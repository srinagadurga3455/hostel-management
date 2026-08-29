from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class DayOfWeek(str, Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"


class CreateFoodMenuDto(BaseModel):
    day: DayOfWeek = Field(..., examples=[DayOfWeek.MONDAY])
    breakfast: str = Field(..., examples=["Idly, Sambar"])
    lunch: str = Field(..., examples=["Rice, Dal, Curry"])
    snacks: str = Field(..., examples=["Tea, Biscuits"])
    dinner: str = Field(..., examples=["Chapati, Curry"])


class UpdateFoodMenuDto(BaseModel):
    breakfast: Optional[str] = Field(default=None, examples=["Poha, Juice"])
    lunch: Optional[str] = Field(default=None, examples=["Rice, Sambar, Vegetable Curry"])
    snacks: Optional[str] = Field(default=None, examples=["Coffee, Cake"])
    dinner: Optional[str] = Field(default=None, examples=["Roti, Paneer"])


class FoodMenuOut(BaseModel):
    id: int
    day: str
    breakfast: str
    lunch: str
    snacks: str
    dinner: str

    model_config = ConfigDict(from_attributes=True)
