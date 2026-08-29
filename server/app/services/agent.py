import os
import httpx
from fastapi import HTTPException

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

AGENT_SYSTEM_PROMPT = """You are a helpful and friendly hostel management chatbot.

Your current role is only to have natural conversations with users.

You can:
- Greet users.
- Answer general questions.
- Explain what you can help with.
- Maintain the context of the current conversation if conversation history is provided.
- Respond naturally and concisely.

Do not pretend that you have performed any hostel operation.
Do not claim that you submitted leave, checked attendance, created complaints, processed outing requests, or modified any data.

Those capabilities will be added later through tools.

For now, your job is simply to have a natural conversation with the user."""


def _api_key() -> str | None:
    return os.getenv("XAI_API_KEY") or os.getenv("AI_API_KEY")


def _base_url() -> str:
    return os.getenv("XAI_BASE_URL") or os.getenv("AI_BASE_URL") or "https://api.x.ai/v1"


def _model() -> str:
    return os.getenv("XAI_MODEL") or os.getenv("AI_MODEL") or "qwen/qwen3.8-27b"


async def chat(message: str, conversation_id: str | None = None, history: list[dict] | None = None) -> str:
    if not message or not message.strip():
        raise HTTPException(status_code=400, detail="message must be a non-empty string")

    api_key = _api_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="Grok API key is not configured. Set XAI_API_KEY (or AI_API_KEY) in environment variables.")

    messages: list[dict] = [{"role": "system", "content": AGENT_SYSTEM_PROMPT}]

    if history:
        for h in history:
            if h.get("role") in ("user", "assistant") and isinstance(h.get("content"), str):
                messages.append({"role": h["role"], "content": h["content"]})

    messages.append({"role": "user", "content": message.strip()})

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                f"{_base_url()}/chat/completions",
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
                json={"model": _model(), "messages": messages, "temperature": 0.7, "max_tokens": 500},
            )
    except Exception:
        raise HTTPException(status_code=502, detail="Grok API is currently unavailable. Please try again later.")

    if not res.is_success:
        if res.status_code == 429:
            raise HTTPException(status_code=429, detail="Grok API rate limit exceeded. Please try again later.")
        raise HTTPException(status_code=502, detail=f"Grok API request failed with status {res.status_code}")

    try:
        body = res.json()
        content = body["choices"][0]["message"]["content"].strip()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid response from Grok API")

    if not content:
        raise HTTPException(status_code=502, detail="Invalid response from Grok API")

    return content
