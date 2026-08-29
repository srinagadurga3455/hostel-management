from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict, field_serializer
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
    outing_date: date = Field(validation_alias="outing_date", serialization_alias="outingDate")
    out_time: str = Field(validation_alias="out_time", serialization_alias="outTime")
    in_time: str = Field(validation_alias="in_time", serialization_alias="inTime")
    status: str
    student_id: int = Field(validation_alias="student_id", serialization_alias="studentId")
    created_at: Optional[datetime] = Field(default=None, validation_alias="created_at", serialization_alias="createdAt")

    @field_serializer("outing_date")
    def serialize_outing_date(self, v: date) -> str:
        return v.isoformat() if isinstance(v, date) else str(v)

    @field_serializer("created_at")
    def serialize_created_at(self, v: datetime | None) -> str | None:
        return v.isoformat() if isinstance(v, datetime) else None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
