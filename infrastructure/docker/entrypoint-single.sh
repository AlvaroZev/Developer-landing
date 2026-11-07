#!/bin/sh
set -eu

# Hosts often set PORT=8080 and/or API_PORT=8080 for the public process.
# Nginx must own that public port. The Go API always stays on loopback :8090.
PUBLIC_PORT="${PORT:-8080}"
export LISTEN_PORT="$PUBLIC_PORT"
export API_PORT=8090
export MIGRATIONS_PATH="${MIGRATIONS_PATH:-/app/database/migrations}"

envsubst '${LISTEN_PORT}' < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

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
