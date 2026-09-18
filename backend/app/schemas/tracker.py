from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AssignedDonorInfo(BaseModel):
    id: int
    full_name: str
    blood_group: str
    phone_number: str
    locality: str
    is_available: bool = True
    cooldown_until: Optional[str] = None

class RequestTrackerItem(BaseModel):
    id: str  # e.g., "sos-1", "direct-2"
    source_type: str  # "SOS Broadcast" or "Direct Request"
    raw_id: int
    status: str  # "Pending", "Accepted", "Fulfilled", "Cancelled"
    urgency_level: str  # "Immediate", "Within 6 Hours", "Within 24 Hours", "Standard"
    patient_name: str
    blood_group: str
    units_needed: int
    component_type: str
    hospital_name: str
    hospital_locality: str
    contact_person: str
    contact_phone: str
    verification_slip_path: Optional[str] = None
    assigned_donor: Optional[AssignedDonorInfo] = None
    created_at: datetime
    accepted_at: Optional[datetime] = None
    notes: Optional[str] = None

class TrackerSummary(BaseModel):
    total: int
    accepted: int
    pending: int
    fulfilled: int

class TrackerResponse(BaseModel):
    summary: TrackerSummary
    requests: list[RequestTrackerItem]

class UpdateStatusRequest(BaseModel):
    status: str  # "Accepted", "Fulfilled", "Completed", "Cancelled"
    notes: Optional[str] = None
