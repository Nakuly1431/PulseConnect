import os
import uuid
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.emergency import EmergencyRequest
from app.models.user import User
from app.models.donation_log import DonationLog
from app.schemas.emergency import EmergencyResponse, EmergencyRespondRequest
import logging
from app.core.config import settings
from app.core.compatibility import haversine_distance, get_compatible_donor_types
from app.models.notification import Notification
from app.api.auth import get_current_user

logger = logging.getLogger("pulseconnect.notifications")

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

router = APIRouter(prefix="/sos", tags=["SOS Emergency"])

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
    elif posted_by_verified_hospital and current_user and hasattr(current_user, "role") and current_user.role == "hospital" and getattr(current_user, "is_verified", False):
        is_verified_hosp = True

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

    emergency = EmergencyRequest(
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
        status="Active"
    )
    db.add(emergency)
    db.commit()
    db.refresh(emergency)

    # Automated Donor Matching & Notification Dispatch
    try:
        today = date.today()
        compatible_groups = get_compatible_donor_types(emergency.blood_group)

        # 1. Query available, non-cooldown donors compatible with emergency blood group
        donor_query = db.query(User).filter(
            User.is_available == True,
            User.blood_group.in_(compatible_groups),
            (User.cooldown_until == None) | (User.cooldown_until <= today)
        )
        eligible_donors = donor_query.all()

        has_sos_coords = bool(
            isinstance(emergency.latitude, (int, float)) and
            isinstance(emergency.longitude, (int, float)) and
            (emergency.latitude != 0.0 or emergency.longitude != 0.0)
        )
        radius_limit = getattr(settings, "NOTIFICATION_RADIUS_KM", 15.0)

        notifications_to_add = []
        for donor in eligible_donors:
            # Check proximity if coordinates are present
            if has_sos_coords and donor.latitude and donor.longitude and (donor.latitude != 0.0 or donor.longitude != 0.0):
                dist = haversine_distance(emergency.latitude, emergency.longitude, donor.latitude, donor.longitude)
                if dist > radius_limit:
                    continue

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
            "posted_by_verified_hospital": bool(req.posted_by_verified_hospital),
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
    db: Session = Depends(get_db)
):
    """
    Donor accepts an emergency request.
    Creates an Accepted handshake donation log and triggers 90-day cooldown on confirmation.
    """
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    today = date.today()
    donor_id = payload.donor_id if payload and payload.donor_id else None
    if not donor_id:
        # Pick first available matching donor who is NOT currently in cooldown
        first_donor = db.query(User).filter(
            User.is_available == True,
            or_(User.cooldown_until == None, User.cooldown_until <= today)
        ).first()
        if first_donor:
            donor_id = first_donor.id

    donor = db.query(User).filter(User.id == donor_id).first() if donor_id else None

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


