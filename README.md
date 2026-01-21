# Sunflow for Home Assistant (Add-on + Integration)

This repository provides Sunflow as a **Home Assistant Add-on** (Ingress UI) and an optional **Home Assistant Integration** (sensors + config flow).

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

1. Install HACS.
2. HACS → **Integrations** → menu → **Custom repositories**.
3. Add `https://github.com/robotnikz/sunflow-ha` as type **Integration**.
4. Install **Sunflow**.
5. Restart Home Assistant.
6. Settings → **Devices & services** → **Add integration** → **Sunflow**.

On supervised installations (HAOS / HA Supervised), the integration can auto-connect to the locally installed Sunflow add-on via the Supervisor network (no host port exposure required).

## Layout

- `repository.yaml` — Home Assistant Add-on repository metadata
- `sunflow/` — Home Assistant Add-on (Supervisor)
- `sunflow/sunflow/` — Sunflow app source (Vite frontend + Node backend)
- `custom_components/sunflow/` — Home Assistant Integration (HACS)
- `scripts/` — smoke tests (Docker-based)
- `docs/` — HAOS/Supervised test plan and notes

## Development / CI

- Ingress build check: run `npm run test:ingress` from `sunflow/sunflow/`.
- Add-on smoke test (Docker): run `powershell -File .\scripts\addon_smoke_test.ps1` from repo root.

CI runs both checks via `.github/workflows/ci.yml`.
