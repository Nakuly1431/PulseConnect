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
