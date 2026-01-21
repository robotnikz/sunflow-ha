<div align="center">


<img src="logo.png" alt="Sunflow Logo" width="100" />

<h1>Sunflow for Home Assistant</h1>

<strong>Home Assistant Add-on (Ingress UI) + optional Integration (sensors).</strong>

<p>Run the Sunflow dashboard inside Home Assistant, and optionally expose key values as entities.</p>

<p>
  <a href="https://github.com/robotnikz/sunflow-ha/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/robotnikz/sunflow-ha/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="https://github.com/robotnikz/sunflow-ha/releases">
    <img alt="GitHub Release" src="https://img.shields.io/github/v/release/robotnikz/sunflow-ha" />
  </a>
  <a href="https://hacs.xyz/">
    <img alt="HACS" src="https://img.shields.io/badge/HACS-Custom-orange.svg" />
  </a>
</p>

</div>

---

> [!IMPORTANT]
> **Hardware requirement:** Sunflow is built specifically for the **Fronius Solar API** and targets the **Fronius Gen24 (Symo/Primo)** inverter family.
> If you **don't have a Fronius Gen24 inverter with Solar API enabled**, Sunflow will not be able to read live data.

## ⚡ What is this repository?

This repository packages the Sunflow main application as a **Home Assistant Add-on** (Ingress UI) and also provides an optional **Home Assistant Integration** (sensors + config flow).

**Upstream (main app):** https://github.com/robotnikz/Sunflow

- If you want to run Sunflow as a **standalone Docker service** (outside of Home Assistant), use the upstream repository.
- If you want the **Home Assistant Add-on** (Ingress UI) and optional integration, you are in the right place.

> [!IMPORTANT]
> Do **not** add the upstream repository to HACS as an Integration.
> For HACS, use this repository: `https://github.com/robotnikz/sunflow-ha`.

## ✨ Key Features

- **Ingress UI:** opens in the Home Assistant sidebar (no port exposure required).
- **Persistent data:** stored under `/data` in the add-on container (survives restarts/upgrades).
- **Supervisor watchdog support:** built-in `/api/info` health endpoint.
- **Optional Integration:** adds entities/sensors to Home Assistant (via HACS).
- **Independent versioning:** this repo releases independently; it bundles a specific upstream Sunflow version.

---

## 🚀 Install (Add-on)

1. Home Assistant → **Settings** → **Add-ons** → **Add-on Store**.
2. Menu (top right) → **Repositories**.
3. Add: `https://github.com/robotnikz/sunflow-ha`
4. Install **Sunflow**.
5. (Optional) Set `admin_token` in the add-on configuration.
6. Start the add-on.
7. Open the UI via the **Sunflow** sidebar entry (Ingress).

End-to-end checklist on real HAOS / Supervised: [docs/HAOS_TESTPLAN.md](docs/HAOS_TESTPLAN.md)

## 🧩 Install (Integration via HACS, optional)

Recommended if you want entities/sensors inside Home Assistant.

1. Install HACS.
2. HACS → **Integrations** → menu → **Custom repositories**.
3. Add `https://github.com/robotnikz/sunflow-ha` as type **Integration**.
4. Install **Sunflow**.
5. Restart Home Assistant.
6. Settings → **Devices & services** → **Add integration** → **Sunflow**.

Manual install (without HACS):

1. Copy `custom_components/sunflow/` into your Home Assistant config folder at `config/custom_components/sunflow/`.
2. Restart Home Assistant.
3. Settings → **Devices & services** → **Add integration** → **Sunflow**.

On supervised installations (HAOS / HA Supervised), the integration can auto-connect to the locally installed Sunflow add-on via the Supervisor network.

---

## 🗂️ Repository Layout

- `repository.yaml` — add-on repository metadata (Supervisor)
- `sunflow/` — Home Assistant add-on
- `sunflow/sunflow/` — vendored upstream Sunflow app (Vite frontend + Node backend)
- `custom_components/sunflow/` — Home Assistant integration (HACS)
- `docs/` — notes, test plans

## 🧪 Development / CI

- Ingress build check: `npm run test:ingress` (run from `sunflow/sunflow/`)
- Add-on smoke test (Docker): `powershell -File .\scripts\addon_smoke_test.ps1` (run from repo root)

CI runs both via `.github/workflows/ci.yml`.
