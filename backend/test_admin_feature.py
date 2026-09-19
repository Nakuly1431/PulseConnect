import sys
from pathlib import Path
from datetime import datetime, timezone
from fastapi import HTTPException

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.models.user import User
from app.models.emergency import EmergencyRequest
from app.api.admin import (
    get_current_admin,
    get_pending_verifications,
    verify_user,
    get_all_requests,
    delete_request,
    get_admin_stats
)
from app.core.security import hash_password

# Use in-memory SQLite for tests
test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)

def run_tests():
    db = TestingSessionLocal()
    
    # 1. Create a non-admin user (donor_acceptor)
    donor = User(
        full_name="Regular Donor",
        email="donor@example.com",
        password_hash=hash_password("password123"),
        phone_number="+919876543210",
        blood_group="O+",
        locality="Indiranagar",
        role="donor_acceptor",
        is_verified=True,
        is_available=True
    )
    # 2. Create an unverified user
    unverified = User(
        full_name="Pending User",
        email="pending@example.com",
        password_hash=hash_password("password123"),
        phone_number="+919876543211",
        blood_group="A+",
        locality="Koramangala",
        role="donor_acceptor",
        is_verified=False,
        is_available=True
    )
    # 3. Create an admin user
    admin = User(
        full_name="Admin Chief",
        email="admin@example.com",
        password_hash=hash_password("password123"),
        phone_number="+919876543212",
        blood_group="AB+",
        locality="MG Road",
        role="admin",
        is_verified=True,
        is_available=True
    )
    # 4. Create a test emergency request
    test_req = EmergencyRequest(
        patient_name="Fraud SOS Test",
        blood_group="B+",
        units_needed=2,
        component_type="Whole Blood",
        hospital_name="Fake Clinic",
        hospital_locality="Outer Ring Rd",
        urgency_level="Immediate",
        contact_person="Fake Person",
        contact_phone="+919000000000",
        status="Active"
    )

    db.add_all([donor, unverified, admin, test_req])
    db.commit()
    db.refresh(donor)
    db.refresh(unverified)
    db.refresh(admin)
    db.refresh(test_req)

    print("\n--- Test 1: Unauthenticated access check ---")
    try:
        get_current_admin(current_user=None)
        assert False, "Should have raised 401"
    except HTTPException as e:
        assert e.status_code == 401
        print("[PASS] Unauthenticated access blocked with 401")

    print("\n--- Test 2: Non-admin access check ---")
    try:
        get_current_admin(current_user=donor)
        assert False, "Should have raised 403"
    except HTTPException as e:
        assert e.status_code == 403
        print(f"[PASS] Non-admin access blocked with 403: {e.detail}")

    print("\n--- Test 3: Admin access check ---")
    authorized_admin = get_current_admin(current_user=admin)
    assert authorized_admin.role == "admin"
    print("[PASS] Admin successfully authenticated with role 'admin'")

    print("\n--- Test 4: Pending verifications query ---")
    pending = get_pending_verifications(db=db, admin=authorized_admin)
    assert len(pending) == 1
    assert pending[0].email == "pending@example.com"
    assert pending[0].is_verified is False
    print(f"[PASS] Retrieved {len(pending)} pending user: {pending[0].full_name}")

    print("\n--- Test 5: Verify user endpoint ---")
    verified_res = verify_user(user_id=unverified.id, db=db, admin=authorized_admin)
    assert verified_res.is_verified is True
    # Check in DB
    db.refresh(unverified)
    assert unverified.is_verified is True
    # Pending list should now be empty
    pending_now = get_pending_verifications(db=db, admin=authorized_admin)
    assert len(pending_now) == 0
    print("[PASS] User successfully verified, pending queue is now 0")

    print("\n--- Test 6: Get all requests with filter ---")
    active_reqs = get_all_requests(status_filter="Active", db=db, admin=authorized_admin)
    assert len(active_reqs) == 1
    assert active_reqs[0].patient_name == "Fraud SOS Test"
    fulfilled_reqs = get_all_requests(status_filter="Fulfilled", db=db, admin=authorized_admin)
    assert len(fulfilled_reqs) == 0
    print(f"[PASS] Filtered requests working properly")

    print("\n--- Test 7: Delete fraudulent request ---")
    del_res = delete_request(request_id=test_req.id, db=db, admin=authorized_admin)
    assert del_res["status"] == "success"
    # Ensure deleted in DB
    in_db = db.query(EmergencyRequest).filter(EmergencyRequest.id == test_req.id).first()
    assert in_db is None
    print(f"[PASS] Request deleted: {del_res['message']}")

    print("\n--- Test 8: Admin stats ---")
    stats = get_admin_stats(db=db, admin=authorized_admin)
    assert stats["total_users"] == 3
    assert stats["admins_count"] == 1
    assert stats["donors_count"] == 2
    assert stats["total_emergencies"] == 0
    print(f"[PASS] Admin stats: {stats}")

    print("\n=== ALL ADMIN FEATURE TESTS PASSED SUCCESSFULLY! ===")
    db.close()

if __name__ == "__main__":
    run_tests()
