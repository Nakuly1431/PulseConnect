# 🩸 PulseConnect — Emergency Blood Donor Connect Platform

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

> **PulseConnect** is a hyper-local, privacy-centric emergency blood donor matching and SOS broadcasting platform built to eliminate critical delays in blood donation across India.

---

## 📖 Detailed Project Inventory

Looking for an exhaustive breakdown of every tool, library, package, service, and algorithm used?
👉 **Check out the separate documentation:** **[docs/LIST_OF_THINGS_USED.md](./docs/LIST_OF_THINGS_USED.md)**

---

## 🌟 Key Features

- 🚨 **Rapid Emergency SOS Broadcasting**: 3-step urgent blood request wizard with auto-GPS coordinate detection, blood group picker, and OTP verification.
- 📍 **Hyper-Local Geolocation Matching**: Uses the **Haversine Distance Formula** to discover and alert matching voluntary donors within a customizable radius (5 km to 50 km).
- 🩸 **Medical Blood Compatibility Engine**: Enforces strict biological compatibility rules across all 8 human blood groups ($O^-, O^+, A^-, A^+, B^-, B^+, AB^-, AB^+$) for Whole Blood, Packed Red Blood Cells (RBC), Platelets, and Plasma.
- 🔒 **Privacy-First Masked Contact Reveal**: Donor phone numbers remain masked (`+91 98*** ***11`) until a donor explicitly accepts a donation request, protecting donor privacy.
- 🇮🇳 **Pan-India Donor Network**: Pre-seeded with **720+ realistic verified donors** spanning all **28 States and 8 Union Territories** of India.
- ⏱️ **Live Request Status Tracker**: Real-time status tracking for emergency requests with stage-by-stage timeline progression and secret edit token authorization.
- 🛡️ **Role-Based Portals**:
  - **Donor Portal**: Accept/decline requests, toggle availability, log donation history, and submit ID verification certificates.
  - **Acceptor / Patient Portal**: Monitor active requests, find compatible donors, and initiate direct donation requests.
  - **Admin Moderation Dashboard**: Full user directory management, hospital verification approval, emergency moderation, and system analytics.
- 📱 **Universal Device Responsiveness**: Optimized for mobile phones, tablets, laptops, and desktops. Includes Apple iOS notch and home indicator safe-area support (`env(safe-area-inset-bottom)`).
- 🌗 **Adaptive Dark & Light Mode**: Tailored visual experience with seamless theme toggling and persistent local storage preferences.

---

## 🏗️ System Architecture

```text
┌───────────────────────────────────────────────────────────────────┐
│                    PulseConnect Frontend                          │
│        (React 19 + Vite 6 + Tailwind CSS v4 + Lucide Icons)        │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│   │  SOS Modal   │  │ Donor Search │  │ Request Status Tracker│   │
│   └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘   │
└──────────┼─────────────────┼──────────────────────┼───────────────┘
           │                 │                      │
           ▼                 ▼                      ▼
┌───────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend Engine                       │
│    (Python 3.10+ • Uvicorn • SQLAlchemy 2.0 • Pydantic v2 • JWT)  │
│                                                                   │
│  • Blood Compatibility Engine       • Haversine Distance Filter   │
│  • Role-Based Access Control (RBAC) • Phone Verification & Masking│
│  • SOS Broadcast & Token Security   • Multi-role Admin Operations │
└──────────────────┬──────────────────────────┬─────────────────────┘
                   │                          │
                   ▼                          ▼
       ┌───────────────────────┐  ┌───────────────────────┐
       │   SQLite Database     │  │  External Integrations│
       │  (pulseconnect.db)    │  │ • Fast2SMS / Twilio   │
       │  720+ Seeded Donors   │  │ • Google Firebase Auth│
       │  Active Emergencies   │  │ • HTML5 GPS / OpenSt. │
       └───────────────────────┘  └───────────────────────┘
```

---

## 🚀 Quick Start / How to Run

To run the entire application, open two separate terminal windows (one for the backend, one for the frontend).

### Prerequisites
- **Python:** Version `3.10` or higher ([python.org](https://www.python.org/))
- **Node.js:** Version `18.0.0` or higher ([nodejs.org](https://nodejs.org/))

---

### Step 1: Start the Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python run.py
```

- **Backend API URL:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc UI:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- *Note:* The SQLite database (`pulseconnect.db`) is automatically initialized and seeded with 720+ Pan-India donors on first startup.

---

### Step 2: Start the Frontend (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```

> **Tip for Windows PowerShell Users:**
> If script execution is disabled on your system (`npm.ps1 cannot be loaded`), run:
> ```powershell
> npm.cmd run dev
> ```
> *or* bypass execution policy for your current session:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> npm run dev
> ```

- **Frontend Application URL:** [http://localhost:5173](http://localhost:5173)

---

## 🔑 Pre-Seeded Default Accounts

For testing all features without signing up from scratch, use these pre-seeded credentials:

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@pulseconnect.org` | `admin123` | Full access to Admin Moderation Dashboard, user verification, deletion, and platform metrics. |
| **Verified Donor** | `subrat.jena@demo.pulseconnect.org` | *(Self-service or direct view)* | Verified O+ donor with existing donation history. |

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```env
DATABASE_URL=sqlite:///./pulseconnect.db
SECRET_KEY=pulseconnect-super-secure-emergency-jwt-secret-key-2026
NOTIFICATION_RADIUS_KM=15.0

# Optional: Real SMS Gateways (Fast2SMS or Twilio)
FAST2SMS_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_PHONE=
```

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api

# Optional: Google Firebase Phone Authentication
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 🧪 Automated Testing

Automated test scripts verify medical logic, security boundaries, and API integrity:

```bash
cd backend

# Test core compatibility matrix and geolocation radius
python test_backend.py

# Test admin authentication, role guards, and moderation
python test_admin_feature.py

# Test medical blood compatibility guard edge cases
python test_blood_compatibility_guard.py

# Test hospital onboarding and verification certificate flow
python test_hospital_feature.py

# Test notifications and broadcast alert lifecycle
python test_notifications_feature.py

# Test Indian mobile phone formatting and validation
python test_phone_validation.py

# Test SOS creation, OTP verification, and edit tokens
python test_sos_otp_and_edit.py
```

---

## 📁 Repository Structure

```text
Blood Donor connect/
├── README.md                      # Main project documentation
├── docs/                          # Project specifications & technical details
│   ├── README.md                  # Documentation index
│   └── LIST_OF_THINGS_USED.md     # Complete list of technologies & tools
├── backend/                       # FastAPI Backend
│   ├── run.py                     # Server entrypoint
│   ├── requirements.txt           # Python dependencies
│   ├── pulseconnect.db            # SQLite database
│   ├── test_*.py                  # Automated test suite scripts
│   └── app/
│       ├── api/                   # API route handlers (auth, donors, sos, admin...)
│       ├── core/                  # Security, compatibility rules, config, phone utils
│       ├── db/                    # Session management & Pan-India seeders
│       ├── models/                # SQLAlchemy database entities
│       └── schemas/               # Pydantic request/response schemas
└── frontend/                      # React 19 Frontend
    ├── package.json               # Node.js dependencies & scripts
    ├── vite.config.js             # Vite configuration
    ├── index.html                 # HTML entrypoint with iOS safe area meta
    └── src/
        ├── components/            # 19 modular React components
        ├── context/               # AuthContext & ThemeContext
        ├── services/              # Axios API client & Firebase config
        └── utils/                 # Blood compatibility & Indian geo datasets
```

---

## 📄 License & Attribution

Built for saving lives during critical medical emergencies. Designed and developed with modern web standards and medical safety protocols.
