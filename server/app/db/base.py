from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Import models to register with Base.metadata
from app.models.user import User  # noqa: F401
from app.models.student import Student  # noqa: F401
from app.models.room import Room  # noqa: F401
from app.models.attendance import Attendance  # noqa: F401
from app.models.complaint import Complaint  # noqa: F401
from app.models.food_menu import FoodMenu  # noqa: F401
from app.models.outing import Outing  # noqa: F401
from app.models.leave import Leave  # noqa: F401
