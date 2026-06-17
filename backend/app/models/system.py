"""
System ORM models — notifications, complaints, audit_logs, system_settings.
Matches dbschema.sql.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id:                Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:           Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title:             Mapped[str | None] = mapped_column(String(255), nullable=True)
    message:           Mapped[str | None] = mapped_column(Text, nullable=True)
    notification_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_read:           Mapped[bool]       = mapped_column(Boolean, default=False, nullable=False)
    created_at:        Mapped[datetime]   = mapped_column(DateTime, server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="notifications")   # noqa: F821


class Complaint(Base):
    __tablename__ = "complaints"

    id:              Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complainant_id:  Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    property_id:     Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=True, index=True)
    complaint_text:  Mapped[str | None]      = mapped_column(Text, nullable=True)
    status:          Mapped[str]             = mapped_column(String(20), default="OPEN", nullable=False, index=True)
    resolved_by:     Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at:      Mapped[datetime]        = mapped_column(DateTime, server_default=func.now(), nullable=False)

    complainant: Mapped["User"]          = relationship("User",     back_populates="complaints_filed", foreign_keys=[complainant_id])   # noqa: F821
    property:    Mapped["Property | None"] = relationship("Property", back_populates="complaints", foreign_keys=[property_id])   # noqa: F821


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id:          Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:     Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    action:      Mapped[str | None]      = mapped_column(String(255), nullable=True)
    entity_name: Mapped[str | None]      = mapped_column(String(100), nullable=True)
    entity_id:   Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    ip_address:  Mapped[str | None]      = mapped_column(String(100), nullable=True)
    created_at:  Mapped[datetime]        = mapped_column(DateTime, server_default=func.now(), nullable=False)

    user: Mapped["User | None"] = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])   # noqa: F821


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id:            Mapped[int]          = mapped_column(Integer, primary_key=True, autoincrement=True)
    setting_key:   Mapped[str | None]   = mapped_column(String(255), unique=True, nullable=True)
    setting_value: Mapped[str | None]   = mapped_column(Text, nullable=True)
    updated_at:    Mapped[datetime]     = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
