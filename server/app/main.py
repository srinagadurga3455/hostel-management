from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.routers import api_router
from app.agent.router import router as agent_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="Hostel Management AI Agent - FastAPI",
)

cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()] if settings.CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True if cors_origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(agent_router)

@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "message": "Hostel Management API is running"}

@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}
