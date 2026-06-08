#!/usr/bin/env bash
# Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from backend/.env or env vars.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/backend/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${SUPABASE_URL:?Set SUPABASE_URL in backend/.env or the environment}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY in backend/.env or the environment}"

BASE="${SUPABASE_URL%/}"
echo "==> Project URL: $BASE"
echo "==> Auth health (expect 200):"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "$BASE/auth/v1/health"

echo "==> JWKS endpoint (expect 200 + keys array):"
curl -sS "$BASE/auth/v1/.well-known/jwks.json" | head -c 200
echo ""

echo "==> REST API with service role (expect not 401):"
CODE=$(curl -sS -o /dev/null -w "%{http_code}" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$BASE/rest/v1/")
echo "HTTP $CODE (200/404/406 are OK — 401 means bad service role key)"

if [[ "$CODE" == "401" ]]; then
  echo "ERROR: Service role key rejected. Reveal/copy from Supabase → Settings → API Keys → Secret keys."
  exit 1
fi

echo "OK: Supabase URL is reachable and service role key is accepted."
