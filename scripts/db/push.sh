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

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "Linking project $SUPABASE_PROJECT_REF (CI)..."
  link_args=(link --project-ref "$SUPABASE_PROJECT_REF")
  if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
    link_args+=(--password "$SUPABASE_DB_PASSWORD")
  fi
  asp_run_supabase "${link_args[@]}"
fi

echo "Applying migrations..."
asp_run_supabase db push "$@"
