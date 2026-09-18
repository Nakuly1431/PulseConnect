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
    latitude: float
    longitude: float
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
    latitude: float
    longitude: float
    urgency_level: str
    contact_person: str
    contact_phone: str
    verification_slip_path: Optional[str] = None
    status: str
    distance_km: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EmergencyRespondRequest(BaseModel):
    donor_id: Optional[int] = None
    notes: Optional[str] = None
