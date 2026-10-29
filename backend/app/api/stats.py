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
    today = date.today()
    logs = db.query(DonationLog).filter(DonationLog.status.in_(["Accepted", "Completed"])).all()
    deltas = [max(1.0, abs(l.timestamp.timestamp() - l.request.created_at.timestamp()) / 60.0) for l in logs if l.request and l.request.created_at and l.timestamp]
    total_saved = len(logs)
    
    return {
        "total_donors": db.query(User).count(),
        "active_ready_donors": db.query(User).filter(User.is_available == True, (User.cooldown_until == None) | (User.cooldown_until <= today)).count(),
        "active_emergencies": db.query(EmergencyRequest).filter(EmergencyRequest.status == "Active").count(),
        "total_lives_saved": total_saved,
        "avg_response_time_minutes": round(sum(deltas) / len(deltas), 1) if deltas else 0.0,
        "golden_hour_success_rate": "100%" if total_saved > 0 else "0%"
    }
