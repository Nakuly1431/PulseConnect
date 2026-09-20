from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserUpdate, UserResponse, Token
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.compatibility import mask_phone_number
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User | None:
    # 1. Read token from httpOnly cookie first, then fallback to Authorization header
    jwt_token = request.cookies.get("access_token") or token
    if not jwt_token:
        return None
    payload = decode_access_token(jwt_token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user
    except Exception:
        return None

def serialize_user(user: User) -> UserResponse:
    res = UserResponse.model_validate(user)
    res.masked_phone = mask_phone_number(user.phone_number)
    today = date.today()
    if user.cooldown_until and user.cooldown_until > today:
        res.is_in_cooldown = True
        res.cooldown_days_remaining = (user.cooldown_until - today).days
    else:
        res.is_in_cooldown = False
        res.cooldown_days_remaining = 0
    return res

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        # Privacy-preserving error message: does not reveal whether the email exists
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. If you already have an account, please log in."
        )
    
    user_role = user_in.role if user_in.role in ["donor_acceptor", "hospital", "admin"] else "donor_acceptor"
    is_verified_val = False if user_role == "hospital" else True

    new_user = User(
        full_name=user_in.full_name,
        email=user_in.email.lower(),
        password_hash=hash_password(user_in.password),
        phone_number=user_in.phone_number,
        blood_group=user_in.blood_group.upper(),
        latitude=user_in.latitude or 0.0,
        longitude=user_in.longitude or 0.0,
        locality=user_in.locality,
        city=user_in.city,
        state=user_in.state,
        role=user_role,
        hospital_name=user_in.hospital_name.strip() if user_in.hospital_name else None,
        license_number=user_in.license_number.strip() if user_in.license_number else None,
        is_available=True,
        is_verified=is_verified_val,
        total_donations=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    
    # Store session as JWT in an httpOnly cookie
    max_age_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=max_age_seconds,
        samesite="lax",
        secure=False
    )
    return Token(access_token=token, user=serialize_user(new_user))

@router.post("/login", response_model=Token)
def login_user(login_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        # Privacy-preserving error message: does not reveal whether the email exists
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    
    # Store session as JWT in an httpOnly cookie
    max_age_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=max_age_seconds,
        samesite="lax",
        secure=False
    )
    return Token(access_token=token, user=serialize_user(user))

@router.post("/logout")
def logout_user(response: Response):
    response.delete_cookie(key="access_token", samesite="lax")
    return {"status": "success", "message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return serialize_user(user)

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to update profile"
        )
    user = current_user

    if profile_in.full_name is not None:
        user.full_name = profile_in.full_name.strip()
    if profile_in.phone_number is not None:
        user.phone_number = profile_in.phone_number.strip()
    if profile_in.blood_group is not None:
        user.blood_group = profile_in.blood_group.strip().upper()
    if profile_in.locality is not None:
        user.locality = profile_in.locality.strip()
    if profile_in.city is not None:
        user.city = profile_in.city.strip()
    if profile_in.state is not None:
        user.state = profile_in.state.strip()
    if profile_in.latitude is not None:
        user.latitude = profile_in.latitude
    if profile_in.longitude is not None:
        user.longitude = profile_in.longitude
    if profile_in.is_available is not None:
        user.is_available = profile_in.is_available
    if profile_in.hospital_name is not None:
        user.hospital_name = profile_in.hospital_name.strip()
    if profile_in.license_number is not None:
        user.license_number = profile_in.license_number.strip()

    db.commit()
    db.refresh(user)
    return serialize_user(user)
