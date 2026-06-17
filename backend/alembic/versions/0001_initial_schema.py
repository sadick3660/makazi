"""Initial schema — landlords, properties_table, amenities with PostGIS

Revision ID: 0001
Revises:
Create Date: 2026-06-12
"""
from __future__ import annotations

from typing import Sequence, Union

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS if not already active
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # --- landlords ---
    op.create_table(
        "landlords",
        sa.Column("pk_landlord_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("primary_contact", sa.String(320), nullable=False, unique=True),
        sa.Column("national_id_number", sa.String(50), nullable=True, unique=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_flagged_broker", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index("ix_landlords_primary_contact", "landlords", ["primary_contact"])

    # --- enum types ---
    water_enum = postgresql.ENUM(
        "none", "intermittent", "daily", "continuous",
        name="water_reliability_enum",
    )
    water_enum.create(op.get_bind())

    electricity_enum = postgresql.ENUM(
        "none", "luku", "fixed", "solar",
        name="electricity_config_enum",
    )
    electricity_enum.create(op.get_bind())

    property_status_enum = postgresql.ENUM(
        "available", "rented", "suspended",
        name="property_status_enum",
    )
    property_status_enum.create(op.get_bind())

    ward_enum = postgresql.ENUM(
        "Mikocheni", "Mwananyamala", "Kijitonyama",
        "Mwenge", "Mabatini", "Makumbusho", "Sinza",
        name="ward_name_enum",
    )
    ward_enum.create(op.get_bind())

    amenity_enum = postgresql.ENUM(
        "cafeteria", "transit_node", "hospital",
        name="amenity_category_enum",
    )
    amenity_enum.create(op.get_bind())

    # --- properties_table ---
    op.create_table(
        "properties_table",
        sa.Column("property_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "fk_landlord_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("landlords.pk_landlord_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("structural_rooms", sa.Integer(), nullable=False),
        sa.Column("floor_area_sqm", sa.Float(), nullable=True),
        sa.Column("water_reliability", sa.Enum(name="water_reliability_enum"), nullable=False),
        sa.Column("electricity_config", sa.Enum(name="electricity_config_enum"), nullable=False),
        sa.Column("has_wifi", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("has_parking", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_furnished", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("base_rent_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("deposit_months", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("ward", sa.Enum(name="ward_name_enum"), nullable=False),
        sa.Column("street_address", sa.String(500), nullable=True),
        sa.Column(
            "geographic_point",
            geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326),
            nullable=False,
        ),
        sa.Column("status", sa.Enum(name="property_status_enum"), nullable=False, server_default="'available'"),
        sa.Column("is_price_flagged", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("flagged_fair_value", sa.Numeric(12, 2), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.CheckConstraint("base_rent_amount > 0", name="ck_rent_positive"),
        sa.CheckConstraint("structural_rooms >= 1", name="ck_rooms_min_one"),
    )
    op.create_index("ix_properties_ward", "properties_table", ["ward"])
    op.create_index("ix_properties_status", "properties_table", ["status"])
    op.create_index("ix_properties_fk_landlord", "properties_table", ["fk_landlord_id"])
    op.execute(
        "CREATE INDEX ix_properties_geographic_point "
        "ON properties_table USING GIST (geographic_point);"
    )

    # --- amenities ---
    op.create_table(
        "amenities",
        sa.Column("amenity_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "fk_property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties_table.property_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.Enum(name="amenity_category_enum"), nullable=False),
        sa.Column(
            "geographic_point",
            geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326),
            nullable=False,
        ),
        sa.Column("distance_from_property_m", sa.Float(), nullable=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index("ix_amenities_fk_property", "amenities", ["fk_property_id"])
    op.create_index("ix_amenities_category", "amenities", ["category"])
    op.execute(
        "CREATE INDEX ix_amenities_geographic_point "
        "ON amenities USING GIST (geographic_point);"
    )


def downgrade() -> None:
    op.drop_table("amenities")
    op.drop_table("properties_table")
    op.drop_table("landlords")

    for enum_name in [
        "amenity_category_enum",
        "ward_name_enum",
        "property_status_enum",
        "electricity_config_enum",
        "water_reliability_enum",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name};")
