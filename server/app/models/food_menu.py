from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class FoodMenu(Base):
    __tablename__ = "food_menus"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    day: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # MONDAY-SUNDAY
    breakfast: Mapped[str] = mapped_column(Text, nullable=False)
    lunch: Mapped[str] = mapped_column(Text, nullable=False)
    snacks: Mapped[str] = mapped_column(Text, nullable=False)
    dinner: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
