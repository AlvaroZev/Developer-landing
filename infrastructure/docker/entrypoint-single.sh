#!/bin/sh
set -eu

# API listens privately; nginx publishes 8080 with the SPA + /api proxy.
export API_PORT="${API_PORT:-8090}"
export MIGRATIONS_PATH="${MIGRATIONS_PATH:-/app/database/migrations}"

/app/triunder-api &
api_pid=$!

i=0
while [ "$i" -lt 60 ]; do
  if wget -qO- "http://127.0.0.1:${API_PORT}/healthz" >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 0.25
done

if ! kill -0 "$api_pid" 2>/dev/null; then
  echo "triunder-api failed to start" >&2
  exit 1
fi

exec nginx -g "daemon off;"
