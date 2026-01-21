# Sunflow (Home Assistant Add-on)

This add-on runs Sunflow fully inside Home Assistant and exposes the UI via **Ingress** (no port forwarding required).

Upstream Sunflow (main app):

- https://github.com/robotnikz/Sunflow

The upstream repository also documents the **standalone Docker** deployment (running Sunflow outside of Home Assistant).

This add-on bundles the full app (frontend + backend) and runs standalone inside Home Assistant.

## Installation (one-click style)

1. Home Assistant → **Settings** → **Add-ons** → **Add-on Store**.
2. Open the menu (top right) → **Repositories**.
3. Add this repository URL:
   - `https://github.com/robotnikz/sunflow-ha`
4. Find **Sunflow** in the Add-on Store and click **Install**.
5. (Optional) Open the add-on **Configuration** page and set:
   - `admin_token`: protects write/admin endpoints
6. Click **Start**.
7. Open the UI:
   - Home Assistant sidebar → **Sunflow** (Ingress panel)

## Data persistence

Sunflow stores its database and uploads in the add-on `/data` directory, which is persisted by Home Assistant.

## Integration (optional)

If you also install the Sunflow integration (HACS/custom component), it can auto-connect to the locally installed add-on on supervised installations.

Note: adding a custom integration repository is done in **HACS** (not in Home Assistant's Integrations UI).

## Development checks

### Ingress build check (recommended)

Validates that the production build uses **relative** asset URLs (required for Home Assistant Ingress).

- From `sunflow/sunflow/` run: `npm run test:ingress`

### Add-on Docker smoke test (optional, requires Docker)

Builds the Home Assistant add-on container and verifies the backend becomes ready by calling `/api/info`.

- From the repo root run: `powershell -File .\scripts\addon_smoke_test.ps1`

## HAOS / Supervised test plan

For a full end-to-end validation on a real Home Assistant OS / Supervised system, follow:

- `docs/HAOS_TESTPLAN.md`
