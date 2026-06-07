#!/usr/bin/env bash
# One-time backend setup: venv + pip install
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  echo "Created backend/.venv"
fi

.venv/bin/pip install -r requirements.txt -q
echo "Backend dependencies installed."
