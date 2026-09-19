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
    lat: Optional[float] = Query(None, description="Optional search center latitude"),
    lng: Optional[float] = Query(None, description="Optional search center longitude"),
    radius_km: Optional[float] = Query(None, description="Optional search radius in kilometers"),
    only_available: bool = Query(True, description="Filter for ready and available donors only"),
    locality: Optional[str] = Query(None, description="Optional locality, city, state, or hospital text query"),
    db: Session = Depends(get_db)
):
    """
    Medical compatibility and locality-based donor search.
    Filters by blood group, locality/city/state text, and cooldown eligibility.
    Coordinates and radius are completely optional.
    """
    today = date.today()
    # Normalize parameters if called directly in code/tests without FastAPI DI
    bg_str = blood_group if isinstance(blood_group, str) else "All"
    loc_str = locality if isinstance(locality, str) else None
    avail_bool = only_available if isinstance(only_available, bool) else True

    query = db.query(User)

    if avail_bool:
        query = query.filter(User.is_available == True)

    # Filter out donors who are actively in 90-day cooldown
    query = query.filter(
        (User.cooldown_until == None) | (User.cooldown_until <= today)
    )

    # Blood group compatibility filter
    if bg_str and bg_str.strip().upper() != "ALL":
        target_group = bg_str.strip().upper().replace(" ", "+")
        # Find all donor types compatible for this recipient group
        compatible_donor_types = get_compatible_donor_types(target_group)
        query = query.filter(User.blood_group.in_(compatible_donor_types))

    if loc_str and loc_str.strip():
        search_str = f"%{loc_str.strip()}%"
        query = query.filter(
            or_(
                User.locality.ilike(search_str),
                User.city.ilike(search_str),
                User.state.ilike(search_str)
            )
        )

    donors = query.all()

    # Process donors
    results = []
    has_coords = isinstance(lat, (int, float)) and isinstance(lng, (int, float)) and lat != 0.0 and lng != 0.0

    for donor in donors:
        dist = None
        if has_coords and donor.latitude and donor.longitude:
            dist = haversine_distance(lat, lng, donor.latitude, donor.longitude)
            if radius_km and dist > radius_km:
                continue

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
        results.append((dist if dist is not None else 9999.0, user_dict))

    if has_coords:
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
