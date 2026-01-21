from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from aiohttp import ClientResponseError, ClientSession


@dataclass
class SunflowSystemInfo:
    version: str
    update_available: bool
    latest_version: str
    release_url: str | None = None


class SunflowClient:
    def __init__(self, session: ClientSession, base_url: str, admin_token: str | None = None) -> None:
        self._session = session
        self._base_url = base_url.rstrip("/")
        self._admin_token = admin_token

    def _headers(self) -> dict[str, str]:
        if not self._admin_token:
            return {}
        return {"Authorization": f"Bearer {self._admin_token}"}

    async def _get_json(self, path: str) -> Any:
        url = f"{self._base_url}{path}"
        async with self._session.get(url, headers=self._headers()) as resp:
            resp.raise_for_status()
            return await resp.json()

    async def get_info(self) -> SunflowSystemInfo:
        data = await self._get_json("/api/info")
        return SunflowSystemInfo(
            version=str(data.get("version", "")),
            update_available=bool(data.get("updateAvailable", False)),
            latest_version=str(data.get("latestVersion", "")),
            release_url=data.get("releaseUrl"),
        )

    async def get_realtime(self) -> dict[str, Any]:
        return await self._get_json("/api/data")

    async def get_roi(self) -> dict[str, Any]:
        return await self._get_json("/api/roi")

    async def get_battery_health(self) -> dict[str, Any]:
        return await self._get_json("/api/battery-health")

    async def async_validate(self) -> SunflowSystemInfo:
        # A lightweight validation call for the config flow.
        return await self.get_info()
