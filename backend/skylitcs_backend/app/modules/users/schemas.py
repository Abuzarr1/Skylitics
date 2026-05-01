from pydantic import BaseModel, EmailStr, UUID4, model_validator
from typing import Optional
from datetime import datetime
from app.modules.users.models import UserRole

# Base Properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.PASSENGER

# Properties to receive via API on creation
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = UserRole.PASSENGER
    airport_code: Optional[str] = None  # set when creating a manager account
    manager_key: Optional[str] = None  # key used for authorization during registration

    @model_validator(mode="after")
    def build_full_name(self) -> "UserCreate":
        if not self.full_name:
            parts = [p for p in [self.first_name, self.last_name] if p]
            self.full_name = " ".join(parts) if parts else "User"
        return self

class UserCreateManager(UserCreate):
    airline_id: Optional[UUID4] = None

# Properties to receive via API on update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    preferred_language: Optional[str] = None
    airport_code: Optional[str] = None

class UserInDBBase(UserBase):
    id: UUID4
    is_active: bool
    is_verified: bool
    airport_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Additional properties to return via API
class UserResponse(UserInDBBase):
    pass
