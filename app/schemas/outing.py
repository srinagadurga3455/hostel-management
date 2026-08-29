from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class CreateOutingDto(BaseModel):
    destination: str = Field(..., examples=["Chennai Central Mall"])
    reason: str = Field(..., examples=["Family visit"])
    outingDate: str = Field(..., alias="outingDate", examples=["2026-08-30"], description="YYYY-MM-DD")
    outTime: str = Field(..., pattern=r"^\d{2}:\d{2}$", examples=["09:00"])
    inTime: str = Field(..., pattern=r"^\d{2}:\d{2}$", examples=["18:00"])

    model_config = ConfigDict(populate_by_name=True)


class OutingOut(BaseModel):
    id: int
    destination: str
    reason: str
    outing_date: str = Field(alias="outingDate")
    out_time: str = Field(alias="outTime")
    in_time: str = Field(alias="inTime")
    status: str
    student_id: int = Field(alias="studentId")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
