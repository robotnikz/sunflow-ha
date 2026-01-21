#!/usr/bin/with-contenv bash
set -euo pipefail

# Home Assistant add-on base images provide:
# - /data for persistent storage
# - /config for HA config

source /usr/lib/bashio/bashio.sh

LOG_LEVEL="$(bashio::config 'log_level')"
ADMIN_TOKEN="$(bashio::config 'admin_token')"
CORS_ORIGIN="$(bashio::config 'cors_origin')"

export DATA_DIR="/data"
export PORT="3000"
export NODE_ENV="production"
export TRUST_PROXY="true"

# Optional hardening
if [[ -n "${ADMIN_TOKEN}" ]]; then
  export SUNFLOW_ADMIN_TOKEN="${ADMIN_TOKEN}"
fi
if [[ -n "${CORS_ORIGIN}" ]]; then
  export SUNFLOW_CORS_ORIGIN="${CORS_ORIGIN}"
fi

# Basic log level support (Sunflow currently logs to stdout; keep env for future)
export SUNFLOW_LOG_LEVEL="${LOG_LEVEL}"

cd /app
exec node server.js
