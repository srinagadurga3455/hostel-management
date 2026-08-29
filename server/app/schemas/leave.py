from pydantic import BaseModel, Field, ConfigDict

class CreateLeaveDto(BaseModel):
    startDate: str = Field(..., alias="startDate", examples=["2026-09-01"], description="YYYY-MM-DD")
    endDate: str = Field(..., alias="endDate", examples=["2026-09-03"], description="YYYY-MM-DD")
    reason: str = Field(..., min_length=3, examples=["Family function"])

    model_config = ConfigDict(populate_by_name=True)

class LeaveOut(BaseModel):
    id: int
    student_id: int = Field(alias="studentId")
    start_date: str = Field(alias="startDate")
    end_date: str = Field(alias="endDate")
    reason: str
    status: str
    created_at: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
