# HAOS / Supervised Test Plan (Sunflow)

Purpose: Verify that the **Sunflow add-on** on Home Assistant OS / Supervised:

- installs cleanly
- starts reliably (no crash loop)
- is usable via **Ingress** (no absolute asset/API paths)
- persists data under **/data**
- optionally works together with the **Sunflow integration**

This plan is intentionally step-by-step and checklist-friendly.

## Copy/paste: user-facing install message

You can post this as-is for users:

1) Install the add-on

- Home Assistant → Settings → Add-ons → Add-on Store → menu (top right) → Repositories
- Add: `https://github.com/robotnikz/sunflow-ha`
- Install **Sunflow**, start it, then open the UI via the **Sunflow** sidebar entry (Ingress)

2) (Optional) Install the integration (entities/sensors)

- HACS → Integrations → menu → Custom repositories
- Add: `https://github.com/robotnikz/sunflow-ha` (type: **Integration**)
- Install **Sunflow**, restart Home Assistant
- Settings → Devices & services → Add integration → **Sunflow**
- On HAOS/Supervised choose **Use local Home Assistant add-on** to auto-connect

## Prerequisites

- Home Assistant OS or Home Assistant Supervised (with Supervisor / Add-ons)
- Internet access for add-on installation
- Optional: Fronius Gen24 (or other supported setup) for live inverter data

## Evidence (for bug reports)

If something fails, collect:

- Add-on logs (Sunflow add-on → Log)
- Supervisor logs (if available)
- Screenshot of the error (UI)
- Home Assistant version + Supervisor version

## 1) Add add-on repository

1. Home Assistant → **Settings** → **Add-ons** → **Add-on Store**
2. Menu (⋮) → **Repositories**
3. Add repository: `https://github.com/robotnikz/sunflow-ha`

Expected:

- Sunflow appears in the Add-on Store

Screenshot checkpoint: Add-on Store showing “Sunflow”.

## 2) Install the add-on

1. Open the Sunflow add-on → **Install**
2. Wait until the installation finishes

Expected:

- Installation completes without errors

If it fails (common):

- Build/download problems → check network/DNS and retry later

## 3) Configure (minimum)

1. Add-on → **Configuration**
2. Options:
   - `admin_token` (optional): protects admin/write endpoints
   - `cors_origin` (optional): usually leave empty
3. Save

Expected:

- Saving works without errors

## 4) Start & health check

1. Add-on → **Start**
2. Add-on → **Log** and watch for 30–60 seconds

Expected:

- Status = Running
- No repeated restarts
- No “readonly DB” / permission errors

Acceptance (hard criteria):

- `/api/info` is reachable
- Database file exists at `/data/solar_data.db` (persistence)

Screenshot checkpoint: Add-on status “Running” + logs without errors.

## 5) Open the Ingress UI

1. Sidebar → **Sunflow** (Ingress panel)

Expected:

- UI loads without 404/502
- Styling is present (not “unstyled HTML”)
- No “Failed to connect to backend or inverter” on UI start (no inverter IP is fine, but the backend must be reachable)

Typical failure patterns & causes:

- White screen + 404 for assets → absolute paths in build output (Ingress path issue)
- UI loads, but API calls fail → requests go to HA Core instead of add-on (Ingress path issue)

Screenshot checkpoint: Dashboard is visible.

## 6) Basic configuration in Sunflow (optional, recommended)

If you have an inverter:

1. In the Sunflow UI open Settings
2. Set inverter IP
3. Save
4. Wait 1–2 minutes

Expected:

- Values update (PV/Grid/Load/SoC)
- No persistent UI errors

If you do not have an inverter:

- Only verify that the settings dialog works and saving does not crash

## 7) Supervisor watchdog (stability)

1. Let the add-on run for 5–10 minutes

Expected:

- No spontaneous restarts
- If the service hangs, Supervisor should restart it (watchdog is configured)

## 8) Install the integration (optional)

Option A: HACS (recommended)

- Add this repo to HACS as an “Integration”, then install

Option B: manual

- Copy `custom_components/sunflow` to `/config/custom_components/sunflow`
- Restart Home Assistant

Then:

1. Home Assistant → **Settings** → **Devices & services**
2. **Add integration** → “Sunflow”
3. On HAOS/Supervised: choose **Use local Home Assistant add-on**

Expected:

- Integration discovers/connects to the add-on
- Entities/sensors appear:
  - Version
  - PV Power / Grid Power / Load Power
  - Battery SoC

Screenshot checkpoint: Devices & services shows “Sunflow” as configured.

## 9) Reboot/update scenarios

1. Reboot Home Assistant
2. Verify: add-on starts automatically
3. Verify: Ingress UI is reachable
4. (Optional) Verify: integration entities remain available

Expected:

- Stable autostart, no manual intervention required

## Acceptance checklist (quick)

- [ ] Repository added, Sunflow visible
- [ ] Add-on installs without errors
- [ ] Add-on starts (no crash loop)
- [ ] Ingress UI loads, styling ok
- [ ] Persistence ok: DB exists at `/data/solar_data.db`
- [ ] (Optional) Live inverter data works
- [ ] (Optional) Integration connects via “local add-on” and sensors appear
- [ ] Survives reboot (autostart + UI reachable)

## Troubleshooting (short)

- **Ingress UI blank/404**: check add-on logs, hard-refresh browser cache, retry.
- **DB readonly / no persistence**: check add-on logs for permission/readonly; `/data` must be writable.
- **Integration cannot find add-on**: ensure Supervisor is present (HAOS/Supervised) and add-on is running.
