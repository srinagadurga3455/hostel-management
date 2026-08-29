import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Hostel Management"
    API_V1_STR: str = "/api/v1"

    # DB - production must set DATABASE_URL explicitly; dev fallback is isolated
    ENV: str = os.getenv("ENV", "development")
    _db_url_env: str | None = os.getenv("DATABASE_URL")
    DATABASE_URL: str = _db_url_env if _db_url_env else "postgresql+psycopg2://postgres:123@localhost:5434/hostel_management"
    SECRET_KEY: str = "change-me-in-production"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "fallback-secret")
    JWT_EXPIRES_IN: str = os.getenv("JWT_EXPIRES_IN", "7d")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Grok / Groq LLM
    GROK_API_KEY: str = os.getenv("GROK_API_KEY", "") or os.getenv("XAI_API_KEY", "") or os.getenv("AI_API_KEY", "")
    GROK_MODEL: str = os.getenv("GROK_MODEL", "") or os.getenv("XAI_MODEL", "") or os.getenv("AI_MODEL", "") or "qwen/qwen3-8b"
    GROK_BASE_URL: str = os.getenv("GROK_BASE_URL", "") or os.getenv("XAI_BASE_URL", "") or os.getenv("AI_BASE_URL", "") or "https://api.x.ai/v1"

    # Agent
    HOSTEL_BACKEND_URL: str = os.getenv("HOSTEL_BACKEND_URL", "http://localhost:8000")
    AGENT_API_PREFIX: str = os.getenv("AGENT_API_PREFIX", "/api/agent")
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "30"))
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")


settings = Settings()

# Enforce production requirements
if settings.ENV == "production":
    if not os.getenv("DATABASE_URL"):
        raise RuntimeError("DATABASE_URL must be set in production (ENV=production). Refusing to use dev fallback.")
    if settings.JWT_SECRET == "fallback-secret" or settings.SECRET_KEY == "change-me-in-production":
        raise RuntimeError("JWT_SECRET/SECRET_KEY must be set in production.")

if os.getenv("JWT_SECRET"):
    settings.SECRET_KEY = settings.JWT_SECRET
if not settings.GROK_API_KEY:
    settings.GROK_API_KEY = os.getenv("GROK_API_KEY", "") or os.getenv("XAI_API_KEY", "") or os.getenv("AI_API_KEY", "")
