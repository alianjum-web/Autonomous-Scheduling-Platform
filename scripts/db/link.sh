#!/usr/bin/env bash
# Link backend/supabase to a remote Supabase project (non-interactive when ref is known).
#
#   SUPABASE_PROJECT_REF=houbbjvwfbebgihigzcb npm run db:link
#   npm run db:link -- --project-ref houbbjvwfbebgihigzcb
#   SUPABASE_DB_PASSWORD='<db-password>' npm run db:link -- --project-ref houbbjvwfbebgihigzcb
# Password is required at link time (or push will fail with "password authentication failed").

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=scripts/db/_lib.sh
source "$ROOT/scripts/db/_lib.sh"

link_args=(link --yes)

if [[ -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  link_args+=(--project-ref "$SUPABASE_PROJECT_REF")
elif [[ $# -eq 1 && "$1" != --* ]]; then
  # npm run db:link -- houbbjvwfbebgihigzcb
  link_args+=(--project-ref "$1")
else
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --project-ref)
        link_args+=(--project-ref "${2:?--project-ref requires a value}")
        shift 2
        ;;
      --password|-p)
        link_args+=(--password "${2:?--password requires a value}")
        shift 2
        ;;
      *)
        link_args+=("$1")
        shift
        ;;
    esac
  done
fi

if [[ ${#link_args[@]} -eq 2 ]]; then
  echo "ERROR: Missing project ref." >&2
  echo "  SUPABASE_PROJECT_REF=<ref> npm run db:link" >&2
  echo "  npm run db:link -- --project-ref <ref>" >&2
  echo "  Ref is in the dashboard URL: supabase.com/dashboard/project/<ref>" >&2
  exit 1
fi

if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  link_args+=(--password "$SUPABASE_DB_PASSWORD")
fi

echo "Linking Supabase project: ${link_args[*]}"
asp_run_supabase "${link_args[@]}"
