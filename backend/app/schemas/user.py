from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    blood_group: str = Field(..., pattern=r"^(A|B|AB|O)[+-]$")
    latitude: float
    longitude: float
    locality: str
    city: Optional[str] = None
    state: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: str  # Can be masked or unmasked depending on context
    masked_phone: Optional[str] = None
    blood_group: str
    latitude: float
    longitude: float
    locality: str
    city: Optional[str] = None
    state: Optional[str] = None
    is_available: bool
    is_verified: bool
    last_donation_date: Optional[date] = None
    cooldown_until: Optional[date] = None
    total_donations: int = 0
    distance_km: Optional[float] = None
    is_in_cooldown: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class AvailabilityToggle(BaseModel):
    is_available: Optional[bool] = None
