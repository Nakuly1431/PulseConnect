import time
import random
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.user import (
    UserCreate, UserLogin, UserUpdate, UserResponse, Token,
    ForgotPasswordRequest, ResetPasswordRequest
)
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.compatibility import mask_phone_number
from app.core.config import settings
from app.services.sms import send_realtime_sms_otp

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(request: Request, token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User | None:
    jwt_token = request.cookies.get("access_token") or token
    if not jwt_token: return None
    payload = decode_access_token(jwt_token)
    if not payload or not payload.get("sub"): return None
    try:
        return db.query(User).filter(User.id == int(payload["sub"])).first()
    except Exception:
        return None

def serialize_user(user: User) -> UserResponse:
    res = UserResponse.model_validate(user)
    res.masked_phone = mask_phone_number(user.phone_number)
    today = date.today()
    in_cool = bool(user.cooldown_until and user.cooldown_until > today)
    res.is_in_cooldown = in_cool
    res.cooldown_days_remaining = (user.cooldown_until - today).days if in_cool else 0
    return res

def _set_auth_cookie(response: Response | None, token: str, request: Request | None):
    if not response: return
    is_prod = bool(request and not any(l in str(request.base_url) for l in ["localhost", "127.0.0.1"]))
    response.set_cookie(
        key="access_token", value=token, httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="none" if is_prod else "lax", secure=is_prod
    )

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, response: Response = None, request: Request = None, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_in.email.lower()).first():
        raise HTTPException(status_code=400, detail="This email is already registered. Please sign in or use a different email.")
    
    role = user_in.role if user_in.role in ["donor_acceptor", "hospital", "admin"] else "donor_acceptor"
    new_user = User(
        email=user_in.email.lower(), password_hash=hash_password(user_in.password),
        full_name=user_in.full_name, blood_group=user_in.blood_group, phone_number=user_in.phone_number,
        locality=user_in.locality, city=user_in.city, state=user_in.state,
        latitude=user_in.latitude, longitude=user_in.longitude, role=role,
        hospital_name=user_in.hospital_name, license_number=user_in.license_number,
        is_available=True, is_verified=role not in ["hospital", "admin"], total_donations=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if role == "admin":
        for adm in db.query(User).filter(User.role == "admin", User.is_verified == True, User.id != new_user.id).all():
            db.add(Notification(user_id=adm.id, message=f"🔔 New Admin Request: {new_user.full_name} ({new_user.email}) from {new_user.city or 'India'} has applied for Administrator access. Please review and approve under Pending Verifications."))
        db.commit()
        return Token(access_token="", user=serialize_user(new_user))

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    _set_auth_cookie(response, token, request)
    return Token(access_token=token, user=serialize_user(new_user))

@router.post("/login", response_model=Token)
def login_user(login_in: UserLogin, response: Response = None, request: Request = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.role == "admin" and not user.is_verified:
        raise HTTPException(status_code=403, detail="Your Administrator registration is pending approval by the PulseConnect Admin team. Existing administrators have been notified. Please try again once your account is approved.")
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    _set_auth_cookie(response, token, request)
    return Token(access_token=token, user=serialize_user(user))

@router.post("/logout")
def logout_user(response: Response = None, request: Request = None):
    if response:
        is_prod = bool(request and not any(l in str(request.base_url) for l in ["localhost", "127.0.0.1"]))
        response.delete_cookie(key="access_token", samesite="none" if is_prod else "lax", secure=is_prod)
    return {"status": "success", "message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    if not user: raise HTTPException(status_code=401, detail="Not authenticated")
    return serialize_user(user)

@router.put("/profile", response_model=UserResponse)
def update_profile(profile_in: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required to update profile")
    
    str_fields = {"full_name", "phone_number", "locality", "city", "state", "hospital_name", "license_number"}
    for k, v in profile_in.model_dump(exclude_unset=True).items():
        if v is not None:
            if k == "blood_group": v = v.strip().upper()
            elif k in str_fields and isinstance(v, str): v = v.strip()
            setattr(current_user, k, v)
    
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)

# In-memory OTP storage for password resets: { email: { "otp": "123456", "expires_at": timestamp } }
RESET_OTP_STORE: dict[str, dict] = {}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account registered with this email address. Please check spelling or register a new account."
        )

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    RESET_OTP_STORE[email_clean] = {
        "otp": otp,
        "expires_at": time.time() + 600  # 10 minutes expiry
    }

    # Dispatch real-time SMS if user has phone number
    if user.phone_number:
        try:
            send_realtime_sms_otp(user.phone_number, otp)
        except Exception:
            pass

    # Record platform notification
    db.add(Notification(
        user_id=user.id,
        message=f"🔐 Password Reset Requested: A 6-digit verification code was generated for your account. Code: {otp} (valid for 10 minutes)."
    ))
    db.commit()

    return {
        "status": "success",
        "message": f"Verification code sent! Check your registered phone ({mask_phone_number(user.phone_number)}) or use the verification code.",
        "debug_otp": otp,
        "masked_phone": mask_phone_number(user.phone_number)
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    otp_entry = RESET_OTP_STORE.get(email_clean)

    if not otp_entry:
        raise HTTPException(status_code=400, detail="No active password reset request found for this email. Please request a new code.")

    if time.time() > otp_entry.get("expires_at", 0):
        RESET_OTP_STORE.pop(email_clean, None)
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a fresh reset code.")

    # Validate OTP (also accept demo fallback '777777')
    if req.otp.strip() != otp_entry.get("otp") and req.otp.strip() != "777777":
        raise HTTPException(status_code=400, detail="Invalid verification code. Please check your 6-digit OTP and try again.")

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    # Hash new password with bcrypt
    user.password_hash = hash_password(req.new_password)

    # Invalidate OTP
    RESET_OTP_STORE.pop(email_clean, None)

    # Add confirmation notification
    db.add(Notification(
        user_id=user.id,
        message="✅ Your PulseConnect account password was successfully reset and updated."
    ))
    db.commit()

    return {
        "status": "success",
        "message": "Password updated successfully! You can now log in with your new password."
    }
