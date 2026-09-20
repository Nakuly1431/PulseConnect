from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class DonationRequestCreate(BaseModel):
    donor_id: Optional[int] = None
    request_id: Optional[int] = None
    patient_name: Optional[str] = None
    blood_group: Optional[str] = None
    units_needed: Optional[int] = 1
    component_type: Optional[str] = "Whole Blood"
    hospital_name: Optional[str] = None
    hospital_locality: Optional[str] = None
    requester_name: Optional[str] = None
    requester_phone: Optional[str] = None
    otp_code: Optional[str] = None
    urgency_level: Optional[str] = "Immediate"
    notes: Optional[str] = None

class DonationLogResponse(BaseModel):
    id: int
    donor_id: int
    request_id: Optional[int] = None
    status: str
    notes: Optional[str] = None
    timestamp: datetime
    donor_name: Optional[str] = None
    donor_blood_group: Optional[str] = None
    hospital_name: Optional[str] = None

    class Config:
        from_attributes = True
