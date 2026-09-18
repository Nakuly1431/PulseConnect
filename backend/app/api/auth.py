from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
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
    
    new_user = User(
        full_name=user_in.full_name,
        email=user_in.email.lower(),
        password_hash=hash_password(user_in.password),
        phone_number=user_in.phone_number,
        blood_group=user_in.blood_group.upper(),
        latitude=user_in.latitude,
        longitude=user_in.longitude,
        locality=user_in.locality,
        city=user_in.city,
        state=user_in.state,
        is_available=True,
        is_verified=True,
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
