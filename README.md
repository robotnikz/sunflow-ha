# Sunflow for Home Assistant (Addon + Integration)

This repository is a Home Assistant packaging workspace for Sunflow.

It is also a valid Home Assistant **Add-on repository**: users can add this GitHub URL in the Add-on Store → Repositories and then install the Sunflow add-on.

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

This repo is intended to be used as a packaging/workbench. The `sunflow/` folder is currently a copy of the upstream project.

Repo (packaging): https://github.com/robotnikz/sunflow-ha
