from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# Mirrors app/ref/students/dto/student.dto.ts


class AssignRoomDto(BaseModel):
    roomId: int = Field(..., ge=1, examples=[10], description="ID of the room to assign")


class UpdateStudentDto(BaseModel):
    branch: Optional[str] = Field(default=None, examples=["Mechanical Engineering"])
    year: Optional[int] = Field(default=None, ge=1, examples=[3])
    roomId: Optional[int] = Field(default=None, ge=1, examples=[2])

    model_config = ConfigDict(populate_by_name=True)


# Read models

class RoomOut(BaseModel):
    id: int
    room_number: str = Field(alias="roomNumber")
    block: str
    floor: int
    capacity: int
    occupied: int

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UserSafeOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class StudentOut(BaseModel):
    id: int
    roll_number: str = Field(alias="rollNumber")
    branch: str
    year: int
    user_id: int = Field(alias="userId")
    room_id: Optional[int] = Field(default=None, alias="roomId")
    user: Optional[UserSafeOut] = None
    room: Optional[RoomOut] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
