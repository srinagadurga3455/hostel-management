import httpx
from app.core.config import settings


class HostelHttpClient:
    def __init__(self, token: str | None = None):
        self.base_url = settings.HOSTEL_BACKEND_URL.rstrip("/")
        self.token = token
        self.timeout = settings.REQUEST_TIMEOUT

    def _headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    async def get(self, path: str, params: dict | None = None):
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.get(f"{self.base_url}{path}", headers=self._headers(), params=params)
            return res

    async def post(self, path: str, json: dict | None = None):
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(f"{self.base_url}{path}", headers=self._headers(), json=json)
            return res

    async def patch(self, path: str, json: dict | None = None):
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.patch(f"{self.base_url}{path}", headers=self._headers(), json=json)
            return res

    async def put(self, path: str, json: dict | None = None):
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.put(f"{self.base_url}{path}", headers=self._headers(), json=json)
            return res

    async def delete(self, path: str):
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.delete(f"{self.base_url}{path}", headers=self._headers())
            return res
