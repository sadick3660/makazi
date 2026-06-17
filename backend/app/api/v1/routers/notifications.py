"""
Notifications Router — /api/v1/notifications
"""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routers.auth import _get_current_user
from app.db.session import get_db
from app.models.system import Notification
from app.models.user import User
from app.schemas.system import NotificationOut

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut], summary="Get my notifications")
async def list_notifications(
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[NotificationOut]:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return [NotificationOut.model_validate(n) for n in result.scalars().all()]


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT,
              summary="Mark notification as read")
async def mark_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.flush()


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT,
              summary="Mark all notifications as read")
async def mark_all_read(
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
    )
    for notif in result.scalars().all():
        notif.is_read = True
    await db.flush()
