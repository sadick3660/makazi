"""
Rental schemas — favorites, applications, appointments.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Favorites ─────────────────────────────────────────────────────────────────

class FavoriteOut(BaseModel):
    id:          uuid.UUID
    user_id:     uuid.UUID
    property_id: uuid.UUID
    created_at:  str
    model_config = {"from_attributes": True}


# ── Applications ──────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    property_id:  uuid.UUID
    move_in_date: Optional[date] = None
    message:      Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    application_status: str = Field(..., description="PENDING | APPROVED | REJECTED | CANCELLED")


class ApplicationOut(BaseModel):
    id:                 uuid.UUID
    seeker_id:          uuid.UUID
    property_id:        uuid.UUID
    application_status: str
    move_in_date:       Optional[date]
    message:            Optional[str]
    applied_at:         str
    model_config = {"from_attributes": True}


# ── Appointments ──────────────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    property_id:      uuid.UUID
    appointment_date: datetime
    notes:            Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str = Field(..., description="PENDING | CONFIRMED | CANCELLED | COMPLETED")


class AppointmentOut(BaseModel):
    id:               uuid.UUID
    seeker_id:        uuid.UUID
    property_id:      uuid.UUID
    appointment_date: Optional[datetime]
    status:           str
    notes:            Optional[str]
    created_at:       str
    model_config = {"from_attributes": True}
