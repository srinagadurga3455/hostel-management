from app.db.database import engine
from app.db.base import Base

print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")