"""Seed realistic sample data for Kinondoni wards

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-12
"""
from __future__ import annotations

import uuid
from typing import Sequence, Union

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Placeholder landlord ID used by API create endpoint
_SYSTEM_LANDLORD_ID = "00000000-0000-0000-0000-000000000001"

# Realistic Kinondoni ward coordinates (WGS 84)
_SEED_PROPERTIES = [
    {
        "id": str(uuid.uuid4()),
        "title": "Spacious 2-Room in Mikocheni B",
        "ward": "Mikocheni",
        "rooms": 2,
        "rent": 280000,
        "water": "daily",
        "electricity": "luku",
        "lng": 39.2788,
        "lat": -6.7640,
        "furnished": False,
        "wifi": False,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Modern Bedsitter — Mwenge Centre",
        "ward": "Mwenge",
        "rooms": 1,
        "rent": 180000,
        "water": "continuous",
        "electricity": "luku",
        "lng": 39.2592,
        "lat": -6.7712,
        "furnished": True,
        "wifi": True,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "3-Room Family Unit Sinza C",
        "ward": "Sinza",
        "rooms": 3,
        "rent": 350000,
        "water": "daily",
        "electricity": "fixed",
        "lng": 39.2490,
        "lat": -6.7918,
        "furnished": False,
        "wifi": False,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Self-Contained Room — Kijitonyama",
        "ward": "Kijitonyama",
        "rooms": 1,
        "rent": 220000,
        "water": "intermittent",
        "electricity": "luku",
        "lng": 39.2706,
        "lat": -6.7778,
        "furnished": False,
        "wifi": False,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "2-Bedroom Apartment Makumbusho",
        "ward": "Makumbusho",
        "rooms": 2,
        "rent": 310000,
        "water": "daily",
        "electricity": "solar",
        "lng": 39.2540,
        "lat": -6.7762,
        "furnished": True,
        "wifi": True,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Affordable Room Mabatini",
        "ward": "Mabatini",
        "rooms": 1,
        "rent": 120000,
        "water": "intermittent",
        "electricity": "luku",
        "lng": 39.2440,
        "lat": -6.8010,
        "furnished": False,
        "wifi": False,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "2-Room Mwananyamala Kaskazini",
        "ward": "Mwananyamala",
        "rooms": 2,
        "rent": 195000,
        "water": "daily",
        "electricity": "luku",
        "lng": 39.2620,
        "lat": -6.7840,
        "furnished": False,
        "wifi": False,
    },
]


def upgrade() -> None:
    conn = op.get_bind()

    # Insert system landlord
    conn.execute(
        __import__("sqlalchemy").text("""
            INSERT INTO landlords
                (pk_landlord_id, full_name, primary_contact, is_verified, hashed_password)
            VALUES
                (:id, 'System Landlord', 'system@kinondoni.tz', true,
                 '$2b$12$placeholderhashedpasswordvalue000')
            ON CONFLICT DO NOTHING;
        """),
        {"id": _SYSTEM_LANDLORD_ID},
    )

    for p in _SEED_PROPERTIES:
        prop_id = p["id"]
        conn.execute(
            __import__("sqlalchemy").text("""
                INSERT INTO properties_table (
                    property_id, fk_landlord_id, title, ward,
                    structural_rooms, base_rent_amount,
                    water_reliability, electricity_config,
                    is_furnished, has_wifi,
                    geographic_point, status
                ) VALUES (
                    :id, :landlord_id, :title, :ward,
                    :rooms, :rent,
                    :water, :electricity,
                    :furnished, :wifi,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 'available'
                )
                ON CONFLICT DO NOTHING;
            """),
            {
                "id": prop_id,
                "landlord_id": _SYSTEM_LANDLORD_ID,
                "title": p["title"],
                "ward": p["ward"],
                "rooms": p["rooms"],
                "rent": p["rent"],
                "water": p["water"],
                "electricity": p["electricity"],
                "furnished": p["furnished"],
                "wifi": p["wifi"],
                "lng": p["lng"],
                "lat": p["lat"],
            },
        )

        # Seed one sample amenity per property
        conn.execute(
            __import__("sqlalchemy").text("""
                INSERT INTO amenities (
                    amenity_id, fk_property_id, name, category,
                    geographic_point, distance_from_property_m, address
                ) VALUES (
                    :amenity_id, :property_id, :name, :category,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                    :distance, :address
                )
                ON CONFLICT DO NOTHING;
            """),
            {
                "amenity_id": str(uuid.uuid4()),
                "property_id": prop_id,
                "name": f"Daladala Stand near {p['ward']}",
                "category": "transit_node",
                "lng": p["lng"] + 0.003,
                "lat": p["lat"] + 0.002,
                "distance": 350.0,
                "address": f"{p['ward']} main road",
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(__import__("sqlalchemy").text("DELETE FROM amenities;"))
    conn.execute(__import__("sqlalchemy").text("DELETE FROM properties_table;"))
    conn.execute(
        __import__("sqlalchemy").text(
            "DELETE FROM landlords WHERE pk_landlord_id = :id"
        ),
        {"id": _SYSTEM_LANDLORD_ID},
    )
