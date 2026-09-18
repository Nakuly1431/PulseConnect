import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "PulseConnect (Blood Donor Connect)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database: SQLite by default for zero-friction setup, easily overrides via DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/pulseconnect.db")
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pulseconnect-super-secure-emergency-jwt-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Uploads
    UPLOAD_DIR: Path = UPLOAD_DIR

    class Config:
        case_sensitive = True

settings = Settings()
