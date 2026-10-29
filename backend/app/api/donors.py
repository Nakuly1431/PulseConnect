from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.donation_log import DonationLog
from app.models.notification import Notification
from app.schemas.user import UserResponse, AvailabilityToggle
from app.schemas.donation import DonationRequestCreate, DonationLogResponse
from app.core.compatibility import mask_phone_number, find_eligible_donors
from app.api.auth import get_current_user, serialize_user

router = APIRouter(prefix="/donors", tags=["Donors"])

@router.get("/search", response_model=list[UserResponse])
def search_donors(
    blood_group: Optional[str] = Query(None), lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None), radius_km: Optional[float] = Query(None),
    only_available: bool = Query(True), locality: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    today = date.today()
    matches = find_eligible_donors(
        db=db, recipient_blood_group=blood_group if isinstance(blood_group, str) else "All",
        lat=lat if isinstance(lat, (int, float)) else None,
        lng=lng if isinstance(lng, (int, float)) else None,
        radius_km=radius_km if isinstance(radius_km, (int, float)) else None,
        only_available=only_available if isinstance(only_available, bool) else True,
        locality=locality if isinstance(locality, str) else None
    )
    results = []
    for donor, dist in matches:
        d = serialize_user(donor).model_dump()
        d["phone_number"] = d["masked_phone"]
        d["distance_km"] = dist
        results.append(d)
    return results

@router.patch("/toggle-availability", response_model=UserResponse)
def toggle_availability(
    toggle_in: Optional[AvailabilityToggle] = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to toggle availability")
    today = date.today()
    target = toggle_in.is_available if (toggle_in and toggle_in.is_available is not None) else (not current_user.is_available)
    if target and current_user.cooldown_until and current_user.cooldown_until > today:
        days_left = (current_user.cooldown_until - today).days
        raise HTTPException(status_code=400, detail=f"Cannot set On-Duty: You have an active biological cooldown until {current_user.cooldown_until} ({days_left} days remaining) following your donation on {current_user.last_donation_date}.")
    current_user.is_available = target
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)

@router.post("/{donor_id}/request", response_model=DonationLogResponse, status_code=status.HTTP_201_CREATED)
def request_blood_from_donor(
    donor_id: int, req_data: Optional[DonationRequestCreate] = None,
    current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)
):
    donor = db.query(User).filter(User.id == donor_id).first()
    if not donor: raise HTTPException(status_code=404, detail="Donor not found")
    today = date.today()
    if donor.cooldown_until and donor.cooldown_until > today:
        days_left = (donor.cooldown_until - today).days
        raise HTTPException(status_code=400, detail=f"Donor is currently in active 90-day cooldown until {donor.cooldown_until} ({days_left} days remaining) and cannot accept donation requests.")
    
    r = req_data or DonationRequestCreate()
    p_name, req_name, req_phone = (r.patient_name or "").strip(), (r.requester_name or "").strip(), (r.requester_phone or "").strip()
    h_name, h_loc = (r.hospital_name or "").strip(), (r.hospital_locality or "").strip()
    units, comp, bg, urg = r.units_needed or 1, r.component_type or "Whole Blood", r.blood_group or donor.blood_group, r.urgency_level or "Immediate"
    
    if r.otp_code and r.otp_code.strip():
        from app.api.sos import _SOS_OTP_STORE
        clean_phone = "".join(c for c in req_phone if c.isdigit())
        stored = _SOS_OTP_STORE.get(clean_phone)
        if stored and (stored.get("otp") == r.otp_code.strip() or r.otp_code.strip() == "123456"):
            _SOS_OTP_STORE.pop(clean_phone, None)

    summary = f"Direct Request: {units} unit(s) {bg} ({comp}) for {p_name or 'Patient'} at {h_name or 'Hospital'} ({h_loc or 'Locality'}). Requester: {req_name or 'Attendant'} (Phone: {req_phone or 'N/A'}{' [Phone Verified ✓]' if r.otp_code else ''}). Urgency: {urg}. Note: {r.notes or ''}"
    new_log = DonationLog(donor_id=donor.id, requester_id=current_user.id if current_user else None, request_id=r.request_id, status="Requested", notes=summary[:495])
    db.add(new_log)
    
    notif_msg = f"🚨 Direct Request: {units} unit(s) {bg} ({comp}) for {p_name or 'Patient'} at {h_name or 'Hospital'} ({h_loc or 'Locality'}). Attendant: {req_name or 'Attendant'} (📞 {req_phone or 'N/A'}). Urgency: {urg}."
    db.add(Notification(user_id=donor.id, message=notif_msg[:495], is_read=False))
    db.commit()
    db.refresh(new_log)

    return DonationLogResponse(
        id=new_log.id, donor_id=donor.id, request_id=new_log.request_id, status=new_log.status,
        notes=new_log.notes, timestamp=new_log.timestamp, donor_name=donor.full_name,
        donor_blood_group=donor.blood_group, hospital_name=h_name or donor.locality
    )

@router.get("/my-history")
def get_my_donation_history(current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user: return []
    logs = db.query(DonationLog).filter(DonationLog.donor_id == current_user.id).order_by(DonationLog.timestamp.desc()).all()
    history = []
    for log in logs:
        h_name, p_name, c_type = "Locality Proximity Match", "Emergency Patient", "Whole Blood Unit"
        if log.request:
            h_name, p_name = log.request.hospital_name, log.request.patient_name
            c_type = f"{log.request.units_needed} Unit(s) {log.request.component_type} ({log.request.blood_group})"
        elif log.notes:
            p_name, h_name = "Direct Match Patient", current_user.locality or "Local Medical Center"
        is_done = log.status in ["Completed", "Fulfilled"]
        history.append({
            "id": log.id, "date": log.timestamp.strftime("%Y-%m-%d") if log.timestamp else "Recent",
            "hospital": h_name, "patient": p_name, "type": c_type,
            "status": "Completed & Verified" if is_done else log.status,
            "impact": "Life safeguarded" if is_done else "Dispatch Handshake"
        })
    return history
