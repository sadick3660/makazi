"""
Auth request / response schemas.
"""
from __future__ import annotations

import uuid
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# ── Register ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name:  str = Field(..., min_length=1, max_length=100)
    email:      EmailStr
    phone:      Optional[str] = None
    password:   str = Field(..., min_length=8)
    role:       Literal["SEEKER", "LANDLORD", "ADMIN"] = "SEEKER"
    language_preference: Optional[str] = "en"


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str
    role:     Optional[Literal["SEEKER", "LANDLORD", "ADMIN"]] = None


# ── Tokens ────────────────────────────────────────────────────────────────────

class TokenPair(BaseModel):
    access:  str
    refresh: str


# ── User output ───────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id:                   uuid.UUID
    first_name:           Optional[str]
    last_name:            Optional[str]
    email:                str
    phone:                Optional[str]
    role:                 str
    profile_image:        Optional[str]
    language_preference:  str
    email_verified:       bool
    phone_verified:       bool
    two_factor_enabled:   bool
    account_status:       str
    created_at:           str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_user(cls, u: object) -> "UserOut":
        from app.models.user import User  # local import to avoid circular
        assert isinstance(u, User)
        return cls(
            id=u.id,
            first_name=u.first_name,
            last_name=u.last_name,
            email=u.email,
            phone=u.phone,
            role=u.role.value,
            profile_image=u.profile_image,
            language_preference=u.language_preference,
            email_verified=u.email_verified,
            phone_verified=u.phone_verified,
            two_factor_enabled=u.two_factor_enabled,
            account_status=u.account_status.value,
            created_at=u.created_at.isoformat(),
        )


# ── Auth response ─────────────────────────────────────────────────────────────

class AuthResponse(BaseModel):
    user:   UserOut
    tokens: TokenPair


# ── Profile update ────────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    first_name:          Optional[str] = None
    last_name:           Optional[str] = None
    phone:               Optional[str] = None
    language_preference: Optional[Literal["en", "sw"]] = None
    profile_image:       Optional[str] = None


# ── Password ──────────────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token:    str
    password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password:     str = Field(..., min_length=8)
