from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class ComplaintStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class CreateComplaintDto(BaseModel):
    title: str = Field(..., examples=["Water problem"])
    description: str = Field(..., examples=["No water supply in my room"])


class UpdateComplaintStatusDto(BaseModel):
    status: ComplaintStatus = Field(..., examples=[ComplaintStatus.RESOLVED])


class ComplaintOut(BaseModel):
    id: int
    title: str
    description: str
    status: str
    student_id: int = Field(alias="studentId")
    student: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
