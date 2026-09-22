# 📋 List of Things Used in PulseConnect

This document provides a comprehensive and exhaustive inventory of all technologies, libraries, frameworks, tools, algorithms, services, datasets, and design patterns utilized in the **PulseConnect (Blood Donor Connect)** platform.

---

## 📑 Table of Contents
1. [Core Programming Languages & Runtimes](#1-core-programming-languages--runtimes)
2. [Frontend Architecture & Frameworks](#2-frontend-architecture--frameworks)
3. [Frontend Libraries & Packages](#3-frontend-libraries--packages)
4. [Backend Frameworks & Core Packages](#4-backend-frameworks--core-packages)
5. [Database & Storage Solutions](#5-database--storage-solutions)
6. [Authentication, Security & Cryptography](#6-authentication-security--cryptography)
7. [External APIs & Third-Party Services](#7-external-apis--third-party-services)
8. [Algorithms & Mathematical Engines](#8-algorithms--mathematical-engines)
9. [Pan-India Datasets & Geographical Data](#9-pan-india-datasets--geographical-data)
10. [Frontend Component Architecture](#10-frontend-component-architecture)
11. [Design System, Styling & UI/UX](#11-design-system-styling--uiux)
12. [State Management & Data Flow](#12-state-management--data-flow)
13. [Testing Suite & Quality Assurance](#13-testing-suite--quality-assurance)
14. [Build, Deployment & DevOps Tooling](#14-build-deployment--devops-tooling)

---

## 1. Core Programming Languages & Runtimes

| Technology | Version / Standard | Purpose in Project |
| :--- | :--- | :--- |
| **Python** | `3.10+` | Powering the asynchronous backend REST API, database ORM models, business logic, compatibility algorithms, and automated test suites. |
| **JavaScript (ES6+)** | `ES2022+ / ESM` | Client-side application logic, UI components, state management, asynchronous API communications, and browser integration. |
| **Node.js** | `v18.0.0+` | Development runtime environment for executing frontend build scripts, Vite bundler, and package manager workflows. |
| **HTML5** | Semantic HTML5 | Document structure, accessibility roles (`role="dialog"`, `aria-label`), mobile viewport configuration (`viewport-fit=cover`), and media embedding. |
| **CSS3** | Modern CSS | Styling, CSS custom properties (variables), backdrop filters (`blur`), keyframe animations, and Apple iOS safe area insets. |
| **SQL** | SQLite Dialect | Relational schema definitions, indexed queries, joins, and transactional data persistence. |
| **JSON** | RFC 8259 | Data exchange format for REST APIs, static datasets (Pan-India donor directory, state coordinates), and configuration files. |

---

## 2. Frontend Architecture & Frameworks

| Technology | Version | Description & Rationale |
| :--- | :--- | :--- |
| **React** | `^19.1.0` | Core UI library utilizing modern component-based architecture, hooks (`useState`, `useEffect`, `useContext`, `useMemo`, `useCallback`), and efficient virtual DOM rendering. |
| **React DOM** | `^19.1.0` | Provides DOM-specific methods for rendering React components into the browser DOM. |
| **Vite** | `^6.3.5` | Next-generation frontend build tool providing instant Hot Module Replacement (HMR), lightning-fast ES module dev server, and optimized Rollup production builds. |
| **@vitejs/plugin-react** | `^4.4.1` | Official Vite plugin for React, providing Fast Refresh via Babel transformation. |
| **Tailwind CSS** | `^4.3.3` | Modern utility-first CSS framework providing responsive design classes, arbitrary values, and modern color palette. |
| **@tailwindcss/postcss** | `^4.3.3` | Tailwind CSS v4 PostCSS plugin integration for streamlined compilation. |
| **PostCSS** | `^8.5.28` | CSS transformation pipeline tool for processing Tailwind CSS utilities and autoprefixing rules. |
| **Autoprefixer** | `^10.6.0` | PostCSS plugin that parses CSS and adds vendor prefixes to rules (e.g., `-webkit-`, `-moz-`) for cross-browser compatibility. |

---

## 3. Frontend Libraries & Packages

| Library | Version | Role in Platform |
| :--- | :--- | :--- |
| **Axios** | `^1.20.0` | Promise-based HTTP client for API requests, configured with base URL management, timeout handling, and request/response interceptors. |
| **Lucide React** | `^1.45.0` | Beautiful, consistent icon pack providing 50+ SVG medical, navigation, status, and alert icons (`Droplets`, `Heart`, `ShieldCheck`, `AlertCircle`, `MapPin`, `Phone`, `Activity`, `Clock`, `User`, `Moon`, `Sun`, etc.). |
| **Firebase** | `^12.19.0` | Google Firebase client SDK providing Firebase Authentication, Phone OTP verification with Invisible reCAPTCHA, and cloud readiness. |

---

## 4. Backend Frameworks & Core Packages

| Package | Version | Purpose & Rationale |
| :--- | :--- | :--- |
| **FastAPI** | `>=0.110.0` | High-performance, asynchronous Python web framework built on Starlette and Pydantic, providing automatic OpenAPI/Swagger documentation, dependency injection, and data validation. |
| **Uvicorn** | `>=0.28.0` | Lightning-fast ASGI web server implementation powering the FastAPI application with uvloop support. |
| **SQLAlchemy** | `>=2.0.0` | Python SQL toolkit and Object Relational Mapper (ORM), providing clean declarative database models, query building, session management, and migrations. |
| **Pydantic** | `>=2.6.0` | Data validation and settings management using Python type hints, ensuring strict request payload and response schema contracts. |
| **Pydantic Settings** | `>=2.0.0` | Environment variable parsing and type-safe configuration loading from `.env` files. |
| **PyJWT** | `>=2.8.0` | Implementation of JSON Web Tokens (JWT) for user authentication, token generation, signature validation, and claims expiration handling. |
| **Bcrypt** | `>=4.1.0` | Cryptographic password-hashing algorithm utilizing salted Blowfish hashing for user password storage. |
| **Python-Multipart** | `>=0.0.9` | Streaming multipart/form-data parser for file uploads (medical certificates, government donor identity verification proofs). |
| **Requests** | `>=2.31.0` | Synchronous HTTP library used for outbound API calls to SMS delivery gateways (Fast2SMS, Twilio). |
| **Email-Validator** | `>=2.0.0` | Robust email address validation checking syntax, deliverability, and domain requirements according to RFC standards. |
| **Alembic** | `>=1.13.0` | Database schema migration tool for tracking schema version changes alongside SQLAlchemy. |

---

## 5. Database & Storage Solutions

| Component | Technology | Details |
| :--- | :--- | :--- |
| **Relational Database** | **SQLite 3** (`pulseconnect.db`) | Zero-configuration, serverless, transactional SQL database engine ideal for rapid local deployment, testing, and edge operation. |
| **ORM Layer** | **SQLAlchemy Declarative Base** | Structured data models: `User`, `EmergencyRequest`, `DonationLog`, `NotificationRecord`. |
| **Session Management** | **Scoped Sessions (`SessionLocal`)** | Database connection pooling, automated session cleanup via FastAPI dependency injection (`get_db`). |
| **File Storage** | **Local File System (`backend/uploads/`)** | Secure document upload repository for donor ID proofs and hospital verification certificates. |

---

## 6. Authentication, Security & Cryptography

| Security Feature | Implementation | Description |
| :--- | :--- | :--- |
| **Password Hashing** | `bcrypt.hashpw` & `bcrypt.checkpw` | Irreversible salted hashing of user credentials before database storage. |
| **Bearer Token Auth** | **JWT (JSON Web Tokens)** | Signed tokens with HS256 algorithm, payload expiration timestamps (`exp`), and user subject IDs. |
| **Role-Based Access Control (RBAC)** | Custom FastAPI Dependencies | Strict privilege tiers: `donor_acceptor`, `hospital`, and `admin` with dedicated permissions. |
| **SOS Edit Token Security** | Cryptographically Random UUID4 | Secret authorization token issued upon SOS creation, allowing the creator to edit/cancel requests without requiring an active account. |
| **Donor Privacy Protection** | Algorithmic Phone Masking | Phone numbers are masked by default (`+91 98*** ***11`) and only revealed after a donor accepts a direct match request. |
| **CORS Middleware** | `fastapi.middleware.cors` | Cross-Origin Resource Sharing configured to allow frontend development servers (`localhost:5173`, `localhost:3000`) and production deployment origins. |

---

## 7. External APIs & Third-Party Services

| Service / API | Integration Type | Functionality |
| :--- | :--- | :--- |
| **Google Firebase Phone Auth** | Client-side SDK (`firebase/auth`) | Real SMS OTP delivery to mobile devices, backed by Google's Invisible reCAPTCHA verification (10,000 free SMS/month). |
| **Fast2SMS API** | Outbound HTTP POST (`requests`) | Direct Indian SMS gateway delivering instant transactional OTPs without complex DLT registration overhead. |
| **Twilio SMS REST API** | Outbound HTTP POST (`requests`) | Global SMS provider fallback for international and enterprise notifications. |
| **HTML5 Geolocation API** | Browser Native (`navigator.geolocation`) | Automatically detects donor/requester latitude and longitude with precision accuracy. |
| **OpenStreetMap / Nominatim** | Web API & Geolocation | Provides location queries and coordinate-based regional identification for hospital landmarks. |

---

## 8. Algorithms & Mathematical Engines

### A. Medical Blood Compatibility Matrix Engine
Implemented in both backend (`app/core/compatibility.py`) and frontend (`utils/bloodCompatibility.js`):
- Computes compatibility across all 8 major human blood types: $O^-$, $O^+$, $A^-$, $A^+$, $B^-$, $B^+$, $AB^-$, $AB^+$.
- Supports product-specific medical rules:
  - **Whole Blood / Packed Red Blood Cells (RBC):** Universal Donor is $O^-$; Universal Recipient is $AB^+$.
  - **Platelets (PRP/SDP):** Platelet cross-compatibility logic.
  - **Fresh Frozen Plasma (FFP):** Reverse plasma compatibility (Universal Donor is $AB$; Universal Recipient is $O$).

### B. Haversine Distance Geolocation Formula
Calculates the shortest great-circle distance between two points on the Earth's surface given their coordinates:
$$d = 2r \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
- Radius of Earth: $r \approx 6371\text{ km}$.
- Used to discover donors within custom radii (5 km, 15 km, 25 km, 50 km, or state-wide).

### C. Emergency Priority Scoring Engine
Categorizes urgent medical requests based on patient conditions and requested timelines:
- **Critical (Tier 1):** Immediate ICU/OT requirement (< 2 hours). High-visibility pulsing red badges and real-time broadcasts.
- **Urgent (Tier 2):** Surgical or scheduled transfusion (< 6-12 hours).
- **Scheduled (Tier 3):** Thalassemia or elective replacement needs.

---

## 9. Pan-India Datasets & Geographical Data

| Dataset | Location | Scope |
| :--- | :--- | :--- |
| **Pan-India Donor Directory** | `backend/app/db/pan_india_donors.py` & `frontend/src/services/panIndiaDonors.json` | 720+ realistic donor profiles distributed across all 28 States and 8 Union Territories of India, complete with real latitude/longitude, realistic local names, Indian phone numbers, blood groups, and donation histories. |
| **Indian States & Cities Coordinates** | `frontend/src/utils/indiaLocations.js` | Comprehensive dictionary of all 36 Indian states/UTs with major district centers, hospitals, and center coordinates. |
| **Odisha Active Medical Seed** | `backend/app/db/seed.py` | Dedicated real-world seed data for Odisha hospitals (AIIMS Bhubaneswar, SCB Cuttack, KIMS, Capital Hospital). |

---

## 10. Frontend Component Architecture

The frontend is modularized into 19 specialized React components:

| Component | File Path | Functional Description |
| :--- | :--- | :--- |
| **Navbar** | `components/Navbar.jsx` | Responsive navigation with desktop header, mobile bottom nav bar, theme toggle, and live notification counters. |
| **SOSModal** | `components/SOSModal.jsx` | 3-step emergency SOS creation wizard with GPS auto-detection, blood picker, patient details, and OTP verification. |
| **RequestStatusTracker** | `components/RequestStatusTracker.jsx` | Live tracker for emergency requests with timeline stages, donor responses, and secure edit/cancel actions. |
| **DonorSearch** | `components/DonorSearch.jsx` | Multi-filter search engine for donors by blood group, component type, state, city, and GPS proximity radius. |
| **DonorCard** | `components/DonorCard.jsx` | Interactive donor profile card with availability status, compatibility badge, donation count, and privacy-protected contact reveal. |
| **ActiveSOSBoard** | `components/ActiveSOSBoard.jsx` | Real-time board displaying active urgent blood requests across the hospital network. |
| **AdminPage** | `components/AdminPage.jsx` | Administrative moderation control center with user filtering, donor verification, request deletion, and metrics. |
| **DirectBloodRequestModal** | `components/DirectBloodRequestModal.jsx` | Modal allowing patients to send a targeted donation request directly to an individual donor. |
| **DonorVerificationModal** | `components/DonorVerificationModal.jsx` | Document upload modal for donors to submit government ID proofs and blood certificates for verification. |
| **ProfilePage** | `components/ProfilePage.jsx` | Comprehensive user profile view showing personal information, donation history logs, and availability toggles. |
| **ProfileDrawer** | `components/ProfileDrawer.jsx` | Slide-over drawer providing quick access to profile statistics, active requests, and account settings. |
| **AuthPage** | `components/AuthPage.jsx` | Unified authentication interface supporting email/password login, registration, and phone OTP verification. |
| **AcceptorPage** | `components/AcceptorPage.jsx` | Tailored portal for blood seekers to manage active requests, monitor responses, and search matching donors. |
| **DonorPage** | `components/DonorPage.jsx` | Dedicated dashboard for blood donors to accept incoming requests, update availability, and log completed donations. |
| **EmergencyBanner** | `components/EmergencyBanner.jsx` | High-priority ticker banner alerting visitors of active local critical blood emergencies. |
| **HeroStats** | `components/HeroStats.jsx` | Dynamic statistics banner displaying registered donors, lives saved, active requests, and participating hospitals. |
| **ThemeToggle** | `components/ThemeToggle.jsx` | Toggle switch allowing instant switching between Light Mode and Dark Mode. |
| **AnimatedBackground** | `components/AnimatedBackground.jsx` | Ambient background particle and mesh effects creating an immersive medical aesthetic. |
| **ErrorBoundary** | `components/ErrorBoundary.jsx` | React error boundary capturing unhandled JavaScript runtime exceptions to prevent full UI crashes. |

---

## 11. Design System, Styling & UI/UX

| Design Element | Technical Implementation |
| :--- | :--- |
| **Typography** | `Plus Jakarta Sans`, system-ui, -apple-system, sans-serif loaded via Google Fonts. |
| **Color Palette** | **Crimson Red** (`#DC2626`, `#B91C1C` - Blood Theme), **Slate** (`#0F172A`, `#1E293B` - Background & Surface), **Emerald** (`#059669` - Success & Verification), **Amber** (`#D97706` - Urgency Warnings). |
| **Glassmorphism** | CSS `backdrop-filter: blur(12px)` paired with translucent backgrounds (`bg-white/95`, `bg-slate-900/95`). |
| **Dark / Light Theme** | Custom CSS root variables (`[data-theme="dark"]` and `[data-theme="light"]`) with persistent storage in `localStorage`. |
| **Responsive Grid System** | Tailwind breakpoints: Mobile (`<640px`), Tablet (`sm` 640px, `md` 768px), Desktop (`lg` 1024px, `xl` 1280px). |
| **Apple iOS Safe Area** | Native support for iPhone notch and home indicator bar via `env(safe-area-inset-bottom)` and `viewport-fit=cover`. |
| **Touch Optimization** | `min-height: 44px` touch targets for mobile navigation buttons and modal triggers. |

---

## 12. State Management & Data Flow

| Pattern | Implementation | Details |
| :--- | :--- | :--- |
| **Global User State** | `AuthContext.jsx` | Exposes `currentUser`, `token`, `login()`, `logout()`, `updateProfile()` across all components. |
| **Global Theme State** | `ThemeContext.jsx` | Exposes `theme` ('light'/'dark'), `toggleTheme()` with system preference detection (`prefers-color-scheme`). |
| **Local Component State** | `useState`, `useReducer` | Form inputs, wizard step progression, modal visibility, filter selections. |
| **Derived State & Caching** | `useMemo`, `useCallback` | Filtered donor search results, compatible donor cross-checks, memoized callback functions. |

---

## 13. Testing Suite & Quality Assurance

| Test File | Framework / Tool | What is Tested |
| :--- | :--- | :--- |
| `test_backend.py` | Python Script / Requests | Blood compatibility logic, Haversine proximity calculations, donor search endpoints. |
| `test_admin_feature.py` | Python Script | Admin authentication, user moderation, account deletion, verification status toggles. |
| `test_blood_compatibility_guard.py` | Python Script | Medical cross-match compatibility rules for whole blood, plasma, and platelets across all blood groups. |
| `test_hospital_feature.py` | Python Script | Hospital user onboarding, verification certificate upload, verified hospital emergency tags. |
| `test_notifications_feature.py` | Python Script | Notification creation, unread counts, mark-as-read endpoints, and broadcast dispatch. |
| `test_phone_validation.py` | Python Script | Indian mobile number formatting, prefix validations (+91, 10-digit formats), error handling. |
| `test_sos_otp_and_edit.py` | Python Script | SOS request lifecycle, OTP generation/validation, secure edit token verification, request resolution. |
| `eslint.config.js` | ESLint 9 | Code quality, React hooks dependency validation, syntax standard compliance. |

---

## 14. Build, Deployment & DevOps Tooling

| Tool | Purpose |
| :--- | :--- |
| **Vite CLI** | `vite build` produces an ultra-optimized static bundle in `dist/` with CSS code-splitting and asset hashing. |
| **Vercel** | `vercel.json` provides rewrite configurations for single-page application routing (`rewrites: [{"source": "/(.*)", "destination": "/"}]`). |
| **Environment Configuration** | Structured `.env.example` templates for both frontend and backend environments. |
| **Git & GitHub** | Source code version control, feature branch workflow, and commit history tracking. |
