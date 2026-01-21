# HA Patch Layer

Anything inside `sunflow/sunflow/` is treated as vendored upstream from `robotnikz/Sunflow`.

If Home Assistant requires changes *inside* `sunflow/sunflow/`, do **not** hand-edit upstream files without recording it.

Instead, store one or more patch files here:

- `patches/*.patch`

They are automatically applied after each upstream sync (see `scripts/sync_upstream.sh`).

## Creating a patch

1. Make your HA-only change.
2. Regenerate the patch file deterministically:

- `bash scripts/regenerate_patch.sh`

3. Commit the patch.

Note: avoid generating patch files from a Windows working tree diff, because CRLF line endings can break `git apply` on Linux CI.

## Why

This keeps upstream updates reproducible and reviewable: the sync PR shows a clean upstream bump plus small, explicit HA deltas.
