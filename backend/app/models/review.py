"""
Review ORM model — matches reviews table from dbschema.sql.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id:                Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reviewer_id:       Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    property_id:       Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True)
    landlord_id:       Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rating:            Mapped[int | None]   = mapped_column(Integer, nullable=True)
    review_text:       Mapped[str | None]   = mapped_column(Text, nullable=True)
    sentiment:         Mapped[str | None]   = mapped_column(String(20), nullable=True)
    moderation_status: Mapped[str]          = mapped_column(String(20), default="PENDING", nullable=False, index=True)
    created_at:        Mapped[datetime]     = mapped_column(DateTime, server_default=func.now(), nullable=False)

    reviewer: Mapped["User"]     = relationship("User",     back_populates="reviews_given", foreign_keys=[reviewer_id])  # noqa: F821
    property: Mapped["Property"] = relationship("Property", back_populates="reviews")   # noqa: F821
