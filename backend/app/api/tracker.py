import re
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.emergency import EmergencyRequest
from app.models.user import User
from app.models.donation_log import DonationLog
from app.schemas.tracker import TrackerResponse, RequestTrackerItem, AssignedDonorInfo, TrackerSummary, UpdateStatusRequest
from app.api.auth import get_current_user

router = APIRouter(prefix="/tracker", tags=["Request Tracker"])

def _donor_info(d: Optional[User]) -> Optional[AssignedDonorInfo]:
    if not d: return None
    return AssignedDonorInfo(
        id=d.id, full_name=d.full_name, blood_group=d.blood_group, phone_number=d.phone_number,
        locality=d.locality, is_available=d.is_available, cooldown_until=str(d.cooldown_until) if d.cooldown_until else None
    )

@router.get("/all", response_model=TrackerResponse)
def get_all_request_statuses(
    status_filter: Optional[str] = Query(None), scope: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)
):
    items: list[RequestTrackerItem] = []
    is_user = current_user is not None and isinstance(current_user, User) and hasattr(current_user, "id")
    is_admin = is_user and getattr(current_user, "role", "") == "admin"
    scope_str = scope if isinstance(scope, str) else None
    
    if not is_user and scope_str == "my":
        return TrackerResponse(summary=TrackerSummary(total=0, accepted=0, pending=0, fulfilled=0), requests=[])
    
    filter_user = is_user and not (is_admin and scope_str == "all")
    u_id = current_user.id if is_user else None
    u_phone = "".join(c for c in (current_user.phone_number or "") if c.isdigit()) if is_user else ""

    # 1. Emergencies
    e_query = db.query(EmergencyRequest)
    if filter_user:
        e_filters = [EmergencyRequest.user_id == u_id, EmergencyRequest.donations.any(DonationLog.donor_id == u_id)]
        if len(u_phone) >= 7: e_filters.append(EmergencyRequest.contact_phone.ilike(f"%{u_phone[-10:]}%"))
        e_query = e_query.filter(or_(*e_filters))
    
    for req in e_query.order_by(EmergencyRequest.created_at.desc()).all():
        acc = next((l for l in req.donations if l.status in ["Accepted", "Completed"]), None)
        d_info = _donor_info(acc.donor) if acc else None
        status_val = "Fulfilled" if req.status == "Fulfilled" else ("Accepted" if d_info else "Pending")
        
        is_hosp = bool(req.posted_by_verified_hospital)
        if req.user_id:
            c = req.creator or db.query(User).filter(User.id == req.user_id).first()
            if c and c.role == "hospital": is_hosp = bool(c.is_verified)
        elif req.hospital_name:
            h = db.query(User).filter(User.role == "hospital", User.hospital_name.ilike(req.hospital_name.strip())).first()
            if h: is_hosp = bool(h.is_verified)

        items.append(RequestTrackerItem(
            id=f"sos-{req.id}", source_type="SOS Broadcast", raw_id=req.id, status=status_val,
            urgency_level=req.urgency_level, patient_name=req.patient_name, blood_group=req.blood_group,
            units_needed=req.units_needed, component_type=req.component_type, hospital_name=req.hospital_name,
            hospital_locality=req.hospital_locality, contact_person=req.contact_person, contact_phone=req.contact_phone,
            verification_slip_path=req.verification_slip_path, assigned_donor=d_info, posted_by_verified_hospital=is_hosp,
            created_at=req.created_at, accepted_at=acc.timestamp if acc else None, notes=acc.notes if acc else None
        ))

    # 2. Direct Requests
    d_query = db.query(DonationLog).filter(DonationLog.request_id == None)
    if filter_user:
        d_filters = [DonationLog.donor_id == u_id, DonationLog.requester_id == u_id]
        if len(u_phone) >= 7: d_filters.append(DonationLog.notes.ilike(f"%{u_phone[-10:]}%"))
        d_query = d_query.filter(or_(*d_filters))

    for log in d_query.order_by(DonationLog.timestamp.desc()).all():
        d_info = _donor_info(log.donor)
        st = "Pending" if log.status == "Requested" else ("Accepted" if log.status == "Accepted" else ("Fulfilled" if log.status in ["Completed", "Fulfilled"] else log.status))
        
        notes = log.notes or ""
        def _ext(lbl):
            m = re.search(rf"{re.escape(lbl)}:\s*([^.]+)", notes)
            return m.group(1).strip() if m else ""

        items.append(RequestTrackerItem(
            id=f"direct-{log.id}", source_type="Direct Request", raw_id=log.id, status=st, urgency_level="Immediate",
            patient_name=_ext("for").replace("Patient", "").strip() or "Emergency Patient",
            blood_group=log.donor.blood_group if log.donor else "Universal", units_needed=1, component_type="Whole Blood",
            hospital_name=_ext("at").replace("Hospital", "").strip() or "Hospital",
            hospital_locality=log.donor.locality if log.donor else "Local",
            contact_person=_ext("Requester") or "Direct Match Contact",
            contact_phone=_ext("Phone").replace("[Phone Verified ✓]", "").strip() or (log.donor.phone_number if log.donor else ""),
            verification_slip_path=None, assigned_donor=d_info, created_at=log.timestamp,
            accepted_at=log.timestamp if st in ["Accepted", "Fulfilled"] else None, notes=notes or "Direct one-on-one donor dispatch"
        ))

    items.sort(key=lambda x: (x.created_at.timestamp() if x.created_at else 0.0), reverse=True)
    summary = TrackerSummary(
        total=len(items), accepted=sum(1 for i in items if i.status == "Accepted"),
        pending=sum(1 for i in items if i.status == "Pending"), fulfilled=sum(1 for i in items if i.status == "Fulfilled")
    )
    if isinstance(status_filter, str) and status_filter.strip().capitalize() != "All":
        clean = status_filter.strip().capitalize()
        items = [i for i in items if i.status.capitalize() == clean]

    return TrackerResponse(summary=summary, requests=items)

@router.patch("/{source_type}/{raw_id}/status")
def update_request_status(source_type: str, raw_id: int, payload: UpdateStatusRequest, db: Session = Depends(get_db)):
    st = payload.status.capitalize()
    if source_type.lower() in ["sos", "sos-broadcast"]:
        req = db.query(EmergencyRequest).filter(EmergencyRequest.id == raw_id).first()
        if not req: raise HTTPException(status_code=404, detail="SOS Emergency request not found")
        req.status = st
        if st == "Fulfilled":
            for log in req.donations:
                if log.status == "Accepted": log.status = "Completed"
        db.commit()
        return {"status": "success", "message": f"SOS Emergency #{raw_id} updated to {st}"}
    elif source_type.lower() in ["direct", "direct-request"]:
        log = db.query(DonationLog).filter(DonationLog.id == raw_id).first()
        if not log: raise HTTPException(status_code=404, detail="Direct request log not found")
        log.status = st
        db.commit()
        return {"status": "success", "message": f"Direct request #{raw_id} updated to {st}"}
    raise HTTPException(status_code=400, detail="Invalid source_type. Must be 'sos' or 'direct'.")
