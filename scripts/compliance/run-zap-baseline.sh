#!/usr/bin/env bash
# OWASP ZAP baseline scan against FastAPI service.
# Usage: ./run-zap-baseline.sh https://api.yourclinic.com
# Requires Docker.

set -euo pipefail

TARGET="${1:-http://localhost:8000}"
REPORT_DIR="$(cd "$(dirname "$0")/../.." && pwd)/reports/zap"

mkdir -p "$REPORT_DIR"

echo "Running OWASP ZAP baseline scan against: $TARGET"

docker run --rm -v "$REPORT_DIR:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t "$TARGET" \
  -r zap-baseline-report.html \
  -J zap-baseline-report.json \
  -I

echo "Report written to $REPORT_DIR/zap-baseline-report.html"
