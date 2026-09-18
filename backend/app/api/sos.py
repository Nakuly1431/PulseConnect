import os
import uuid
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.emergency import EmergencyRequest
from app.models.user import User
from app.models.donation_log import DonationLog
from app.schemas.emergency import EmergencyResponse, EmergencyRespondRequest
from app.core.config import settings
from app.core.compatibility import haversine_distance

router = APIRouter(prefix="/sos", tags=["SOS Emergency"])

@router.post("/create", response_model=EmergencyResponse, status_code=status.HTTP_201_CREATED)
async def create_sos_emergency(
    patient_name: str = Form(...),
    blood_group: str = Form(...),
    units_needed: int = Form(1),
    component_type: str = Form("Whole Blood"),
    hospital_name: str = Form(...),
    hospital_locality: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    urgency_level: str = Form("Immediate"),
    contact_person: str = Form(...),
    contact_phone: str = Form(...),
    verification_slip: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Broadcasts an urgent SOS emergency request.
    Optionally accepts a hospital verification slip / prescription image upload.
    """
    slip_rel_path = None
    if verification_slip and verification_slip.filename:
        file_ext = os.path.splitext(verification_slip.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        target_path = settings.UPLOAD_DIR / unique_filename
        
        contents = await verification_slip.read()
        with open(target_path, "wb") as f:
            f.write(contents)
        slip_rel_path = f"/uploads/{unique_filename}"

    emergency = EmergencyRequest(
        patient_name=patient_name,
        blood_group=blood_group.strip().upper(),
        units_needed=units_needed,
        component_type=component_type,
        hospital_name=hospital_name,
        hospital_locality=hospital_locality,
        latitude=latitude,
        longitude=longitude,
        urgency_level=urgency_level,
        contact_person=contact_person,
        contact_phone=contact_phone,
        verification_slip_path=slip_rel_path,
        status="Active"
    )
    db.add(emergency)
    db.commit()
    db.refresh(emergency)

    return emergency

@router.get("/active", response_model=list[EmergencyResponse])
def get_active_sos_requests(
    lat: Optional[float] = Query(None, description="Current user latitude for distance sorting"),
    lng: Optional[float] = Query(None, description="Current user longitude"),
    db: Session = Depends(get_db)
):
    """
    Fetch all active SOS emergency broadcasts sorted by urgency, proximity, and timestamp.
    """
    emergencies = db.query(EmergencyRequest).filter(EmergencyRequest.status == "Active").all()
    
    results = []
    urgency_priority = {"Immediate": 0, "Within 6 Hours": 1, "Within 24 Hours": 2}

    for req in emergencies:
        dist = None
        if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
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
            "distance_km": dist,
            "created_at": req.created_at
        }
        priority_val = urgency_priority.get(req.urgency_level, 3)
        dist_val = dist if dist is not None else 9999.0
        results.append((priority_val, dist_val, res_dict))

    # Sort by urgency first, then distance ascending
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

    donor_id = payload.donor_id if payload and payload.donor_id else None
    if not donor_id:
        # Pick first available matching donor if not supplied
        first_donor = db.query(User).filter(User.is_available == True).first()
        if first_donor:
            donor_id = first_donor.id

    donor = db.query(User).filter(User.id == donor_id).first() if donor_id else None

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


