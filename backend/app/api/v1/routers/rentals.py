"""
Rentals Router — /api/v1/rentals
=================================
Favorites, rental applications, appointments, and spatial search stub.
"""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routers.auth import _get_current_user
from app.db.session import get_db
from app.models.property import Property, AvailabilityStatus
from app.models.rental import Appointment, Favorite, RentalApplication
from app.models.user import User, UserRole
from app.schemas.rental import (
    AppointmentCreate, AppointmentOut, AppointmentStatusUpdate,
    ApplicationCreate, ApplicationOut, ApplicationStatusUpdate,
    FavoriteOut,
)

router = APIRouter(prefix="/rentals", tags=["Rentals"])


# ── Favorites ─────────────────────────────────────────────────────────────────

@router.get("/favorites", response_model=List[FavoriteOut], summary="List my favorites")
async def list_favorites(
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[FavoriteOut]:
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id).order_by(Favorite.created_at.desc())
    )
    return [FavoriteOut.model_validate(f) for f in result.scalars().all()]


@router.post("/favorites/{property_id}", response_model=FavoriteOut,
             status_code=status.HTTP_201_CREATED, summary="Add property to favorites")
async def add_favorite(
    property_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FavoriteOut:
    existing = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.property_id == property_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Already in favorites.")
    fav = Favorite(user_id=current_user.id, property_id=property_id)
    db.add(fav)
    await db.flush()
    await db.refresh(fav)
    return FavoriteOut.model_validate(fav)


@router.delete("/favorites/{property_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Remove from favorites")
async def remove_favorite(
    property_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.property_id == property_id)
    )
    fav = result.scalar_one_or_none()
    if not fav:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Not in favorites.")
    await db.delete(fav)


# ── Applications ──────────────────────────────────────────────────────────────

@router.post("/applications", response_model=ApplicationOut,
             status_code=status.HTTP_201_CREATED, summary="Apply for a rental")
async def apply(
    payload: ApplicationCreate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationOut:
    app = RentalApplication(
        seeker_id=current_user.id,
        property_id=payload.property_id,
        move_in_date=payload.move_in_date,
        message=payload.message,
    )
    db.add(app)
    await db.flush()
    await db.refresh(app)
    return ApplicationOut.model_validate(app)


@router.get("/applications/mine", response_model=List[ApplicationOut],
            summary="List my applications (Seeker)")
async def my_applications(
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ApplicationOut]:
    result = await db.execute(
        select(RentalApplication)
        .where(RentalApplication.seeker_id == current_user.id)
        .order_by(RentalApplication.applied_at.desc())
    )
    return [ApplicationOut.model_validate(a) for a in result.scalars().all()]


@router.get("/applications/property/{property_id}", response_model=List[ApplicationOut],
            summary="List applications for a property (Landlord / Admin)")
async def property_applications(
    property_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ApplicationOut]:
    result = await db.execute(
        select(RentalApplication)
        .where(RentalApplication.property_id == property_id)
        .order_by(RentalApplication.applied_at.desc())
    )
    return [ApplicationOut.model_validate(a) for a in result.scalars().all()]


@router.patch("/applications/{application_id}", response_model=ApplicationOut,
              summary="Update application status (Landlord / Admin)")
async def update_application(
    application_id: uuid.UUID,
    payload: ApplicationStatusUpdate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationOut:
    result = await db.execute(
        select(RentalApplication).where(RentalApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found.")
    app.application_status = payload.application_status
    await db.flush()
    await db.refresh(app)
    return ApplicationOut.model_validate(app)


# ── Appointments ──────────────────────────────────────────────────────────────

@router.post("/appointments", response_model=AppointmentOut,
             status_code=status.HTTP_201_CREATED, summary="Book a viewing appointment")
async def book_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AppointmentOut:
    appt = Appointment(
        seeker_id=current_user.id,
        property_id=payload.property_id,
        appointment_date=payload.appointment_date,
        notes=payload.notes,
    )
    db.add(appt)
    await db.flush()
    await db.refresh(appt)
    return AppointmentOut.model_validate(appt)


@router.get("/appointments/mine", response_model=List[AppointmentOut],
            summary="List my appointments")
async def my_appointments(
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[AppointmentOut]:
    result = await db.execute(
        select(Appointment)
        .where(Appointment.seeker_id == current_user.id)
        .order_by(Appointment.appointment_date)
    )
    return [AppointmentOut.model_validate(a) for a in result.scalars().all()]


@router.patch("/appointments/{appointment_id}", response_model=AppointmentOut,
              summary="Update appointment status")
async def update_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentStatusUpdate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AppointmentOut:
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    appt.status = payload.status
    await db.flush()
    await db.refresh(appt)
    return AppointmentOut.model_validate(appt)
