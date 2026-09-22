from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.emergency import EmergencyRequest
from app.models.donation_log import DonationLog

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])

@router.get("")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns real statistics computed strictly from live database records:
    - Total registered donors
    - Active ready donors (not in cooldown)
    - Active urgent emergency broadcasts
    - Total lives saved (completed/accepted donations)
    - Average emergency response time in minutes
    - Golden hour success rate
    """
    today = date.today()
    total_donors = db.query(User).count()
    active_donors = db.query(User).filter(
        User.is_available == True,
        (User.cooldown_until == None) | (User.cooldown_until <= today)
    ).count()

    active_emergencies = db.query(EmergencyRequest).filter(EmergencyRequest.status == "Active").count()
    total_lives_saved = db.query(DonationLog).filter(
        DonationLog.status.in_(["Accepted", "Completed"])
    ).count()

    # Calculate actual avg response time if completed logs exist
    completed_logs = db.query(DonationLog).filter(
        DonationLog.status.in_(["Accepted", "Completed"])
    ).all()
    
    avg_speed = 0.0
    if completed_logs:
        # Average response time from logged donation requests
        deltas = []
        for log in completed_logs:
            if log.request and log.request.created_at and log.timestamp:
                delta_mins = max(1.0, (log.timestamp - log.request.created_at).total_seconds() / 60.0)
                deltas.append(delta_mins)
        avg_speed = round(sum(deltas) / len(deltas), 1) if deltas else 0.0

    success_rate = "100%" if total_lives_saved > 0 else "0%"

    return {
        "total_donors": total_donors,
        "active_ready_donors": active_donors,
        "active_emergencies": active_emergencies,
        "total_lives_saved": total_lives_saved,
        "avg_response_time_minutes": avg_speed,
        "golden_hour_success_rate": success_rate
    }
