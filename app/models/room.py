from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    room_number: Mapped[str] = mapped_column("room_number", String(50), unique=True, nullable=False)
    block: Mapped[str] = mapped_column(String(50), nullable=False, default="A")
    floor: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    occupied: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    students: Mapped[list["Student"]] = relationship("Student", back_populates="room")
