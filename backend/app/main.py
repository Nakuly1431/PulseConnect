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
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)
    
    # Safe SQLite column migration for city and state
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN city VARCHAR(100)"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN state VARCHAR(100)"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(30) DEFAULT 'donor_acceptor'"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("UPDATE users SET role = 'donor_acceptor' WHERE role IS NULL"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN hospital_name VARCHAR(150)"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN license_number VARCHAR(100)"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE emergency_requests ADD COLUMN posted_by_verified_hospital BOOLEAN DEFAULT 0"))
            conn.commit()
        except Exception:
            pass

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Emergency Blood Donor Matching & SOS Broadcasting Platform",
    lifespan=lifespan
)

# CORS Middleware - allows localhost dev servers and Vercel deployments
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if hasattr(settings, "BACKEND_CORS_ORIGINS"):
    for origin in settings.BACKEND_CORS_ORIGINS:
        if origin != "*" and origin not in cors_origins:
            cors_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for medical verification uploads
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(donors.router, prefix=settings.API_V1_STR)
app.include_router(sos.router, prefix=settings.API_V1_STR)
app.include_router(stats.router, prefix=settings.API_V1_STR)
app.include_router(tracker.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "status": "operational",
        "golden_hour_ready": True,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "PulseConnect API"}
