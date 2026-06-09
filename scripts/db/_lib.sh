#!/usr/bin/env bash
# Shared helpers for Supabase CLI — schema lives in backend/supabase/.
# All commands run with cwd=backend/ so the CLI resolves ./supabase/config.toml.

set -euo pipefail

if [[ -z "${ASP_ROOT:-}" ]]; then
  ASP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi

ASP_BACKEND="${ASP_ROOT}/backend"
ASP_MIGRATIONS_DIR="${ASP_BACKEND}/supabase/migrations"

asp_require_backend() {
  if [[ ! -d "$ASP_MIGRATIONS_DIR" ]]; then
    echo "ERROR: Missing migrations directory: $ASP_MIGRATIONS_DIR" >&2
    exit 1
  fi
}

asp_resolve_supabase_cli() {
  if [[ -n "${SUPABASE_CLI:-}" && -x "$SUPABASE_CLI" ]]; then
    echo "$SUPABASE_CLI"
    return
  fi
  if command -v supabase &>/dev/null; then
    echo "supabase"
    return
  fi
  if [[ -x "$ASP_BACKEND/node_modules/.bin/supabase" ]]; then
    echo "$ASP_BACKEND/node_modules/.bin/supabase"
    return
  fi
  echo ""
}

asp_supabase_cli() {
  local cli
  cli="$(asp_resolve_supabase_cli)"
  if [[ -z "$cli" ]]; then
    echo "ERROR: Supabase CLI not found." >&2
    echo "  Run: npm install --prefix backend" >&2
    exit 1
  fi
  echo "$cli"
}

# Run supabase with backend/ as workdir (monorepo convention).
asp_run_supabase() {
  local cli
  cli="$(asp_supabase_cli)"
  (cd "$ASP_BACKEND" && "$cli" "$@")
}

# Build a pooler connection string after `supabase link` (see supabase/.temp/pooler-url).
asp_build_db_url() {
  local pooler_file="$ASP_BACKEND/supabase/.temp/pooler-url"
  if [[ -z "${SUPABASE_DB_PASSWORD:-}" || ! -f "$pooler_file" ]]; then
    return 1
  fi

  local template
  template="$(tr -d '[:space:]' <"$pooler_file")"
  if [[ "$template" == *"[YOUR-PASSWORD]"* ]]; then
    echo "${template//\[YOUR-PASSWORD\]/$SUPABASE_DB_PASSWORD}"
    return 0
  fi

  # pooler-url is often postgresql://user@host — inject the password before @.
  if [[ "$template" =~ ^postgresql://([^@/]+)@(.+)$ ]]; then
    echo "postgresql://${BASH_REMATCH[1]}:${SUPABASE_DB_PASSWORD}@${BASH_REMATCH[2]}"
    return 0
  fi

  return 1
}

asp_print_db_auth_help() {
  echo "" >&2
  echo "Database connection failed. Try these fixes:" >&2
  echo "  1. Supabase Dashboard → Database → Settings → check Network Bans and remove your IP" >&2
  echo "  2. Token-only push (no DB password): set SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF only" >&2
  echo "  3. Wait 1–2 minutes after resetting the database password, then retry" >&2
  echo "  4. Reset password again (alphanumeric only), update GitHub secret SUPABASE_DB_PASSWORD" >&2
  echo "Docs: https://supabase.com/docs/guides/troubleshooting" >&2
}
