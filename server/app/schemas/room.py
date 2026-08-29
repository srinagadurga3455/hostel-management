from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class CreateRoomDto(BaseModel):
    roomNumber: str = Field(..., alias="roomNumber", examples=["A101"])
    block: str = Field(..., examples=["A"])
    floor: int = Field(..., ge=0, examples=[1])
    capacity: int = Field(..., ge=1, examples=[4])

    model_config = ConfigDict(populate_by_name=True)


class UpdateRoomDto(BaseModel):
    block: Optional[str] = Field(default=None, examples=["B"])
    floor: Optional[int] = Field(default=None, ge=0, examples=[2])
    capacity: Optional[int] = Field(default=None, ge=1, examples=[3])
    occupied: Optional[int] = Field(default=None, ge=0, examples=[2])

    model_config = ConfigDict(populate_by_name=True)


class OccupantUserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class RoomOccupantOut(BaseModel):
    id: int
    roll_number: str = Field(validation_alias="roll_number", serialization_alias="rollNumber")
    branch: str
    year: int
    user_id: int = Field(validation_alias="user_id", serialization_alias="userId")
    user: Optional[OccupantUserOut] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class RoomOut(BaseModel):
    id: int
    room_number: str = Field(validation_alias="room_number", serialization_alias="roomNumber")
    block: str
    floor: int
    capacity: int
    occupied: int
    students: list[RoomOccupantOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
