"""
Rental ORM models — favorites, rental_applications, appointments.
Matches dbschema.sql.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id:          Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:     Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    property_id: Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True)
    created_at:  Mapped[datetime]   = mapped_column(DateTime, server_default=func.now(), nullable=False)

    user:     Mapped["User"]     = relationship("User",     back_populates="favorites")      # noqa: F821
    property: Mapped["Property"] = relationship("Property", back_populates="favorites")      # noqa: F821


class RentalApplication(Base):
    __tablename__ = "rental_applications"

    id:                 Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seeker_id:          Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    property_id:        Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True)
    application_status: Mapped[str]            = mapped_column(String(20), default="PENDING", nullable=False, index=True)
    move_in_date:       Mapped[date | None]    = mapped_column(Date, nullable=True)
    message:            Mapped[str | None]     = mapped_column(Text, nullable=True)
    applied_at:         Mapped[datetime]       = mapped_column(DateTime, server_default=func.now(), nullable=False)

    seeker:   Mapped["User"]     = relationship("User",     back_populates="applications", foreign_keys=[seeker_id])   # noqa: F821
    property: Mapped["Property"] = relationship("Property", back_populates="applications")   # noqa: F821


class Appointment(Base):
    __tablename__ = "appointments"

    id:               Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seeker_id:        Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    property_id:      Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True)
    appointment_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status:           Mapped[str]             = mapped_column(String(20), default="PENDING", nullable=False, index=True)
    notes:            Mapped[str | None]      = mapped_column(Text, nullable=True)
    created_at:       Mapped[datetime]        = mapped_column(DateTime, server_default=func.now(), nullable=False)

    seeker:   Mapped["User"]     = relationship("User",     back_populates="appointments", foreign_keys=[seeker_id])   # noqa: F821
    property: Mapped["Property"] = relationship("Property", back_populates="appointments")   # noqa: F821
