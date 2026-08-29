from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"


class CreateAttendanceDto(BaseModel):
    studentId: int = Field(..., ge=1, examples=[1])
    date: str = Field(..., examples=["2026-08-26"], description="YYYY-MM-DD")
    status: AttendanceStatus = Field(..., examples=[AttendanceStatus.PRESENT])


class UpdateAttendanceDto(BaseModel):
    status: AttendanceStatus = Field(..., examples=[AttendanceStatus.ABSENT])


class AttendanceOut(BaseModel):
    id: int
    student_id: int = Field(alias="studentId")
    date: str
    status: str
    student: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
