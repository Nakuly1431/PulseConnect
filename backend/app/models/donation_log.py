from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class DonationLog(Base):
    __tablename__ = "donation_logs"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    request_id = Column(Integer, ForeignKey("emergency_requests.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="Requested", nullable=False)  # Requested, Accepted, Completed, Cancelled
    notes = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    donor = relationship("User", foreign_keys=[donor_id], back_populates="donations")
    requester = relationship("User", foreign_keys=[requester_id])
    request = relationship("EmergencyRequest", back_populates="donations")

