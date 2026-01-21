from __future__ import annotations

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import SunflowClient
from .const import (
    CONF_ADMIN_TOKEN,
    CONF_BASE_URL,
    CONF_SCAN_INTERVAL_SECONDS,
    DEFAULT_LOCAL_ADDON_PORT,
    DEFAULT_SCAN_INTERVAL_SECONDS,
    DOMAIN,
    SCAN_INTERVAL_CHOICES_SECONDS,
)
from .supervisor import async_get_addon_info, async_get_sunflow_addon_slug, async_is_supervised


class SunflowConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    @staticmethod
    @config_entries.callback
    def async_get_options_flow(config_entry: config_entries.ConfigEntry):
        return SunflowOptionsFlow(config_entry)

    async def async_step_user(self, user_input: dict | None = None):
        # Entry point:
        # - On supervised installs: offer to auto-connect to the locally installed add-on.
        # - Otherwise: fall back to manual base_url configuration.
        if await async_is_supervised(self.hass):
            return self.async_show_menu(
                step_id="user",
                menu_options=["local_addon", "manual"],
            )

        return await self.async_step_manual(user_input)

    async def async_step_manual(self, user_input: dict | None = None):
        errors: dict[str, str] = {}

        if user_input is not None:
            base_url = user_input[CONF_BASE_URL]
            admin_token = user_input.get(CONF_ADMIN_TOKEN) or None

            session = async_get_clientsession(self.hass)
            client = SunflowClient(session=session, base_url=base_url, admin_token=admin_token)

            try:
                info = await client.async_validate()
            except Exception:
                errors["base"] = "cannot_connect"
            else:
                title = user_input.get(CONF_NAME) or f"Sunflow ({info.version})"
                await self.async_set_unique_id(base_url)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=title,
                    data={
                        CONF_BASE_URL: base_url,
                        CONF_ADMIN_TOKEN: admin_token or "",
                    },
                )

        schema = vol.Schema(
            {
                vol.Required(CONF_BASE_URL, default="http://localhost:3000"): str,
                vol.Optional(CONF_ADMIN_TOKEN, default=""): str,
                vol.Optional(CONF_NAME, default="Sunflow"): str,
            }
        )

        return self.async_show_form(step_id="manual", data_schema=schema, errors=errors)

    async def async_step_local_addon(self, user_input: dict | None = None):
        errors: dict[str, str] = {}

        if user_input is not None:
            admin_token = user_input.get(CONF_ADMIN_TOKEN) or None

            try:
                addon_slug = await async_get_sunflow_addon_slug(self.hass)
            except Exception:
                errors["base"] = "addon_not_found"
            else:
                session = async_get_clientsession(self.hass)

                # On HA OS / Supervised, add-ons are reachable from HA Core via Docker DNS.
                # Unfortunately the exact hostname can vary between installations.
                # Try a small set of known-good patterns.
                slug_tail = addon_slug.split("_")[-1] if addon_slug else ""
                candidates: list[str] = []

                def _add_candidate(host: str) -> None:
                    h = (host or "").strip()
                    if not h:
                        return
                    url = f"http://{h}:{DEFAULT_LOCAL_ADDON_PORT}"
                    if url not in candidates:
                        candidates.append(url)

                # Common patterns:
                # - <full_slug>:3000 (e.g. a0d7b954_sunflow)
                # - addon_<full_slug>:3000
                # - <slug_tail>:3000 (e.g. sunflow)
                # - addon_<slug_tail>:3000
                _add_candidate(addon_slug)
                _add_candidate(f"addon_{addon_slug}")
                if slug_tail and slug_tail != addon_slug:
                    _add_candidate(slug_tail)
                    _add_candidate(f"addon_{slug_tail}")

                # Fallback: use Supervisor info (IP address) when available.
                try:
                    addon_info = await async_get_addon_info(self.hass, addon_slug)
                except Exception:
                    addon_info = {}

                ip_address = addon_info.get("ip_address")
                if isinstance(ip_address, str) and ip_address.strip():
                    _add_candidate(ip_address.strip())

                last_exc: Exception | None = None
                for base_url in candidates:
                    client = SunflowClient(session=session, base_url=base_url, admin_token=admin_token)
                    try:
                        info = await client.async_validate()
                    except Exception as e:
                        last_exc = e
                        # If the add-on is protected, surface the correct error.
                        # (Currently /api/info is unprotected, but keep this for future-proofing.)
                        status = getattr(e, "status", None)
                        if status == 401:
                            errors["base"] = "unauthorized"
                            break
                        continue
                    else:
                        title = user_input.get(CONF_NAME) or f"Sunflow ({info.version})"
                        await self.async_set_unique_id(f"addon:{addon_slug}")
                        self._abort_if_unique_id_configured()
                        return self.async_create_entry(
                            title=title,
                            data={
                                CONF_BASE_URL: base_url,
                                CONF_ADMIN_TOKEN: admin_token or "",
                            },
                        )

                if "base" not in errors:
                    errors["base"] = "cannot_connect"

        schema = vol.Schema(
            {
                vol.Optional(CONF_ADMIN_TOKEN, default=""): str,
                vol.Optional(CONF_NAME, default="Sunflow"): str,
            }
        )

        return self.async_show_form(step_id="local_addon", data_schema=schema, errors=errors)


class SunflowOptionsFlow(config_entries.OptionsFlow):
    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self._config_entry = config_entry

    async def async_step_init(self, user_input: dict | None = None):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        current = self._config_entry.options.get(CONF_SCAN_INTERVAL_SECONDS, DEFAULT_SCAN_INTERVAL_SECONDS)
        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_SCAN_INTERVAL_SECONDS,
                    default=current,
                ): vol.In(SCAN_INTERVAL_CHOICES_SECONDS)
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
