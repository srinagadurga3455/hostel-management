"""Backward-compatibility shim — prefer app.db.database."""
from app.db.database import SessionLocal, engine, get_db  # noqa: F401

__all__ = ["engine", "SessionLocal", "get_db"]
