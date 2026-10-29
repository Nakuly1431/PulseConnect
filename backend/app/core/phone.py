import re
from typing import Tuple

INDIAN_MOBILE_REGEX = re.compile(r"^(?:\+91|91|0)?([6-9]\d{9})$")

def validate_indian_phone(phone: str) -> Tuple[bool, str, str]:
    if not phone or not str(phone).strip():
        return False, "", "Phone number is required."
    cleaned = re.sub(r"[\s\-\(\)\.]", "", str(phone).strip())
    numeric_part = cleaned[1:] if cleaned.startswith("+") else cleaned
    if not numeric_part.isdigit():
        return False, cleaned, "Phone number must contain digits only."
    match = INDIAN_MOBILE_REGEX.match(cleaned)
    if not match:
        digits = re.sub(r"\D", "", cleaned)
        if len(digits) < 10:
            return False, cleaned, f"Phone number is too short ({len(digits)}/10 digits)."
        if len(digits) == 10 and digits[0] not in "6789":
            return False, cleaned, f"Indian mobile numbers must start with 6, 7, 8, or 9 (starts with '{digits[0]}')."
        return False, cleaned, "Invalid Indian mobile number format. Expected 10 digits starting with 6, 7, 8, or 9."
    return True, f"+91{match.group(1)}", ""

def standardize_indian_phone(phone: str) -> str:
    is_valid, standardized, error_msg = validate_indian_phone(phone)
    if not is_valid: raise ValueError(error_msg)
    return standardized
