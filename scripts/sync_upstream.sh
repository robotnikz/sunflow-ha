#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_REPO="${UPSTREAM_REPO:-robotnikz/Sunflow}"
TAG="${1:?Usage: sync_upstream.sh <tag> (e.g. v1.11.1)}"
DEST_DIR="${DEST_DIR:-sunflow/sunflow}"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync not found" >&2
  exit 1
fi
if ! command -v unzip >/dev/null 2>&1; then
  echo "unzip not found" >&2
  exit 1
fi

# GitHub zipball (source) for a specific tag
ZIP_URL="https://api.github.com/repos/${UPSTREAM_REPO}/zipball/${TAG}"

TMP_DIR="$(mktemp -d)"
ZIP_FILE="${TMP_DIR}/upstream.zip"
EXTRACT_DIR="${TMP_DIR}/src"
mkdir -p "${EXTRACT_DIR}"

# Use token if present to avoid rate limits
AUTH_HEADER=()
if [ -n "${GITHUB_TOKEN:-}" ]; then
  AUTH_HEADER=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

curl -fsSL -L "${AUTH_HEADER[@]}" -H "Accept: application/vnd.github+json" "${ZIP_URL}" -o "${ZIP_FILE}"
unzip -q "${ZIP_FILE}" -d "${EXTRACT_DIR}"

UPSTREAM_ROOT="$(find "${EXTRACT_DIR}" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
if [ -z "${UPSTREAM_ROOT}" ] || [ ! -d "${UPSTREAM_ROOT}" ]; then
  echo "Failed to locate extracted upstream root" >&2
  exit 1
fi

mkdir -p "${DEST_DIR}"

# Mirror upstream repo root into our vendored app folder.
# Exclude transient/build artifacts.
rsync -a --delete \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "dist" \
  --exclude "build" \
  --exclude "coverage" \
  --exclude ".e2e-data" \
  --exclude "test-results" \
  --exclude "playwright-report" \
  "${UPSTREAM_ROOT}/" "${DEST_DIR}/"

# Optional: apply HA-specific patches after syncing.
if [ -d "patches" ]; then
  shopt -s nullglob
  PATCHES=(patches/*.patch)
  if [ ${#PATCHES[@]} -gt 0 ]; then
    git apply "${PATCHES[@]}"
  fi
fi

rm -rf "${TMP_DIR}"

echo "Synced ${UPSTREAM_REPO}@${TAG} -> ${DEST_DIR}"
