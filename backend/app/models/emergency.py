from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(120), nullable=False)
    blood_group = Column(String(5), index=True, nullable=False)
    units_needed = Column(Integer, default=1, nullable=False)
    component_type = Column(String(50), default="Whole Blood", nullable=False)  # Whole Blood, Platelets, Plasma
    hospital_name = Column(String(150), nullable=False)
    hospital_locality = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    urgency_level = Column(String(50), default="Immediate", index=True, nullable=False)  # Immediate, Within 6 Hours, Within 24 Hours
    contact_person = Column(String(120), nullable=False)
    contact_phone = Column(String(30), nullable=False)
    verification_slip_path = Column(String(255), nullable=True)
    status = Column(String(30), default="Active", index=True, nullable=False)  # Active, Fulfilled, Expired
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    donations = relationship("DonationLog", back_populates="request", cascade="all, delete-orphan")
