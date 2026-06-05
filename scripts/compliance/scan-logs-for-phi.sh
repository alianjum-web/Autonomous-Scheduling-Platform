#!/usr/bin/env bash
# Scan deployed application logs for raw PHI field names or values.
# Usage: ./scan-logs-for-phi.sh /path/to/logs/*.log
# Exit 0 = PASS (no matches), Exit 1 = FAIL (PHI patterns found)

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <log-file-or-directory> [...]" >&2
  exit 2
fi

PATTERN='patient_name|patient_phone|patient_email|chief_complaint|ai_summary|[0-9]{3}-[0-9]{2}-[0-9]{4}'

MATCHES=$(grep -rE "$PATTERN" "$@" 2>/dev/null | grep -v '\[REDACTED\]' | grep -v 'PHONE_REDACTED' | grep -v 'EMAIL_REDACTED' || true)

if [[ -n "$MATCHES" ]]; then
  echo "FAIL: PHI patterns found in logs:" >&2
  echo "$MATCHES" >&2
  exit 1
fi

echo "PASS: No PHI patterns found"
