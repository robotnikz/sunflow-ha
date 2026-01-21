# Sunflow for Home Assistant (Addon + Integration)

This repository provides Sunflow as a **Home Assistant Add-on** (Ingress UI) and an optional **Integration**.

## Install (Add-on)

1. Home Assistant → **Settings** → **Add-ons** → **Add-on Store**.
2. Menu (top right) → **Repositories**.
3. Add: `https://github.com/robotnikz/sunflow-ha`
4. Install **Sunflow**.
5. Optional: set `admin_token` in the add-on configuration.
6. Start the add-on.
7. Open the UI via the **Sunflow** sidebar entry (Ingress).

## Layout

- `repository.yaml` — Home Assistant Add-on repository metadata
- `sunflow/` — Home Assistant Add-on (Supervisor)
- `upstream/` — upstream app source copy (Vite frontend + Node backend)
- `custom_components/sunflow/` — Home Assistant Integration (HACS)

## Goals

- Provide Sunflow as a Home Assistant **Add-on** (with Ingress UI)
- Provide a Home Assistant **Integration** to:
  - configure/connect to the Sunflow API
  - expose key sensors/entities
  - optionally register services (e.g. refresh, test notification)

On supervised Home Assistant installations (HA OS / HA Supervised), the integration can auto-connect to the locally installed Sunflow add-on via the Supervisor network (no host port exposure required).

## Development

This repo is intended to be used as a packaging/workbench.

Repo (packaging): https://github.com/robotnikz/sunflow-ha
