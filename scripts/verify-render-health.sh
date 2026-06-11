#!/usr/bin/env bash
# Probe production Render API and flag common env misconfigurations in backend/.env.production.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${1:-}"

if [[ -z "$API_URL" && -f "$ROOT/frontend/.env.production" ]]; then
  API_URL="$(grep -E '^NEXT_PUBLIC_API_URL=' "$ROOT/frontend/.env.production" | cut -d= -f2- | tr -d '"' | tr -d "'")"
fi
API_URL="${API_URL:-https://autonomous-scheduling-platform.onrender.com}"
API_URL="${API_URL%/}"
ENV_FILE="$ROOT/backend/.env.production"

echo "==> Render API: $API_URL"
echo "==> Health (may take up to 60s on cold start)..."
START=$(date +%s)
BODY=$(curl -sS --max-time 120 "${API_URL}/health" || true)
ELAPSED=$(( $(date +%s) - START ))
echo "    Response time: ${ELAPSED}s"

if [[ -z "$BODY" ]]; then
  echo "FAIL: No response — service may be down or still waking up."
  exit 1
fi

echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

echo ""
python3 - <<'PY' "$BODY" "$ELAPSED"
import json, sys
body, elapsed = sys.argv[1], int(sys.argv[2])
try:
    data = json.loads(body)
except json.JSONDecodeError:
    print("FAIL: Response is not JSON (Render may still be showing the wake-up page).")
    sys.exit(1)

checks = data.get("checks", {})
issues = []
if elapsed > 25:
    issues.append(f"Slow cold start ({elapsed}s) — enable render-keepalive.yml or upgrade Render plan.")
if not checks.get("database"):
    issues.append("database=false — check SUPABASE_* on Render.")
if not checks.get("redis"):
    issues.append("redis=false — set UPSTASH_REDIS_URL on Render (plain rediss:// URL, no REDIS_URL= prefix).")
if not checks.get("ai"):
    issues.append("ai=false — set OPENAI_API_KEY or GEMINI_API_KEY on Render (Ollama does not run on Render).")

print(f"Overall: {data.get('status', 'unknown')}")
if issues:
    print("\nAction items:")
    for item in issues:
        print(f"  • {item}")
else:
    print("\nAPI looks healthy.")
PY

if [[ -f "$ENV_FILE" ]]; then
  echo ""
  echo "==> Local backend/.env.production checks (copy matching vars to Render):"
  env_val() { grep -E "^${1}=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'"; }

  svc_key="$(env_val SUPABASE_SERVICE_ROLE_KEY)"
  upstash="$(env_val UPSTASH_REDIS_URL)"
  gcal="$(env_val GOOGLE_CALENDAR_ID)"
  gsa="$(env_val GOOGLE_SERVICE_ACCOUNT_JSON)"
  openai_key="$(env_val OPENAI_API_KEY)"
  gemini_key="$(env_val GEMINI_API_KEY)"

  [[ -z "$svc_key" || "$svc_key" == your-* ]] \
    && echo "  • SUPABASE_SERVICE_ROLE_KEY missing or placeholder"
  [[ "$upstash" == *'REDIS_URL='* ]] \
    && echo "  • UPSTASH_REDIS_URL is malformed (should be only rediss://...)"
  [[ -z "$gsa" ]] \
    && echo "  • GOOGLE_SERVICE_ACCOUNT_JSON empty — calendar uses mock slots until set"
  [[ "$openai_key" == sk-your-* || -z "$openai_key" ]] \
    && { [[ -z "$gemini_key" ]] && echo "  • Set OPENAI_API_KEY or GEMINI_API_KEY on Render — AI chat disabled"; }
  [[ -n "$gcal" && -z "$gsa" ]] \
    && echo "  • GOOGLE_CALENDAR_ID set but no service account JSON yet"
fi
