#!/usr/bin/env bash
set -euo pipefail

BASE_SHA="${1:-${GITHUB_BASE_SHA:-}}"
HEAD_SHA="${2:-${GITHUB_HEAD_SHA:-${GITHUB_SHA:-}}}"

if [ -z "${BASE_SHA}" ] || [ -z "${HEAD_SHA}" ]; then
  echo "Usage: check_patch_layer.sh <base_sha> <head_sha>" >&2
  echo "Or set GITHUB_BASE_SHA and GITHUB_HEAD_SHA/GITHUB_SHA." >&2
  exit 2
fi

CHANGED_FILES="$(git diff --name-only "${BASE_SHA}...${HEAD_SHA}" || true)"

if echo "${CHANGED_FILES}" | grep -q '^sunflow/sunflow/'; then
  if echo "${CHANGED_FILES}" | grep -q '^patches/'; then
    exit 0
  fi

  # Upstream sync PRs always bump the tracked upstream version.
  if echo "${CHANGED_FILES}" | grep -q '^sunflow/upstream_version\.txt$'; then
    exit 0
  fi

  echo "Detected changes inside sunflow/sunflow/ without updating patch layer." >&2
  echo "" >&2
  echo "To keep upstream syncs reproducible, HA-only changes in sunflow/sunflow/ must be represented as patches/*.patch" >&2
  echo "(unless this is an upstream sync PR, which should update sunflow/upstream_version.txt)." >&2
  echo "" >&2
  echo "Changed files:" >&2
  echo "${CHANGED_FILES}" >&2
  exit 1
fi
