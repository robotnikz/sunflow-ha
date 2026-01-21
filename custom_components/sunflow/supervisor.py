from __future__ import annotations

import os
from typing import Any

from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import ADDON_SLUG

SUPERVISOR_BASE_URL = "http://supervisor"


def _supervisor_token() -> str | None:
    return os.environ.get("SUPERVISOR_TOKEN")


def _auth_headers() -> dict[str, str]:
    token = _supervisor_token()
    if not token:
        return {}
    return {"Authorization": f"Bearer {token}"}


async def async_is_supervised(hass) -> bool:
    """Return True if Supervisor appears reachable with a token.

    This is intentionally lightweight and avoids importing internal hassio modules.
    """
    if not _supervisor_token():
        return False
    session = async_get_clientsession(hass)
    try:
        async with session.get(f"{SUPERVISOR_BASE_URL}/supervisor/ping") as resp:
            return resp.status == 200
    except Exception:
        return False


async def async_get_addons(hass) -> list[dict[str, Any]]:
    """Return the Supervisor add-ons list."""
    session = async_get_clientsession(hass)
    async with session.get(f"{SUPERVISOR_BASE_URL}/addons", headers=_auth_headers()) as resp:
        resp.raise_for_status()
        payload = await resp.json()

    data = payload.get("data") or {}
    addons = data.get("addons") or []
    if not isinstance(addons, list):
        return []
    return [a for a in addons if isinstance(a, dict)]


def _is_sunflow_addon(addon: dict[str, Any], slug_hint: str = ADDON_SLUG) -> bool:
    slug = str(addon.get("slug", ""))
    name = str(addon.get("name", ""))

    if slug == slug_hint:
        return True

    # Some Supervisor APIs expose the “full” slug including repository identifier.
    # We match the trailing part so users don't need to know that identifier.
    if slug.split("_")[-1] == slug_hint:
        return True

    if name.strip().lower() == "sunflow":
        return True

    return False


async def async_get_sunflow_addon_slug(hass) -> str:
    addons = await async_get_addons(hass)
    for addon in addons:
        if _is_sunflow_addon(addon):
            slug = str(addon.get("slug", "")).strip()
            if slug:
                return slug
    raise RuntimeError("Sunflow add-on not found")


async def async_get_addon_info(hass, addon_slug: str) -> dict[str, Any]:
    """Return Supervisor /addons/<addon>/info payload data."""
    session = async_get_clientsession(hass)
    async with session.get(
        f"{SUPERVISOR_BASE_URL}/addons/{addon_slug}/info",
        headers=_auth_headers(),
    ) as resp:
        resp.raise_for_status()
        payload = await resp.json()

    data = payload.get("data") or {}
    if not isinstance(data, dict):
        return {}
    return data
