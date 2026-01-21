#!/usr/bin/env bash
set -euo pipefail

# Ensures patches are CI-safe:
# - No absolute paths in diff headers (e.g. C:\\...)
# - No CRLF line endings

if [ ! -d "patches" ]; then
  exit 0
fi

shopt -s nullglob
PATCHES=(patches/*.patch)
if [ ${#PATCHES[@]} -eq 0 ]; then
  exit 0
fi

FAILED=0

for PATCH_FILE in "${PATCHES[@]}"; do
  # Absolute paths (Windows drive letters or absolute Unix paths) in headers.
  if grep -Eq '^(diff --git|--- |\+\+\+ ) "?(a|b)/[^\"]*:[\\/]' "${PATCH_FILE}"; then
    echo "ERROR: Patch contains absolute paths: ${PATCH_FILE}" >&2
    FAILED=1
  fi

  # CRLF line endings.
  if python3 - "${PATCH_FILE}" <<'PY'
import pathlib
import sys
raw = pathlib.Path(sys.argv[1]).read_bytes()
# If any '\r' remains, patch is not LF-only.
raise SystemExit(1 if b"\r" in raw else 0)
PY
  then
    :
  else
    echo "ERROR: Patch contains CRLF/CR characters: ${PATCH_FILE}" >&2
    FAILED=1
  fi
done

if [ ${FAILED} -ne 0 ]; then
  echo "" >&2
  echo "Regenerate patches with: bash scripts/regenerate_patch.sh" >&2
  exit 1
fi
