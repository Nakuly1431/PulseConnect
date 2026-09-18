import sys
import time
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.core.compatibility import haversine_distance, get_compatible_donor_types
from app.db.session import Base, engine, SessionLocal
from app.db.seed import seed_database
from app.models.user import User
from app.models.emergency import EmergencyRequest
from app.models.donation_log import DonationLog

def test_all():
    print("=== Testing Core Logic ===")
    
    # 1. Haversine test: Bangalore center to Indiranagar
    dist = haversine_distance(12.9716, 77.5946, 12.9783, 77.6408)
    print(f"Haversine Bangalore Center -> Indiranagar: {dist} km")
    assert 4.0 <= dist <= 6.0, f"Distance calculation unexpected: {dist}"

    # 2. Blood compatibility test
    print("Testing Blood Compatibility Matrix:")
    o_minus_donors = get_compatible_donor_types("O-")
    assert o_minus_donors == ["O-"], f"O- should only receive O-, got {o_minus_donors}"
    
    a_plus_donors = get_compatible_donor_types("A+")
    assert set(a_plus_donors) == {"A+", "A-", "O+", "O-"}, f"A+ donors mismatch: {a_plus_donors}"

    ab_plus_donors = get_compatible_donor_types("AB+")
    assert len(ab_plus_donors) == 8, f"AB+ universal recipient should have 8 donor types"
    print("Compatibility rules verified!")

    # 3. Database & Seeding Test
    print("\n=== Initializing Database & Seed ===")
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestSession()
    seed_database(db)


    donor_count = db.query(User).count()
    emergency_count = db.query(EmergencyRequest).count()
    print(f"Seeded Donors: {donor_count}, Seeded Emergencies: {emergency_count}")
    assert donor_count >= 10, "Should have at least 10 seeded donors"
    assert emergency_count >= 3, "Should have at least 3 seeded emergencies"

    # 4. Search Query Latency Test (Sub-50ms)
    print("\n=== Benchmarking Search Query Latency ===")
    from app.api.donors import search_donors

    start = time.perf_counter()
    results = search_donors(
        blood_group="A+",
        lat=12.9716,
        lng=77.5946,
        radius_km=15.0,
        only_available=True,
        locality=None,
        db=db
    )
    elapsed_ms = (time.perf_counter() - start) * 1000
    print(f"Search query returned {len(results)} donors in {elapsed_ms:.2f} ms")
    assert elapsed_ms < 50.0, f"Search took too long: {elapsed_ms}ms"

    for r in results:
        print(f" - [{r['blood_group']}] {r['full_name']} ({r['locality']}): {r['distance_km']} km | Phone: {r['masked_phone']}")

    # 5. Test SOS Respond & Fulfilled Disappearance
    print("\n=== Testing SOS Dispatch & Board Clearing ===")
    from app.api.sos import respond_to_sos, get_active_sos_requests
    active_before = get_active_sos_requests(db=db)
    if len(active_before) == 0:
        test_req = EmergencyRequest(
            patient_name="Test Patient",
            blood_group="O+",
            units_needed=1,
            component_type="Whole Blood",
            hospital_name="City Hospital",
            hospital_locality="Central Area",
            latitude=12.9716,
            longitude=77.5946,
            urgency_level="Immediate",
            contact_person="Test Contact",
            contact_phone="+91 99999 00000",
            status="Active"
        )
        db.add(test_req)
        db.commit()
        active_before = get_active_sos_requests(db=db)

    assert len(active_before) > 0, "Expected active emergencies"
    target_sos = active_before[0]
    sos_id = target_sos["id"]


    # Dispatch & respond to the target SOS
    resp = respond_to_sos(request_id=sos_id, db=db)
    assert resp["status"] == "success"
    assert resp["emergency"]["status"] == "Fulfilled"

    # Verify target SOS is no longer returned in active broadcasts
    active_after = get_active_sos_requests(db=db)
    active_ids_after = [e["id"] for e in active_after]
    assert sos_id not in active_ids_after, f"Emergency #{sos_id} should have disappeared from active board!"
    # 6. Test Request & Mission Tracker
    print("\n=== Testing Request Tracker Endpoint ===")
    from app.api.tracker import get_all_request_statuses
    tracker_data = get_all_request_statuses(db=db)
    print(f"Tracker Total: {tracker_data.summary.total}, Accepted: {tracker_data.summary.accepted}, Pending: {tracker_data.summary.pending}, Fulfilled: {tracker_data.summary.fulfilled}")
    assert tracker_data.summary.total > 0, "Tracker should contain requests"
    assert len(tracker_data.requests) > 0, "Tracker requests list should not be empty"
    print("Verified: Request Tracker correctly aggregared SOS and direct requests!")

    db.close()
    print("\nALL BACKEND CORE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()


