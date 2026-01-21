## [1.0.2](https://github.com/robotnikz/sunflow-ha/compare/v1.0.1...v1.0.2) (2026-01-21)


### Bug Fixes

* **release:** append upstream info to notes ([cf22f8d](https://github.com/robotnikz/sunflow-ha/commit/cf22f8daf8264e0d078b9896747e560e72f0e63e))





## [1.0.2](https://github.com/robotnikz/sunflow-ha/compare/v1.0.1...v1.0.2) (2026-01-21)


### Bug Fixes

* **release:** append upstream info to notes ([cf22f8d](https://github.com/robotnikz/sunflow-ha/commit/cf22f8daf8264e0d078b9896747e560e72f0e63e))





---
### Upstream Sunflow (Main Project)
- Standalone Docker app: https://github.com/robotnikz/Sunflow
- Bundled upstream version: v1.11.1
### Home Assistant Packaging
- Add-on + integration repo: https://github.com/robotnikz/sunflow-ha
- Upstream sync process: https://github.com/robotnikz/sunflow-ha/blob/main/docs/SYNCING.md

## [1.0.1](https://github.com/robotnikz/sunflow-ha/compare/v1.0.0...v1.0.1) (2026-01-21)


### Bug Fixes

* **sync:** make upstream patch layer CI-safe ([512c358](https://github.com/robotnikz/sunflow-ha/commit/512c35848cf1548f7d86d8740725df7e70631560))

# Changelog

This changelog tracks the Home Assistant add-on wrapper version.
The bundled upstream Sunflow app has its own release/versioning.

Upstream Sunflow: https://github.com/robotnikz/Sunflow

## 1.0.0

- Stable baseline release of the Home Assistant add-on + optional integration.
- Integration: polling interval is configurable via Options and updates now reliably follow that interval.
- Integration: battery sensors (signed battery power + charge/discharge split), plus PV/load/grid and SoC.
- Add-on/UI: Ingress save reliability improvements and supervised add-on auto-connect improvements.
- App: Smart Usage appliances persist correctly (empty list is respected; kWh-per-run devices are supported).

## 0.1.11

- Integration: default polling interval is now 10s for better automations/notifications (configurable via Options).
- Integration: Options screen warns that 5s polling increases traffic/load.
- HACS: add repository `icon.png`/`logo.png` so the Sunflow logo is shown in the HACS UI.

## 0.1.10

- Integration: add an Options screen to configure the polling interval (default still 30s unless changed by the user).
- Integration: avoid calling `/api/info` on every poll (cache via TTL ~1h); realtime `/api/data` remains per poll for timely automations.

## 0.1.9

- Integration: add battery charge/discharge power sensors (and signed battery power) derived from `power.battery`.
- Add-on/backend: make aWATTar compare resilient when the tariffs table is temporarily empty (fallback to config defaults instead of returning HTTP 400).

## 0.1.8

- Integration: fix missing entities by retrying setup when the add-on is temporarily unreachable and by making entity unique IDs per config entry.

## 0.1.7

- Integration: improve "Use local add-on" auto-connect by trying multiple Supervisor/Docker hostname patterns (fixes "Failed to connect to Sunflow" on some HA installs).

## 0.1.6

- Fix settings save failing with HTTP 404 under Home Assistant Ingress by deriving the correct ingress base path for API calls.

## 0.1.5

- Fix settings save error handling when Home Assistant/proxy returns non-JSON responses (avoid `JSON.parse` popup; show useful status/message).
	- Also shows the backend error message in the UI when settings save fails (helps diagnose invalid input or auth).

## 0.1.4

- Fix saving inverter address when users paste a full URL/path (now extracts `private-ip[:port]` safely).

## 0.1.3

- Fix saving settings in the Ingress UI when the add-on `admin_token` option is set (frontend now supports Bearer token auth stored locally).
- Fix notification test call for Home Assistant Ingress (no more absolute `/api/...` path).

## 0.1.2

- Fix add-on install/build in Home Assistant Supervisor (remove invalid `${BUILD_FROM}` build arg mapping).

## 0.1.1

- Fix add-on build on ARM by using the public multi-arch Home Assistant add-on base image.
- Add armhf support.

## 0.1.0

- Home Assistant add-on packaging (Ingress UI, persistent `/data`, basic configuration options).
- Bundles upstream Sunflow app version 1.11.1.
