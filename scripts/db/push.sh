#!/usr/bin/env bash
# Apply pending migrations to the linked Supabase project (local or CI).
#
# Local (recommended — store password at link time):
#   cd backend && npx supabase login
#   SUPABASE_DB_PASSWORD='<database-password>' npm run db:link -- --project-ref <ref>
#   npm run db:push
#
# CI (non-interactive):
#   SUPABASE_ACCESS_TOKEN=<token> SUPABASE_PROJECT_REF=<ref> SUPABASE_DB_PASSWORD=<pwd> npm run db:push
#
# Without CLI: run SQL from backend/supabase/migrations/ in Supabase SQL Editor.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=scripts/db/_lib.sh
source "$ROOT/scripts/db/_lib.sh"

bash "$ROOT/scripts/db/validate-migrations.sh"

link_project() {
  local label="$1"
  shift
  local link_args=(link --project-ref "$SUPABASE_PROJECT_REF" --yes "$@")
  if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
    link_args+=(--password "$SUPABASE_DB_PASSWORD")
  fi
  echo "Linking project $SUPABASE_PROJECT_REF ($label)..."
  asp_run_supabase "${link_args[@]}"
}

if [[ -n "${GITHUB_ACTIONS:-}" || -n "${CI:-}" ]]; then
  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" || -z "${SUPABASE_PROJECT_REF:-}" ]]; then
    echo "ERROR: CI database deploy requires GitHub secrets:" >&2
    echo "  SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens" >&2
    echo "  SUPABASE_PROJECT_REF   — e.g. houbbjvwfbebgihigzcb (from dashboard URL)" >&2
    echo "  SUPABASE_DB_PASSWORD   — Database → Settings → database password" >&2
    echo "Add them under: Repo → Settings → Secrets → Actions (production environment)." >&2
    exit 1
  fi
  export SUPABASE_ACCESS_TOKEN
  link_project "CI"
elif [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  export SUPABASE_ACCESS_TOKEN
  link_project "token"
fi

push_migrations() {
  local extra_args=("$@")
  local err_file
  err_file="$(mktemp)"
  trap 'rm -f "$err_file"' RETURN

  local push_cmd=(db push --linked --yes)
  if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
    push_cmd+=(-p "$SUPABASE_DB_PASSWORD")
    echo "Applying migrations (linked project + database password)..."
  else
    echo "Applying migrations (linked project — uses password saved at link time)..."
    echo "Tip: if this fails, re-link with SUPABASE_DB_PASSWORD set (see scripts/db/link.sh)." >&2
  fi

  if asp_run_supabase "${push_cmd[@]}" "${extra_args[@]}" 2>"$err_file"; then
    return 0
  fi
  cat "$err_file" >&2

  if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
    local db_url
    if db_url="$(asp_build_db_url)"; then
      echo "Retrying with explicit pooler connection string..."
      if asp_run_supabase db push --db-url "$db_url" "${extra_args[@]}" 2>"$err_file"; then
        return 0
      fi
      cat "$err_file" >&2
    fi
  fi

  echo "" >&2
  echo "ERROR: Could not connect to Postgres to apply migrations." >&2
  echo "  • Use the Database password (Database → Settings → Reset database password)." >&2
  echo "  • Not the anon key, service role key, or JWT secret." >&2
  echo "  • Link with password, then push:" >&2
  echo "      SUPABASE_DB_PASSWORD='<pwd>' npm run db:link -- --project-ref <ref>" >&2
  echo "      npm run db:push" >&2
  echo "  • Or paste SQL from backend/supabase/migrations/ into Supabase SQL Editor." >&2
  asp_print_db_auth_help
  return 1
}

push_migrations "$@"
