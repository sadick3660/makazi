"""
Spatial Search Service
======================
Executes PostGIS radius queries against the properties_table.
All geospatial parameters are sanitised before query execution.
SRID 4326 (WGS 84) is enforced throughout.
"""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import validate_kinondoni_bounds
from app.schemas.property import PropertySearchResult, SearchResponse

settings = get_settings()


# ---------------------------------------------------------------------------
# Raw SQL spatial query (parameterised — no string interpolation of coords)
# ---------------------------------------------------------------------------

_SPATIAL_SEARCH_SQL = text("""
    SELECT
        p.property_id,
        p.title,
        p.ward,
        p.base_rent_amount,
        p.structural_rooms,
        p.is_price_flagged,
        p.flagged_fair_value,
        p.street_address,
        ST_X(p.geographic_point::geometry)          AS longitude,
        ST_Y(p.geographic_point::geometry)          AS latitude,
        ST_Distance(
            p.geographic_point::geography,
            ST_SetSRID(ST_MakePoint(:target_lng, :target_lat), 4326)::geography
        )                                           AS distance_metres
    FROM properties_table p
    WHERE
        p.status = 'available'
        AND ST_DWithin(
            p.geographic_point::geography,
            ST_SetSRID(ST_MakePoint(:target_lng, :target_lat), 4326)::geography,
            :radius_metres
        )
        AND (:max_rent   IS NULL OR p.base_rent_amount <= :max_rent)
        AND (:min_rooms  IS NULL OR p.structural_rooms >= :min_rooms)
        AND (:ward_filter IS NULL OR p.ward = :ward_filter)
    ORDER BY distance_metres ASC
    LIMIT :result_limit;
""")

_AMENITY_SQL = text("""
    SELECT
        a.amenity_id,
        a.name,
        a.category,
        a.distance_from_property_m,
        a.address
    FROM amenities a
    WHERE a.fk_property_id = :property_id;
""")


async def search_rentals(
    db: AsyncSession,
    target_lng: float,
    target_lat: float,
    radius_metres: float = 2000.0,
    max_rent: Optional[float] = None,
    min_rooms: Optional[int] = None,
    ward: Optional[str] = None,
    limit: int = 20,
) -> SearchResponse:
    """
    Execute a PostGIS ST_DWithin radius search centred on (target_lng, target_lat).

    Security guarantees:
    - Coordinates are validated against Kinondoni bounding box before use.
    - All parameters are passed as SQL bind variables (no f-string injection).
    - Radius is capped at MAX_SEARCH_RADIUS_METRES from config.
    """
    # Sanitise & validate coordinates
    target_lng, target_lat = validate_kinondoni_bounds(target_lng, target_lat)

    # Cap radius
    radius_metres = min(radius_metres, settings.MAX_SEARCH_RADIUS_METRES)

    params: dict[str, Any] = {
        "target_lng": target_lng,
        "target_lat": target_lat,
        "radius_metres": radius_metres,
        "max_rent": max_rent,
        "min_rooms": min_rooms,
        "ward_filter": ward,
        "result_limit": limit,
    }

    result = await db.execute(_SPATIAL_SEARCH_SQL, params)
    rows = result.mappings().all()

    results: list[PropertySearchResult] = []
    for row in rows:
        # Fetch amenities for this property
        amenity_result = await db.execute(
            _AMENITY_SQL, {"property_id": row["property_id"]}
        )
        amenity_rows = amenity_result.mappings().all()
        amenities = [
            {
                "amenity_id": ar["amenity_id"],
                "name": ar["name"],
                "category": ar["category"],
                "distance_from_property_m": ar["distance_from_property_m"],
                "address": ar["address"],
            }
            for ar in amenity_rows
        ]

        results.append(
            PropertySearchResult(
                property_id=row["property_id"],
                title=row["title"],
                ward=row["ward"],
                base_rent_amount=float(row["base_rent_amount"]),
                structural_rooms=row["structural_rooms"],
                distance_metres=round(float(row["distance_metres"]), 2),
                is_price_flagged=row["is_price_flagged"],
                flagged_fair_value=(
                    float(row["flagged_fair_value"])
                    if row["flagged_fair_value"] is not None
                    else None
                ),
                longitude=float(row["longitude"]),
                latitude=float(row["latitude"]),
                amenities=amenities,  # type: ignore[arg-type]
            )
        )

    return SearchResponse(
        total_results=len(results),
        radius_metres=radius_metres,
        origin_lng=target_lng,
        origin_lat=target_lat,
        results=results,
    )
