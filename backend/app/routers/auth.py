# routers/auth.py — Authentication endpoints (login, register, profile)
import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from app.models import User, ActivityLog
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=72)


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=72)


@router.post("/register", summary="Register a new user")
async def register(data: RegisterRequest, request: Request):
    username = data.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    existing = await User.find_one(User.username == username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=username,
        password_hash=get_password_hash(data.password),
        role="USER",
    )
    await user.insert()
    # Log the registration activity
    await ActivityLog(
        user_id=str(user.id),
        username=user.username,
        role=user.role,
        action="REGISTER",
        details=f"New user registered: {user.username}",
        ip_address=request.client.host if request.client else None,
    ).insert()
    # Auto-login: return token so frontend can immediately use it
    access_token = create_access_token({"sub": user.username, "role": user.role})
    return {
        "msg": "User created",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": user.username, "role": user.role},
    }


@router.post("/login", summary="Login and get JWT token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = None):
    user = await User.find_one(User.username == form_data.username.strip())
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token({"sub": user.username, "role": user.role})
    # Log the login activity
    await ActivityLog(
        user_id=str(user.id),
        username=user.username,
        role=user.role,
        action="LOGIN",
        details=f"User logged in: {user.username}",
        ip_address=request.client.host if request and request.client else None,
    ).insert()
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": user.username, "role": user.role},
    }


@router.post("/login-json", summary="Login with JSON body (for frontend)")
async def login_json(data: LoginRequest, request: Request):
    user = await User.find_one(User.username == data.username.strip())
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token({"sub": user.username, "role": user.role})
    # Log the login activity
    await ActivityLog(
        user_id=str(user.id),
        username=user.username,
        role=user.role,
        action="LOGIN",
        details=f"User logged in (JSON): {user.username}",
        ip_address=request.client.host if request.client else None,
    ).insert()
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": user.username, "role": user.role},
    }


@router.get("/me", summary="Get current user profile")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat(),
    }
