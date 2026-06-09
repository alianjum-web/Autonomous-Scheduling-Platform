#!/usr/bin/env bash
# Apply pending migrations to the linked Supabase project (local or CI).
#
# Local (once linked):
#   cd backend && npx supabase login
#   npm run db:link -- --project-ref <ref>
#   npm run db:push
#
# CI (non-interactive):
#   SUPABASE_ACCESS_TOKEN=<token> SUPABASE_PROJECT_REF=<ref> npm run db:push
#
# Optional fallback when token-only push fails:
#   SUPABASE_DB_PASSWORD=<db-password>

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=scripts/db/_lib.sh
source "$ROOT/scripts/db/_lib.sh"

bash "$ROOT/scripts/db/validate-migrations.sh"

link_project() {
  local label="$1"
  shift
  local link_args=(link --project-ref "$SUPABASE_PROJECT_REF" --yes "$@")
  echo "Linking project $SUPABASE_PROJECT_REF ($label)..."
  asp_run_supabase "${link_args[@]}"
}

if [[ -n "${GITHUB_ACTIONS:-}" || -n "${CI:-}" ]]; then
  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" || -z "${SUPABASE_PROJECT_REF:-}" ]]; then
    echo "ERROR: CI database deploy requires GitHub secrets:" >&2
    echo "  SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens" >&2
    echo "  SUPABASE_PROJECT_REF   — e.g. houbbjvwfbebgihigzcb (from dashboard URL)" >&2
    echo "  SUPABASE_DB_PASSWORD   — optional fallback (Settings → Database)" >&2
    echo "Add them under: Repo → Settings → Secrets → Actions (production environment)." >&2
    exit 1
  fi
  export SUPABASE_ACCESS_TOKEN
  # Prefer token-based link; password is only a fallback for db push.
  link_project "CI"
elif [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  export SUPABASE_ACCESS_TOKEN
  link_project "token"
fi

if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  export SUPABASE_DB_PASSWORD
fi

push_migrations() {
  local extra_args=("$@")
  local err_file
  err_file="$(mktemp)"
  trap 'rm -f "$err_file"' RETURN

  echo "Applying migrations (token-based)..."
  if asp_run_supabase db push --linked "${extra_args[@]}" 2>"$err_file"; then
    return 0
  fi
  cat "$err_file" >&2

  if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo "Retrying with database password..."
    if asp_run_supabase db push --linked -p "$SUPABASE_DB_PASSWORD" "${extra_args[@]}" 2>"$err_file"; then
      return 0
    fi
    cat "$err_file" >&2

    local db_url
    if db_url="$(asp_build_db_url)"; then
      echo "Retrying with explicit pooler connection string..."
      if asp_run_supabase db push --db-url "$db_url" "${extra_args[@]}" 2>"$err_file"; then
        return 0
      fi
      cat "$err_file" >&2
    fi
  fi

  asp_print_db_auth_help
  return 1
}

push_migrations "$@"
