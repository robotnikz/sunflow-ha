from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import DOMAIN


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: ConfigEntry):
    data = hass.data.get(DOMAIN, {}).get(entry.entry_id, {})
    coordinator: DataUpdateCoordinator | None = data.get("coordinator")

    diag = {
        "entry": {
            "title": entry.title,
            "data": {**entry.data, "admin_token": "***" if entry.data.get("admin_token") else ""},
        },
    }

    if coordinator is not None:
        diag["last_update_success"] = coordinator.last_update_success
        diag["data"] = coordinator.data

    return diag
