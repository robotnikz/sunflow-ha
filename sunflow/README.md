# Sunflow (Home Assistant Add-on)

Sunflow is a self-hosted solar energy dashboard that runs entirely inside Home Assistant as an add-on.
It provides an Ingress UI (opens in the Home Assistant sidebar) and a local REST API for data access.

## Features

- Ingress UI (no port exposure required)
- Persistent storage under `/data` (survives restarts/upgrades)
- Built-in health endpoint (`/api/info`) used by Supervisor watchdog
- Optional Home Assistant integration available in this repository (sensors + config flow)

Versioning: the Home Assistant add-on uses its own versioning. It bundles upstream Sunflow app version 1.11.1.

## Getting started

1. Install the add-on from your custom add-on repository.
2. Start the add-on.
3. Open **Sunflow** from the Home Assistant sidebar.
4. Complete configuration inside the Sunflow UI (e.g. inverter/IP, location, optional providers).

If you also install the **Sunflow** Home Assistant integration (via HACS/custom repo), you can create sensors/entities and use the data in Home Assistant dashboards.

## Configuration

This add-on intentionally keeps configuration minimal. Most settings are done inside the Sunflow UI.

Add-on options:

- `log_level` (default: `info`)
- `admin_token` (optional): protects admin/write endpoints if you enable them
- `cors_origin` (optional): set only if you intentionally expose the API to other origins

If you set `admin_token`, open **System Settings** in the Sunflow UI and enter the same token in **Admin Token (optional)**. This is stored locally in your browser and is used to authenticate protected actions (e.g. saving settings).

## Troubleshooting

- If the UI does not load in Ingress, restart the add-on and check the add-on logs.
- If data does not persist, ensure the add-on is allowed to use `/data` (this add-on is configured to store its SQLite DB there).
- If you set `admin_token`, keep it private. You only need it for admin/write endpoints.

## Documentation

- Add-on docs: [DOCS.md](DOCS.md)
- Full repository documentation: https://github.com/robotnikz/sunflow-ha
