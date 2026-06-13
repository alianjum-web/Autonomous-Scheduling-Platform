#!/usr/bin/env bash
# Free port 8000 for local Uvicorn when Docker API or a stale dev process is still bound.
set -euo pipefail

PORT=8000
BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"
COMPOSE_DEV="$REPO_ROOT/docker-compose.yml"
COMPOSE_PROD="$REPO_ROOT/docker-compose.prod.yml"

port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -tln | grep -q ":${PORT} "
    return $?
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -i ":${PORT}" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  return 1
}

stop_compose_api() {
  local file=$1
  if [ -f "$file" ]; then
    docker compose -f "$file" stop api >/dev/null 2>&1 || true
  fi
}

stop_docker_api() {
  local ids
  ids=$(docker ps --filter "publish=${PORT}" --format "{{.ID}}" 2>/dev/null || true)
  if [ -z "$ids" ]; then
    return 1
  fi

  echo "→ Port ${PORT} is held by the Docker API container."
  echo "  Stopping compose api service (use 'npm run docker:dev' for containerized API)…"
  stop_compose_api "$COMPOSE_DEV"
  stop_compose_api "$COMPOSE_PROD"
  # Fallback if compose project name differs or only the container is known.
  while IFS= read -r id; do
    [ -n "$id" ] && docker stop "$id" >/dev/null 2>&1 || true
  done <<< "$ids"
  sleep 1
  return 0
}

stop_stale_local_api() {
  if ! command -v lsof >/dev/null 2>&1; then
    return 1
  fi

  local stopped=0
  local pid cmd
  for pid in $(lsof -ti ":${PORT}" -sTCP:LISTEN 2>/dev/null || true); do
    cmd=$(ps -p "$pid" -o args= 2>/dev/null || true)
    case "$cmd" in
      *"uvicorn app.main:app"*|*"gunicorn"*"app.main:app"*)
        echo "→ Stopping stale local API process (PID ${pid})…"
        kill "$pid" 2>/dev/null || true
        stopped=1
        ;;
    esac
  done

  if [ "$stopped" -eq 1 ]; then
    sleep 1
    return 0
  fi
  return 1
}

report_blocking_process() {
  echo "ERROR: Port ${PORT} is still in use. Free it before running local dev:" >&2
  echo >&2
  if command -v lsof >/dev/null 2>&1; then
    lsof -i ":${PORT}" -sTCP:LISTEN 2>/dev/null || true
  elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep ":${PORT} " || true
  fi
  echo >&2
  echo "  npm run docker:stop     # stop Docker API + Redis" >&2
  echo "  npm run dev             # local Uvicorn (auto-frees Docker/stale API)" >&2
  echo "  npm run docker:dev      # run API in Docker instead" >&2
  exit 1
}

if ! port_in_use; then
  exit 0
fi

stop_docker_api || stop_stale_local_api || true

if port_in_use; then
  report_blocking_process
fi
