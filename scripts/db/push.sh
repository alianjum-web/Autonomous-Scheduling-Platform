#!/usr/bin/env bash
# Apply pending migrations to the linked Supabase project (local or CI).
#
# Local (once linked):
#   cd backend && npx supabase link --project-ref <ref>
#   npm run db:push
#
# CI (non-interactive):
#   SUPABASE_ACCESS_TOKEN=<token> SUPABASE_PROJECT_REF=<ref> npm run db:push
#
# Optional: SUPABASE_DB_PASSWORD when the project requires a database password.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=scripts/db/_lib.sh
source "$ROOT/scripts/db/_lib.sh"

bash "$ROOT/scripts/db/validate-migrations.sh"

if [[ -n "${GITHUB_ACTIONS:-}" || -n "${CI:-}" ]]; then
  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" || -z "${SUPABASE_PROJECT_REF:-}" ]]; then
    echo "ERROR: CI database deploy requires GitHub secrets:" >&2
    echo "  SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens" >&2
    echo "  SUPABASE_PROJECT_REF   — e.g. houbbjvwfbebgihigzcb (from dashboard URL)" >&2
    echo "  SUPABASE_DB_PASSWORD   — database password (Settings → Database)" >&2
    echo "Add them under: Repo → Settings → Secrets → Actions (production environment)." >&2
    exit 1
  fi
  export SUPABASE_ACCESS_TOKEN
  echo "Linking project $SUPABASE_PROJECT_REF (CI)..."
  link_args=(link --project-ref "$SUPABASE_PROJECT_REF" --yes)
  if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
    link_args+=(--password "$SUPABASE_DB_PASSWORD")
  fi
  asp_run_supabase "${link_args[@]}"
elif [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  export SUPABASE_ACCESS_TOKEN
  echo "Linking project $SUPABASE_PROJECT_REF..."
  link_args=(link --project-ref "$SUPABASE_PROJECT_REF" --yes)
  if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
    link_args+=(--password "$SUPABASE_DB_PASSWORD")
  fi
  asp_run_supabase "${link_args[@]}"
fi

echo "Applying migrations..."
asp_run_supabase db push "$@"
