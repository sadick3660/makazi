"""
Payment ORM models — payments, receipts.
Matches dbschema.sql.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id:                    Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:               Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    property_id:           Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=True, index=True)
    amount:                Mapped[float | None]   = mapped_column(Numeric(12, 2), nullable=True)
    payment_method:        Mapped[str | None]     = mapped_column(String(50), nullable=True)
    transaction_reference: Mapped[str | None]     = mapped_column(String(255), nullable=True, unique=True)
    payment_status:        Mapped[str | None]     = mapped_column(String(20), nullable=True, index=True)
    paid_at:               Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user:     Mapped["User"]          = relationship("User",     back_populates="payments")    # noqa: F821
    property: Mapped["Property | None"] = relationship("Property", back_populates="payments")  # noqa: F821
    receipt:  Mapped["Receipt | None"] = relationship("Receipt",  back_populates="payment", uselist=False, cascade="all, delete-orphan")  # noqa: F821


class Receipt(Base):
    __tablename__ = "receipts"

    id:             Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_id:     Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=False, unique=True)
    receipt_number: Mapped[str | None]  = mapped_column(String(100), unique=True, nullable=True)
    receipt_url:    Mapped[str | None]  = mapped_column(Text, nullable=True)
    generated_at:   Mapped[datetime]    = mapped_column(DateTime, server_default=func.now(), nullable=False)

    payment: Mapped["Payment"] = relationship("Payment", back_populates="receipt")
