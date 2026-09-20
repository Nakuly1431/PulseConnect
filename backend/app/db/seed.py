import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.emergency import EmergencyRequest
from app.core.security import hash_password

ODISHA_DONORS = [
    {
        "full_name": "Subrat Kumar Jena",
        "email": "subrat.jena@demo.pulseconnect.org",
        "phone_number": "+91 98610 23411",
        "blood_group": "O+",
        "locality": "Patia, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.3551,
        "longitude": 85.8189,
        "total_donations": 6,
        "last_donation_date": datetime.date(2026, 5, 10),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Priyanka Mohapatra",
        "email": "priyanka.mohapatra@demo.pulseconnect.org",
        "phone_number": "+91 94371 88204",
        "blood_group": "O-",
        "locality": "Saheed Nagar, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2882,
        "longitude": 85.8456,
        "total_donations": 4,
        "last_donation_date": datetime.date(2026, 4, 18),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Soumya Ranjan Das",
        "email": "soumya.das@demo.pulseconnect.org",
        "phone_number": "+91 97782 54190",
        "blood_group": "B+",
        "locality": "Chandrasekharpur, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.3245,
        "longitude": 85.8164,
        "total_donations": 8,
        "last_donation_date": datetime.date(2026, 6, 2),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Lipika Patnaik",
        "email": "lipika.patnaik@demo.pulseconnect.org",
        "phone_number": "+91 99370 12985",
        "blood_group": "A+",
        "locality": "Nayapalli, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.3012,
        "longitude": 85.8234,
        "total_donations": 3,
        "last_donation_date": datetime.date(2026, 3, 22),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Debashis Mishra",
        "email": "debashis.mishra@demo.pulseconnect.org",
        "phone_number": "+91 98532 77410",
        "blood_group": "B-",
        "locality": "Jayadev Vihar, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.3041,
        "longitude": 85.8190,
        "total_donations": 5,
        "last_donation_date": datetime.date(2026, 5, 15),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Ananya Sahoo",
        "email": "ananya.sahoo@demo.pulseconnect.org",
        "phone_number": "+91 94398 65231",
        "blood_group": "AB+",
        "locality": "Khandagiri, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2602,
        "longitude": 85.7876,
        "total_donations": 2,
        "last_donation_date": datetime.date(2026, 2, 14),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Rakesh Kumar Rout",
        "email": "rakesh.rout@demo.pulseconnect.org",
        "phone_number": "+91 96924 33187",
        "blood_group": "A-",
        "locality": "Old Town, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2415,
        "longitude": 85.8335,
        "total_donations": 7,
        "last_donation_date": datetime.date(2026, 5, 28),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Smaranika Pradhan",
        "email": "smaranika.pradhan@demo.pulseconnect.org",
        "phone_number": "+91 98614 90123",
        "blood_group": "AB-",
        "locality": "Rasulgarh, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2974,
        "longitude": 85.8643,
        "total_donations": 3,
        "last_donation_date": datetime.date(2026, 4, 5),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Ashish Mohanty",
        "email": "ashish.mohanty@demo.pulseconnect.org",
        "phone_number": "+91 94372 41560",
        "blood_group": "O+",
        "locality": "Jatni, Khordha",
        "city": "Khordha",
        "state": "Odisha",
        "latitude": 20.1633,
        "longitude": 85.7067,
        "total_donations": 9,
        "last_donation_date": datetime.date(2026, 6, 11),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Biswajit Nayak",
        "email": "biswajit.nayak@demo.pulseconnect.org",
        "phone_number": "+91 97761 28904",
        "blood_group": "B+",
        "locality": "Khurda Town, Khordha",
        "city": "Khordha",
        "state": "Odisha",
        "latitude": 20.1812,
        "longitude": 85.6214,
        "total_donations": 4,
        "last_donation_date": datetime.date(2026, 3, 30),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Tapasi Barik",
        "email": "tapasi.barik@demo.pulseconnect.org",
        "phone_number": "+91 99388 56120",
        "blood_group": "O-",
        "locality": "Mancheswar, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.3189,
        "longitude": 85.8521,
        "total_donations": 5,
        "last_donation_date": datetime.date(2026, 5, 4),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Pradeep Kumar Behera",
        "email": "pradeep.behera@demo.pulseconnect.org",
        "phone_number": "+91 98539 10455",
        "blood_group": "A+",
        "locality": "Baramunda, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2789,
        "longitude": 85.7954,
        "total_donations": 6,
        "last_donation_date": datetime.date(2026, 6, 8),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Monali Samantaray",
        "email": "monali.samantaray@demo.pulseconnect.org",
        "phone_number": "+91 94380 77341",
        "blood_group": "B+",
        "locality": "Unit-9, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2814,
        "longitude": 85.8378,
        "total_donations": 3,
        "last_donation_date": datetime.date(2026, 4, 12),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Satya Narayan Tripathy",
        "email": "satya.tripathy@demo.pulseconnect.org",
        "phone_number": "+91 96921 68430",
        "blood_group": "O+",
        "locality": "Sailashree Vihar, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.3341,
        "longitude": 85.8112,
        "total_donations": 11,
        "last_donation_date": datetime.date(2026, 5, 19),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Madhusmita Senapati",
        "email": "madhusmita.senapati@demo.pulseconnect.org",
        "phone_number": "+91 98612 35890",
        "blood_group": "A-",
        "locality": "Ghatikia, Khandagiri, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2645,
        "longitude": 85.7721,
        "total_donations": 4,
        "last_donation_date": datetime.date(2026, 3, 15),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Chandan Sekhar Panda",
        "email": "chandan.panda@demo.pulseconnect.org",
        "phone_number": "+91 94374 81299",
        "blood_group": "B-",
        "locality": "Kalinga Nagar, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2512,
        "longitude": 85.7589,
        "total_donations": 5,
        "last_donation_date": datetime.date(2026, 5, 25),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Sweta Snigdha Ray",
        "email": "sweta.ray@demo.pulseconnect.org",
        "phone_number": "+91 97775 42318",
        "blood_group": "O+",
        "locality": "Sundarpada, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2241,
        "longitude": 85.8178,
        "total_donations": 2,
        "last_donation_date": datetime.date(2026, 2, 28),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Deepak Kumar Sethi",
        "email": "deepak.sethi@demo.pulseconnect.org",
        "phone_number": "+91 99374 91024",
        "blood_group": "AB+",
        "locality": "Info City, Patia, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.3589,
        "longitude": 85.8115,
        "total_donations": 7,
        "last_donation_date": datetime.date(2026, 6, 1),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Jayashree Biswal",
        "email": "jayashree.biswal@demo.pulseconnect.org",
        "phone_number": "+91 98533 60719",
        "blood_group": "A+",
        "locality": "Bhubaneswar Station Road, Khordha",
        "city": "Khordha",
        "state": "Odisha",
        "latitude": 20.1923,
        "longitude": 85.6421,
        "total_donations": 4,
        "last_donation_date": datetime.date(2026, 4, 20),
        "is_available": True,
        "is_verified": True
    },
    {
        "full_name": "Manas Ranjan Mallick",
        "email": "manas.mallick@demo.pulseconnect.org",
        "phone_number": "+91 94391 24873",
        "blood_group": "O-",
        "locality": "Dumuduma, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2489,
        "longitude": 85.7923,
        "total_donations": 8,
        "last_donation_date": datetime.date(2026, 5, 30),
        "is_available": True,
        "is_verified": True
    }
]

ODISHA_EMERGENCIES = [
    {
        "patient_name": "Rajeshwar Patnaik",
        "blood_group": "B+",
        "units_needed": 2,
        "component_type": "Whole Blood",
        "hospital_name": "AIIMS Bhubaneswar",
        "hospital_locality": "Sijua, Patrapada, Bhubaneswar",
        "latitude": 20.2412,
        "longitude": 85.7725,
        "urgency_level": "Immediate",
        "contact_person": "Dr. Prasant Rout (ICU Coordinator)",
        "contact_phone": "+91 94370 11223",
        "status": "Active",
        "posted_by_verified_hospital": True
    },
    {
        "patient_name": "Sanghamitra Das",
        "blood_group": "O-",
        "units_needed": 1,
        "component_type": "Whole Blood",
        "hospital_name": "Apollo Hospitals Bhubaneswar",
        "hospital_locality": "Sainik School Road, Bhubaneswar",
        "latitude": 20.3082,
        "longitude": 85.8321,
        "urgency_level": "Immediate",
        "contact_person": "Debendra Das",
        "contact_phone": "+91 98611 44556",
        "status": "Active",
        "posted_by_verified_hospital": True
    },
    {
        "patient_name": "Bikash Kumar Nayak",
        "blood_group": "A+",
        "units_needed": 3,
        "component_type": "Platelets",
        "hospital_name": "KIMS Hospital (KIIT Campus)",
        "hospital_locality": "Patia, Bhubaneswar",
        "latitude": 20.3524,
        "longitude": 85.8172,
        "urgency_level": "Within 6 Hours",
        "contact_person": "Satyajit Nayak",
        "contact_phone": "+91 97780 77889",
        "status": "Active",
        "posted_by_verified_hospital": True
    }
]

def seed_database(db: Session):
    """
    Populates 20 verified volunteer donors and active medical emergencies
    specifically from Odisha (Bhubaneswar and Khordha) for demo and production readiness.
    """
    existing_count = db.query(User).filter(User.email.like("%@demo.pulseconnect.org")).count()
    if existing_count >= 20:
        return

    default_pw_hash = hash_password("demo12345")

    # 1. Seed 20 Odisha Donors
    for donor_info in ODISHA_DONORS:
        existing = db.query(User).filter(User.email == donor_info["email"]).first()
        if not existing:
            new_user = User(
                full_name=donor_info["full_name"],
                email=donor_info["email"],
                password_hash=default_pw_hash,
                phone_number=donor_info["phone_number"],
                blood_group=donor_info["blood_group"],
                locality=donor_info["locality"],
                city=donor_info["city"],
                state=donor_info["state"],
                latitude=donor_info["latitude"],
                longitude=donor_info["longitude"],
                total_donations=donor_info["total_donations"],
                last_donation_date=donor_info["last_donation_date"],
                is_available=donor_info["is_available"],
                is_verified=donor_info["is_verified"],
                role="donor_acceptor"
            )
            db.add(new_user)
    
    # 2. Seed Admin & Hospital if not present
    admin_user = db.query(User).filter(User.email == "admin@pulseconnect.org").first()
    if not admin_user:
        db.add(User(
            full_name="PulseConnect Odisha Admin",
            email="admin@pulseconnect.org",
            password_hash=hash_password("admin123"),
            phone_number="+91 94370 00001",
            blood_group="O+",
            locality="Master Canteen, Bhubaneswar",
            city="Bhubaneswar",
            state="Odisha",
            role="admin",
            is_verified=True,
            is_available=True
        ))

    db.commit()

    # 3. Seed Odisha Active Emergencies
    for em_info in ODISHA_EMERGENCIES:
        existing_em = db.query(EmergencyRequest).filter(
            EmergencyRequest.patient_name == em_info["patient_name"],
            EmergencyRequest.status == "Active"
        ).first()
        if not existing_em:
            new_em = EmergencyRequest(
                patient_name=em_info["patient_name"],
                blood_group=em_info["blood_group"],
                units_needed=em_info["units_needed"],
                component_type=em_info["component_type"],
                hospital_name=em_info["hospital_name"],
                hospital_locality=em_info["hospital_locality"],
                latitude=em_info["latitude"],
                longitude=em_info["longitude"],
                urgency_level=em_info["urgency_level"],
                contact_person=em_info["contact_person"],
                contact_phone=em_info["contact_phone"],
                status="Active",
                posted_by_verified_hospital=em_info["posted_by_verified_hospital"]
            )
            db.add(new_em)

    db.commit()
