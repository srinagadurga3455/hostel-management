import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


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
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.info(f"GET {self.base_url}{path}")
                res = await client.get(f"{self.base_url}{path}", headers=self._headers(), params=params)
                return res
        except httpx.ConnectError as e:
            logger.error(f"Connection failed to {self.base_url}{path}: {e}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise

    async def post(self, path: str, json: dict | None = None):
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.info(f"POST {self.base_url}{path}")
                res = await client.post(f"{self.base_url}{path}", headers=self._headers(), json=json)
                return res
        except httpx.ConnectError as e:
            logger.error(f"Connection failed to {self.base_url}{path}: {e}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise

    async def patch(self, path: str, json: dict | None = None):
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.info(f"PATCH {self.base_url}{path}")
                res = await client.patch(f"{self.base_url}{path}", headers=self._headers(), json=json)
                return res
        except httpx.ConnectError as e:
            logger.error(f"Connection failed to {self.base_url}{path}: {e}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise

    async def put(self, path: str, json: dict | None = None):
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.info(f"PUT {self.base_url}{path}")
                res = await client.put(f"{self.base_url}{path}", headers=self._headers(), json=json)
                return res
        except httpx.ConnectError as e:
            logger.error(f"Connection failed to {self.base_url}{path}: {e}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise

    async def delete(self, path: str):
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.info(f"DELETE {self.base_url}{path}")
                res = await client.delete(f"{self.base_url}{path}", headers=self._headers())
                return res
        except httpx.ConnectError as e:
            logger.error(f"Connection failed to {self.base_url}{path}: {e}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise

