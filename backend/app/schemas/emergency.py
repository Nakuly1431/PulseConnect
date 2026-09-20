from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class EmergencyCreate(BaseModel):
    patient_name: str
    blood_group: str = Field(..., pattern=r"^(A|B|AB|O)[+-]$")
    units_needed: int = Field(default=1, ge=1, le=20)
    component_type: str = "Whole Blood"  # Whole Blood, Platelets, Plasma
    hospital_name: str
    hospital_locality: str
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    urgency_level: str = "Immediate"  # Immediate, Within 6 Hours, Within 24 Hours
    contact_person: str
    contact_phone: str

class EmergencyResponse(BaseModel):
    id: int
    patient_name: str
    blood_group: str
    units_needed: int
    component_type: str
    hospital_name: str
    hospital_locality: str
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    urgency_level: str
    contact_person: str
    contact_phone: str
    verification_slip_path: Optional[str] = None
    status: str
    posted_by_verified_hospital: bool = False
    distance_km: Optional[float] = None
    edit_token: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EmergencyUpdate(BaseModel):
    edit_token: Optional[str] = None
    patient_name: Optional[str] = None
    blood_group: Optional[str] = None
    units_needed: Optional[int] = Field(default=None, ge=1, le=20)
    component_type: Optional[str] = None
    hospital_name: Optional[str] = None
    hospital_locality: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    urgency_level: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None

class SOSSendOTPRequest(BaseModel):
    phone_number: str

class SOSSendOTPResponse(BaseModel):
    status: str
    message: str
    phone_number: str
    debug_otp: Optional[str] = None

class EmergencyRespondRequest(BaseModel):
    donor_id: Optional[int] = None
    notes: Optional[str] = None
