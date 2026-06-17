"""
Property ORM model — matches properties table from dbschema.sql.
Includes property_images, property_videos, property_amenities join table.
"""
from __future__ import annotations

import uuid
import enum as pyenum
from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer,
    Numeric, String, Table, Column, Text, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PropertyType(str, pyenum.Enum):
    HOSTEL    = "HOSTEL"
    ROOM      = "ROOM"
    APARTMENT = "APARTMENT"
    HOUSE     = "HOUSE"


class GenderRestriction(str, pyenum.Enum):
    MALE   = "MALE"
    FEMALE = "FEMALE"
    MIXED  = "MIXED"


class AvailabilityStatus(str, pyenum.Enum):
    AVAILABLE   = "AVAILABLE"
    RENTED      = "RENTED"
    SUSPENDED   = "SUSPENDED"
    MAINTENANCE = "MAINTENANCE"


# ── Many-to-many join table ──────────────────────────────────────────────────
property_amenities_table = Table(
    "property_amenities",
    Base.metadata,
    Column("property_id", UUID(as_uuid=True), ForeignKey("properties.id"), primary_key=True),
    Column("amenity_id",  Integer,             ForeignKey("amenities.id"),  primary_key=True),
)


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    landlord_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    property_type: Mapped[PropertyType] = mapped_column(
        Enum(PropertyType, name="property_type_enum"), nullable=False
    )

    title:       Mapped[str | None]   = mapped_column(String(255), nullable=True)
    description: Mapped[str | None]   = mapped_column(Text, nullable=True)
    location:    Mapped[str | None]   = mapped_column(String(255), nullable=True)
    ward:        Mapped[str | None]   = mapped_column(String(100), nullable=True, index=True)
    district:    Mapped[str | None]   = mapped_column(String(100), nullable=True)
    city:        Mapped[str]          = mapped_column(String(100), default="Dar es Salaam", nullable=False)

    latitude:   Mapped[float | None]  = mapped_column(Numeric(10, 8), nullable=True)
    longitude:  Mapped[float | None]  = mapped_column(Numeric(11, 8), nullable=True)

    monthly_rent: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    bedrooms:     Mapped[int | None]   = mapped_column(Integer, nullable=True)
    bathrooms:    Mapped[int | None]   = mapped_column(Integer, nullable=True)
    size_sqm:     Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    gender_restriction: Mapped[GenderRestriction | None] = mapped_column(
        Enum(GenderRestriction, name="gender_restriction_enum"), nullable=True
    )
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    availability_status: Mapped[AvailabilityStatus] = mapped_column(
        Enum(AvailabilityStatus, name="availability_status_enum"),
        default=AvailabilityStatus.AVAILABLE,
        nullable=False,
        index=True,
    )

    is_verified: Mapped[bool]  = mapped_column(Boolean, default=False, nullable=False)
    view_count:  Mapped[int]   = mapped_column(Integer, default=0,     nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # ── Relationships ────────────────────────────────────────────────────────
    landlord:  Mapped["User"]                          = relationship("User", back_populates="properties", foreign_keys=[landlord_id])  # noqa: F821
    images:    Mapped[list["PropertyImage"]]           = relationship("PropertyImage",  back_populates="property", cascade="all, delete-orphan", lazy="selectin")
    videos:    Mapped[list["PropertyVideo"]]           = relationship("PropertyVideo",  back_populates="property", cascade="all, delete-orphan")
    amenities: Mapped[list["Amenity"]]                 = relationship("Amenity", secondary=property_amenities_table, back_populates="properties", lazy="selectin")  # noqa: F821
    favorites: Mapped[list["Favorite"]]                = relationship("Favorite",       back_populates="property", cascade="all, delete-orphan")  # noqa: F821
    applications: Mapped[list["RentalApplication"]]    = relationship("RentalApplication", back_populates="property", cascade="all, delete-orphan")  # noqa: F821
    appointments: Mapped[list["Appointment"]]          = relationship("Appointment",    back_populates="property", cascade="all, delete-orphan")  # noqa: F821
    payments:     Mapped[list["Payment"]]              = relationship("Payment",        back_populates="property")  # noqa: F821
    reviews:      Mapped[list["Review"]]               = relationship("Review",         back_populates="property", cascade="all, delete-orphan")  # noqa: F821
    analytics:    Mapped["PropertyAnalytics | None"]   = relationship("PropertyAnalytics", back_populates="property", uselist=False, cascade="all, delete-orphan")  # noqa: F821
    price_predictions: Mapped[list["PricePrediction"]] = relationship("PricePrediction", back_populates="property", cascade="all, delete-orphan")  # noqa: F821
    fraud_logs:   Mapped[list["FraudDetectionLog"]]    = relationship("FraudDetectionLog", back_populates="property", cascade="all, delete-orphan")  # noqa: F821
    complaints:   Mapped[list["Complaint"]]            = relationship("Complaint",      back_populates="property", foreign_keys="Complaint.property_id")  # noqa: F821
    ai_recommendations: Mapped[list["AIRecommendation"]] = relationship("AIRecommendation", back_populates="property", cascade="all, delete-orphan")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Property id={self.id} type={self.property_type} title={self.title!r}>"


class PropertyImage(Base):
    __tablename__ = "property_images"

    id:          Mapped[uuid.UUID]   = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID]   = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url:   Mapped[str]         = mapped_column(Text, nullable=False)
    is_primary:  Mapped[bool]        = mapped_column(Boolean, default=False, nullable=False)
    uploaded_at: Mapped[datetime]    = mapped_column(DateTime, server_default=func.now(), nullable=False)

    property: Mapped["Property"] = relationship("Property", back_populates="images")


class PropertyVideo(Base):
    __tablename__ = "property_videos"

    id:          Mapped[uuid.UUID]   = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID]   = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    video_url:   Mapped[str | None]  = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime]    = mapped_column(DateTime, server_default=func.now(), nullable=False)

    property: Mapped["Property"] = relationship("Property", back_populates="videos")


class Amenity(Base):
    __tablename__ = "amenities"

    id:           Mapped[int]         = mapped_column(Integer, primary_key=True, autoincrement=True)
    amenity_name: Mapped[str | None]  = mapped_column(String(100), nullable=True)

    properties: Mapped[list["Property"]] = relationship(
        "Property", secondary=property_amenities_table, back_populates="amenities"
    )

    def __repr__(self) -> str:
        return f"<Amenity id={self.id} name={self.amenity_name!r}>"
