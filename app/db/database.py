"""SQLAlchemy engine, session factory and FastAPI dependency.

Flow: Router → Depends(get_db) → Session → PostgreSQL
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# PostgreSQL requires psycopg2 / psycopg driver indicated in DATABASE_URL.
# e.g. postgresql+psycopg2://user:pass@host:5434/db
# Use pool_pre_ping to handle stale connections; no SQLite check_same_thread needed.
connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
    "echo": False,
}

# Keep SQLite fallback for local tests without Postgres
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    # SQLite does not support pool_pre_ping / pooling options in same way
    engine_kwargs.pop("pool_pre_ping", None)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that yields a DB session and ensures cleanup."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
