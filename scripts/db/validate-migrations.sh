#!/usr/bin/env bash
# Validate backend/supabase/migrations for CI and local pre-push checks.
#
# Ensures:
#   - no legacy root supabase/ directory
#   - migration filenames match Supabase CLI pattern (<14-digit-ts>_name.sql)
#   - timestamps are unique and lexicographically ordered
#   - each file is non-empty SQL

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=scripts/db/_lib.sh
source "$ROOT/scripts/db/_lib.sh"

asp_require_backend

errors=0

if [[ -d "$ROOT/supabase" ]]; then
  echo "ERROR: Legacy root supabase/ directory found." >&2
  echo "       Schema must live only in backend/supabase/." >&2
  errors=$((errors + 1))
fi

shopt -s nullglob
files=("$ASP_MIGRATIONS_DIR"/*.sql)
shopt -u nullglob

if [[ ${#files[@]} -eq 0 ]]; then
  echo "ERROR: No migration files in $ASP_MIGRATIONS_DIR" >&2
  exit 1
fi

declare -A seen_ts=()
prev_ts=""

for file in "${files[@]}"; do
  base="$(basename "$file")"

  if [[ ! "$base" =~ ^[0-9]{14}_[a-z0-9_]+\.sql$ ]]; then
    echo "ERROR: Invalid migration filename: $base" >&2
    echo "       Expected: <14-digit-timestamp>_snake_case_name.sql" >&2
    errors=$((errors + 1))
    continue
  fi

  ts="${base%%_*}"
  if [[ -n "${seen_ts[$ts]:-}" ]]; then
    echo "ERROR: Duplicate migration timestamp: $ts" >&2
    errors=$((errors + 1))
  fi
  seen_ts[$ts]=1

  if [[ -n "$prev_ts" && "$ts" < "$prev_ts" ]]; then
    echo "ERROR: Migrations out of order: $base (after timestamp $prev_ts)" >&2
    errors=$((errors + 1))
  fi
  prev_ts="$ts"

  if [[ ! -s "$file" ]]; then
    echo "ERROR: Empty migration file: $base" >&2
    errors=$((errors + 1))
  fi
done

if [[ "$errors" -gt 0 ]]; then
  echo "Migration validation failed with $errors error(s)." >&2
  exit 1
fi

echo "OK: ${#files[@]} migration(s) in backend/supabase/migrations/"
