#!/usr/bin/env bash
set -euo pipefail

ARCH="${ARCH:-amd64}"
TAG="${TAG:-sunflow-ha-addon:smoke}"
PORT="${PORT:-3000}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-60}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADDON_DIR="$REPO_ROOT/sunflow"
BUILD_YAML="$ADDON_DIR/build.yaml"
DOCKERFILE="$ADDON_DIR/Dockerfile"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed or not on PATH" >&2
  exit 1
fi

if [[ ! -f "$BUILD_YAML" ]]; then
  echo "Missing build.yaml: $BUILD_YAML" >&2
  exit 1
fi

BUILD_FROM="$(awk -v arch="$ARCH" 'BEGIN{found=0} $1==arch":" {print $2; found=1; exit} END{if(!found) exit 2}' "$BUILD_YAML" 2>/dev/null | tr -d '\r' || true)"
if [[ -z "$BUILD_FROM" ]]; then
  echo "Could not find build_from for arch '$ARCH' in $BUILD_YAML" >&2
  exit 1
fi

echo "Building add-on image '$TAG' (BUILD_FROM=$BUILD_FROM, ARCH=$ARCH)..."
docker build \
  -f "$DOCKERFILE" \
  -t "$TAG" \
  --build-arg "BUILD_FROM=$BUILD_FROM" \
  --build-arg "BUILD_ARCH=$ARCH" \
  --build-arg "BUILD_VERSION=smoke" \
  "$ADDON_DIR"

tmp="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp" || true
}
trap cleanup EXIT

cat >"$tmp/options.json" <<'JSON'
{"log_level":"info","admin_token":"","cors_origin":""}
JSON

echo "Starting container and waiting for /api/info on http://localhost:$PORT ..."
container_id="$(docker run -d --rm -p "$PORT:3000" -v "$tmp:/data" "$TAG")"

stop_container() {
  if [[ -n "${container_id:-}" ]]; then
    docker stop "$container_id" >/dev/null 2>&1 || true
  fi
}
trap stop_container EXIT

deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))
ok=0
while [[ $(date +%s) -lt $deadline ]]; do
  if curl -fsS "http://localhost:$PORT/api/info" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 2
done

if [[ $ok -ne 1 ]]; then
  echo "--- container logs ---" >&2
  docker logs "$container_id" || true
  echo "Smoke test failed: /api/info did not become ready within ${TIMEOUT_SECONDS}s" >&2
  exit 1
fi

# Validate persistence path: DB should be created under /data
if ! docker exec "$container_id" sh -lc 'test -f /data/solar_data.db' >/dev/null 2>&1; then
  echo "--- container logs ---" >&2
  docker logs "$container_id" || true
  echo 'Smoke test failed: expected /data/solar_data.db to exist (persistence not working)' >&2
  exit 1
fi

echo "OK: add-on started and /api/info returned 200"