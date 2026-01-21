# Sunflow for Home Assistant (Add-on + Integration)

This repository provides Sunflow as a **Home Assistant Add-on** (Ingress UI) and an optional **Home Assistant Integration** (sensors + config flow).

## Upstream project

The "main app" is **Sunflow**:

- https://github.com/robotnikz/Sunflow

This Home Assistant repository packages that app as a **complete, standalone add-on** (frontend + backend) that runs independently inside Home Assistant.
The Home Assistant integration is **optional** and only needed if you want entities/sensors in Home Assistant.

Important: do **not** add `https://github.com/robotnikz/Sunflow` to HACS as an *Integration*.
That upstream repository is the standalone app, not a Home Assistant `custom_components/` integration.
For HACS you must add **this** repository: `https://github.com/robotnikz/sunflow-ha`.

Versioning note: the Home Assistant add-on and integration use independent versions (this repo release), and the bundled Sunflow app has its own upstream version.

## Install (Add-on)

1. Home Assistant → **Settings** → **Add-ons** → **Add-on Store**.
2. Menu (top right) → **Repositories**.
3. Add: `https://github.com/robotnikz/sunflow-ha`
4. Install **Sunflow**.
5. (Optional) Set `admin_token` in the add-on configuration.
6. Start the add-on.
7. Open the UI via the **Sunflow** sidebar entry (Ingress).

For an end-to-end checklist on real HAOS / Supervised, see: [docs/HAOS_TESTPLAN.md](docs/HAOS_TESTPLAN.md).

## Install (Integration via HACS, optional)

This is recommended if you want entities/sensors inside Home Assistant.

Note: the **Home Assistant Integrations** screen does not have "custom repositories". That feature is part of **HACS**.

1. Install HACS.
2. HACS → **Integrations** → menu → **Custom repositories**.
3. Add `https://github.com/robotnikz/sunflow-ha` as type **Integration**.
4. Install **Sunflow**.
5. Restart Home Assistant.
6. Settings → **Devices & services** → **Add integration** → **Sunflow**.

If you don't use HACS, you can install manually:

1. Copy `custom_components/sunflow/` into your Home Assistant config folder at `config/custom_components/sunflow/`.
2. Restart Home Assistant.
3. Settings → **Devices & services** → **Add integration** → **Sunflow**.

On supervised installations (HAOS / HA Supervised), the integration can auto-connect to the locally installed Sunflow add-on via the Supervisor network (no host port exposure required).

## Layout


## Logo/Icon in Home Assistant & HACS

Home Assistant and HACS load integration branding from the official brands repository.
If you don’t see a Sunflow icon/logo yet, see [docs/BRANDING.md](docs/BRANDING.md).

## Development / CI

- Ingress build check: run `npm run test:ingress` from `sunflow/sunflow/`.
- Add-on smoke test (Docker): run `powershell -File .\scripts\addon_smoke_test.ps1` from repo root.

CI runs both checks via `.github/workflows/ci.yml`.
