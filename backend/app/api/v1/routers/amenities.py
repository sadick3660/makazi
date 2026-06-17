"""
Amenities Router — /api/v1/amenities
======================================
Query Points of Interest: Cafeterias, Transit Nodes, Hospitals.
"""
from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import validate_kinondoni_bounds
from app.db.session import get_db
from app.models.amenity import Amenity, AmenityCategory
from app.schemas.property import AmenityOut

router = APIRouter(prefix="/amenities", tags=["Amenities"])


@router.get(
    "/nearby",
    response_model=List[AmenityOut],
    summary="Find amenities near a coordinate within a given radius",
)
async def get_nearby_amenities(
    target_lng: float = Query(..., ge=-180.0, le=180.0),
    target_lat: float = Query(..., ge=-90.0, le=90.0),
    radius_metres: float = Query(default=1000.0, ge=50.0, le=5000.0),
    category: Optional[AmenityCategory] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[AmenityOut]:
    try:
        validate_kinondoni_bounds(target_lng, target_lat)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    from sqlalchemy import text

    sql = text("""
        SELECT
            a.amenity_id,
            a.name,
            a.category,
            a.address,
            ST_Distance(
                a.geographic_point::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
            ) AS distance_from_property_m
        FROM amenities a
        WHERE
            ST_DWithin(
                a.geographic_point::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radius
            )
            AND (:category IS NULL OR a.category = :category)
        ORDER BY distance_from_property_m ASC
        LIMIT :lim;
    """)

    result = await db.execute(
        sql,
        {
            "lng": target_lng,
            "lat": target_lat,
            "radius": radius_metres,
            "category": category.value if category else None,
            "lim": limit,
        },
    )
    rows = result.mappings().all()
    return [
        AmenityOut(
            amenity_id=r["amenity_id"],
            name=r["name"],
            category=r["category"],
            distance_from_property_m=r["distance_from_property_m"],
            address=r["address"],
        )
        for r in rows
    ]


@router.get(
    "/property/{property_id}",
    response_model=List[AmenityOut],
    summary="Get all amenities linked to a specific property",
)
async def get_amenities_for_property(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> List[AmenityOut]:
    result = await db.execute(
        select(Amenity).where(Amenity.fk_property_id == property_id)
    )
    amenities = result.scalars().all()
    return [AmenityOut.model_validate(a) for a in amenities]
