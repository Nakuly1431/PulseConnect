# PulseConnect - Blood Donor Connect Platform

Emergency Blood Donor Matching & SOS Broadcasting Platform.

---

## Quick Start / How to Execute

To run the application, open two terminal windows (one for backend, one for frontend).

### 1. Terminal 1: Run the Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python run.py
```

- **Backend API URL:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- The SQLite database (`pulseconnect.db`) and initial sample donor data are created and seeded automatically on first launch.

---

### 2. Terminal 2: Run the Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

> **Note for Windows PowerShell users:** If you encounter `npm.ps1 cannot be loaded because running scripts is disabled`, run:
> ```powershell
> npm.cmd run dev
> ```
> or run:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> npm run dev
> ```

- **Frontend Application URL:** [http://localhost:5173](http://localhost:5173)

---

### 3. Testing Backend Logic

To verify compatibility matrix rules and geolocation search:
```bash
cd backend
python test_backend.py
```
