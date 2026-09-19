import sys
from datetime import date
from fastapi import HTTPException
from app.db.session import SessionLocal
from app.models.user import User
from app.models.emergency import EmergencyRequest
from app.schemas.emergency import EmergencyRespondRequest
from app.api.sos import respond_to_sos
from app.core.compatibility import get_compatible_donor_types

def run_compatibility_tests():
    db = SessionLocal()
    try:
        # Create test emergency needing B+
        emergency = EmergencyRequest(
            patient_name="Compatibility Test Patient",
            blood_group="B+",
            units_needed=1,
            component_type="Whole Blood",
            hospital_name="City Trauma Care",
            hospital_locality="Indiranagar",
            contact_person="Dr. Rao",
            contact_phone="9876543210",
            status="Active"
        )
        db.add(emergency)
        db.commit()
        db.refresh(emergency)

        # Create incompatible donor (A+)
        incompatible_donor = User(
            full_name="Incompatible Donor",
            email="incompatible_test@pulseconnect.org",
            password_hash="fakehash",
            phone_number="+91 99999 11111",
            blood_group="A+",
            locality="Indiranagar",
            is_available=True,
            is_verified=True
        )
        db.add(incompatible_donor)
        db.commit()
        db.refresh(incompatible_donor)

        # Create compatible donor (O+)
        compatible_donor = User(
            full_name="Compatible Donor",
            email="compatible_test@pulseconnect.org",
            password_hash="fakehash",
            phone_number="+91 99999 22222",
            blood_group="O+",
            locality="Indiranagar",
            is_available=True,
            is_verified=True
        )
        db.add(compatible_donor)
        db.commit()
        db.refresh(compatible_donor)

        print("\n--- Test 1: Incompatible blood response (A+ donor -> B+ patient) ---")
        try:
            respond_to_sos(
                request_id=emergency.id,
                payload=EmergencyRespondRequest(donor_id=incompatible_donor.id),
                db=db
            )
            print("[FAIL] Incompatible donation should have been blocked!")
            sys.exit(1)
        except HTTPException as e:
            if e.status_code == 400 and "Incompatible Blood Group" in e.detail:
                print(f"[PASS] Successfully blocked with 400: {e.detail}")
            else:
                print(f"[FAIL] Unexpected HTTPException: {e.status_code} {e.detail}")
                sys.exit(1)

        print("\n--- Test 2: Compatible blood response (O+ donor -> B+ patient) ---")
        res = respond_to_sos(
            request_id=emergency.id,
            payload=EmergencyRespondRequest(donor_id=compatible_donor.id),
            db=db
        )
        if res.get("status") == "success":
            print(f"[PASS] Successfully accepted compatible donation: {res.get('message')}")
        else:
            print(f"[FAIL] Compatible donation failed: {res}")
            sys.exit(1)

        print("\n=== ALL BLOOD COMPATIBILITY TESTS PASSED! ===")

    finally:
        # Cleanup
        try:
            if 'emergency' in locals() and emergency.id:
                e = db.query(EmergencyRequest).filter(EmergencyRequest.id == emergency.id).first()
                if e:
                    db.delete(e)
            if 'incompatible_donor' in locals() and incompatible_donor.id:
                u1 = db.query(User).filter(User.id == incompatible_donor.id).first()
                if u1:
                    db.delete(u1)
            if 'compatible_donor' in locals() and compatible_donor.id:
                u2 = db.query(User).filter(User.id == compatible_donor.id).first()
                if u2:
                    db.delete(u2)
            db.commit()
        except Exception as cleanup_err:
            print(f"Cleanup error: {cleanup_err}")
        db.close()

if __name__ == "__main__":
    run_compatibility_tests()
