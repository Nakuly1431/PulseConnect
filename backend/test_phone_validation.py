import sys
from app.core.phone import validate_indian_phone, standardize_indian_phone
from app.schemas.user import UserCreate
from app.schemas.emergency import EmergencyCreate, SOSSendOTPRequest
from pydantic import ValidationError

def run_tests():
    print("==========================================")
    print("Testing Indian Mobile Number Verification")
    print("==========================================")

    # 1. Test Valid Phone Formats
    valid_cases = [
        ("9876543210", "+919876543210"),
        ("8765432109", "+918765432109"),
        ("7654321098", "+917654321098"),
        ("6543210987", "+916543210987"),
        ("+919876543210", "+919876543210"),
        ("+91 98765 43210", "+919876543210"),
        ("+91-98765-43210", "+919876543210"),
        ("09876543210", "+919876543210"),
        ("919876543210", "+919876543210"),
        ("  +91 (98765) 43210  ", "+919876543210")
    ]

    for raw, expected in valid_cases:
        is_valid, standardized, err = validate_indian_phone(raw)
        assert is_valid, f"Failed for valid number: {raw}, err: {err}"
        assert standardized == expected, f"Expected {expected}, got {standardized}"
    print(f"[PASS] All {len(valid_cases)} valid Indian mobile number formats verified!")

    # 2. Test Invalid Phone Numbers (Should be rejected)
    invalid_cases = [
        "5555555555",       # Starts with 5 (invalid in India)
        "1234567890",       # Starts with 1
        "0123456789",       # Local starts with 1
        "98765",            # Too short (<10 digits)
        "987654321099",     # Too long (>10 digits)
        "98765abcde",       # Alphanumeric
        "",                 # Empty
        "   ",              # Whitespace
        "+14155552671",     # US phone number
        "+447911123456"     # UK phone number
    ]

    for raw in invalid_cases:
        is_valid, standardized, err = validate_indian_phone(raw)
        assert not is_valid, f"Expected invalid for '{raw}', but passed with: {standardized}"
    print(f"[PASS] All {len(invalid_cases)} invalid number formats correctly rejected!")

    # 3. Test Pydantic Schemas Validation
    # UserCreate Schema
    try:
        user = UserCreate(
            full_name="Rohan Varma",
            email="rohan@example.com",
            phone_number="9845012345",
            blood_group="O+",
            password="securepassword123"
        )
        assert user.phone_number == "+919845012345"
        print("[PASS] UserCreate correctly normalized 10-digit phone to +919845012345")
    except Exception as e:
        print(f"[FAIL] UserCreate valid phone failed: {e}")
        sys.exit(1)

    # Reject Invalid Phone in UserCreate
    try:
        UserCreate(
            full_name="Fake User",
            email="fake@example.com",
            phone_number="5555555555",
            blood_group="O+",
            password="securepassword123"
        )
        print("[FAIL] UserCreate allowed invalid number starting with 5!")
        sys.exit(1)
    except ValidationError:
        print("[PASS] UserCreate correctly rejected phone number starting with 5")

    # EmergencyCreate Schema
    try:
        emg = EmergencyCreate(
            patient_name="Pooja Sen",
            blood_group="B+",
            units_needed=2,
            hospital_name="Manipal Hospital",
            hospital_locality="HAL Airport Rd",
            contact_person="Dr. Sen",
            contact_phone="+91 97780 12345"
        )
        assert emg.contact_phone == "+919778012345"
        print("[PASS] EmergencyCreate normalized contact_phone to +919778012345")
    except Exception as e:
        print(f"[FAIL] EmergencyCreate valid phone failed: {e}")
        sys.exit(1)

    try:
        EmergencyCreate(
            patient_name="Fake Patient",
            blood_group="B+",
            units_needed=2,
            hospital_name="Fake Hospital",
            hospital_locality="Fake Locality",
            contact_person="Nobody",
            contact_phone="12345"
        )
        print("[FAIL] EmergencyCreate allowed short phone number!")
        sys.exit(1)
    except ValidationError:
        print("[PASS] EmergencyCreate correctly rejected short phone number")

    # SOSSendOTPRequest Schema
    try:
        otp_req = SOSSendOTPRequest(phone_number="09845012345")
        assert otp_req.phone_number == "+919845012345"
        print("[PASS] SOSSendOTPRequest standardized trunk 0 phone to +919845012345")
    except Exception as e:
        print(f"[FAIL] SOSSendOTPRequest valid phone failed: {e}")
        sys.exit(1)

    try:
        SOSSendOTPRequest(phone_number="+1234567890")
        print("[FAIL] SOSSendOTPRequest allowed non-Indian phone number!")
        sys.exit(1)
    except ValidationError:
        print("[PASS] SOSSendOTPRequest correctly rejected non-Indian phone number")

    print("\n==========================================")
    print("ALL INDIAN PHONE VALIDATION TESTS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
