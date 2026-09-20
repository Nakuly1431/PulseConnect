import asyncio
from fastapi import HTTPException
from app.db.session import SessionLocal, Base, engine
from app.models.emergency import EmergencyRequest
from app.models.user import User
from app.api.sos import send_sos_otp, create_sos_emergency, update_sos_emergency, fulfill_sos
from app.schemas.emergency import SOSSendOTPRequest, EmergencyUpdate

def run_tests():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        phone = "+919876543210"
        
        # 1. Test Send OTP
        print("\n--- Test 1: Send Phone OTP ---")
        otp_resp = send_sos_otp(SOSSendOTPRequest(phone_number=phone))
        assert otp_resp.status == "success"
        assert otp_resp.debug_otp is not None
        assert len(otp_resp.debug_otp) == 6
        sent_otp = otp_resp.debug_otp
        print(f"[PASS] OTP generated successfully: {sent_otp}")

        # 2. Test Create SOS with invalid OTP (should fail)
        print("\n--- Test 2: Create SOS with Invalid OTP ---")
        async def try_create_invalid_otp():
            return await create_sos_emergency(
                patient_name="Stressed Patient",
                blood_group="B-",
                units_needed=1,
                component_type="Whole Blood",
                hospital_name="Apollo Hospital",
                hospital_locality="Jayanagar",
                latitude=12.9250,
                longitude=77.5938,
                urgency_level="Immediate",
                contact_person="Ravi Kumar",
                contact_phone=phone,
                otp_code="000000",
                db=db
            )

        failed_as_expected = False
        try:
            asyncio.run(try_create_invalid_otp())
        except HTTPException as exc:
            assert exc.status_code == 400
            failed_as_expected = True
        assert failed_as_expected, "Expected invalid OTP to be rejected"
        print("[PASS] Invalid OTP was correctly rejected with 400 Bad Request")

        # 3. Test Create SOS with valid OTP (should succeed and return edit_token)
        print("\n--- Test 3: Create SOS with Valid OTP ---")
        async def try_create_valid_otp():
            return await create_sos_emergency(
                patient_name="Stressed Patient",
                blood_group="B-",  # Mistyped under stress, meant B+
                units_needed=1,    # Mistyped under stress, meant 3
                component_type="Whole Blood",
                hospital_name="Apollo Hospital",
                hospital_locality="Jayanagar",
                latitude=12.9250,
                longitude=77.5938,
                urgency_level="Immediate",
                contact_person="Ravi Kumar",
                contact_phone=phone,
                otp_code=sent_otp,
                db=db
            )

        emergency = asyncio.run(try_create_valid_otp())
        assert emergency.id is not None
        assert emergency.edit_token is not None
        assert len(emergency.edit_token) == 32
        assert emergency.blood_group == "B-"
        assert emergency.units_needed == 1
        edit_token = emergency.edit_token
        print(f"[PASS] Emergency #{emergency.id} created with secure edit_token: {edit_token}")

        # 4. Test Edit SOS with invalid edit_token (should fail 403)
        print("\n--- Test 4: Edit SOS with Invalid Token ---")
        invalid_token_blocked = False
        try:
            update_sos_emergency(
                request_id=emergency.id,
                payload=EmergencyUpdate(
                    edit_token="wrong-fake-token",
                    blood_group="B+",
                    units_needed=3
                ),
                db=db
            )
        except HTTPException as exc:
            assert exc.status_code == 403
            invalid_token_blocked = True
        assert invalid_token_blocked, "Expected edit with wrong token to fail 403"
        print("[PASS] Edit with invalid token was correctly forbidden (403)")

        # 5. Test Edit SOS with valid edit_token (Correction under stress)
        print("\n--- Test 5: Edit SOS with Valid Token (Typo Correction) ---")
        updated = update_sos_emergency(
            request_id=emergency.id,
            payload=EmergencyUpdate(
                edit_token=edit_token,
                blood_group="B+",
                units_needed=3,
                component_type="Platelets",
                hospital_name="Apollo Hospital (ICU Bed 402)",
                contact_person="Ravi Kumar (Brother)"
            ),
            db=db
        )
        assert updated.blood_group == "B+"
        assert updated.units_needed == 3
        assert updated.component_type == "Platelets"
        assert updated.hospital_name == "Apollo Hospital (ICU Bed 402)"
        assert updated.contact_person == "Ravi Kumar (Brother)"
        print("[PASS] Emergency details successfully corrected using edit_token!")

        # 6. Test Cannot edit Fulfilled emergency
        print("\n--- Test 6: Cannot Edit Fulfilled Emergency ---")
        fulfill_sos(request_id=emergency.id, db=db)
        fulfilled_blocked = False
        try:
            update_sos_emergency(
                request_id=emergency.id,
                payload=EmergencyUpdate(
                    edit_token=edit_token,
                    units_needed=4
                ),
                db=db
            )
        except HTTPException as exc:
            assert exc.status_code == 400
            assert "Fulfilled" in exc.detail
            fulfilled_blocked = True
        assert fulfilled_blocked, "Expected edit on fulfilled emergency to fail 400"
        print("[PASS] Cannot edit fulfilled emergency rule enforced (400)")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
    print("\n==========================================")
    print("ALL SOS OTP & EDIT TESTS PASSED! (6/6)")
    print("==========================================")
