from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Mirrors ref/auth/dto/login.dto.ts

class LoginDto(BaseModel):
    email: EmailStr = Field(examples=["student@hostel.com"])
    password: str = Field(min_length=6, examples=["password123"])

class RegisterDto(BaseModel):
    name: str = Field(examples=["John Doe"])
    email: EmailStr = Field(examples=["john@hostel.com"])
    password: str = Field(min_length=6, examples=["password123"])
    role: Literal["student", "warden"] = Field(examples=["student"])
    roll_number: Optional[str] = Field(default=None, alias="rollNumber", examples=["CS2021001"])
    branch: Optional[str] = Field(default=None, examples=["Computer Science"])
    year: Optional[int] = Field(default=None, ge=1, examples=[2])

    model_config = ConfigDict(populate_by_name=True)

# Responses

class StudentOut(BaseModel):
    id: int
    roll_number: str = Field(alias="rollNumber")
    branch: str
    year: int
    user_id: int = Field(alias="userId")
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    student: Optional[StudentOut] = None
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    token: str
    user: UserOut
