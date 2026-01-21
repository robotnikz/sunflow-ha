from __future__ import annotations

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import SunflowClient
from .const import CONF_ADMIN_TOKEN, CONF_BASE_URL, DEFAULT_LOCAL_ADDON_PORT, DOMAIN
from .supervisor import async_get_addon_info, async_get_sunflow_addon_slug, async_is_supervised


class SunflowConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

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
                addon_info = await async_get_addon_info(self.hass, addon_slug)
            except Exception:
                errors["base"] = "addon_not_found"
            else:
                # Prefer a stable, Supervisor-reported address, but fall back to
                # a reasonable default.
                host = addon_info.get("hostname") or addon_info.get("ip_address")
                if isinstance(host, str):
                    host = host.strip()
                if not host:
                    # Last-resort: the internal DNS name is usually based on repository+slug.
                    host = addon_slug.replace("_", "-")

                base_url = f"http://{host}:{DEFAULT_LOCAL_ADDON_PORT}"

                session = async_get_clientsession(self.hass)
                client = SunflowClient(session=session, base_url=base_url, admin_token=admin_token)

                try:
                    info = await client.async_validate()
                except Exception:
                    errors["base"] = "cannot_connect"
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

        schema = vol.Schema(
            {
                vol.Optional(CONF_ADMIN_TOKEN, default=""): str,
                vol.Optional(CONF_NAME, default="Sunflow"): str,
            }
        )

        return self.async_show_form(step_id="local_addon", data_schema=schema, errors=errors)
