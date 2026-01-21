from __future__ import annotations

from datetime import timedelta
import logging

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .api import SunflowClient
from .const import CONF_ADMIN_TOKEN, CONF_BASE_URL, DEFAULT_SCAN_INTERVAL_SECONDS, DOMAIN


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

    async def _async_update_data():
        info = await client.get_info()
        realtime = await client.get_realtime()
        return {"info": info, "realtime": realtime}

    coordinator = DataUpdateCoordinator(
        hass,
        logger=_LOGGER,
        name=f"Sunflow ({base_url})",
        update_method=_async_update_data,
        update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL_SECONDS),
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


class _SunflowBaseSensor(SensorEntity):
    _attr_has_entity_name = True

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        self._coordinator = coordinator
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
        return self._coordinator.last_update_success

    async def async_update(self) -> None:
        await self._coordinator.async_request_refresh()


class SunflowVersionSensor(_SunflowBaseSensor):
    _attr_name = "Version"

    def __init__(self, coordinator: DataUpdateCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_sunflow_version"

    @property
    def native_value(self):
        info = self._coordinator.data.get("info")
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
        p = (self._coordinator.data.get("realtime") or {}).get("power") or {}
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
        p = (self._coordinator.data.get("realtime") or {}).get("power") or {}
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
        p = (self._coordinator.data.get("realtime") or {}).get("power") or {}
        return p.get("grid")


class _SunflowBatteryPowerBase(_SunflowBaseSensor):
    _attr_native_unit_of_measurement = "W"
    _attr_device_class = SensorDeviceClass.POWER
    _attr_state_class = SensorStateClass.MEASUREMENT

    def _get_battery_power_w(self) -> float | None:
        p = (self._coordinator.data.get("realtime") or {}).get("power") or {}
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
        b = (self._coordinator.data.get("realtime") or {}).get("battery") or {}
        return b.get("soc")
