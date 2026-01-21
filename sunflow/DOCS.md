# Sunflow (Home Assistant Add-on)

This add-on runs Sunflow fully inside Home Assistant and exposes the UI via **Ingress** (no port forwarding required).

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
