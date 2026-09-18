from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class DonationRequestCreate(BaseModel):
    donor_id: int
    request_id: Optional[int] = None
    notes: Optional[str] = "Urgent blood requirement match"

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
