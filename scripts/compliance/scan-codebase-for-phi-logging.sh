#!/usr/bin/env bash
# Static scan: detect raw PHI or LLM content in logger calls (pre-deploy guard).
# Exit 0 = PASS, Exit 1 = FAIL

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="$ROOT/backend/app"

EXCLUDE='logging.py|sentry.py|pii.py|emergency_keywords.py|openai_client.py|supabase_client.py'

PHI_MATCHES=$(grep -rnE 'logger\.(info|warning|error|debug|exception).*patient_(name|phone|email)|extra_data.*patient_(name|phone|email)' \
  "$APP_DIR" --include="*.py" 2>/dev/null | grep -Ev "$EXCLUDE" || true)

LLM_MATCHES=$(grep -rnE 'logger\.(info|warning|error|debug|exception).*(prompt|llm_response|message_history|chat_history|token_stream|model_output)|extra_data.*(prompt|messages|completion)' \
  "$APP_DIR" --include="*.py" 2>/dev/null | grep -Ev "$EXCLUDE" || true)

if [[ -n "$PHI_MATCHES" ]]; then
  echo "FAIL: Potential raw PHI in log statements:" >&2
  echo "$PHI_MATCHES" >&2
  exit 1
fi

if [[ -n "$LLM_MATCHES" ]]; then
  echo "FAIL: Potential raw LLM content in log statements:" >&2
  echo "$LLM_MATCHES" >&2
  exit 1
fi

echo "PASS: No raw PHI or LLM logging patterns in application code"
