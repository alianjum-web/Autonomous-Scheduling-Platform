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
