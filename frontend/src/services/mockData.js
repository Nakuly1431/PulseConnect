import PAN_INDIA_DONORS from './panIndiaDonors.json';

// 720 Verified Demo Volunteer Donors across all 36 Indian States and Union Territories (20 per state)
export const MOCK_DONORS = PAN_INDIA_DONORS;

// Active Medical Emergencies from Major Hospitals in Bhubaneswar & Khordha
export const MOCK_EMERGENCIES = [
  {
    id: 201,
    patient_name: "Rajeshwar Patnaik",
    blood_group: "B+",
    units_needed: 2,
    component_type: "Whole Blood",
    hospital_name: "AIIMS Bhubaneswar",
    hospital_locality: "Sijua, Patrapada, Bhubaneswar",
    urgency_level: "Immediate",
    contact_person: "Dr. Prasant Rout (ICU Coordinator)",
    contact_phone: "+91 94370 11223",
    status: "Active",
    posted_by_verified_hospital: true,
    created_at: new Date(Date.now() - 24 * 60000).toISOString()
  },
  {
    id: 202,
    patient_name: "Sanghamitra Das",
    blood_group: "O-",
    units_needed: 1,
    component_type: "Whole Blood",
    hospital_name: "Apollo Hospitals Bhubaneswar",
    hospital_locality: "Sainik School Road, Bhubaneswar",
    urgency_level: "Immediate",
    contact_person: "Debendra Das",
    contact_phone: "+91 98611 44556",
    status: "Active",
    posted_by_verified_hospital: true,
    created_at: new Date(Date.now() - 52 * 60000).toISOString()
  },
  {
    id: 203,
    patient_name: "Bikash Kumar Nayak",
    blood_group: "A+",
    units_needed: 3,
    component_type: "Platelets",
    hospital_name: "KIMS Hospital (KIIT Campus)",
    hospital_locality: "Patia, Bhubaneswar",
    urgency_level: "Within 6 Hours",
    contact_person: "Satyajit Nayak",
    contact_phone: "+91 97780 77889",
    status: "Active",
    posted_by_verified_hospital: true,
    created_at: new Date(Date.now() - 110 * 60000).toISOString()
  }
];

export const MOCK_STATS = {
  total_donors: 720,
  active_ready_donors: 648,
  active_emergencies: 3,
  total_lives_saved: 1420,
  avg_response_time_minutes: 14,
  golden_hour_success_rate: "95.4%"
};

export const MOCK_TRACKER_DATA = {
  summary: {
    total: 3,
    accepted: 2,
    pending: 1,
    fulfilled: 12
  },
  requests: [
    {
      id: 201,
      patient_name: "Rajeshwar Patnaik",
      blood_group: "B+",
      units_needed: 2,
      component_type: "Whole Blood",
      hospital_name: "AIIMS Bhubaneswar",
      hospital_locality: "Sijua, Patrapada, Bhubaneswar",
      urgency_level: "Immediate",
      contact_person: "Dr. Prasant Rout (ICU Coordinator)",
      contact_phone: "+91 94370 11223",
      status: "Active",
      posted_by_verified_hospital: true,
      created_at: new Date(Date.now() - 24 * 60000).toISOString(),
      dispatched_count: 2,
      accepted_donors: [
        { name: "Soumya Ranjan Das", phone: "+91 97782 54190", eta: "15 mins" }
      ]
    },
    {
      id: 202,
      patient_name: "Sanghamitra Das",
      blood_group: "O-",
      units_needed: 1,
      component_type: "Whole Blood",
      hospital_name: "Apollo Hospitals Bhubaneswar",
      hospital_locality: "Sainik School Road, Bhubaneswar",
      urgency_level: "Immediate",
      contact_person: "Debendra Das",
      contact_phone: "+91 98611 44556",
      status: "Active",
      posted_by_verified_hospital: true,
      created_at: new Date(Date.now() - 52 * 60000).toISOString(),
      dispatched_count: 1,
      accepted_donors: [
        { name: "Priyanka Mohapatra", phone: "+91 94371 88204", eta: "18 mins" }
      ]
    }
  ]
};
