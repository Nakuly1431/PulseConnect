from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.emergency import EmergencyRequest
from app.models.donation_log import DonationLog
from app.models.notification import Notification
from app.schemas.user import UserResponse
from app.schemas.emergency import EmergencyResponse
from app.api.auth import get_current_user, serialize_user

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to access admin resources")
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access forbidden: Administrator privileges required")
    if not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Your Administrator registration is pending approval by an active system administrator.")
    return current_user

@router.get("/users/pending-verification", response_model=list[UserResponse])
def get_pending_verifications(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    users = db.query(User).filter(User.is_verified == False).order_by(User.created_at.desc()).all()
    return [serialize_user(u) for u in users]

@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    role: Optional[str] = Query(None), search: Optional[str] = Query(None),
    db: Session = Depends(get_db), admin: User = Depends(get_current_admin)
):
    query = db.query(User)
    if role and role.strip().lower() != "all":
        query = query.filter(User.role == role.strip().lower())
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        fields = [User.full_name, User.email, User.phone_number, User.locality, User.city, User.state, User.blood_group]
        query = query.filter(or_(*[f.ilike(term) for f in fields]))
    return [serialize_user(u) for u in query.order_by(User.created_at.desc()).all()]

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own active account.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User #{user_id} not found")
    name = user.full_name
    db.query(Notification).filter(Notification.user_id == user.id).delete()
    db.query(EmergencyRequest).filter(EmergencyRequest.user_id == user.id).update({"user_id": None})
    db.delete(user)
    db.commit()
    return {"status": "success", "message": f"User account '{name}' (#{user_id}) has been successfully removed."}

@router.patch("/users/{user_id}/verify", response_model=UserResponse)
def verify_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User #{user_id} not found")
    user.is_verified = True
    if user.role == "hospital":
        db.query(EmergencyRequest).filter(EmergencyRequest.user_id == user.id).update({"posted_by_verified_hospital": True})
        if user.hospital_name:
            db.query(EmergencyRequest).filter(EmergencyRequest.hospital_name.ilike(user.hospital_name.strip())).update({"posted_by_verified_hospital": True})
    
    msg = "🎉 Your Administrator account has been approved by the PulseConnect Admin team! You now have full access to the Admin Portal." if user.role == "admin" else "🎉 Verification Approved: Your profile has been reviewed and verified by PulseConnect administrators."
    db.add(Notification(user_id=user.id, message=msg))
    db.commit()
    db.refresh(user)
    return serialize_user(user)

@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: int, payload: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User #{user_id} not found")
    new_role = (payload.get("role") or "").strip().lower()
    if new_role not in ["admin", "donor_acceptor", "hospital"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin', 'donor_acceptor', or 'hospital'.")
    if admin.id == user_id and new_role != "admin":
        if db.query(User).filter(User.role == "admin", User.id != admin.id).count() == 0:
            raise HTTPException(status_code=400, detail="Cannot demote the only remaining administrator account.")
    user.role = new_role
    if new_role == "admin":
        user.is_verified = True
    db.commit()
    db.refresh(user)
    return serialize_user(user)

@router.patch("/users/{user_id}/make-admin", response_model=UserResponse)
def make_user_admin(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return update_user_role(user_id, {"role": "admin"}, db, admin)

@router.get("/requests", response_model=list[EmergencyResponse])
def get_all_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db), admin: User = Depends(get_current_admin)
):
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
            hosp = db.query(User).filter(User.role == "hospital", User.hospital_name.ilike(req.hospital_name.strip())).first()
            if hosp:
                req.posted_by_verified_hospital = bool(hosp.is_verified)
    return requests

@router.delete("/requests/{request_id}")
def delete_request(request_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail=f"Emergency request #{request_id} not found")
    name = emergency.patient_name
    db.delete(emergency)
    db.commit()
    return {"status": "success", "message": f"Emergency request #{request_id} for '{name}' successfully deleted"}

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    today = date.today()
    logs = db.query(DonationLog).filter(DonationLog.status.in_(["Accepted", "Completed"])).all()
    deltas = [max(1.0, abs(l.timestamp.timestamp() - l.request.created_at.timestamp()) / 60.0) for l in logs if l.request and l.request.created_at and l.timestamp]
    lives_saved = len(logs)
    
    return {
        "total_users": db.query(User).count(),
        "verified_users": db.query(User).filter(User.is_verified == True).count(),
        "pending_verifications": db.query(User).filter(User.is_verified == False).count(),
        "donors_count": db.query(User).filter(User.role == "donor_acceptor").count(),
        "hospitals_count": db.query(User).filter(User.role == "hospital").count(),
        "admins_count": db.query(User).filter(User.role == "admin").count(),
        "active_ready_donors": db.query(User).filter(User.is_available == True, (User.cooldown_until == None) | (User.cooldown_until <= today)).count(),
        "total_emergencies": db.query(EmergencyRequest).count(),
        "active_emergencies": db.query(EmergencyRequest).filter(EmergencyRequest.status == "Active").count(),
        "fulfilled_emergencies": db.query(EmergencyRequest).filter(EmergencyRequest.status == "Fulfilled").count(),
        "total_lives_saved": lives_saved,
        "avg_response_time_minutes": round(sum(deltas) / len(deltas), 1) if deltas else 0.0,
        "golden_hour_success_rate": "100%" if lives_saved > 0 else "0%"
    }
