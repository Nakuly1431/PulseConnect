from datetime import datetime, timezone, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.emergency import EmergencyRequest
from app.models.user import User
from app.models.donation_log import DonationLog
from app.schemas.tracker import (
    TrackerResponse,
    RequestTrackerItem,
    AssignedDonorInfo,
    TrackerSummary,
    UpdateStatusRequest
)
from app.core.compatibility import mask_phone_number

router = APIRouter(prefix="/tracker", tags=["Request Tracker"])

@router.get("/all", response_model=TrackerResponse)
def get_all_request_statuses(
    status_filter: Optional[str] = Query(None, description="Optional status filter: 'Pending', 'Accepted', 'Fulfilled'"),
    db: Session = Depends(get_db)
):
    """
    Returns a unified ledger of all donor and acceptor requests across the network,
    including who requested, which donor accepted, current status, and timestamps.
    """
    items: list[RequestTrackerItem] = []

    # 1. Process all Emergency SOS Broadcasts
    emergencies = db.query(EmergencyRequest).order_by(EmergencyRequest.created_at.desc()).all()

    for req in emergencies:
        # Find if a donor accepted or completed this request
        assigned_donor_info = None
        accepted_at = None
        handshake_notes = None

        # Check related donation handshakes
        accepted_log = next(
            (log for log in req.donations if log.status in ["Accepted", "Completed"]),
            None
        )

        if accepted_log and accepted_log.donor:
            d = accepted_log.donor
            assigned_donor_info = AssignedDonorInfo(
                id=d.id,
                full_name=d.full_name,
                blood_group=d.blood_group,
                phone_number=d.phone_number,
                locality=d.locality,
                is_available=d.is_available,
                cooldown_until=str(d.cooldown_until) if d.cooldown_until else None
            )
            accepted_at = accepted_log.timestamp
            handshake_notes = accepted_log.notes

        # Determine normalized unified status
        if req.status == "Fulfilled":
            computed_status = "Fulfilled"
        elif assigned_donor_info is not None:
            computed_status = "Accepted"
        else:
            computed_status = "Pending"

        item = RequestTrackerItem(
            id=f"sos-{req.id}",
            source_type="SOS Broadcast",
            raw_id=req.id,
            status=computed_status,
            urgency_level=req.urgency_level,
            patient_name=req.patient_name,
            blood_group=req.blood_group,
            units_needed=req.units_needed,
            component_type=req.component_type,
            hospital_name=req.hospital_name,
            hospital_locality=req.hospital_locality,
            contact_person=req.contact_person,
            contact_phone=req.contact_phone,
            verification_slip_path=req.verification_slip_path,
            assigned_donor=assigned_donor_info,
            posted_by_verified_hospital=bool(req.posted_by_verified_hospital),
            created_at=req.created_at,
            accepted_at=accepted_at,
            notes=handshake_notes
        )
        items.append(item)

    # 2. Process Direct Donor Requests (DonationLog with no request_id)
    direct_logs = db.query(DonationLog).filter(DonationLog.request_id == None).order_by(DonationLog.timestamp.desc()).all()

    for log in direct_logs:
        donor = log.donor
        assigned_donor_info = None
        if donor:
            assigned_donor_info = AssignedDonorInfo(
                id=donor.id,
                full_name=donor.full_name,
                blood_group=donor.blood_group,
                phone_number=donor.phone_number,
                locality=donor.locality,
                is_available=donor.is_available,
                cooldown_until=str(donor.cooldown_until) if donor.cooldown_until else None
            )

        # Normalize status
        if log.status == "Requested":
            comp_status = "Pending"
        elif log.status in ["Accepted", "Completed", "Fulfilled"]:
            comp_status = "Accepted" if log.status == "Accepted" else "Fulfilled"
        else:
            comp_status = log.status

        item = RequestTrackerItem(
            id=f"direct-{log.id}",
            source_type="Direct Request",
            raw_id=log.id,
            status=comp_status,
            urgency_level="Immediate",
            patient_name="Emergency Match Patient",
            blood_group=donor.blood_group if donor else "Universal",
            units_needed=1,
            component_type="Whole Blood",
            hospital_name="Immediate Locality Match",
            hospital_locality=donor.locality if donor else "Bengaluru",
            contact_person="Direct Handshake Match",
            contact_phone="+91 98450 00000",
            verification_slip_path=None,
            assigned_donor=assigned_donor_info,
            created_at=log.timestamp,
            accepted_at=log.timestamp if comp_status in ["Accepted", "Fulfilled"] else None,
            notes=log.notes or "Direct one-on-one donor dispatch"
        )
        items.append(item)

    # Sort all items by created_at descending
    items.sort(key=lambda x: x.created_at, reverse=True)

    # Calculate summary metrics
    total_count = len(items)
    accepted_count = sum(1 for i in items if i.status == "Accepted")
    pending_count = sum(1 for i in items if i.status == "Pending")
    fulfilled_count = sum(1 for i in items if i.status == "Fulfilled")

    summary = TrackerSummary(
        total=total_count,
        accepted=accepted_count,
        pending=pending_count,
        fulfilled=fulfilled_count
    )

    # Apply optional filter
    if isinstance(status_filter, str) and status_filter.strip().capitalize() != "All":
        clean_filter = status_filter.strip().capitalize()
        items = [i for i in items if i.status.capitalize() == clean_filter]

    return TrackerResponse(summary=summary, requests=items)

@router.patch("/{source_type}/{raw_id}/status")
def update_request_status(
    source_type: str,
    raw_id: int,
    payload: UpdateStatusRequest,
    db: Session = Depends(get_db)
):
    """
    Updates the status of a request (e.g., mark an Accepted request as Fulfilled/Completed).
    """
    new_status = payload.status.capitalize()

    if source_type.lower() in ["sos", "sos-broadcast"]:
        emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == raw_id).first()
        if not emergency:
            raise HTTPException(status_code=404, detail="SOS Emergency request not found")
        
        emergency.status = new_status
        if new_status == "Fulfilled":
            # Also ensure related donation log is completed
            for log in emergency.donations:
                if log.status == "Accepted":
                    log.status = "Completed"
        db.commit()
        return {"status": "success", "message": f"SOS Emergency #{raw_id} updated to {new_status}"}

    elif source_type.lower() in ["direct", "direct-request"]:
        log = db.query(DonationLog).filter(DonationLog.id == raw_id).first()
        if not log:
            raise HTTPException(status_code=404, detail="Direct request log not found")
        
        log.status = new_status
        db.commit()
        return {"status": "success", "message": f"Direct request #{raw_id} updated to {new_status}"}

    else:
        raise HTTPException(status_code=400, detail="Invalid source_type. Must be 'sos' or 'direct'.")
