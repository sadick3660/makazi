"""
Landlord ORM model — core demographic indices and contact references.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Landlord(Base):
    __tablename__ = "landlords"

    pk_landlord_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Primary key — unique validation reference for every landlord.",
    )

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Legal full name of the landlord.",
    )

    # Verified primary contact key (E.164 phone or email)
    primary_contact: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
        unique=True,
        index=True,
        comment="Verified primary contact — phone (E.164) or email address.",
    )

    national_id_number: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        unique=True,
        comment="National ID / NIDA number for identity verification.",
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="True once the landlord's identity has been confirmed.",
    )

    # Dalali (broker) flag — flagged if exploitation patterns are detected
    is_flagged_broker: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="True if this account has been flagged for predatory broker behaviour.",
    )

    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    properties: Mapped[list["Property"]] = relationship(  # noqa: F821
        "Property",
        back_populates="landlord",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Landlord id={self.pk_landlord_id} name={self.full_name!r}>"
