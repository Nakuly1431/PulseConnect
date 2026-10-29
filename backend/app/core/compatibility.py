import math
from datetime import date
from sqlalchemy import or_
from app.models.user import User

BLOOD_COMPATIBILITY: dict[str, list[str]] = {
    "A+": ["A+", "A-", "O+", "O-"], "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"], "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["AB-", "A-", "B-", "O-"],
    "O+": ["O+", "O-"], "O-": ["O-"],
}

def get_compatible_donor_types(recipient_group: str) -> list[str]:
    norm = recipient_group.strip().upper().replace(" ", "+")
    return BLOOD_COMPATIBILITY.get(norm, [norm])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    d_lat, d_lon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0)**2
    return round(6371.0 * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a)), 2)

def mask_phone_number(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) <= 4: return "****"
    prefix = "+91" if "+91" in phone else digits[:2]
    return f"{prefix} ••••• {digits[-4:]}"

def find_eligible_donors(
    db, recipient_blood_group: str | None = None, lat: float | None = None, lng: float | None = None,
    radius_km: float | None = None, only_available: bool = True, locality: str | None = None, require_donor_role: bool = True
):
    today = date.today()
    query = db.query(User).filter((User.cooldown_until == None) | (User.cooldown_until <= today))
    if require_donor_role:
        query = query.filter(or_(User.role == "donor_acceptor", User.role == None))
    if only_available:
        query = query.filter(User.is_available == True)
    if recipient_blood_group and recipient_blood_group.strip().upper() != "ALL":
        query = query.filter(User.blood_group.in_(get_compatible_donor_types(recipient_blood_group)))
    if locality and locality.strip():
        term = f"%{locality.strip()}%"
        query = query.filter(or_(User.locality.ilike(term), User.city.ilike(term), User.state.ilike(term)))

    has_coords = isinstance(lat, (int, float)) and isinstance(lng, (int, float)) and (lat != 0.0 or lng != 0.0)
    results = []
    for donor in query.all():
        dist = None
        has_donor_coords = donor.latitude is not None and donor.longitude is not None and (donor.latitude != 0.0 or donor.longitude != 0.0)
        if has_coords and has_donor_coords:
            dist = haversine_distance(lat, lng, donor.latitude, donor.longitude)
            if radius_km is not None and dist > radius_km: continue
        elif has_coords and radius_km is not None and not has_donor_coords:
            continue
        results.append((donor, dist))

    if has_coords:
        results.sort(key=lambda x: (x[1] if x[1] is not None else 9999.0))
    return results
