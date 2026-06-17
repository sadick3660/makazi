"""
Amenity ORM model — Points of Interest with PostGIS geometry.

Covers: Cafeterias, Transit Nodes, and Hospitals within Kinondoni.
"""
from __future__ import annotations

import enum as pyenum
import uuid
from datetime import datetime, timezone
from typing import Optional

from geoalchemy2 import Geometry
from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AmenityCategory(str, pyenum.Enum):
    CAFETERIA = "cafeteria"
    TRANSIT_NODE = "transit_node"
    HOSPITAL = "hospital"


class Amenity(Base):
    __tablename__ = "amenities"

    __table_args__ = (
        Index(
            "ix_amenities_geographic_point",
            "geographic_point",
            postgresql_using="gist",
        ),
    )

    amenity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Structural reference tie to the parent property
    fk_property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties_table.property_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Foreign key to the associated property listing.",
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    category: Mapped[AmenityCategory] = mapped_column(
        Enum(AmenityCategory, name="amenity_category_enum"),
        nullable=False,
        index=True,
    )

    # WGS 84 point geometry for the amenity location
    geographic_point: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )

    # Pre-computed walking distance from the associated property (metres)
    distance_from_property_m: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Straight-line distance from the parent property in metres.",
    )

    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship
    property: Mapped["Property"] = relationship(  # noqa: F821
        "Property",
        back_populates="amenities",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Amenity id={self.amenity_id} category={self.category.value} name={self.name!r}>"
