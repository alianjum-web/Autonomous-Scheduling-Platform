#!/usr/bin/env bash
# Link backend/supabase to a remote Supabase project.
#
#   SUPABASE_PROJECT_REF=<ref> npm run db:link
#   npm run db:link -- --project-ref <ref>

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=scripts/db/_lib.sh
source "$ROOT/scripts/db/_lib.sh"

asp_run_supabase link "$@"
