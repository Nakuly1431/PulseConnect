from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    blood_group: str = Field(..., pattern=r"^(A|B|AB|O)[+-]$")
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    locality: Optional[str] = "Bengaluru"
    city: Optional[str] = "Bengaluru"
    state: Optional[str] = "Karnataka"
    role: Optional[str] = "donor_acceptor"
    hospital_name: Optional[str] = None
    license_number: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    blood_group: Optional[str] = Field(None, pattern=r"^(A|B|AB|O)[+-]$")
    locality: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_available: Optional[bool] = None
    role: Optional[str] = None
    hospital_name: Optional[str] = None
    license_number: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: str  # Can be masked or unmasked depending on context
    masked_phone: Optional[str] = None
    blood_group: str
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    locality: str
    city: Optional[str] = None
    state: Optional[str] = None
    is_available: bool
    is_verified: bool
    role: str = "donor_acceptor"
    hospital_name: Optional[str] = None
    license_number: Optional[str] = None
    last_donation_date: Optional[date] = None
    cooldown_until: Optional[date] = None
    cooldown_days_remaining: int = 0
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
