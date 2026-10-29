from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.api import auth, donors, sos, stats, tracker, admin, notifications

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    migrations = [
        "ALTER TABLE users ADD COLUMN city VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN state VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN role VARCHAR(30) DEFAULT 'donor_acceptor'",
        "UPDATE users SET role = 'donor_acceptor' WHERE role IS NULL",
        "ALTER TABLE users ADD COLUMN hospital_name VARCHAR(150)",
        "ALTER TABLE users ADD COLUMN license_number VARCHAR(100)",
        "ALTER TABLE emergency_requests ADD COLUMN posted_by_verified_hospital BOOLEAN DEFAULT 0",
        "ALTER TABLE emergency_requests ADD COLUMN user_id INTEGER",
        "ALTER TABLE emergency_requests ADD COLUMN edit_token VARCHAR(64)"
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass

    db = SessionLocal()
    try:
        from app.db.seed import seed_database
        seed_database(db)
    except Exception as e:
        print(f"Seeding notice: {e}")
    finally:
        db.close()
    yield

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, description="Emergency Blood Donor Matching & SOS Broadcasting Platform", lifespan=lifespan)

cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]
if hasattr(settings, "BACKEND_CORS_ORIGINS"):
    cors_origins.extend([o for o in settings.BACKEND_CORS_ORIGINS if o != "*" and o not in cors_origins])

app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_origin_regex=r"https?://.*", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

for router in [auth.router, donors.router, sos.router, stats.router, tracker.router, admin.router, notifications.router]:
    app.include_router(router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"platform": settings.PROJECT_NAME, "status": "operational", "golden_hour_ready": True, "docs_url": "/docs"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "PulseConnect API"}
