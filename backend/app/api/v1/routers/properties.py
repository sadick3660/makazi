"""
Properties Router — /api/v1/properties
=======================================
Full CRUD + search + image/video management + amenity management.
Seeker: read only.  Landlord: own properties.  Admin: all.
"""
from __future__ import annotations

import math
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routers.auth import _get_current_user
from app.db.session import get_db
from app.models.property import (
    Amenity, AvailabilityStatus, GenderRestriction,
    Property, PropertyImage, PropertyType, PropertyVideo,
    property_amenities_table,
)
from app.models.system import AuditLog
from app.models.user import User, UserRole
from app.schemas.property import (
    AmenityCreate, AmenityOut, PaginatedProperties,
    PropertyCreate, PropertyOut, PropertyUpdate,
)

router = APIRouter(prefix="/properties", tags=["Properties"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _check_owner_or_admin(prop: Property, user: User) -> None:
    if user.role == UserRole.ADMIN:
        return
    if prop.landlord_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not your property.")


def _to_out(p: Property) -> PropertyOut:
    return PropertyOut.model_validate(p)


# ── List / search ─────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedProperties, summary="Search/list properties")
async def list_properties(
    query:              Optional[str]   = Query(default=None),
    ward:               Optional[str]   = Query(default=None),
    district:           Optional[str]   = Query(default=None),
    property_type:      Optional[str]   = Query(default=None),
    min_rent:           Optional[float] = Query(default=None, ge=0),
    max_rent:           Optional[float] = Query(default=None, ge=0),
    min_bedrooms:       Optional[int]   = Query(default=None, ge=0),
    gender_restriction: Optional[str]   = Query(default=None),
    availability:       Optional[str]   = Query(default="AVAILABLE"),
    page:               int             = Query(default=1, ge=1),
    limit:              int             = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedProperties:
    stmt = select(Property)

    if availability:
        stmt = stmt.where(Property.availability_status == AvailabilityStatus(availability))
    if query:
        q = f"%{query.lower()}%"
        stmt = stmt.where(or_(
            func.lower(Property.title).like(q),
            func.lower(Property.description).like(q),
            func.lower(Property.location).like(q),
        ))
    if ward:
        stmt = stmt.where(func.lower(Property.ward) == ward.lower())
    if district:
        stmt = stmt.where(func.lower(Property.district) == district.lower())
    if property_type:
        stmt = stmt.where(Property.property_type == PropertyType(property_type.upper()))
    if min_rent is not None:
        stmt = stmt.where(Property.monthly_rent >= min_rent)
    if max_rent is not None:
        stmt = stmt.where(Property.monthly_rent <= max_rent)
    if min_bedrooms is not None:
        stmt = stmt.where(Property.bedrooms >= min_bedrooms)
    if gender_restriction:
        stmt = stmt.where(Property.gender_restriction == GenderRestriction(gender_restriction.upper()))

    # Count
    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    # Page
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit).order_by(Property.created_at.desc())
    result = await db.execute(stmt)
    props = result.scalars().all()

    return PaginatedProperties(
        results=[_to_out(p) for p in props],
        total=total,
        page=page,
        limit=limit,
        total_pages=max(1, math.ceil(total / limit)),
    )


# ── Get one ───────────────────────────────────────────────────────────────────

@router.get("/{property_id}", response_model=PropertyOut, summary="Get a single property")
async def get_property(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> PropertyOut:
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Property not found.")
    # Increment view count
    prop.view_count = (prop.view_count or 0) + 1
    await db.flush()
    return _to_out(prop)


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED,
             summary="Create a new property listing (Landlord / Admin)")
async def create_property(
    payload: PropertyCreate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PropertyOut:
    if current_user.role not in (UserRole.LANDLORD, UserRole.ADMIN):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only landlords can create listings.")

    prop = Property(
        landlord_id=current_user.id,
        property_type=PropertyType(payload.property_type.upper()),
        title=payload.title,
        description=payload.description,
        location=payload.location,
        ward=payload.ward,
        district=payload.district,
        city=payload.city,
        latitude=payload.latitude,
        longitude=payload.longitude,
        monthly_rent=payload.monthly_rent,
        bedrooms=payload.bedrooms,
        bathrooms=payload.bathrooms,
        size_sqm=payload.size_sqm,
        gender_restriction=GenderRestriction(payload.gender_restriction.upper()) if payload.gender_restriction else None,
        capacity=payload.capacity,
    )
    db.add(prop)
    await db.flush()

    # Attach amenities
    if payload.amenity_ids:
        am_result = await db.execute(select(Amenity).where(Amenity.id.in_(payload.amenity_ids)))
        prop.amenities = list(am_result.scalars().all())

    await db.refresh(prop)

    db.add(AuditLog(user_id=current_user.id, action="CREATE_PROPERTY",
                    entity_name="Property", entity_id=prop.id))

    return _to_out(prop)


# ── Update ────────────────────────────────────────────────────────────────────

@router.patch("/{property_id}", response_model=PropertyOut, summary="Update a property")
async def update_property(
    property_id: uuid.UUID,
    payload: PropertyUpdate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PropertyOut:
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Property not found.")
    _check_owner_or_admin(prop, current_user)

    for field, val in payload.model_dump(exclude_unset=True).items():
        if field == "amenity_ids":
            if val is not None:
                am_result = await db.execute(select(Amenity).where(Amenity.id.in_(val)))
                prop.amenities = list(am_result.scalars().all())
        elif field == "property_type" and val:
            prop.property_type = PropertyType(val.upper())
        elif field == "gender_restriction" and val:
            prop.gender_restriction = GenderRestriction(val.upper())
        elif field == "availability_status" and val:
            prop.availability_status = AvailabilityStatus(val.upper())
        else:
            setattr(prop, field, val)

    await db.flush()
    await db.refresh(prop)
    return _to_out(prop)


# ── Delete (soft) ─────────────────────────────────────────────────────────────

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Suspend / soft-delete a property")
async def delete_property(
    property_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Property not found.")
    _check_owner_or_admin(prop, current_user)
    prop.availability_status = AvailabilityStatus.SUSPENDED
    await db.flush()


# ── My listings (landlord) ────────────────────────────────────────────────────

@router.get("/my/listings", response_model=PaginatedProperties,
            summary="Get current landlord's listings")
async def my_listings(
    page:  int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedProperties:
    if current_user.role not in (UserRole.LANDLORD, UserRole.ADMIN):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only landlords can access this.")

    stmt = select(Property).where(Property.landlord_id == current_user.id)
    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * limit
    result = await db.execute(stmt.offset(offset).limit(limit).order_by(Property.created_at.desc()))
    props = result.scalars().all()

    return PaginatedProperties(
        results=[_to_out(p) for p in props],
        total=total, page=page, limit=limit,
        total_pages=max(1, math.ceil(total / limit)),
    )


# ── Images ────────────────────────────────────────────────────────────────────

@router.post("/{property_id}/images", response_model=dict,
             status_code=status.HTTP_201_CREATED, summary="Upload property image URL")
async def add_image(
    property_id: uuid.UUID,
    image_url:  str,
    is_primary: bool = False,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Property not found.")
    _check_owner_or_admin(prop, current_user)

    if is_primary:
        # Unset other primary images
        for img in prop.images:
            img.is_primary = False

    img = PropertyImage(property_id=property_id, image_url=image_url, is_primary=is_primary)
    db.add(img)
    await db.flush()
    return {"id": str(img.id), "image_url": img.image_url, "is_primary": img.is_primary}


@router.delete("/{property_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete a property image")
async def delete_image(
    property_id: uuid.UUID,
    image_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(PropertyImage).where(
            PropertyImage.id == image_id,
            PropertyImage.property_id == property_id,
        )
    )
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Image not found.")
    await db.delete(img)


# ── Videos ────────────────────────────────────────────────────────────────────

@router.post("/{property_id}/videos", response_model=dict,
             status_code=status.HTTP_201_CREATED, summary="Add property video URL")
async def add_video(
    property_id: uuid.UUID,
    video_url: str,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Property not found.")
    _check_owner_or_admin(prop, current_user)
    vid = PropertyVideo(property_id=property_id, video_url=video_url)
    db.add(vid)
    await db.flush()
    return {"id": str(vid.id), "video_url": vid.video_url}


# ── Amenities management ──────────────────────────────────────────────────────

@router.get("/amenities/list", response_model=List[AmenityOut], summary="List all amenities")
async def list_amenities(db: AsyncSession = Depends(get_db)) -> List[AmenityOut]:
    result = await db.execute(select(Amenity).order_by(Amenity.amenity_name))
    return [AmenityOut.model_validate(a) for a in result.scalars().all()]


@router.post("/amenities", response_model=AmenityOut, status_code=status.HTTP_201_CREATED,
             summary="Create a new amenity (Admin)")
async def create_amenity(
    payload: AmenityCreate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AmenityOut:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Admin only.")
    am = Amenity(amenity_name=payload.amenity_name)
    db.add(am)
    await db.flush()
    return AmenityOut.model_validate(am)
