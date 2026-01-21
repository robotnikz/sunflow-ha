from __future__ import annotations

from datetime import timedelta
import logging
import time

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity, DataUpdateCoordinator

from .api import SunflowClient
from .const import (
    CONF_ADMIN_TOKEN,
    CONF_BASE_URL,
    CONF_SCAN_INTERVAL_SECONDS,
    DEFAULT_OPTIONS_SCAN_INTERVAL_SECONDS,
    DEFAULT_SCAN_INTERVAL_SECONDS,
    DOMAIN,
)


_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    base_url = entry.data[CONF_BASE_URL]
    admin_token = entry.data.get(CONF_ADMIN_TOKEN) or None

    session = async_get_clientsession(hass)
    client = SunflowClient(session=session, base_url=base_url, admin_token=admin_token)

    # Realtime should be fast for automations/notifications.
    # Info is relatively static, so avoid fetching it on every tick.
    info_ttl_seconds = 60 * 60
    last_info_fetch_monotonic = 0.0
    cached_info = None

    async def _async_update_data():
        nonlocal last_info_fetch_monotonic, cached_info
        now = time.monotonic()

        if cached_info is None or (now - last_info_fetch_monotonic) >= info_ttl_seconds:
            cached_info = await client.get_info()
            last_info_fetch_monotonic = now

        realtime = await client.get_realtime()
        return {"info": cached_info, "realtime": realtime}

    scan_interval_seconds = entry.options.get(CONF_SCAN_INTERVAL_SECONDS, DEFAULT_OPTIONS_SCAN_INTERVAL_SECONDS)
    try:
        scan_interval_seconds = int(scan_interval_seconds)
    except (TypeError, ValueError):
        scan_interval_seconds = DEFAULT_SCAN_INTERVAL_SECONDS

    coordinator = DataUpdateCoordinator(
        hass,
        logger=_LOGGER,
        name=f"Sunflow ({base_url})",
        update_method=_async_update_data,
        update_interval=timedelta(seconds=scan_interval_seconds),
    )

    try:
        await coordinator.async_config_entry_first_refresh()
    except Exception as err:
        # Without this, setup can fail silently for users, and no entities appear.
        raise ConfigEntryNotReady from err

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {"client": client, "coordinator": coordinator}

    async_add_entities(
        [
            SunflowVersionSensor(coordinator, entry),
            SunflowPVPowerSensor(coordinator, entry),
            SunflowLoadPowerSensor(coordinator, entry),
            SunflowGridPowerSensor(coordinator, entry),
            SunflowBatteryPowerSensor(coordinator, entry),
            SunflowBatteryChargePowerSensor(coordinator, entry),
            SunflowBatteryDischargePowerSensor(coordinator, entry),
            SunflowBatterySocSensor(coordinator, entry),
        ],
        update_before_add=False,
    )


class _SunflowBaseSensor(CoordinatorEntity, SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._entry = entry

    @property
    def device_info(self):
        return {
            "identifiers": {(DOMAIN, self._entry.entry_id)},
            "name": self._entry.title,
            "manufacturer": "Sunflow",
            "entry_type": "service",
        }

    @property
    def available(self) -> bool:
        return self.coordinator.last_update_success


class SunflowVersionSensor(_SunflowBaseSensor):
    _attr_name = "Version"

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_sunflow_version"

    @property
    def native_value(self):
        info = self.coordinator.data.get("info")
        return getattr(info, "version", None)


class SunflowPVPowerSensor(_SunflowBaseSensor):
    _attr_name = "PV Power"
    _attr_native_unit_of_measurement = "W"
    _attr_device_class = SensorDeviceClass.POWER
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_sunflow_pv_power"

    @property
    def native_value(self):
        p = (self.coordinator.data.get("realtime") or {}).get("power") or {}
        return p.get("pv")


class SunflowLoadPowerSensor(_SunflowBaseSensor):
    _attr_name = "Load Power"
    _attr_native_unit_of_measurement = "W"
    _attr_device_class = SensorDeviceClass.POWER
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_sunflow_load_power"

    @property
    def native_value(self):
        p = (self.coordinator.data.get("realtime") or {}).get("power") or {}
        return p.get("load")


class SunflowGridPowerSensor(_SunflowBaseSensor):
    _attr_name = "Grid Power"
    _attr_native_unit_of_measurement = "W"
    _attr_device_class = SensorDeviceClass.POWER
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_sunflow_grid_power"

    @property
    def native_value(self):
        p = (self.coordinator.data.get("realtime") or {}).get("power") or {}
        return p.get("grid")


class _SunflowBatteryPowerBase(_SunflowBaseSensor):
    _attr_native_unit_of_measurement = "W"
    _attr_device_class = SensorDeviceClass.POWER
    _attr_state_class = SensorStateClass.MEASUREMENT

    def _get_battery_power_w(self) -> float | None:
        p = (self.coordinator.data.get("realtime") or {}).get("power") or {}
        val = p.get("battery")
        if val is None:
            return None
        try:
            return float(val)
        except (TypeError, ValueError):
            return None


class SunflowBatteryPowerSensor(_SunflowBatteryPowerBase):
    _attr_name = "Battery Power"

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_sunflow_battery_power"

    @property
    def native_value(self):
        # Convention (Sunflow UI):
        #  - positive = discharging (battery -> load/grid)
        #  - negative = charging (pv/grid -> battery)
        return self._get_battery_power_w()


class SunflowBatteryChargePowerSensor(_SunflowBatteryPowerBase):
    _attr_name = "Battery Charge Power"

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_sunflow_battery_charge_power"

    @property
    def native_value(self):
        p = self._get_battery_power_w()
        if p is None:
            return None
        if p < 0:
            return abs(p)
        return 0


class SunflowBatteryDischargePowerSensor(_SunflowBatteryPowerBase):
    _attr_name = "Battery Discharge Power"

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_sunflow_battery_discharge_power"

    @property
    def native_value(self):
        p = self._get_battery_power_w()
        if p is None:
            return None
        if p > 0:
            return p
        return 0


class SunflowBatterySocSensor(_SunflowBaseSensor):
    _attr_name = "Battery SoC"
    _attr_native_unit_of_measurement = "%"

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_sunflow_battery_soc"

    @property
    def native_value(self):
        b = (self.coordinator.data.get("realtime") or {}).get("battery") or {}
        return b.get("soc")
