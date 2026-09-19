import sys
from pathlib import Path
from datetime import date, datetime, timedelta

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.models.user import User
from app.models.emergency import EmergencyRequest
from app.models.notification import Notification
from app.core.security import hash_password
from app.core.compatibility import get_compatible_donor_types, haversine_distance
from app.api.notifications import get_my_notifications, mark_notification_read, mark_all_notifications_read
from app.api.sos import create_sos_emergency

# Use in-memory SQLite for tests
test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)

import asyncio

def run_tests():
    db = TestingSessionLocal()

    # 1. Setup donors:
    # Donor A: O- (Universal donor, compatible with all), available, located in Bengaluru center (12.9716, 77.5946)
    donor_a = User(
        full_name="Universal Donor O-",
        email="o_minus@example.com",
        password_hash=hash_password("pw123"),
        phone_number="+919876543201",
        blood_group="O-",
        locality="Bengaluru Center",
        latitude=12.9716,
        longitude=77.5946,
        is_available=True,
        is_verified=True,
        role="donor_acceptor"
    )

    # Donor B: B+ (Compatible with B+ emergency), available, located 5km away (Indiranagar 12.9783, 77.6408)
    donor_b = User(
        full_name="Compatible Donor B+",
        email="b_plus@example.com",
        password_hash=hash_password("pw123"),
        phone_number="+919876543202",
        blood_group="B+",
        locality="Indiranagar",
        latitude=12.9783,
        longitude=77.6408,
        is_available=True,
        is_verified=True,
        role="donor_acceptor"
    )

    # Donor C: AB+ (Incompatible donor for B+ patient), available, nearby
    donor_c = User(
        full_name="Incompatible Donor AB+",
        email="ab_plus@example.com",
        password_hash=hash_password("pw123"),
        phone_number="+919876543203",
        blood_group="AB+",
        locality="Koramangala",
        latitude=12.9352,
        longitude=77.6245,
        is_available=True,
        is_verified=True,
        role="donor_acceptor"
    )

    # Donor D: B+ but in 90-day cooldown (not eligible)
    donor_d = User(
        full_name="Cooldown Donor B+",
        email="cooldown@example.com",
        password_hash=hash_password("pw123"),
        phone_number="+919876543204",
        blood_group="B+",
        locality="Indiranagar",
        latitude=12.9783,
        longitude=77.6408,
        is_available=True,
        is_verified=True,
        cooldown_until=date.today() + timedelta(days=45),
        role="donor_acceptor"
    )

    # Donor E: B+ but 100km away (Mysuru ~12.2958, 76.6394) - outside 15km radius
    donor_e = User(
        full_name="Far Away Donor B+",
        email="faraway@example.com",
        password_hash=hash_password("pw123"),
        phone_number="+919876543205",
        blood_group="B+",
        locality="Mysuru",
        latitude=12.2958,
        longitude=76.6394,
        is_available=True,
        is_verified=True,
        role="donor_acceptor"
    )

    db.add_all([donor_a, donor_b, donor_c, donor_d, donor_e])
    db.commit()
    for d in [donor_a, donor_b, donor_c, donor_d, donor_e]:
        db.refresh(d)

    print("\n--- Test 1: Create SOS Emergency for B+ patient in Bengaluru ---")
    # B+ recipient can receive from B+, B-, O+, O-.
    # Donor A (O-, 5km away): Compatible -> SHOULD receive notification
    # Donor B (B+, 0km away from hospital): Compatible -> SHOULD receive notification
    # Donor C (AB+): Incompatible -> Should NOT receive notification
    # Donor D (B+, in cooldown): In cooldown -> Should NOT receive notification
    # Donor E (B+, 140km away): Out of radius -> Should NOT receive notification

    async def create_sos():
        return await create_sos_emergency(
            patient_name="Priya Sharma",
            blood_group="B+",
            units_needed=2,
            component_type="Whole Blood",
            hospital_name="Manipal Hospital",
            hospital_locality="HAL Old Airport Rd",
            latitude=12.9592,
            longitude=77.6548,
            urgency_level="Immediate",
            contact_person="Rohan Sharma",
            contact_phone="+919111122222",
            verification_slip=None,
            db=db
        )

    emergency = asyncio.run(create_sos())
    assert emergency.id is not None
    print(f"[PASS] Emergency #{emergency.id} created successfully")

    print("\n--- Test 2: Verify notifications in DB ---")
    all_notifs = db.query(Notification).filter(Notification.request_id == emergency.id).all()
    notified_user_ids = {n.user_id for n in all_notifs}
    print(f"Total notifications dispatched: {len(all_notifs)}")
    print(f"Notified user IDs: {notified_user_ids}")

    # Donor A (O-) and Donor B (B+) must be notified
    assert donor_a.id in notified_user_ids, "Universal donor O- should have received notification"
    assert donor_b.id in notified_user_ids, "Compatible nearby B+ donor should have received notification"

    # Donor C (AB+), Donor D (cooldown), Donor E (far away) must NOT be notified
    assert donor_c.id not in notified_user_ids, "Incompatible AB+ donor must not be notified"
    assert donor_d.id not in notified_user_ids, "Donor in cooldown must not be notified"
    assert donor_e.id not in notified_user_ids, "Far away donor beyond radius must not be notified"
    print("[PASS] Compatibility, cooldown, and proximity matching logic verified accurately!")

    print("\n--- Test 3: Check GET /api/notifications/me for Donor B ---")
    b_notifs = get_my_notifications(current_user=donor_b, db=db)
    assert b_notifs.unread_count == 1
    assert len(b_notifs.notifications) == 1
    assert b_notifs.notifications[0].is_read is False
    assert "Priya Sharma" in b_notifs.notifications[0].message
    print(f"[PASS] Donor B received unread notification: {b_notifs.notifications[0].message}")

    print("\n--- Test 4: Mark single notification as read ---")
    notif_id = b_notifs.notifications[0].id
    read_res = mark_notification_read(notification_id=notif_id, current_user=donor_b, db=db)
    assert read_res.is_read is True
    # Verify unread count is now 0
    b_notifs_after = get_my_notifications(current_user=donor_b, db=db)
    assert b_notifs_after.unread_count == 0
    print("[PASS] Single notification marked as read successfully")

    print("\n--- Test 5: Mark all notifications as read for Donor A ---")
    a_notifs = get_my_notifications(current_user=donor_a, db=db)
    assert a_notifs.unread_count == 1
    mark_all_notifications_read(current_user=donor_a, db=db)
    a_notifs_after = get_my_notifications(current_user=donor_a, db=db)
    assert a_notifs_after.unread_count == 0
    print("[PASS] Mark all notifications as read verified successfully")

    print("\n=== ALL NOTIFICATION FEATURE TESTS PASSED! ===")
    db.close()

if __name__ == "__main__":
    run_tests()
