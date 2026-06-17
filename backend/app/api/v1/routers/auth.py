"""
Auth Router — /api/v1/auth
==========================
Full registration, login, JWT tokens, profile management.
Roles: SEEKER | LANDLORD | ADMIN

JWT encodes user id + role.  Access token: 24 h.  Refresh token: 30 days.
Passwords hashed with bcrypt.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User, UserRole, AccountStatus
from app.models.landlord_profile import LandlordProfile
from app.models.system import AuditLog
from app.schemas.auth import (
    AuthResponse, ChangePasswordRequest, ForgotPasswordRequest,
    LoginRequest, RegisterRequest, ResetPasswordRequest,
    TokenPair, UpdateProfileRequest, UserOut,
)

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

ACCESS_EXP  = 60 * 24         # 24 h
REFRESH_EXP = 60 * 24 * 30    # 30 days


# ── Helpers ────────────────────────────────────────────────────────────────────

def _hash(plain: str) -> str:
    return _pwd.hash(plain)


def _verify(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def _make_token(sub: str, role: str, minutes: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return jwt.encode({"sub": sub, "role": role, "exp": exp}, settings.SECRET_KEY, algorithm="HS256")


def _make_pair(user_id: str, role: str) -> TokenPair:
    return TokenPair(
        access=_make_token(user_id, role, ACCESS_EXP),
        refresh=_make_token(user_id, role, REFRESH_EXP),
    )


def _user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id, first_name=u.first_name, last_name=u.last_name,
        email=u.email, phone=u.phone, role=u.role.value,
        profile_image=u.profile_image, language_preference=u.language_preference,
        email_verified=u.email_verified, phone_verified=u.phone_verified,
        two_factor_enabled=u.two_factor_enabled,
        account_status=u.account_status.value,
        created_at=u.created_at.isoformat(),
    )


async def _get_current_user(
    token: Optional[str] = Depends(oauth2),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        uid: str = payload.get("sub", "")
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(uid)))
    user = result.scalar_one_or_none()
    if not user or user.account_status != AccountStatus.ACTIVE:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="User not found or suspended")
    return user


async def _require_role(role: UserRole, user: User = Depends(_get_current_user)) -> User:
    if user.role != role:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=f"Requires {role.value} role")
    return user


# Public dependency
CurrentUser  = Depends(_get_current_user)


# ── Register ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED,
             summary="Register a new user (SEEKER / LANDLORD / ADMIN)")
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    # Check duplicate
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered.")

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        password_hash=_hash(payload.password),
        role=UserRole(payload.role),
        language_preference=payload.language_preference or "en",
    )
    db.add(user)
    await db.flush()

    # Auto-create landlord profile
    if user.role == UserRole.LANDLORD:
        db.add(LandlordProfile(user_id=user.id))

    await db.refresh(user)
    tokens = _make_pair(str(user.id), user.role.value)
    return AuthResponse(user=_user_out(user), tokens=tokens)


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=AuthResponse, summary="Login and receive JWT tokens")
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not _verify(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if user.account_status != AccountStatus.ACTIVE:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Account is suspended.")

    if payload.role and user.role.value != payload.role:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered as '{user.role.value}', not '{payload.role}'.",
        )

    # Audit log
    db.add(AuditLog(
        user_id=user.id, action="LOGIN",
        entity_name="User", entity_id=user.id,
        ip_address=request.client.host if request.client else None,
    ))

    tokens = _make_pair(str(user.id), user.role.value)
    return AuthResponse(user=_user_out(user), tokens=tokens)


# ── Me ─────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut, summary="Get current user profile")
async def get_me(current_user: User = Depends(_get_current_user)) -> UserOut:
    return _user_out(current_user)


@router.patch("/me", response_model=UserOut, summary="Update current user profile")
async def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    if payload.first_name is not None:  current_user.first_name = payload.first_name
    if payload.last_name  is not None:  current_user.last_name  = payload.last_name
    if payload.phone      is not None:  current_user.phone      = payload.phone
    if payload.language_preference is not None: current_user.language_preference = payload.language_preference
    if payload.profile_image       is not None: current_user.profile_image       = payload.profile_image
    await db.flush()
    await db.refresh(current_user)
    return _user_out(current_user)


# ── Change password ────────────────────────────────────────────────────────────

@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT,
             summary="Change password (authenticated)")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    if not _verify(payload.current_password, current_user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    current_user.password_hash = _hash(payload.new_password)
    await db.flush()


# ── Forgot / Reset password ────────────────────────────────────────────────────

@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT,
             summary="Send password reset token (stub — wire to email in production)")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> None:
    # Always return 204 to prevent email enumeration.
    # In production: generate a signed JWT, email a reset link.
    _ = await db.execute(select(User).where(User.email == payload.email))


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT,
             summary="Reset password using a signed token")
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        data = jwt.decode(payload.token, settings.SECRET_KEY, algorithms=["HS256"])
        uid = data.get("sub")
    except JWTError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token.")

    result = await db.execute(select(User).where(User.id == uuid.UUID(uid)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.password_hash = _hash(payload.password)
    await db.flush()


# ── Refresh token ──────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenPair, summary="Refresh access token")
async def refresh_token(
    refresh: str,
    db: AsyncSession = Depends(get_db),
) -> TokenPair:
    try:
        payload = jwt.decode(refresh, settings.SECRET_KEY, algorithms=["HS256"])
        uid: str = payload.get("sub", "")
        role: str = payload.get("role", "")
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    result = await db.execute(select(User).where(User.id == uuid.UUID(uid)))
    user = result.scalar_one_or_none()
    if not user or user.account_status != AccountStatus.ACTIVE:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="User not found or suspended.")

    return _make_pair(str(user.id), role or user.role.value)
