"""
AI / Analytics ORM models:
  - ai_recommendations
  - price_predictions
  - fraud_detection_logs
  - property_analytics
  - search_history
Matches dbschema.sql.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id:                  Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:             Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    property_id:         Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True)
    recommendation_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    reason:              Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at:          Mapped[datetime]   = mapped_column(DateTime, server_default=func.now(), nullable=False)

    user:     Mapped["User"]     = relationship("User",     back_populates="ai_recommendations")   # noqa: F821
    property: Mapped["Property"] = relationship("Property", back_populates="ai_recommendations")   # noqa: F821


class PricePrediction(Base):
    __tablename__ = "price_predictions"

    id:              Mapped[uuid.UUID]     = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id:     Mapped[uuid.UUID]     = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True)
    predicted_price: Mapped[float | None]  = mapped_column(Numeric(12, 2), nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    model_version:   Mapped[str | None]    = mapped_column(String(50), nullable=True)
    created_at:      Mapped[datetime]      = mapped_column(DateTime, server_default=func.now(), nullable=False)

    property: Mapped["Property"] = relationship("Property", back_populates="price_predictions")   # noqa: F821


class FraudDetectionLog(Base):
    __tablename__ = "fraud_detection_logs"

    id:          Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True)
    fraud_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    reason:      Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed:    Mapped[bool]       = mapped_column(nullable=False, default=False)
    created_at:  Mapped[datetime]   = mapped_column(DateTime, server_default=func.now(), nullable=False)

    property: Mapped["Property"] = relationship("Property", back_populates="fraud_logs")   # noqa: F821


class PropertyAnalytics(Base):
    __tablename__ = "property_analytics"

    id:               Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id:      Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, unique=True, index=True)
    total_views:      Mapped[int]       = mapped_column(Integer, default=0, nullable=False)
    total_inquiries:  Mapped[int]       = mapped_column(Integer, default=0, nullable=False)
    total_favorites:  Mapped[int]       = mapped_column(Integer, default=0, nullable=False)
    total_bookings:   Mapped[int]       = mapped_column(Integer, default=0, nullable=False)
    updated_at:       Mapped[datetime]  = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    property: Mapped["Property"] = relationship("Property", back_populates="analytics")   # noqa: F821


class SearchHistory(Base):
    __tablename__ = "search_history"

    id:           Mapped[uuid.UUID]     = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:      Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    search_query: Mapped[str | None]    = mapped_column(Text, nullable=True)
    location:     Mapped[str | None]    = mapped_column(String(255), nullable=True)
    min_price:    Mapped[float | None]  = mapped_column(Numeric(12, 2), nullable=True)
    max_price:    Mapped[float | None]  = mapped_column(Numeric(12, 2), nullable=True)
    searched_at:  Mapped[datetime]      = mapped_column(DateTime, server_default=func.now(), nullable=False)

    user: Mapped["User | None"] = relationship("User", back_populates="search_history")   # noqa: F821
