#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_REPO="${UPSTREAM_REPO:-robotnikz/Sunflow}"
TAG="${1:?Usage: sync_upstream.sh <tag> (e.g. v1.11.1)}"
DEST_DIR="${DEST_DIR:-sunflow/sunflow}"
APPLY_PATCHES="${APPLY_PATCHES:-1}"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync not found" >&2
  exit 1
fi

extract_zip() {
  local zip_file="$1"
  local dest_dir="$2"

  if command -v unzip >/dev/null 2>&1; then
    unzip -q "${zip_file}" -d "${dest_dir}"
    return
  fi

  if command -v python3 >/dev/null 2>&1; then
    python3 - "${zip_file}" "${dest_dir}" <<'PY'
import sys
import zipfile

zip_file, dest_dir = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(zip_file) as z:
    z.extractall(dest_dir)
PY
    return
  fi

  echo "Neither unzip nor python3 is available to extract zipball" >&2
  exit 1
}

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
extract_zip "${ZIP_FILE}" "${EXTRACT_DIR}"

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
if [ "${APPLY_PATCHES}" = "1" ] && [ -d "patches" ]; then
  shopt -s nullglob
  PATCHES=(patches/*.patch)
  if [ ${#PATCHES[@]} -gt 0 ]; then
    # If syncing into a custom folder (e.g. verify script temp dir), apply patches to that folder.
    # Our patches are stored with paths rooted at sunflow/sunflow, so we strip 3 components:
    #   a/sunflow/sunflow/<file>  ->  <file>
    APPLY_CWD=""
    STRIP_COMPONENTS=1
    if [ "${DEST_DIR}" != "sunflow/sunflow" ]; then
      APPLY_CWD="${DEST_DIR}"
      STRIP_COMPONENTS=3
    fi

    # Convert patch paths to absolute paths before changing directories.
    PATCHES_ABS=()
    for PATCH_FILE in "${PATCHES[@]}"; do
      PATCHES_ABS+=("$(pwd)/${PATCH_FILE}")
    done

    # Fail fast if a patch accidentally contains absolute paths (common when generated on Windows).
    for PATCH_FILE in "${PATCHES_ABS[@]}"; do
      if grep -Eq '^(diff --git|--- |\+\+\+ ) "?(a|b)/[^\"]*:[\\/]' "${PATCH_FILE}"; then
        echo "Patch contains absolute paths and cannot be applied reliably in CI: ${PATCH_FILE}" >&2
        echo "Regenerate the patch with clean relative paths (a/... and b/...)." >&2
        exit 1
      fi
    done

    if [ -n "${APPLY_CWD}" ]; then
      (cd "${APPLY_CWD}" && git apply -p"${STRIP_COMPONENTS}" "${PATCHES_ABS[@]}")
    else
      git apply "${PATCHES_ABS[@]}"
    fi
  fi
fi

rm -rf "${TMP_DIR}"

echo "Synced ${UPSTREAM_REPO}@${TAG} -> ${DEST_DIR}"
