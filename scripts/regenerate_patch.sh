#!/usr/bin/env bash
set -euo pipefail

# Regenerates patches/0001-ha-overrides.patch so it can be applied on Linux CI.
# It diffs a clean upstream sync (WITHOUT applying patches) against the repo's
# committed vendored tree (sunflow/sunflow), and writes a patch with clean
# a/... and b/... prefixes.

TAG="${1:-}"
if [ -z "${TAG}" ]; then
  if [ -f "sunflow/upstream_version.txt" ]; then
    TAG="$(cat sunflow/upstream_version.txt | tr -d '\r' | tr -d '\n')"
  fi
fi
if [ -z "${TAG}" ]; then
  echo "Usage: regenerate_patch.sh <tag> (or set sunflow/upstream_version.txt)" >&2
  exit 2
fi

UPSTREAM_REPO="${UPSTREAM_REPO:-robotnikz/Sunflow}"
PATCH_OUT="${PATCH_OUT:-patches/0001-ha-overrides.patch}"

PATCH_OUT_ABS="$(pwd)/${PATCH_OUT}"
REPO_ROOT="$(pwd)"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

UPSTREAM_DIR="${TMP_DIR}/upstream"
mkdir -p "${UPSTREAM_DIR}"

# Create a clean upstream tree in a temp folder (no patches applied).
APPLY_PATCHES=0 DEST_DIR="${UPSTREAM_DIR}" GITHUB_TOKEN="${GITHUB_TOKEN:-}" UPSTREAM_REPO="${UPSTREAM_REPO}" bash scripts/sync_upstream.sh "${TAG}" >/dev/null

mkdir -p "$(dirname "${PATCH_OUT}")"

# Build a temporary git repo so the patch has canonical paths:
#   a/sunflow/sunflow/... -> b/sunflow/sunflow/...
# and never references /tmp/... folders.
WORK_DIR="${TMP_DIR}/work"
mkdir -p "${WORK_DIR}"

(
  cd "${WORK_DIR}"
  git init -q
  git config core.fileMode false

  mkdir -p sunflow/sunflow

  # Seed repo with upstream content at the exact target path.
  rsync -a --delete \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude "dist" \
    --exclude "build" \
    --exclude "coverage" \
    --exclude ".e2e-data" \
    --exclude "test-results" \
    --exclude "playwright-report" \
    "${UPSTREAM_DIR}/" "sunflow/sunflow/" >/dev/null

  git add -A
  git -c user.name='sunflow-ha-bot' -c user.email='sunflow-ha-bot@users.noreply.github.com' commit -q -m "Upstream ${UPSTREAM_REPO}@${TAG}"

  # Overlay with the repo's vendored tree (current desired state).
  rm -rf sunflow/sunflow
  mkdir -p sunflow/sunflow

  if ! command -v tar >/dev/null 2>&1; then
    echo "tar not found" >&2
    exit 1
  fi

  git -C "${REPO_ROOT}" archive "HEAD:sunflow/sunflow" | tar -x -C "sunflow/sunflow"

  git add -A
  git diff --binary --no-renames HEAD > "${PATCH_OUT_ABS}"
)

# Normalize line endings to LF (CRLF in patches can break git apply in CI).
python3 - "${PATCH_OUT_ABS}" <<'PY'
import pathlib
import sys

p = pathlib.Path(sys.argv[1])
raw = p.read_bytes()
raw = raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
p.write_bytes(raw)
PY

# Quick sanity check: ensure no absolute paths leaked into headers.
if grep -Eq '^(diff --git|--- |\+\+\+ ) "?(a|b)/[^\"]*:[\\/]' "${PATCH_OUT_ABS}"; then
  echo "ERROR: Patch still contains absolute paths: ${PATCH_OUT}" >&2
  exit 1
fi

echo "Wrote ${PATCH_OUT} (upstream ${UPSTREAM_REPO}@${TAG})"
