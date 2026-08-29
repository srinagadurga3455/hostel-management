from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Student(Base):
    __tablename__ = "students"
    __table_args__ = (UniqueConstraint("roll_number", name="uq_students_roll_number"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    roll_number: Mapped[str] = mapped_column("roll_number", String(50), unique=True, index=True, nullable=False)
    branch: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    room_id: Mapped[int | None] = mapped_column(ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="student")
    room: Mapped["Room | None"] = relationship("Room", back_populates="students")
