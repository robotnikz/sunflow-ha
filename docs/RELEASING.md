# Releasing (sunflow-ha)

This repository uses **semantic-release** on the `main` branch.

## How a release is created

1. Merge a PR into `main` with **Conventional Commits** style messages.
2. GitHub Actions runs the `Release` workflow.
3. If tests pass, semantic-release:
   - calculates the next version
   - updates `sunflow/config.yaml` and `custom_components/sunflow/manifest.json`
   - appends to `sunflow/CHANGELOG.md`
   - creates a Git tag `vX.Y.Z`
   - creates a GitHub Release with generated notes

## Commit message rules (what bumps what)

- `fix(scope): ...` → patch bump (e.g. `1.0.0` → `1.0.1`)
- `feat(scope): ...` → minor bump (e.g. `1.0.0` → `1.1.0`)
- `feat!: ...` or `BREAKING CHANGE:` → major bump

Suggested scopes:
- `addon`
- `integration`
- `ui`
- `backend`
- `ci`
- `docs`
- `upstream`

## Local dry-run

You can preview what semantic-release would do locally:

- `npx -y -p semantic-release@25 -p @semantic-release/commit-analyzer@13 -p @semantic-release/release-notes-generator@14 semantic-release --dry-run -e ./release.config.cjs`

(Real releases are intended to be done by CI.)
