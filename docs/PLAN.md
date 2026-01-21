# Plan: Sunflow als Home-Assistant Add-on + Integration

## Zielbild

- **Add-on**: startet Sunflow (Node + Vite built assets) in Home Assistant Supervisor, inkl. **Ingress** (UI im HA-Panel), persistente Daten unter `/data`.
- **Integration**: verbindet sich mit Sunflow API und stellt Sensors/Entities in Home Assistant bereit.

---

## Milestone 0 — Repo/Grundgerüst (Status: umgesetzt)

- Monorepo Struktur vorhanden:
  - `repository.yaml` (Add-on Repository Metadata)
  - `sunflow/` (Add-on)
  - `upstream/` (Upstream Copy)
  - `custom_components/sunflow/` (Integration Skeleton)

---

## Milestone 1 — Add-on MVP (Ingress + Persistenz)

### Aufgaben
- Add-on lokal build/installierbar (Supervisor → Add-on Store → Repositories).
- Start/Stop/Logs funktionieren.
- Persistenz: DB/Config/Uploads landen unter `/data`.
- Options werden in Env gemappt:
  - `admin_token` → `SUNFLOW_ADMIN_TOKEN`
  - `cors_origin` → `SUNFLOW_CORS_ORIGIN`

### Tests
- HA OS: Add-on installieren, starten.
- UI via Ingress lädt.
- `GET /api/info` liefert JSON.
- `POST /api/config` (wenn Token gesetzt) funktioniert.

### Optional (MVP+)
- Optionale Port-Freigabe (z.B. `3000/tcp`) zusätzlich zu Ingress.

---

## Milestone 2 — Integration MVP (Config Flow + Basissensoren)

### Aufgaben
- Config Flow erlaubt Setup per `base_url` + optional `admin_token`.
- Sensoren:
  - Version (`/api/info`)
  - PV/Load/Grid Power + Battery SoC (`/api/data`)
- Diagnostics liefert Coordinator data (Token redacted).

### Tests (manuell)
- HA → Geräte & Dienste → Integration hinzufügen → Sunflow.
- Sensorwerte erscheinen und aktualisieren.

### Optional
- Add-on Auto-URL: später via Supervisor API (Add-on URL/host) vereinfachen.

---

## Milestone 3 — Integration Ausbau (Mehr Entities + Services)

### Kandidaten
- ROI (`/api/roi`) als Sensor(en) (z.B. roiPercent, netValue).
- Battery Health (`/api/battery-health`) als Sensor(en) (z.B. latest efficiency/cycles).
- Services:
  - `test_notification` (mapped to `/api/test-notification`, requires admin token)

---

## Milestone 4 — Packaging/Release

### Add-on
- Versionierung: `sunflow/config.yaml` Version per Release Tag.
- Multi-arch build in GitHub Actions (optional).

### Integration (HACS)
- `hacs.json` (optional) und Release ZIP Assets.
- Tag-basierte Releases.

---

## Empfohlene nächste Schritte (konkret)

1) Entscheiden: Add-on **Ingress-only** oder zusätzlich Host-Port?
2) Add-on in einer HA-Testinstanz installieren.
3) Integration in derselben Instanz hinzufügen und auf den Add-on-URL zeigen.
4) Danach CI/Release-Flow aufsetzen.
