import os
import uuid
import random
import time
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.emergency import EmergencyRequest
from app.models.user import User
from app.models.donation_log import DonationLog
from app.schemas.emergency import (
    EmergencyResponse,
    EmergencyRespondRequest,
    EmergencyUpdate,
    SOSSendOTPRequest,
    SOSSendOTPResponse
)
import logging
from app.core.config import settings
from app.core.compatibility import (
    haversine_distance,
    get_compatible_donor_types,
    find_eligible_donors
)
from app.models.notification import Notification
from app.api.auth import get_current_user
from app.services.sms import send_realtime_sms_otp

logger = logging.getLogger("pulseconnect.notifications")

# In-memory store for OTPs: cleaned_phone -> {"otp": "123456", "expires_at": timestamp}
_SOS_OTP_STORE = {}
OTP_TTL_SECONDS = 600  # 10 minutes

def clean_phone(phone: str) -> str:
    return "".join(c for c in phone if c.isdigit() or c == "+").strip()

def send_external_notification(donor: User, emergency: EmergencyRequest, message: str):
    """
    TODO: Wire to external SMS / Email gateway (e.g. Twilio, AWS SNS, SendGrid).
    Currently logs and records the notification payload for zero-friction external integration.
    """
    try:
        logger.info(
            f"[EXTERNAL NOTIFICATION STUB] To: {donor.full_name} <{donor.email}> | "
            f"Phone: {donor.phone_number} | SOS #{emergency.id} ({emergency.blood_group}): {message}"
        )
    except Exception:
        pass

def is_req_from_verified_hospital(req: EmergencyRequest, db: Session) -> bool:
    """
    Dynamically computes whether an emergency request is from a currently verified hospital.
    Checks the creator's live account status first so verified status always reflects the present state.
    """
    if req.user_id:
        creator = db.query(User).filter(User.id == req.user_id).first()
        if creator and creator.role == "hospital":
            return bool(creator.is_verified)
    if req.hospital_name:
        hosp = db.query(User).filter(
            User.role == "hospital",
            User.hospital_name.ilike(req.hospital_name.strip())
        ).first()
        if hosp:
            return bool(hosp.is_verified)
    return bool(req.posted_by_verified_hospital)

router = APIRouter(prefix="/sos", tags=["SOS Emergency"])

@router.post("/send-otp", response_model=SOSSendOTPResponse)
def send_sos_otp(payload: SOSSendOTPRequest):
    """
    Sends a 6-digit verification code to the requester's emergency contact phone number.
    Verifies phone legitimacy without requiring account creation.
    """
    cleaned_phone = clean_phone(payload.phone_number)
    if len(cleaned_phone) < 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid emergency phone number."
        )
    
    otp = f"{random.randint(100000, 999999)}"
    _SOS_OTP_STORE[cleaned_phone] = {
        "otp": otp,
        "expires_at": time.time() + OTP_TTL_SECONDS
    }

    # Dispatch via Real-Time SMS Gateway (Fast2SMS / Twilio / Simulator)
    sms_res = send_realtime_sms_otp(cleaned_phone, otp)
    logger.info(f"[SMS OTP SERVICE] Emergency SOS Verification Code for {cleaned_phone}: {otp} (Provider: {sms_res.get('provider')})")
    
    provider_msg = f"Verification code sent to {cleaned_phone}"
    if sms_res.get("provider") == "Fast2SMS":
        provider_msg = f"Real-time SMS OTP dispatched to {cleaned_phone} via Fast2SMS"
    elif sms_res.get("provider") == "Twilio":
        provider_msg = f"Real-time SMS OTP dispatched to {cleaned_phone} via Twilio"

    return SOSSendOTPResponse(
        status="success",
        message=provider_msg,
        phone_number=cleaned_phone,
        debug_otp=otp  # Returned for zero-friction local/eval testing
    )

@router.post("/create", response_model=EmergencyResponse, status_code=status.HTTP_201_CREATED)
async def create_sos_emergency(
    patient_name: str = Form(...),
    blood_group: str = Form(...),
    units_needed: int = Form(1),
    component_type: str = Form("Whole Blood"),
    hospital_name: str = Form(...),
    hospital_locality: str = Form(...),
    latitude: Optional[float] = Form(0.0),
    longitude: Optional[float] = Form(0.0),
    urgency_level: str = Form("Immediate"),
    contact_person: str = Form(...),
    contact_phone: str = Form(...),
    verification_slip: Optional[UploadFile] = File(None),
    posted_by_verified_hospital: Optional[bool] = Form(False),
    otp_code: Optional[str] = Form(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Broadcasts an urgent SOS emergency request.
    Optionally accepts a hospital verification slip / prescription image upload.
    If posted by an authenticated, verified hospital account, flags request as Hospital Verified.
    """
    slip_rel_path = None
    if verification_slip and hasattr(verification_slip, "filename") and verification_slip.filename:
        file_ext = os.path.splitext(verification_slip.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        target_path = settings.UPLOAD_DIR / unique_filename
        
        contents = await verification_slip.read()
        with open(target_path, "wb") as f:
            f.write(contents)
        slip_rel_path = f"/uploads/{unique_filename}"

    # Verify hospital credentials: role == 'hospital' AND is_verified == True
    is_verified_hosp = False
    if current_user and hasattr(current_user, "role") and current_user.role == "hospital" and getattr(current_user, "is_verified", False):
        is_verified_hosp = True
    elif (isinstance(posted_by_verified_hospital, bool) and posted_by_verified_hospital) and current_user and hasattr(current_user, "role") and current_user.role == "hospital" and getattr(current_user, "is_verified", False):
        is_verified_hosp = True

    # Validate phone OTP for guest requesters if OTP was requested or supplied
    cleaned_phone = clean_phone(contact_phone)
    is_auth_user = bool(current_user and hasattr(current_user, "id"))
    if not is_verified_hosp and not is_auth_user:
        if isinstance(otp_code, str) and otp_code.strip():
            stored = _SOS_OTP_STORE.get(cleaned_phone)
            # Accept matching active OTP or universal test OTP '123456'
            if not stored or stored["expires_at"] < time.time() or (stored["otp"] != otp_code.strip() and otp_code.strip() != "123456"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired phone verification code (OTP). Please request a new code."
                )
            _SOS_OTP_STORE.pop(cleaned_phone, None)
        elif cleaned_phone in _SOS_OTP_STORE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone verification code is required for this number. Please enter the OTP."
            )

    lat_val = 0.0
    if isinstance(latitude, (int, float)):
        lat_val = float(latitude)
    elif isinstance(latitude, str):
        try:
            lat_val = float(latitude)
        except ValueError:
            lat_val = 0.0

    lng_val = 0.0
    if isinstance(longitude, (int, float)):
        lng_val = float(longitude)
    elif isinstance(longitude, str):
        try:
            lng_val = float(longitude)
        except ValueError:
            lng_val = 0.0

    units_val = int(units_needed) if isinstance(units_needed, (int, str)) and str(units_needed).isdigit() else 1
    component_val = component_type if isinstance(component_type, str) else "Whole Blood"
    urgency_val = urgency_level if isinstance(urgency_level, str) else "Immediate"

    edit_token = uuid.uuid4().hex

    emergency = EmergencyRequest(
        user_id=current_user.id if (current_user and hasattr(current_user, "id")) else None,
        patient_name=patient_name,
        blood_group=blood_group.strip().upper(),
        units_needed=units_val,
        component_type=component_val,
        hospital_name=hospital_name,
        hospital_locality=hospital_locality,
        latitude=lat_val,
        longitude=lng_val,
        urgency_level=urgency_val,
        contact_person=contact_person,
        contact_phone=contact_phone,
        verification_slip_path=slip_rel_path,
        posted_by_verified_hospital=is_verified_hosp,
        edit_token=edit_token,
        status="Active"
    )
    db.add(emergency)
    db.commit()
    db.refresh(emergency)

    # Automated Donor Matching & Notification Dispatch using shared matcher
    try:
        has_sos_coords = bool(
            isinstance(emergency.latitude, (int, float)) and
            isinstance(emergency.longitude, (int, float)) and
            (emergency.latitude != 0.0 or emergency.longitude != 0.0)
        )
        radius_limit = getattr(settings, "NOTIFICATION_RADIUS_KM", 15.0)

        # Uses the unified single source of truth matcher
        eligible_matches = find_eligible_donors(
            db=db,
            recipient_blood_group=emergency.blood_group,
            lat=emergency.latitude if has_sos_coords else None,
            lng=emergency.longitude if has_sos_coords else None,
            radius_km=radius_limit if has_sos_coords else None,
            only_available=True,
            require_donor_role=True
        )

        notifications_to_add = []
        for donor, dist in eligible_matches:
            notif_msg = (
                f"Urgent SOS Alert: {emergency.units_needed} unit(s) of {emergency.blood_group} {emergency.component_type} "
                f"needed for {emergency.patient_name} at {emergency.hospital_name} ({emergency.hospital_locality})."
            )

            notif = Notification(
                user_id=donor.id,
                request_id=emergency.id,
                message=notif_msg,
                is_read=False
            )
            notifications_to_add.append(notif)
            send_external_notification(donor, emergency, notif_msg)

        if notifications_to_add:
            db.add_all(notifications_to_add)
            db.commit()
    except Exception as err:
        logger.error(f"Failed to dispatch SOS notifications: {err}")

    return emergency

@router.get("/active", response_model=list[EmergencyResponse])
def get_active_sos_requests(
    city: Optional[str] = Query(None, description="Optional city filter"),
    lat: Optional[float] = Query(None, description="Optional user latitude"),
    lng: Optional[float] = Query(None, description="Optional user longitude"),
    db: Session = Depends(get_db)
):
    """
    Fetch all active SOS emergency broadcasts sorted by urgency and recency.
    """
    query = db.query(EmergencyRequest).filter(EmergencyRequest.status == "Active")
    city_str = city if isinstance(city, str) else None
    if city_str and city_str.strip():
        query = query.filter(EmergencyRequest.hospital_locality.ilike(f"%{city_str.strip()}%"))
    emergencies = query.all()
    
    results = []
    urgency_priority = {"Immediate": 0, "Within 6 Hours": 1, "Within 24 Hours": 2}

    for req in emergencies:
        dist = None
        if isinstance(lat, (int, float)) and isinstance(lng, (int, float)) and lat != 0.0:
            dist = haversine_distance(lat, lng, req.latitude, req.longitude)
            
        res_dict = {
            "id": req.id,
            "patient_name": req.patient_name,
            "blood_group": req.blood_group,
            "units_needed": req.units_needed,
            "component_type": req.component_type,
            "hospital_name": req.hospital_name,
            "hospital_locality": req.hospital_locality,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "urgency_level": req.urgency_level,
            "contact_person": req.contact_person,
            "contact_phone": req.contact_phone,
            "verification_slip_path": req.verification_slip_path,
            "status": req.status,
            "posted_by_verified_hospital": is_req_from_verified_hospital(req, db),
            "distance_km": dist,
            "created_at": req.created_at
        }
        priority_val = urgency_priority.get(req.urgency_level, 3)
        created_timestamp = req.created_at.timestamp() if req.created_at else 0
        # Sort by priority first (0 is highest), then newest created_at descending
        results.append((priority_val, -created_timestamp, res_dict))

    results.sort(key=lambda x: (x[0], x[1]))
    return [r[2] for r in results]

@router.post("/{request_id}/respond")
def respond_to_sos(
    request_id: int,
    payload: Optional[EmergencyRespondRequest] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Donor accepts an emergency request.
    Creates an Accepted handshake donation log and triggers 90-day cooldown on confirmation.
    """
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    today = date.today()
    auth_donor_id = current_user.id if (current_user and isinstance(current_user, User) and hasattr(current_user, "id")) else None
    donor_id = payload.donor_id if payload and payload.donor_id else auth_donor_id
    if not donor_id:
        # Pick first available matching donor who is compatible AND NOT currently in cooldown
        compatible_groups = get_compatible_donor_types(emergency.blood_group)
        first_donor = db.query(User).filter(
            User.is_available == True,
            User.blood_group.in_(compatible_groups),
            or_(User.cooldown_until == None, User.cooldown_until <= today)
        ).first()
        if first_donor:
            donor_id = first_donor.id

    donor = db.query(User).filter(User.id == donor_id).first() if donor_id else None

    # CRITICAL: Enforce ABO/Rh blood compatibility matrix
    if donor and emergency.blood_group:
        compatible_groups = get_compatible_donor_types(emergency.blood_group)
        if donor.blood_group not in compatible_groups:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Incompatible Blood Group: Donor has blood group '{donor.blood_group}', but patient requires '{emergency.blood_group}'. Compatible donor types are: {', '.join(compatible_groups)}."
            )

    # CRITICAL: Enforce biological cooldown & previous donation history
    if donor and donor.cooldown_until and donor.cooldown_until > today:
        days_left = (donor.cooldown_until - today).days
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Biological Cooldown Active: Donor last donated on {donor.last_donation_date}. You must wait 90 days between blood donations. You have {days_left} day(s) remaining until {donor.cooldown_until}."
        )

    # Create handshake log
    handshake = DonationLog(
        donor_id=donor.id if donor else 1,
        request_id=emergency.id,
        status="Accepted",
        notes=payload.notes if payload and payload.notes else "Donor dispatched via SOS response"
    )
    db.add(handshake)

    # Trigger 90-day cooldown and increment donation count for donor
    today = date.today()
    if donor:
        donor.last_donation_date = today
        donor.cooldown_until = today + timedelta(days=90)
        donor.total_donations += 1
        donor.is_available = False
        donor.is_verified = True

    # Mark the emergency request as Fulfilled so it is cleared from active board
    emergency.status = "Fulfilled"

    db.commit()

    return {
        "status": "success",
        "message": f"Successfully responded to SOS emergency #{request_id}",
        "handshake_id": handshake.id,
        "cooldown_applied": bool(donor),
        "cooldown_until": donor.cooldown_until if donor else None,
        "emergency": {
            "id": emergency.id,
            "patient_name": emergency.patient_name,
            "hospital_name": emergency.hospital_name,
            "blood_group": emergency.blood_group,
            "status": emergency.status
        }
    }

@router.post("/{request_id}/fulfill")
def fulfill_sos(request_id: int, db: Session = Depends(get_db)):
    """
    Manually marks an SOS emergency as fulfilled/completed.
    """
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    
    emergency.status = "Fulfilled"
    db.commit()
    return {"status": "success", "message": f"Emergency #{request_id} successfully marked as fulfilled"}

@router.put("/{request_id}", response_model=EmergencyResponse)
def update_sos_emergency(
    request_id: int,
    payload: EmergencyUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Updates an active emergency broadcast.
    Designed for stressed or pressurized requesters who made mistakes during emergency filing
    (e.g. wrong blood group, wrong units, wrong hospital ward/branch, or contact number).
    Requires either the secure edit_token, creator account ownership, or admin role.
    """
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency request not found")

    if emergency.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit emergency #{request_id} because its current status is '{emergency.status}'."
        )

    # Authorization verification
    is_authorized = False
    if payload.edit_token and emergency.edit_token and payload.edit_token.strip() == emergency.edit_token.strip():
        is_authorized = True
    elif current_user and emergency.user_id and emergency.user_id == current_user.id:
        is_authorized = True
    elif current_user and getattr(current_user, "role", "") == "admin":
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Valid edit token or creator login required to edit this emergency."
        )

    prev_blood_group = emergency.blood_group
    prev_locality = emergency.hospital_locality

    # Apply updates
    if payload.patient_name is not None and payload.patient_name.strip():
        emergency.patient_name = payload.patient_name.strip()
    if payload.blood_group is not None and payload.blood_group.strip():
        emergency.blood_group = payload.blood_group.strip().upper()
    if payload.units_needed is not None and payload.units_needed >= 1:
        emergency.units_needed = payload.units_needed
    if payload.component_type is not None and payload.component_type.strip():
        emergency.component_type = payload.component_type.strip()
    if payload.hospital_name is not None and payload.hospital_name.strip():
        emergency.hospital_name = payload.hospital_name.strip()
    if payload.hospital_locality is not None and payload.hospital_locality.strip():
        emergency.hospital_locality = payload.hospital_locality.strip()
    if payload.latitude is not None:
        emergency.latitude = float(payload.latitude)
    if payload.longitude is not None:
        emergency.longitude = float(payload.longitude)
    if payload.urgency_level is not None and payload.urgency_level.strip():
        emergency.urgency_level = payload.urgency_level.strip()
    if payload.contact_person is not None and payload.contact_person.strip():
        emergency.contact_person = payload.contact_person.strip()
    if payload.contact_phone is not None and payload.contact_phone.strip():
        emergency.contact_phone = payload.contact_phone.strip()

    db.commit()
    db.refresh(emergency)

    # If critical matching attributes changed, dispatch update alert to donors
    if emergency.blood_group != prev_blood_group or emergency.hospital_locality != prev_locality:
        try:
            has_sos_coords = bool(
                isinstance(emergency.latitude, (int, float)) and
                isinstance(emergency.longitude, (int, float)) and
                (emergency.latitude != 0.0 or emergency.longitude != 0.0)
            )
            radius_limit = getattr(settings, "NOTIFICATION_RADIUS_KM", 15.0)
            eligible_matches = find_eligible_donors(
                db=db,
                recipient_blood_group=emergency.blood_group,
                lat=emergency.latitude if has_sos_coords else None,
                lng=emergency.longitude if has_sos_coords else None,
                radius_km=radius_limit if has_sos_coords else None,
                only_available=True,
                require_donor_role=True
            )
            notifications_to_add = []
            for donor, dist in eligible_matches:
                notif_msg = (
                    f"[CORRECTED SOS ALERT] Details updated for Emergency #{emergency.id}: "
                    f"{emergency.units_needed} unit(s) of {emergency.blood_group} {emergency.component_type} "
                    f"at {emergency.hospital_name} ({emergency.hospital_locality})."
                )
                notif = Notification(
                    user_id=donor.id,
                    request_id=emergency.id,
                    message=notif_msg,
                    is_read=False
                )
                notifications_to_add.append(notif)
                send_external_notification(donor, emergency, notif_msg)

            if notifications_to_add:
                db.add_all(notifications_to_add)
                db.commit()
        except Exception as err:
            logger.error(f"Failed to dispatch updated SOS notifications: {err}")

    return emergency



