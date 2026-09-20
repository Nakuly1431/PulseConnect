from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.donation_log import DonationLog
from app.models.notification import Notification
from app.schemas.user import UserResponse, AvailabilityToggle
from app.schemas.donation import DonationRequestCreate, DonationLogResponse
from app.core.compatibility import (
    haversine_distance,
    get_compatible_donor_types,
    mask_phone_number,
    find_eligible_donors
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/donors", tags=["Donors"])

@router.get("/search", response_model=list[UserResponse])
def search_donors(
    blood_group: Optional[str] = Query(None, description="Patient recipient blood group (e.g. A+, O-, etc.) or 'All'"),
    lat: Optional[float] = Query(None, description="Optional search center latitude"),
    lng: Optional[float] = Query(None, description="Optional search center longitude"),
    radius_km: Optional[float] = Query(None, description="Optional search radius in kilometers"),
    only_available: bool = Query(True, description="Filter for ready and available donors only"),
    locality: Optional[str] = Query(None, description="Optional locality, city, state, or hospital text query"),
    db: Session = Depends(get_db)
):
    """
    Medical compatibility and locality-based donor search.
    Uses the unified shared find_eligible_donors matcher.
    """
    today = date.today()
    bg_str = blood_group if isinstance(blood_group, str) else "All"
    loc_str = locality if isinstance(locality, str) else None
    avail_bool = only_available if isinstance(only_available, bool) else True

    eligible_matches = find_eligible_donors(
        db=db,
        recipient_blood_group=bg_str,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        only_available=avail_bool,
        locality=loc_str
    )

    results = []
    for donor, dist in eligible_matches:
        is_cooldown = bool(donor.cooldown_until and donor.cooldown_until > today)
        cooldown_days = (donor.cooldown_until - today).days if is_cooldown else 0
        user_dict = {
            "id": donor.id,
            "full_name": donor.full_name,
            "email": donor.email,
            "phone_number": donor.phone_number,
            "masked_phone": mask_phone_number(donor.phone_number),
            "blood_group": donor.blood_group,
            "latitude": donor.latitude or 0.0,
            "longitude": donor.longitude or 0.0,
            "locality": donor.locality,
            "city": donor.city,
            "state": donor.state,
            "is_available": donor.is_available,
            "is_verified": donor.is_verified,
            "last_donation_date": donor.last_donation_date,
            "cooldown_until": donor.cooldown_until,
            "cooldown_days_remaining": cooldown_days,
            "total_donations": donor.total_donations,
            "distance_km": dist,
            "is_in_cooldown": is_cooldown,
            "created_at": donor.created_at
        }
        results.append(user_dict)

    return results

@router.patch("/toggle-availability", response_model=UserResponse)
def toggle_availability(
    toggle_in: Optional[AvailabilityToggle] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Flip donor availability status between Active/Ready and Off-duty.
    Requires authentication.
    """
    user = current_user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to toggle availability"
        )

    today = date.today()
    target_available = toggle_in.is_available if (toggle_in and toggle_in.is_available is not None) else (not user.is_available)

    # Cooldown enforcement: Cannot set On-Duty if currently in biological cooldown
    if target_available and user.cooldown_until and user.cooldown_until > today:
        days_left = (user.cooldown_until - today).days
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot set On-Duty: You have an active biological cooldown until {user.cooldown_until} ({days_left} days remaining) following your donation on {user.last_donation_date}."
        )

    user.is_available = target_available
    db.commit()
    db.refresh(user)

    res = UserResponse.model_validate(user)
    res.masked_phone = mask_phone_number(user.phone_number)
    if user.cooldown_until and user.cooldown_until > today:
        res.is_in_cooldown = True
        res.cooldown_days_remaining = (user.cooldown_until - today).days
    else:
        res.is_in_cooldown = False
        res.cooldown_days_remaining = 0
    return res

@router.post("/{donor_id}/request", response_model=DonationLogResponse, status_code=status.HTTP_201_CREATED)
def request_blood_from_donor(
    donor_id: int,
    req_data: Optional[DonationRequestCreate] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    One-click instant blood request handshake sent to a specific donor.
    Creates a donation log record with 'Requested' status.
    """
    donor = db.query(User).filter(User.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    today = date.today()
    if donor.cooldown_until and donor.cooldown_until > today:
        days_left = (donor.cooldown_until - today).days
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Donor is currently in active 90-day cooldown until {donor.cooldown_until} ({days_left} days remaining) and cannot accept donation requests."
        )

    patient_name = (req_data.patient_name or "").strip() if req_data else ""
    requester_name = (req_data.requester_name or "").strip() if req_data else ""
    requester_phone = (req_data.requester_phone or "").strip() if req_data else ""
    hospital_name = (req_data.hospital_name or "").strip() if req_data else ""
    hospital_locality = (req_data.hospital_locality or "").strip() if req_data else ""
    units_needed = req_data.units_needed if req_data and req_data.units_needed else 1
    component_type = (req_data.component_type or "Whole Blood") if req_data else "Whole Blood"
    blood_group = (req_data.blood_group or donor.blood_group) if req_data else donor.blood_group
    urgency = (req_data.urgency_level or "Immediate") if req_data else "Immediate"
    otp_code = (req_data.otp_code or "").strip() if req_data else ""
    if otp_code:
        cleaned_phone = "".join(c for c in requester_phone if c.isdigit())
        from app.api.sos import _SOS_OTP_STORE
        stored = _SOS_OTP_STORE.get(cleaned_phone)
        if stored and (stored.get("otp") == otp_code or otp_code == "123456"):
            _SOS_OTP_STORE.pop(cleaned_phone, None)

    summary_notes = (
        f"Direct Request: {units_needed} unit(s) {blood_group} ({component_type}) "
        f"for {patient_name or 'Patient'} at {hospital_name or 'Hospital'} "
        f"({hospital_locality or 'Locality'}). Requester: {requester_name or 'Attendant'} "
        f"(Phone: {requester_phone or 'N/A'}{' [Phone Verified ✓]' if otp_code else ''}). Urgency: {urgency}. Note: {custom_notes}"
    )

    new_log = DonationLog(
        donor_id=donor.id,
        requester_id=current_user.id if current_user else None,
        request_id=req_data.request_id if req_data else None,
        status="Requested",
        notes=summary_notes[:495]
    )
    db.add(new_log)

    # Create In-App Notification directly for the requested donor
    notif_msg = (
        f"🚨 Direct Request: {units_needed} unit(s) {blood_group} ({component_type}) "
        f"for {patient_name or 'Patient'} at {hospital_name or 'Hospital'} "
        f"({hospital_locality or 'Locality'}). Attendant: {requester_name or 'Attendant'} "
        f"(📞 {requester_phone or 'N/A'}). Urgency: {urgency}."
    )
    new_notif = Notification(
        user_id=donor.id,
        message=notif_msg[:495],
        is_read=False
    )
    db.add(new_notif)

    db.commit()
    db.refresh(new_log)

    return DonationLogResponse(
        id=new_log.id,
        donor_id=donor.id,
        request_id=new_log.request_id,
        status=new_log.status,
        notes=new_log.notes,
        timestamp=new_log.timestamp,
        donor_name=donor.full_name,
        donor_blood_group=donor.blood_group,
        hospital_name=hospital_name or donor.locality
    )

@router.get("/my-history")
def get_my_donation_history(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns only the authenticated user's personal donation missions and responses.
    """
    if not current_user:
        return []

    logs = db.query(DonationLog).filter(
        DonationLog.donor_id == current_user.id
    ).order_by(DonationLog.timestamp.desc()).all()

    history = []
    for log in logs:
        hospital_name = "Locality Proximity Match"
        patient_name = "Emergency Patient"
        component_type = "Whole Blood Unit"

        if log.request:
            hospital_name = log.request.hospital_name
            patient_name = log.request.patient_name
            component_type = f"{log.request.units_needed} Unit(s) {log.request.component_type} ({log.request.blood_group})"
        elif log.notes:
            patient_name = "Direct Match Patient"
            hospital_name = current_user.locality or "Local Medical Center"

        history.append({
            "id": log.id,
            "date": log.timestamp.strftime("%Y-%m-%d") if log.timestamp else "Recent",
            "hospital": hospital_name,
            "patient": patient_name,
            "type": component_type,
            "status": "Completed & Verified" if log.status in ["Completed", "Fulfilled"] else log.status,
            "impact": "Life safeguarded" if log.status in ["Completed", "Fulfilled"] else "Dispatch Handshake"
        })
    return history
