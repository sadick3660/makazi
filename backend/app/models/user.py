"""
User ORM model — matches users table from dbschema.sql.
Roles: SEEKER | LANDLORD | ADMIN
"""
from __future__ import annotations

import uuid
import enum as pyenum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, pyenum.Enum):
    SEEKER   = "SEEKER"
    LANDLORD = "LANDLORD"
    ADMIN    = "ADMIN"


class AccountStatus(str, pyenum.Enum):
    ACTIVE    = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    BANNED    = "BANNED"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    first_name: Mapped[str | None]  = mapped_column(String(100), nullable=True)
    last_name:  Mapped[str | None]  = mapped_column(String(100), nullable=True)
    email:      Mapped[str]         = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone:      Mapped[str | None]  = mapped_column(String(20),  unique=True, nullable=True)
    password_hash: Mapped[str]      = mapped_column(Text, nullable=False)

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum"),
        nullable=False,
        default=UserRole.SEEKER,
        index=True,
    )

    profile_image:         Mapped[str | None]  = mapped_column(Text, nullable=True)
    language_preference:   Mapped[str]         = mapped_column(String(10), default="en", nullable=False)
    email_verified:        Mapped[bool]        = mapped_column(Boolean, default=False, nullable=False)
    phone_verified:        Mapped[bool]        = mapped_column(Boolean, default=False, nullable=False)
    two_factor_enabled:    Mapped[bool]        = mapped_column(Boolean, default=False, nullable=False)

    account_status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus, name="account_status_enum"),
        default=AccountStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # ── Relationships ────────────────────────────────────────────────────────
    landlord_profile: Mapped["LandlordProfile | None"] = relationship(  # noqa: F821
        "LandlordProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    properties:    Mapped[list["Property"]] = relationship(  # noqa: F821
        "Property", back_populates="landlord", foreign_keys="Property.landlord_id"
    )
    favorites:     Mapped[list["Favorite"]]    = relationship("Favorite",    back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    applications:  Mapped[list["RentalApplication"]] = relationship("RentalApplication", back_populates="seeker", foreign_keys="RentalApplication.seeker_id")  # noqa: F821
    appointments:  Mapped[list["Appointment"]] = relationship("Appointment",  back_populates="seeker", foreign_keys="Appointment.seeker_id")  # noqa: F821
    payments:      Mapped[list["Payment"]]     = relationship("Payment",      back_populates="user")  # noqa: F821
    reviews_given: Mapped[list["Review"]]      = relationship("Review",       back_populates="reviewer", foreign_keys="Review.reviewer_id")  # noqa: F821
    chatbot_convos: Mapped[list["ChatbotConversation"]] = relationship("ChatbotConversation", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    search_history: Mapped[list["SearchHistory"]] = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    audit_logs:    Mapped[list["AuditLog"]]    = relationship("AuditLog",     back_populates="user", foreign_keys="AuditLog.user_id")  # noqa: F821
    complaints_filed: Mapped[list["Complaint"]] = relationship("Complaint",   back_populates="complainant", foreign_keys="Complaint.complainant_id")  # noqa: F821
    ai_recommendations: Mapped[list["AIRecommendation"]] = relationship("AIRecommendation", back_populates="user", cascade="all, delete-orphan")  # noqa: F821

    @property
    def full_name(self) -> str:
        parts = [self.first_name, self.last_name]
        return " ".join(p for p in parts if p) or self.email

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role.value}>"
