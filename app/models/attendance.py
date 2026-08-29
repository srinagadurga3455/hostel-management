from sqlalchemy import String, Date, ForeignKey, UniqueConstraint, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("student_id", "date", name="uq_attendance_student_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[str] = mapped_column(Date, nullable=False)  # YYYY-MM-DD
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # PRESENT / ABSENT
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    student: Mapped["Student"] = relationship("Student")
