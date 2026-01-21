# Upstream Sync (robotnikz/Sunflow → sunflow-ha)

This repository vendors the upstream Sunflow dashboard app under:

- `sunflow/sunflow/`

## What gets synced

We sync the **upstream repository root** of `robotnikz/Sunflow` into `sunflow/sunflow/`.

This is intentionally a mostly **1:1** sync of the upstream app.

## Will a 1:1 sync still work as a Home Assistant add-on?

Yes — because the Home Assistant add-on packaging is owned by this repo and lives outside the vendored upstream folder.

In practice:

- The add-on wrapper (Dockerfile/run.sh/add-on config) is in `sunflow/`.
- The Home Assistant integration is in `custom_components/`.
- Upstream UI/backend code is vendored into `sunflow/sunflow/`.

So an upstream update does not overwrite the HA add-on wrapper or integration code.

If Home Assistant requires a change *inside* `sunflow/sunflow/` (e.g. Ingress/base-path behavior), we keep that change as an explicit patch file under `patches/` so it is re-applied after every sync.

The Home Assistant specific parts stay outside that folder:

- `sunflow/` (add-on wrapper: `config.yaml`, `Dockerfile`, `run.sh`, etc.)
- `custom_components/` (Home Assistant integration)

## Tracking upstream version

We track the last imported upstream release tag in:

- `sunflow/upstream_version.txt`

## How automated sync works

Workflow: `.github/workflows/sync-upstream.yml`

- Fetches the latest upstream GitHub Release tag from `robotnikz/Sunflow`.
- If it differs from `sunflow/upstream_version.txt`, it:
  - creates a branch
  - runs `scripts/sync_upstream.sh <tag>`
  - updates `sunflow/upstream_version.txt`
  - opens a PR titled `chore(upstream): sync robotnikz/Sunflow vX.Y.Z`

CI on the PR is the gatekeeper.

## HA-specific patch layer (optional)

If you need to maintain HA-only changes inside `sunflow/sunflow/` without forking upstream history,
place patch files in:

- `patches/*.patch`

### How this affects releases

Upstream sync PRs update `sunflow/sunflow/` and then apply `patches/*.patch` so the branch contains the final, working HA state.
When that PR is merged and the HA repo is released, the release therefore includes:

- The upstream update (new tag in `sunflow/upstream_version.txt`)
- The HA-specific deltas (the patch layer), already applied to `sunflow/sunflow/`

CI verifies that `sunflow/sunflow/` is reproducible from upstream + patches.

They will be applied automatically by `scripts/sync_upstream.sh` after the upstream files are synced.

Recommended approach:

1. Make the HA-only change on a branch.
2. Regenerate the patch deterministically from the *committed* vendored tree:
  - `bash scripts/regenerate_patch.sh`
3. Keep the patch small and focused.

Note: avoid generating patch files from a Windows working tree diff, because CRLF line endings can break `git apply` on Linux CI.

