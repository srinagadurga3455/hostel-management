import httpx
from app.core.config import settings


async def chat_completion(messages: list[dict], temperature: float = 0.7, max_tokens: int = 800) -> str:
    if not settings.GROK_API_KEY:
        raise RuntimeError("GROK_API_KEY not configured")
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        res = await client.post(
            f"{settings.GROK_BASE_URL.rstrip('/')}/chat/completions",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {settings.GROK_API_KEY}"},
            json={"model": settings.GROK_MODEL, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
        )
        if not res.is_success:
            raise RuntimeError(f"LLM request failed {res.status_code}: {res.text[:500]}")
        body = res.json()
        content = body.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not content or not content.strip():
            raise RuntimeError("Empty LLM response")
        return content.strip()


async def chat_completion_json(messages: list[dict], temperature: float = 0.2, max_tokens: int = 600) -> str:
    # Force JSON mode via system prompt; Groq/Grok support response_format
    if not settings.GROK_API_KEY:
        raise RuntimeError("GROK_API_KEY not configured")
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        payload: dict = {"model": settings.GROK_MODEL, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
        # Try JSON mode if supported
        payload["response_format"] = {"type": "json_object"}
        res = await client.post(
            f"{settings.GROK_BASE_URL.rstrip('/')}/chat/completions",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {settings.GROK_API_KEY}"},
            json=payload,
        )
        # Fallback without response_format if 400
        if res.status_code == 400 and "response_format" in payload:
            payload.pop("response_format")
            res = await client.post(
                f"{settings.GROK_BASE_URL.rstrip('/')}/chat/completions",
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {settings.GROK_API_KEY}"},
                json=payload,
            )
        if not res.is_success:
            raise RuntimeError(f"LLM request failed {res.status_code}: {res.text[:500]}")
        body = res.json()
        content = body.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not content or not content.strip():
            raise RuntimeError("Empty LLM response")
        return content.strip()
