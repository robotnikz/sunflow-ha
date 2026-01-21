# Changelog

## 0.1.5

- Fix settings save error handling when Home Assistant/proxy returns non-JSON responses (avoid `JSON.parse` popup; show useful status/message).

## 0.1.4

- Fix saving inverter address when users paste a full URL/path (now extracts `private-ip[:port]` safely).

## 0.1.6

- Fix settings save failing with HTTP 404 under Home Assistant Ingress by deriving the correct ingress base path for API calls.
- Show the backend error message in the UI when settings save fails (helps diagnose invalid input or auth).

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
