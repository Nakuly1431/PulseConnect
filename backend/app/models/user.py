from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone_number = Column(String(30), nullable=False)
    blood_group = Column(String(5), index=True, nullable=False)  # A+, A-, B+, B-, AB+, AB-, O+, O-
    latitude = Column(Float, nullable=True, default=0.0)
    longitude = Column(Float, nullable=True, default=0.0)
    locality = Column(String(150), nullable=False)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    is_available = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False)
    role = Column(String(30), default="donor_acceptor", nullable=False)  # donor_acceptor, hospital, admin
    hospital_name = Column(String(150), nullable=True)
    license_number = Column(String(100), nullable=True)
    last_donation_date = Column(Date, nullable=True)
    cooldown_until = Column(Date, nullable=True)
    total_donations = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    donations = relationship("DonationLog", back_populates="donor", cascade="all, delete-orphan")
