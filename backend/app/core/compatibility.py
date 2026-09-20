import math

# Blood compatibility matrix: Key is recipient blood group, value is list of compatible donor groups
# Red Blood Cell compatibility rule
BLOOD_COMPATIBILITY: dict[str, list[str]] = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],  # Universal recipient
    "AB-": ["AB-", "A-", "B-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"],  # Universal donor, can only receive O-
}

def get_compatible_donor_types(recipient_group: str) -> list[str]:
    """Returns list of donor blood types compatible with the specified recipient group."""
    normalized = recipient_group.strip().upper().replace(" ", "+")
    return BLOOD_COMPATIBILITY.get(normalized, [normalized])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great circle distance between two points on the earth in kilometers
    using the Haversine formula.
    """
    R = 6371.0  # Earth radius in kilometers

    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return round(distance, 2)

def mask_phone_number(phone: str) -> str:
    """
    Masks middle digits of a phone number for privacy.
    Example: '+91 9876543210' -> '+91 ••••• 3210'
    """
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) <= 4:
        return "****"
    prefix = "+91" if "+91" in phone else digits[:2]
    suffix = digits[-4:]
    return f"{prefix} ••••• {suffix}"

def find_eligible_donors(
    db,
    recipient_blood_group: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float | None = None,
    only_available: bool = True,
    locality: str | None = None,
    require_donor_role: bool = True
):
    """
    Unified, single source of truth for donor matching across search and SOS notification dispatch.
    Applies:
    1. Role filter (excludes hospital/admin accounts if require_donor_role is True)
    2. Availability check (is_available == True)
    3. Biological cooldown check (cooldown_until is None or <= today)
    4. ABO/Rh Red Blood Cell compatibility matrix
    5. Locality/City/State text filter
    6. Haversine distance proximity and radius limit filtering
    """
    from datetime import date
    from sqlalchemy import or_
    from app.models.user import User

    today = date.today()
    query = db.query(User)

    if require_donor_role:
        query = query.filter(or_(User.role == "donor_acceptor", User.role == None))

    if only_available:
        query = query.filter(User.is_available == True)

    # Filter out donors who are actively in 90-day cooldown
    query = query.filter(
        (User.cooldown_until == None) | (User.cooldown_until <= today)
    )

    # Blood group compatibility filter
    if recipient_blood_group and recipient_blood_group.strip().upper() != "ALL":
        target_group = recipient_blood_group.strip().upper().replace(" ", "+")
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

    results = []
    has_coords = (
        isinstance(lat, (int, float)) and
        isinstance(lng, (int, float)) and
        (lat != 0.0 or lng != 0.0)
    )

    for donor in donors:
        dist = None
        has_donor_coords = (
            donor.latitude is not None and
            donor.longitude is not None and
            (donor.latitude != 0.0 or donor.longitude != 0.0)
        )
        if has_coords and has_donor_coords:
            dist = haversine_distance(lat, lng, donor.latitude, donor.longitude)
            if radius_km is not None and dist > radius_km:
                continue
        elif has_coords and radius_km is not None and not has_donor_coords:
            # If coordinates and strict radius are enforced, exclude donors with unknown locations
            continue

        results.append((donor, dist))

    if has_coords:
        results.sort(key=lambda x: (x[1] if x[1] is not None else 9999.0))

    return results
