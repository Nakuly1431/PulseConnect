import re
from typing import Tuple

# Regex matching Indian mobile numbers:
# Optional +91, 91, or 0, followed by 10 digits starting with 6, 7, 8, or 9
INDIAN_MOBILE_REGEX = re.compile(r"^(?:\+91|91|0)?([6-9]\d{9})$")

def validate_indian_phone(phone: str) -> Tuple[bool, str, str]:
    """
    Validates whether a phone string conforms to Indian mobile numbering standards (TRAI / DoT).
    
    Returns:
        (is_valid, standardized_e164, error_message)
        where standardized_e164 is in format '+91XXXXXXXXXX' when valid.
    """
    if not phone or not str(phone).strip():
        return False, "", "Phone number is required."
    
    # Strip spaces, hyphens, parentheses, and dots
    cleaned = re.sub(r"[\s\-\(\)\.]", "", str(phone).strip())
    
    # Check for non-numeric characters except leading +
    if cleaned.startswith("+"):
        numeric_part = cleaned[1:]
    else:
        numeric_part = cleaned
        
    if not numeric_part.isdigit():
        return False, cleaned, "Phone number must contain digits only."
        
    match = INDIAN_MOBILE_REGEX.match(cleaned)
    if not match:
        digits_only = re.sub(r"\D", "", cleaned)
        if len(digits_only) < 10:
            return False, cleaned, f"Phone number is too short ({len(digits_only)}/10 digits)."
        if len(digits_only) == 10 and digits_only[0] not in "6789":
            return False, cleaned, f"Indian mobile numbers must start with 6, 7, 8, or 9 (starts with '{digits_only[0]}')."
        return False, cleaned, "Invalid Indian mobile number format. Expected 10 digits starting with 6, 7, 8, or 9."
        
    ten_digit = match.group(1)
    standardized = f"+91{ten_digit}"
    return True, standardized, ""

def standardize_indian_phone(phone: str) -> str:
    """
    Validates and standardizes an Indian mobile number to E.164 (+91XXXXXXXXXX).
    Raises ValueError if invalid.
    """
    is_valid, standardized, error_msg = validate_indian_phone(phone)
    if not is_valid:
        raise ValueError(error_msg)
    return standardized
