"""
LandlordProfile ORM model — matches landlord_profiles table from dbschema.sql.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LandlordProfile(Base):
    __tablename__ = "landlord_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )

    business_name:       Mapped[str | None]  = mapped_column(String(255), nullable=True)
    national_id:         Mapped[str | None]  = mapped_column(String(100), nullable=True)
    verification_status: Mapped[str]         = mapped_column(String(20),  default="PENDING", nullable=False)
    verification_date:   Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    bio:                 Mapped[str | None]  = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    # ── Relationships ────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="landlord_profile")  # noqa: F821

    def __repr__(self) -> str:
        return f"<LandlordProfile user_id={self.user_id} status={self.verification_status}>"
