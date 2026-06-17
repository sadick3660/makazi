"""
Property Pydantic schemas — create, update, output.
"""
from __future__ import annotations

import uuid
from typing import List, Optional

from pydantic import BaseModel, Field


# ── Amenity ───────────────────────────────────────────────────────────────────

class AmenityOut(BaseModel):
    id:           int
    amenity_name: Optional[str]
    model_config = {"from_attributes": True}


class AmenityCreate(BaseModel):
    amenity_name: str = Field(..., min_length=1, max_length=100)


# ── Property Image ────────────────────────────────────────────────────────────

class PropertyImageOut(BaseModel):
    id:          uuid.UUID
    image_url:   str
    is_primary:  bool
    model_config = {"from_attributes": True}


class PropertyVideoOut(BaseModel):
    id:        uuid.UUID
    video_url: Optional[str]
    model_config = {"from_attributes": True}


# ── Property Create ───────────────────────────────────────────────────────────

class PropertyCreate(BaseModel):
    property_type:      str = Field(..., description="HOSTEL | ROOM | APARTMENT | HOUSE")
    title:              str = Field(..., min_length=3, max_length=255)
    description:        Optional[str] = None
    location:           Optional[str] = None
    ward:               Optional[str] = None
    district:           Optional[str] = None
    city:               str = "Dar es Salaam"
    latitude:           Optional[float] = None
    longitude:          Optional[float] = None
    monthly_rent:       float = Field(..., gt=0)
    bedrooms:           Optional[int] = Field(default=None, ge=0)
    bathrooms:          Optional[int] = Field(default=None, ge=0)
    size_sqm:           Optional[float] = None
    gender_restriction: Optional[str] = None     # MALE | FEMALE | MIXED
    capacity:           Optional[int] = None
    amenity_ids:        List[int] = []


# ── Property Update ───────────────────────────────────────────────────────────

class PropertyUpdate(BaseModel):
    title:               Optional[str] = None
    description:         Optional[str] = None
    location:            Optional[str] = None
    ward:                Optional[str] = None
    monthly_rent:        Optional[float] = Field(default=None, gt=0)
    bedrooms:            Optional[int] = None
    bathrooms:           Optional[int] = None
    size_sqm:            Optional[float] = None
    gender_restriction:  Optional[str] = None
    capacity:            Optional[int] = None
    availability_status: Optional[str] = None
    amenity_ids:         Optional[List[int]] = None


# ── Property Out ──────────────────────────────────────────────────────────────

class LandlordBrief(BaseModel):
    id:         uuid.UUID
    first_name: Optional[str]
    last_name:  Optional[str]
    email:      str
    phone:      Optional[str]
    model_config = {"from_attributes": True}


class PropertyOut(BaseModel):
    id:                  uuid.UUID
    landlord_id:         uuid.UUID
    landlord:            Optional[LandlordBrief]
    property_type:       str
    title:               Optional[str]
    description:         Optional[str]
    location:            Optional[str]
    ward:                Optional[str]
    district:            Optional[str]
    city:                str
    latitude:            Optional[float]
    longitude:           Optional[float]
    monthly_rent:        Optional[float]
    bedrooms:            Optional[int]
    bathrooms:           Optional[int]
    size_sqm:            Optional[float]
    gender_restriction:  Optional[str]
    capacity:            Optional[int]
    availability_status: str
    is_verified:         bool
    view_count:          int
    images:              List[PropertyImageOut]   = []
    videos:              List[PropertyVideoOut]   = []
    amenities:           List[AmenityOut]         = []
    created_at:          str
    updated_at:          str

    model_config = {"from_attributes": True}


# ── Search ────────────────────────────────────────────────────────────────────

class PropertySearchParams(BaseModel):
    query:              Optional[str]   = None
    ward:               Optional[str]   = None
    district:           Optional[str]   = None
    property_type:      Optional[str]   = None
    min_rent:           Optional[float] = None
    max_rent:           Optional[float] = None
    min_bedrooms:       Optional[int]   = None
    gender_restriction: Optional[str]   = None
    availability:       Optional[str]   = "AVAILABLE"
    page:               int             = Field(default=1, ge=1)
    limit:              int             = Field(default=20, ge=1, le=100)


class PaginatedProperties(BaseModel):
    results:      List[PropertyOut]
    total:        int
    page:         int
    limit:        int
    total_pages:  int
