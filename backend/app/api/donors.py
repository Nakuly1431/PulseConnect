from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.donation_log import DonationLog
from app.schemas.user import UserResponse, AvailabilityToggle
from app.schemas.donation import DonationRequestCreate, DonationLogResponse
from app.core.compatibility import (
    haversine_distance,
    get_compatible_donor_types,
    mask_phone_number
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/donors", tags=["Donors"])

@router.get("/search", response_model=list[UserResponse])
def search_donors(
    blood_group: Optional[str] = Query(None, description="Patient recipient blood group (e.g. A+, O-, etc.) or 'All'"),
    lat: float = Query(12.9716, description="Search center latitude (default Bangalore center)"),
    lng: float = Query(77.5946, description="Search center longitude"),
    radius_km: float = Query(15.0, ge=1.0, le=200.0, description="Search radius in kilometers"),
    only_available: bool = Query(True, description="Filter for ready and available donors only"),
    locality: Optional[str] = Query(None, description="Optional locality, city, state, or hospital text query"),
    db: Session = Depends(get_db)
):
    """
    Ultra-fast proximity and medical compatibility search.
    Implements Haversine distance calculation and blood compatibility rules.
    Filters out donors in 90-day cooldown.
    """
    today = date.today()
    query = db.query(User)

    if only_available:
        query = query.filter(User.is_available == True)

    # Filter out donors who are actively in 90-day cooldown
    query = query.filter(
        (User.cooldown_until == None) | (User.cooldown_until <= today)
    )

    # Blood group compatibility filter
    if blood_group and blood_group.strip().upper() != "ALL":
        target_group = blood_group.strip().upper().replace(" ", "+")
        # Find all donor types compatible for this recipient group
        compatible_donor_types = get_compatible_donor_types(target_group)
        query = query.filter(User.blood_group.in_(compatible_donor_types))

    if locality and locality.strip():
        search_str = f"%{locality.strip()}%"
        query = query.filter(
            or_(
                User.locality.ilike(search_str),
                User.city.ilike(search_str),
                User.state.ilike(search_str)
            )
        )

    donors = query.all()

    # Compute Haversine distance and filter by radius
    results = []
    for donor in donors:
        dist = haversine_distance(lat, lng, donor.latitude, donor.longitude)
        if dist <= radius_km:
            is_cooldown = bool(donor.cooldown_until and donor.cooldown_until > today)
            user_dict = {
                "id": donor.id,
                "full_name": donor.full_name,
                "email": donor.email,
                "phone_number": donor.phone_number,
                "masked_phone": mask_phone_number(donor.phone_number),
                "blood_group": donor.blood_group,
                "latitude": donor.latitude,
                "longitude": donor.longitude,
                "locality": donor.locality,
                "city": donor.city,
                "state": donor.state,
                "is_available": donor.is_available,
                "is_verified": donor.is_verified,
                "last_donation_date": donor.last_donation_date,
                "cooldown_until": donor.cooldown_until,
                "total_donations": donor.total_donations,
                "distance_km": dist,
                "is_in_cooldown": is_cooldown,
                "created_at": donor.created_at
            }
            results.append((dist, user_dict))

    # Sort results strictly by distance ascending
    results.sort(key=lambda x: x[0])
    return [r[1] for r in results]

@router.patch("/toggle-availability", response_model=UserResponse)
def toggle_availability(
    toggle_in: Optional[AvailabilityToggle] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Flip donor availability status between Active/Ready and Off-duty.
    If authenticated, updates the logged-in user. If no auth provided in dev,
    toggles the first seeded donor for effortless UI demoing.
    """
    user = current_user
    if not user:
        # Fallback to first donor in DB to make demo frictionless
        user = db.query(User).first()
        if not user:
            raise HTTPException(status_code=404, detail="No donor found to toggle")

    if toggle_in and toggle_in.is_available is not None:
        user.is_available = toggle_in.is_available
    else:
        user.is_available = not user.is_available

    db.commit()
    db.refresh(user)

    res = UserResponse.model_validate(user)
    res.masked_phone = mask_phone_number(user.phone_number)
    return res

@router.post("/{donor_id}/request", response_model=DonationLogResponse, status_code=status.HTTP_201_CREATED)
def request_blood_from_donor(
    donor_id: int,
    req_data: Optional[DonationRequestCreate] = None,
    db: Session = Depends(get_db)
):
    """
    One-click instant blood request handshake sent to a specific donor.
    Creates a donation log record with 'Requested' status.
    """
    donor = db.query(User).filter(User.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    new_log = DonationLog(
        donor_id=donor.id,
        request_id=req_data.request_id if req_data else None,
        status="Requested",
        notes=req_data.notes if req_data else "Emergency proximity blood request"
    )
    db.add(new_log)
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
        donor_blood_group=donor.blood_group
    )
