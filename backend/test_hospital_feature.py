import sys
from pathlib import Path
from datetime import datetime, timezone

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.models.user import User
from app.models.emergency import EmergencyRequest
from app.core.security import hash_password
from app.schemas.user import UserCreate
from app.api.auth import register_user
from app.api.admin import get_current_admin, get_pending_verifications, verify_user
from app.api.sos import create_sos_emergency, get_active_sos_requests
from fastapi import Response
import asyncio

# Use in-memory SQLite for tests
test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)

class MockResponse:
    def set_cookie(self, *args, **kwargs):
        pass

def run_tests():
    db = TestingSessionLocal()

    # Create admin user
    admin = User(
        full_name="Admin Director",
        email="director@example.com",
        password_hash=hash_password("adminpass"),
        phone_number="+919800000001",
        blood_group="O+",
        locality="Health HQ",
        role="admin",
        is_verified=True,
        is_available=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    print("\n--- Test 1: Register as Hospital / Clinic ---")
    hosp_in = UserCreate(
        full_name="Dr. Arvind (Chief Medical Officer)",
        email="apollo.blr@example.com",
        password="securehospitalpass123",
        phone_number="+919876599999",
        blood_group="O+", # Generic default
        locality="Bannerghatta Road",
        city="Bengaluru",
        state="Karnataka",
        role="hospital",
        hospital_name="Apollo Hospitals Bannerghatta",
        license_number="KA-MED-REG-44892"
    )
    res_token = register_user(user_in=hosp_in, response=MockResponse(), db=db)
    new_hosp_user = res_token.user

    assert new_hosp_user.role == "hospital"
    assert new_hosp_user.hospital_name == "Apollo Hospitals Bannerghatta"
    assert new_hosp_user.license_number == "KA-MED-REG-44892"
    assert new_hosp_user.is_verified is False, "Hospital accounts MUST default to is_verified=False!"
    print(f"[PASS] Hospital '{new_hosp_user.hospital_name}' registered with is_verified=False")

    print("\n--- Test 2: Hospital appears in Admin Pending Verification queue ---")
    admin_user = get_current_admin(current_user=admin)
    pending_list = get_pending_verifications(db=db, admin=admin_user)
    assert any(u.id == new_hosp_user.id for u in pending_list)
    print(f"[PASS] Hospital '{new_hosp_user.hospital_name}' found in admin pending verifications queue")

    print("\n--- Test 3: Unverified Hospital SOS request is NOT hospital-verified ---")
    hosp_db_user = db.query(User).filter(User.id == new_hosp_user.id).first()

    async def post_unverified_sos():
        return await create_sos_emergency(
            patient_name="Emergency Patient 1",
            blood_group="A+",
            units_needed=1,
            component_type="Platelets",
            hospital_name="Apollo Hospitals",
            hospital_locality="Bannerghatta Rd",
            contact_person="Staff Nurse",
            contact_phone="+919876599999",
            current_user=hosp_db_user,
            db=db
        )

    unverified_emergency = asyncio.run(post_unverified_sos())
    assert unverified_emergency.posted_by_verified_hospital is False
    print("[PASS] SOS broadcast from unverified hospital account is NOT tagged as hospital verified")

    print("\n--- Test 4: Admin verifies Hospital account ---")
    verified_hosp = verify_user(user_id=hosp_db_user.id, db=db, admin=admin_user)
    assert verified_hosp.is_verified is True
    db.refresh(hosp_db_user)
    assert hosp_db_user.is_verified is True
    print("[PASS] Hospital account successfully approved and verified by admin")

    print("\n--- Test 5: Verified Hospital SOS request is flagged as Hospital Verified ---")
    async def post_verified_sos():
        return await create_sos_emergency(
            patient_name="Critical ICU Patient",
            blood_group="O+",
            units_needed=3,
            component_type="Whole Blood",
            hospital_name="Apollo Hospitals Bannerghatta",
            hospital_locality="Bannerghatta Rd",
            contact_person="Dr. Arvind",
            contact_phone="+919876599999",
            current_user=hosp_db_user,
            db=db
        )

    verified_emergency = asyncio.run(post_verified_sos())
    assert verified_emergency.posted_by_verified_hospital is True
    print(f"[PASS] Emergency #{verified_emergency.id} successfully flagged with posted_by_verified_hospital=True")

    print("\n--- Test 6: Check Active SOS board returns posted_by_verified_hospital flag ---")
    active_board = get_active_sos_requests(db=db)
    verified_on_board = next((e for e in active_board if e["id"] == verified_emergency.id), None)
    assert verified_on_board is not None
    assert verified_on_board["posted_by_verified_hospital"] is True
    print(f"[PASS] Active SOS board correctly returned posted_by_verified_hospital=True")

    print("\n=== ALL HOSPITAL ACCOUNT FEATURE TESTS PASSED! ===")
    db.close()

if __name__ == "__main__":
    run_tests()
