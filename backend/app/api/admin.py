from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.emergency import EmergencyRequest
from app.models.donation_log import DonationLog
from app.schemas.user import UserResponse
from app.schemas.emergency import EmergencyResponse
from app.api.auth import get_current_user, serialize_user

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Enforces JWT authentication and verifies user has 'admin' role.
    Returns 401 if unauthenticated, 403 if authenticated but not admin.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access admin resources"
        )
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required"
        )
    return current_user

@router.get("/users/pending-verification", response_model=list[UserResponse])
def get_pending_verifications(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Fetch all registered users who have is_verified=False,
    ordered by registration date descending.
    """
    pending_users = (
        db.query(User)
        .filter(User.is_verified == False)
        .order_by(User.created_at.desc())
        .all()
    )
    return [serialize_user(u) for u in pending_users]

@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    role: Optional[str] = Query(None, description="Filter by role ('donor_acceptor', 'hospital', 'admin', 'all')"),
    search: Optional[str] = Query(None, description="Search across full name, email, phone, locality, city, state, or blood group"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Fetch all registered donors, hospitals, and admins for full moderation & directory viewing.
    Supports real-time search and role filtering.
    """
    query = db.query(User)
    if role and role.strip().lower() != "all":
        query = query.filter(User.role == role.strip().lower())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            (User.full_name.ilike(term)) |
            (User.email.ilike(term)) |
            (User.phone_number.ilike(term)) |
            (User.locality.ilike(term)) |
            (User.city.ilike(term)) |
            (User.state.ilike(term)) |
            (User.blood_group.ilike(term))
        )

    users = query.order_by(User.created_at.desc()).all()
    return [serialize_user(u) for u in users]

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin moderation: Permanently removes a spam or test user account.
    Prevents an admin from accidentally deleting their own active profile.
    """
    if admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own active account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User #{user_id} not found"
        )

    from app.models.notification import Notification
    db.query(Notification).filter(Notification.user_id == user.id).delete()
    db.query(EmergencyRequest).filter(EmergencyRequest.user_id == user.id).update({"user_id": None})
    db.delete(user)
    db.commit()

    return {
        "status": "success",
        "message": f"User account '{user.full_name}' (#{user_id}) has been successfully removed."
    }


@router.patch("/users/{user_id}/verify", response_model=UserResponse)
def verify_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin verification workflow: marks is_verified=True for a user (donor or hospital).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User #{user_id} not found"
        )

    user.is_verified = True
    # If a hospital account is verified, synchronize all emergency requests associated with this hospital
    if user.role == "hospital":
        db.query(EmergencyRequest).filter(EmergencyRequest.user_id == user.id).update(
            {"posted_by_verified_hospital": True}
        )
        if user.hospital_name:
            db.query(EmergencyRequest).filter(
                EmergencyRequest.hospital_name.ilike(user.hospital_name.strip())
            ).update({"posted_by_verified_hospital": True})
    db.commit()
    db.refresh(user)

    return serialize_user(user)

@router.get("/requests", response_model=list[EmergencyResponse])
def get_all_requests(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status ('Active', 'Fulfilled', etc.) or 'All'"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Returns all emergency requests across the network, optionally filtered by status.
    Ensures hospital verified flag dynamically reflects the creator's live account status.
    """
    query = db.query(EmergencyRequest)
    if status_filter and status_filter.strip().lower() != "all":
        query = query.filter(EmergencyRequest.status.ilike(status_filter.strip()))

    requests = query.order_by(EmergencyRequest.created_at.desc()).all()
    for req in requests:
        if req.user_id:
            creator = db.query(User).filter(User.id == req.user_id).first()
            if creator and creator.role == "hospital":
                req.posted_by_verified_hospital = bool(creator.is_verified)
        elif req.hospital_name:
            hosp = db.query(User).filter(
                User.role == "hospital",
                User.hospital_name.ilike(req.hospital_name.strip())
            ).first()
            if hosp:
                req.posted_by_verified_hospital = bool(hosp.is_verified)
    return requests

@router.delete("/requests/{request_id}")
def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Moderation tool: Removes fraudulent, duplicate, or abusive SOS requests.
    """
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request #{request_id} not found"
        )

    db.delete(emergency)
    db.commit()

    return {
        "status": "success",
        "message": f"Emergency request #{request_id} for '{emergency.patient_name}' successfully deleted"
    }

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Comprehensive platform statistics for administrators, extending standard stats:
    - User counts by role (donors, hospitals, admins)
    - Pending verification count
    - Active, fulfilled, and total emergency broadcasts
    - Lives saved and average response speed
    """
    today = date.today()
    total_users = db.query(User).count()
    pending_verifications = db.query(User).filter(User.is_verified == False).count()
    verified_users = db.query(User).filter(User.is_verified == True).count()

    donors_count = db.query(User).filter(User.role == "donor_acceptor").count()
    hospitals_count = db.query(User).filter(User.role == "hospital").count()
    admins_count = db.query(User).filter(User.role == "admin").count()

    active_donors = db.query(User).filter(
        User.is_available == True,
        (User.cooldown_until == None) | (User.cooldown_until <= today)
    ).count()

    total_emergencies = db.query(EmergencyRequest).count()
    active_emergencies = db.query(EmergencyRequest).filter(EmergencyRequest.status == "Active").count()
    fulfilled_emergencies = db.query(EmergencyRequest).filter(EmergencyRequest.status == "Fulfilled").count()

    total_lives_saved = db.query(DonationLog).filter(
        DonationLog.status.in_(["Accepted", "Completed"])
    ).count()

    # Average response speed
    completed_logs = db.query(DonationLog).filter(
        DonationLog.status.in_(["Accepted", "Completed"])
    ).all()
    avg_speed = 0.0
    if completed_logs:
        deltas = []
        for log in completed_logs:
            if log.request and log.request.created_at and log.timestamp:
                delta_mins = max(1.0, (log.timestamp - log.request.created_at).total_seconds() / 60.0)
                deltas.append(delta_mins)
        avg_speed = round(sum(deltas) / len(deltas), 1) if deltas else 0.0

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "pending_verifications": pending_verifications,
        "donors_count": donors_count,
        "hospitals_count": hospitals_count,
        "admins_count": admins_count,
        "active_ready_donors": active_donors,
        "total_emergencies": total_emergencies,
        "active_emergencies": active_emergencies,
        "fulfilled_emergencies": fulfilled_emergencies,
        "total_lives_saved": total_lives_saved,
        "avg_response_time_minutes": avg_speed,
        "golden_hour_success_rate": "100%" if total_lives_saved > 0 else "0%"
    }
