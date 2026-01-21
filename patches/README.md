# HA Patch Layer

Anything inside `sunflow/sunflow/` is treated as vendored upstream from `robotnikz/Sunflow`.

If Home Assistant requires changes *inside* `sunflow/sunflow/`, do **not** hand-edit upstream files without recording it.

Instead, store one or more patch files here:

- `patches/*.patch`

They are automatically applied after each upstream sync (see `scripts/sync_upstream.sh`).

## Creating a patch

1. Make your HA-only change.
2. Create/update a patch file:

- `git diff -- sunflow/sunflow > patches/0001-ha-overrides.patch`

3. Commit the patch.

## Why

This keeps upstream updates reproducible and reviewable: the sync PR shows a clean upstream bump plus small, explicit HA deltas.
