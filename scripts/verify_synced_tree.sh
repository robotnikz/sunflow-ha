#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-}"
if [ -z "${TAG}" ]; then
  if [ -f "sunflow/upstream_version.txt" ]; then
    TAG="$(cat sunflow/upstream_version.txt | tr -d '\r' | tr -d '\n')"
  fi
fi
if [ -z "${TAG}" ]; then
  echo "Usage: verify_synced_tree.sh <tag>" >&2
  exit 2
fi

UPSTREAM_REPO="${UPSTREAM_REPO:-robotnikz/Sunflow}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

DEST_DIR="${TMP_DIR}/synced"

# Re-sync upstream into a temp folder + apply patches
DEST_DIR="${DEST_DIR}" GITHUB_TOKEN="${GITHUB_TOKEN:-}" UPSTREAM_REPO="${UPSTREAM_REPO}" bash scripts/sync_upstream.sh "${TAG}"

# Compare temp result with repo's vendored tree, ignoring transient artifacts.
RSYNC_EXCLUDES=(
  --exclude ".git"
  --exclude "node_modules"
  --exclude "dist"
  --exclude "build"
  --exclude "coverage"
  --exclude ".e2e-data"
  --exclude "test-results"
  --exclude "playwright-report"
)

# If rsync reports any changes, the committed tree isn't reproducible from upstream+patches.
CHANGES="$(rsync -a --delete --dry-run --out-format='%i %n%L' "${RSYNC_EXCLUDES[@]}" "${DEST_DIR}/" "sunflow/sunflow/" | sed '/^\s*$/d' || true)"
if [ -n "${CHANGES}" ]; then
  echo "Vendored tree sunflow/sunflow is NOT reproducible from ${UPSTREAM_REPO}@${TAG} + patches." >&2
  echo "" >&2
  echo "Differences:" >&2
  echo "${CHANGES}" >&2
  exit 1
fi

echo "OK: sunflow/sunflow matches ${UPSTREAM_REPO}@${TAG} + patches"
