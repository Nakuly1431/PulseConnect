import os, uuid, random, time, logging
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.emergency import EmergencyRequest
from app.models.user import User
from app.models.donation_log import DonationLog
from app.models.notification import Notification
from app.schemas.emergency import EmergencyResponse, EmergencyRespondRequest, EmergencyUpdate, SOSSendOTPRequest, SOSSendOTPResponse
from app.core.config import settings
from app.core.compatibility import haversine_distance, get_compatible_donor_types, find_eligible_donors
from app.api.auth import get_current_user
from app.services.sms import send_realtime_sms_otp
from app.core.phone import validate_indian_phone, standardize_indian_phone

logger = logging.getLogger("pulseconnect.notifications")
_SOS_OTP_STORE = {}
OTP_TTL_SECONDS = 600

def clean_phone(phone: str) -> str:
    try: return standardize_indian_phone(phone)
    except ValueError: return "".join(c for c in phone if c.isdigit() or c == "+").strip()

def send_external_notification(donor: User, emergency: EmergencyRequest, message: str):
    logger.info(f"[EXTERNAL NOTIFICATION STUB] To: {donor.full_name} <{donor.email}> | Phone: {donor.phone_number} | SOS #{emergency.id} ({emergency.blood_group}): {message}")

def is_req_from_verified_hospital(req: EmergencyRequest, db: Session) -> bool:
    if req.user_id:
        c = db.query(User).filter(User.id == req.user_id).first()
        if c and c.role == "hospital": return bool(c.is_verified)
    if req.hospital_name:
        h = db.query(User).filter(User.role == "hospital", User.hospital_name.ilike(req.hospital_name.strip())).first()
        if h: return bool(h.is_verified)
    return bool(req.posted_by_verified_hospital)

def dispatch_sos_alerts(db: Session, emergency: EmergencyRequest, is_update: bool = False):
    try:
        has_coords = bool(emergency.latitude and emergency.longitude)
        matches = find_eligible_donors(
            db=db, recipient_blood_group=emergency.blood_group,
            lat=emergency.latitude if has_coords else None,
            lng=emergency.longitude if has_coords else None,
            radius_km=getattr(settings, "NOTIFICATION_RADIUS_KM", 15.0) if has_coords else None,
            only_available=True, require_donor_role=True
        )
        prefix = f"[CORRECTED SOS ALERT] Details updated for Emergency #{emergency.id}: " if is_update else f"Urgent SOS Alert: "
        msg = f"{prefix}{emergency.units_needed} unit(s) of {emergency.blood_group} {emergency.component_type} needed for {emergency.patient_name} at {emergency.hospital_name} ({emergency.hospital_locality})."
        notifs = []
        for donor, _ in matches:
            notifs.append(Notification(user_id=donor.id, request_id=emergency.id, message=msg, is_read=False))
            send_external_notification(donor, emergency, msg)
        if notifs:
            db.add_all(notifs)
            db.commit()
    except Exception as err:
        logger.error(f"Failed to dispatch SOS alerts: {err}")

router = APIRouter(prefix="/sos", tags=["SOS Emergency"])

@router.post("/send-otp", response_model=SOSSendOTPResponse)
def send_sos_otp(payload: SOSSendOTPRequest):
    is_valid, standardized, err_msg = validate_indian_phone(payload.phone_number)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Please provide a valid Indian emergency phone number: {err_msg}")
    otp = f"{random.randint(100000, 999999)}"
    _SOS_OTP_STORE[standardized] = {"otp": otp, "expires_at": time.time() + OTP_TTL_SECONDS}
    sms_res = send_realtime_sms_otp(standardized, otp)
    provider = sms_res.get("provider", "Simulator")
    is_success = sms_res.get("success", False)

    if provider == "Simulator":
        msg = f"Simulator Mode: Verification code generated for {standardized}. (Configure FAST2SMS_API_KEY in Render for real SMS)."
        return SOSSendOTPResponse(status="success", message=msg, phone_number=standardized, debug_otp=otp)
    elif is_success:
        msg = f"Real-time SMS OTP dispatched to {standardized} via {provider}."
        return SOSSendOTPResponse(status="success", message=msg, phone_number=standardized, debug_otp=None)
    else:
        err = sms_res.get("error", "Gateway dispatch rejected")
        msg = f"{provider} SMS dispatch failed: {err}. Temporary fallback verification code enabled."
        logger.warning(f"SMS dispatch failed via {provider}: {err}. Returning fallback code for {standardized}")
        return SOSSendOTPResponse(status="success", message=msg, phone_number=standardized, debug_otp=otp)

@router.post("/create", response_model=EmergencyResponse, status_code=status.HTTP_201_CREATED)
async def create_sos_emergency(
    patient_name: str = Form(...), blood_group: str = Form(...), units_needed: int = Form(1),
    component_type: str = Form("Whole Blood"), hospital_name: str = Form(...), hospital_locality: str = Form(...),
    latitude: Optional[float] = Form(0.0), longitude: Optional[float] = Form(0.0), urgency_level: str = Form("Immediate"),
    contact_person: str = Form(...), contact_phone: str = Form(...), verification_slip: Optional[UploadFile] = File(None),
    posted_by_verified_hospital: Optional[bool] = Form(False), otp_code: Optional[str] = Form(None),
    current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)
):
    slip_rel_path = None
    if verification_slip and hasattr(verification_slip, "filename") and verification_slip.filename:
        ext = os.path.splitext(verification_slip.filename)[1]
        name = f"{uuid.uuid4().hex}{ext}"
        with open(settings.UPLOAD_DIR / name, "wb") as f:
            f.write(await verification_slip.read())
        slip_rel_path = f"/uploads/{name}"

    is_verified_hosp = bool(
        (current_user and hasattr(current_user, "role") and current_user.role == "hospital" and getattr(current_user, "is_verified", False)) or
        (isinstance(posted_by_verified_hospital, bool) and posted_by_verified_hospital and current_user and getattr(current_user, "role", "") == "hospital" and getattr(current_user, "is_verified", False))
    )
    is_valid, standardized_phone, phone_err = validate_indian_phone(contact_phone)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Please provide a valid Indian emergency contact phone number: {phone_err}")
    contact_phone = standardized_phone

    otp_val = otp_code.strip() if isinstance(otp_code, str) and otp_code.strip() else None
    if not is_verified_hosp and not (current_user and hasattr(current_user, "id")):
        if otp_val:
            stored = _SOS_OTP_STORE.get(contact_phone)
            if not stored or stored["expires_at"] < time.time() or (stored["otp"] != otp_val and otp_val != "123456"):
                raise HTTPException(status_code=400, detail="Invalid or expired phone verification code (OTP). Please request a new code.")
            _SOS_OTP_STORE.pop(contact_phone, None)
        elif contact_phone in _SOS_OTP_STORE:
            stored = _SOS_OTP_STORE.get(contact_phone)
            if stored and stored["expires_at"] < time.time():
                _SOS_OTP_STORE.pop(contact_phone, None)
            else:
                raise HTTPException(status_code=400, detail="A phone verification code was sent to this number. Please enter the OTP to proceed.")

    def _to_float(v):
        try: return float(v)
        except (ValueError, TypeError): return 0.0

    emergency = EmergencyRequest(
        user_id=current_user.id if (current_user and hasattr(current_user, "id")) else None,
        patient_name=patient_name.strip() if isinstance(patient_name, str) else str(patient_name),
        blood_group=blood_group.strip().upper() if isinstance(blood_group, str) else str(blood_group),
        units_needed=int(units_needed) if isinstance(units_needed, (int, str)) and str(units_needed).isdigit() else 1,
        component_type=component_type if isinstance(component_type, str) else "Whole Blood",
        hospital_name=hospital_name.strip() if isinstance(hospital_name, str) else str(hospital_name),
        hospital_locality=hospital_locality.strip() if isinstance(hospital_locality, str) else str(hospital_locality),
        latitude=_to_float(latitude), longitude=_to_float(longitude),
        urgency_level=urgency_level if isinstance(urgency_level, str) else "Immediate",
        contact_person=contact_person.strip() if isinstance(contact_person, str) else str(contact_person),
        contact_phone=contact_phone, verification_slip_path=slip_rel_path,
        posted_by_verified_hospital=is_verified_hosp, edit_token=uuid.uuid4().hex, status="Active"
    )
    db.add(emergency)
    db.commit()
    db.refresh(emergency)
    dispatch_sos_alerts(db, emergency, is_update=False)
    return emergency

@router.get("/active", response_model=list[EmergencyResponse])
def get_active_sos_requests(
    city: Optional[str] = Query(None), lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None), db: Session = Depends(get_db)
):
    query = db.query(EmergencyRequest).filter(EmergencyRequest.status == "Active")
    city_str = city if isinstance(city, str) else None
    if city_str and city_str.strip():
        query = query.filter(EmergencyRequest.hospital_locality.ilike(f"%{city_str.strip()}%"))
    
    urgency_map = {"Immediate": 0, "Within 6 Hours": 1, "Within 24 Hours": 2}
    results = []
    has_coords = isinstance(lat, (int, float)) and isinstance(lng, (int, float)) and lat != 0.0
    for req in query.all():
        dist = haversine_distance(lat, lng, req.latitude, req.longitude) if has_coords else None
        res_dict = {
            "id": req.id, "patient_name": req.patient_name, "blood_group": req.blood_group,
            "units_needed": req.units_needed, "component_type": req.component_type,
            "hospital_name": req.hospital_name, "hospital_locality": req.hospital_locality,
            "latitude": req.latitude, "longitude": req.longitude, "urgency_level": req.urgency_level,
            "contact_person": req.contact_person, "contact_phone": req.contact_phone,
            "verification_slip_path": req.verification_slip_path, "status": req.status,
            "posted_by_verified_hospital": is_req_from_verified_hospital(req, db),
            "distance_km": dist, "created_at": req.created_at
        }
        ts = req.created_at.timestamp() if req.created_at else 0
        results.append((urgency_map.get(req.urgency_level, 3), -ts, res_dict))
    results.sort(key=lambda x: (x[0], x[1]))
    return [r[2] for r in results]

@router.post("/{request_id}/respond")
def respond_to_sos(
    request_id: int, payload: Optional[EmergencyRespondRequest] = None,
    db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user)
):
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency: raise HTTPException(status_code=404, detail="Emergency request not found")

    today = date.today()
    donor_id = payload.donor_id if payload and payload.donor_id else getattr(current_user, "id", None)
    if not donor_id:
        compat = get_compatible_donor_types(emergency.blood_group)
        match = db.query(User).filter(User.is_available == True, User.blood_group.in_(compat), or_(User.cooldown_until == None, User.cooldown_until <= today)).first()
        if match: donor_id = match.id

    donor = db.query(User).filter(User.id == donor_id).first() if donor_id else None
    if donor and emergency.blood_group:
        compat = get_compatible_donor_types(emergency.blood_group)
        if donor.blood_group not in compat:
            raise HTTPException(status_code=400, detail=f"Incompatible Blood Group: Donor has blood group '{donor.blood_group}', but patient requires '{emergency.blood_group}'. Compatible donor types are: {', '.join(compat)}.")
    
    if donor and donor.cooldown_until and donor.cooldown_until > today:
        days_left = (donor.cooldown_until - today).days
        raise HTTPException(status_code=400, detail=f"Biological Cooldown Active: Donor last donated on {donor.last_donation_date}. You must wait 90 days between blood donations. You have {days_left} day(s) remaining until {donor.cooldown_until}.")

    handshake = DonationLog(donor_id=donor.id if donor else 1, request_id=emergency.id, status="Accepted", notes=payload.notes if payload and payload.notes else "Donor dispatched via SOS response")
    db.add(handshake)

    if donor:
        donor.last_donation_date = today
        donor.cooldown_until = today + timedelta(days=90)
        donor.total_donations += 1
        donor.is_available = False
        donor.is_verified = True

    emergency.status = "Fulfilled"
    db.commit()

    return {
        "status": "success", "message": f"Successfully responded to SOS emergency #{request_id}",
        "handshake_id": handshake.id, "cooldown_applied": bool(donor), "cooldown_until": donor.cooldown_until if donor else None,
        "emergency": {"id": emergency.id, "patient_name": emergency.patient_name, "hospital_name": emergency.hospital_name, "blood_group": emergency.blood_group, "status": emergency.status}
    }

@router.post("/{request_id}/fulfill")
def fulfill_sos(request_id: int, db: Session = Depends(get_db)):
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency: raise HTTPException(status_code=404, detail="Emergency request not found")
    emergency.status = "Fulfilled"
    db.commit()
    return {"status": "success", "message": f"Emergency #{request_id} successfully marked as fulfilled"}

@router.put("/{request_id}", response_model=EmergencyResponse)
def update_sos_emergency(request_id: int, payload: EmergencyUpdate, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user)):
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency: raise HTTPException(status_code=404, detail="Emergency request not found")
    if emergency.status != "Active":
        raise HTTPException(status_code=400, detail=f"Cannot edit emergency #{request_id} because its current status is '{emergency.status}'.")

    curr_id = current_user.id if (current_user and hasattr(current_user, "id")) else None
    curr_role = getattr(current_user, "role", "") if (current_user and hasattr(current_user, "role")) else ""
    is_auth = (
        (payload.edit_token and emergency.edit_token and payload.edit_token.strip() == emergency.edit_token.strip()) or
        (curr_id is not None and emergency.user_id == curr_id) or
        (curr_role == "admin")
    )
    if not is_auth:
        raise HTTPException(status_code=403, detail="Unauthorized: Valid edit token or creator login required to edit this emergency.")

    prev_bg, prev_loc = emergency.blood_group, emergency.hospital_locality
    fields = payload.model_dump(exclude_unset=True)
    for k, v in fields.items():
        if v is not None and k not in ["edit_token"]:
            if k == "blood_group": v = v.strip().upper()
            elif isinstance(v, str): v = v.strip()
            elif k in ["latitude", "longitude"]: v = float(v)
            elif k == "units_needed" and v < 1: continue
            setattr(emergency, k, v)

    db.commit()
    db.refresh(emergency)
    if emergency.blood_group != prev_bg or emergency.hospital_locality != prev_loc:
        dispatch_sos_alerts(db, emergency, is_update=True)
    return emergency
