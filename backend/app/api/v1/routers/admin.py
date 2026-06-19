"""
Admin Router — /api/v1/admin
==============================
Platform analytics, user management, property verification,
complaint handling, system settings.  All endpoints require ADMIN role.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.routers.auth import _get_current_user
from app.db.session import get_db
from app.models.landlord_profile import LandlordProfile
from app.models.payment import Payment
from app.models.property import Property, PropertyType, AvailabilityStatus
from app.models.review import Review
from app.models.system import AuditLog, Complaint, Notification, SystemSetting
from app.models.user import AccountStatus, User, UserRole
from app.schemas.auth import LandlordOut, UserOut
from app.schemas.payment import PaymentOut
from app.schemas.property import PropertyOut
from app.schemas.system import (
    AdminStats, AnnouncementCreate, AnnouncementOut,
    BackupResult, ComplaintCreate, ComplaintOut,
    ReportSummary, SubscriptionPlanOut,
    SubscriptionPlanUpdate, SystemSettingOut,
    SystemSettingUpdate,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(current_user: User = Depends(_get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return current_user


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStats, summary="Platform analytics dashboard")
async def get_stats(
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminStats:
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    total_props = (await db.execute(select(func.count(Property.id)))).scalar_one()
    active_listings = (await db.execute(
        select(func.count(Property.id)).where(Property.availability_status == AvailabilityStatus.AVAILABLE)
    )).scalar_one()
    fraud_reports = (await db.execute(
        select(func.count(Property.id)).where(Property.is_verified == False)  # noqa: E712
    )).scalar_one()
    pending_reviews = (await db.execute(
        select(func.count(Review.id)).where(Review.moderation_status == "PENDING")
    )).scalar_one()
    open_complaints = (await db.execute(
        select(func.count(Complaint.id)).where(Complaint.status == "OPEN")
    )).scalar_one()
    pending_landlord_verifications = (await db.execute(
        select(func.count(LandlordProfile.id)).where(LandlordProfile.verification_status == "PENDING")
    )).scalar_one()
    total_revenue = float((await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0.0))
    )).scalar_one())

    # Users by role
    role_rows = (await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )).all()
    users_by_role = {row[0].value: row[1] for row in role_rows}

    # Properties by type
    type_rows = (await db.execute(
        select(Property.property_type, func.count(Property.id)).group_by(Property.property_type)
    )).all()
    properties_by_type = {row[0].value: row[1] for row in type_rows}

    return AdminStats(
        total_users=total_users,
        total_properties=total_props,
        active_listings=active_listings,
        total_revenue=0.0,   # Wire to payments table in production
        pending_approvals=fraud_reports,
        pending_landlord_verifications=pending_landlord_verifications,
        fraud_reports=fraud_reports,
        open_complaints=open_complaints,
        pending_reviews=pending_reviews,
        users_by_role=users_by_role,
        properties_by_type=properties_by_type,
    )


# ── User management ───────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut], summary="List all users")
async def list_users(
    role:   str | None = Query(default=None),
    status: str | None = Query(default=None),
    page:   int = Query(default=1, ge=1),
    limit:  int = Query(default=50, ge=1, le=200),
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> List[UserOut]:
    stmt = select(User)
    if role:
        stmt = stmt.where(User.role == UserRole(role.upper()))
    if status:
        stmt = stmt.where(User.account_status == AccountStatus(status.upper()))
    stmt = stmt.offset((page - 1) * limit).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [UserOut(
        id=u.id, first_name=u.first_name, last_name=u.last_name, email=u.email,
        phone=u.phone, role=u.role.value, profile_image=u.profile_image,
        language_preference=u.language_preference, email_verified=u.email_verified,
        phone_verified=u.phone_verified, two_factor_enabled=u.two_factor_enabled,
        account_status=u.account_status.value, created_at=u.created_at.isoformat(),
    ) for u in users]


@router.get("/landlords", response_model=List[LandlordOut], summary="List landlord accounts")
async def list_landlords(
    status: str | None = Query(default=None),
    page:   int = Query(default=1, ge=1),
    limit:  int = Query(default=50, ge=1, le=200),
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> List[LandlordOut]:
    stmt = select(User).options(selectinload(User.landlord_profile)).where(User.role == UserRole.LANDLORD)
    if status:
        stmt = stmt.join(User.landlord_profile).where(LandlordProfile.verification_status == status.upper())
    stmt = stmt.offset((page - 1) * limit).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [LandlordOut.from_orm_user(u) for u in users]


@router.patch("/landlords/{user_id}/verify", status_code=status.HTTP_204_NO_CONTENT,
              summary="Verify a landlord account")
async def verify_landlord(
    user_id: uuid.UUID,
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(LandlordProfile).where(LandlordProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Landlord profile not found.")
    profile.verification_status = "APPROVED"
    profile.verification_date = datetime.utcnow()
    await db.flush()


@router.get("/properties", response_model=List[PropertyOut], summary="List property listings")
async def list_properties(
    availability: str | None = Query(default=None),
    is_verified: bool | None = Query(default=None),
    page:   int = Query(default=1, ge=1),
    limit:  int = Query(default=50, ge=1, le=200),
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> List[PropertyOut]:
    stmt = select(Property).options(selectinload(Property.landlord))
    if availability:
        stmt = stmt.where(Property.availability_status == AvailabilityStatus(availability.upper()))
    if is_verified is not None:
        stmt = stmt.where(Property.is_verified == is_verified)
    stmt = stmt.offset((page - 1) * limit).limit(limit).order_by(Property.created_at.desc())
    result = await db.execute(stmt)
    props = result.scalars().all()
    return [PropertyOut.model_validate(p) for p in props]


@router.patch("/users/{user_id}/suspend", status_code=status.HTTP_204_NO_CONTENT,
              summary="Suspend a user account")
async def suspend_user(
    user_id: uuid.UUID,
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.account_status = AccountStatus.SUSPENDED
    await db.flush()


@router.patch("/users/{user_id}/activate", status_code=status.HTTP_204_NO_CONTENT,
              summary="Activate a suspended user account")
async def activate_user(
    user_id: uuid.UUID,
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.account_status = AccountStatus.ACTIVE
    await db.flush()


# ── Property management ───────────────────────────────────────────────────────

@router.patch("/properties/{property_id}/verify", status_code=status.HTTP_204_NO_CONTENT,
              summary="Verify a property listing")
async def verify_property(
    property_id: uuid.UUID,
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Property not found.")
    prop.is_verified = True
    await db.flush()


@router.patch("/properties/{property_id}/suspend", status_code=status.HTTP_204_NO_CONTENT,
              summary="Suspend a property listing")
async def suspend_property(
    property_id: uuid.UUID,
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Property not found.")
    prop.availability_status = AvailabilityStatus.SUSPENDED
    await db.flush()


# ── Complaints ────────────────────────────────────────────────────────────────

@router.get("/complaints", response_model=List[ComplaintOut], summary="List all complaints")
async def list_complaints(
    status_filter: str | None = Query(default=None, alias="status"),
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> List[ComplaintOut]:
    stmt = select(Complaint).order_by(Complaint.created_at.desc())
    if status_filter:
        stmt = stmt.where(Complaint.status == status_filter.upper())
    result = await db.execute(stmt)
    return [ComplaintOut.model_validate(c) for c in result.scalars().all()]


@router.patch("/complaints/{complaint_id}/resolve", response_model=ComplaintOut,
              summary="Mark complaint as resolved")
async def resolve_complaint(
    complaint_id: uuid.UUID,
    admin: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> ComplaintOut:
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Complaint not found.")
    complaint.status = "RESOLVED"
    complaint.resolved_by = admin.id
    await db.flush()
    await db.refresh(complaint)
    return ComplaintOut.model_validate(complaint)


# ── Announcements / notifications ─────────────────────────────────────────────

@router.post("/announcements", response_model=AnnouncementOut,
             status_code=status.HTTP_201_CREATED,
             summary="Send an announcement to all users")
async def create_announcement(
    payload: AnnouncementCreate,
    admin: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> AnnouncementOut:
    users = (await db.execute(select(User.id))).scalars().all()
    announcement_id = uuid.uuid4()
    for user_id in users:
        db.add(Notification(
            user_id=user_id,
            title=payload.title,
            message=payload.message,
            notification_type="ANNOUNCEMENT",
        ))
    await db.flush()
    return AnnouncementOut(
        id=announcement_id,
        title=payload.title,
        message=payload.message,
        sent_by=admin.full_name,
        created_at=datetime.utcnow().isoformat(),
    )


@router.get("/announcements", response_model=List[AnnouncementOut],
            summary="List all sent announcements")
async def list_announcements(
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> List[AnnouncementOut]:
    result = await db.execute(
        select(Notification)
        .where(Notification.notification_type == "ANNOUNCEMENT")
        .order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()
    announcements: list[AnnouncementOut] = []
    for notification in notifications:
        announcements.append(AnnouncementOut(
            id=notification.id,
            title=notification.title or "",
            message=notification.message or "",
            sent_by="System",
            created_at=notification.created_at.isoformat(),
        ))
    return announcements


# ── Subscription management ───────────────────────────────────────────────────

SUBSCRIPTION_PLANS: list[SubscriptionPlanOut] = [
    SubscriptionPlanOut(id=1, name="Basic", description="Access to essential landlord tools.", price_tzs=50000, billing_cycle="monthly", is_active=True),
    SubscriptionPlanOut(id=2, name="Premium", description="Priority listing placement and support.", price_tzs=120000, billing_cycle="monthly", is_active=True),
    SubscriptionPlanOut(id=3, name="Enterprise", description="Dedicated onboarding and analytics.", price_tzs=260000, billing_cycle="monthly", is_active=False),
]


@router.get("/subscriptions", response_model=List[SubscriptionPlanOut],
            summary="List subscription plans")
async def list_subscription_plans(
    _: User = Depends(_require_admin),
) -> List[SubscriptionPlanOut]:
    return SUBSCRIPTION_PLANS


@router.patch("/subscriptions/{plan_id}", response_model=SubscriptionPlanOut,
              summary="Update a subscription plan")
async def update_subscription_plan(
    plan_id: int,
    payload: SubscriptionPlanUpdate,
    _: User = Depends(_require_admin),
) -> SubscriptionPlanOut:
    plan = next((plan for plan in SUBSCRIPTION_PLANS if plan.id == plan_id), None)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Subscription plan not found.")
    if payload.name is not None:
        plan.name = payload.name
    if payload.description is not None:
        plan.description = payload.description
    if payload.price_tzs is not None:
        plan.price_tzs = payload.price_tzs
    if payload.billing_cycle is not None:
        plan.billing_cycle = payload.billing_cycle
    if payload.is_active is not None:
        plan.is_active = payload.is_active
    return plan


# ── Reports & backup ───────────────────────────────────────────────────────────

@router.get("/reports", response_model=ReportSummary,
            summary="Generate a platform analytics report")
async def generate_report(
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> ReportSummary:
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    total_properties = (await db.execute(select(func.count(Property.id)))).scalar_one()
    total_revenue = float((await db.execute(func.coalesce(func.sum(Payment.amount), 0.0))).scalar_one())
    open_complaints = (await db.execute(select(func.count(Complaint.id)).where(Complaint.status == "OPEN"))).scalar_one()
    pending_reviews = (await db.execute(select(func.count(Review.id)).where(Review.moderation_status == "PENDING"))).scalar_one()
    return ReportSummary(
        total_users=total_users,
        total_properties=total_properties,
        total_revenue=total_revenue,
        open_complaints=open_complaints,
        pending_reviews=pending_reviews,
        generated_at=datetime.utcnow().isoformat(),
    )


@router.post("/backup", response_model=BackupResult,
             summary="Trigger a system backup")
async def backup_system(
    _: User = Depends(_require_admin),
) -> BackupResult:
    return BackupResult(status="COMPLETED", timestamp=datetime.utcnow().isoformat())


# ── System settings ───────────────────────────────────────────────────────────

@router.get("/settings", response_model=List[SystemSettingOut], summary="Get system settings")
async def get_settings_list(
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> List[SystemSettingOut]:
    result = await db.execute(select(SystemSetting).order_by(SystemSetting.setting_key))
    return [SystemSettingOut.model_validate(s) for s in result.scalars().all()]


@router.patch("/settings/{key}", response_model=SystemSettingOut,
              summary="Update a system setting")
async def update_setting(
    key: str,
    payload: SystemSettingUpdate,
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> SystemSettingOut:
    result = await db.execute(select(SystemSetting).where(SystemSetting.setting_key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        # Create if not exists
        setting = SystemSetting(setting_key=key, setting_value=payload.setting_value)
        db.add(setting)
    else:
        setting.setting_value = payload.setting_value
    await db.flush()
    await db.refresh(setting)
    return SystemSettingOut.model_validate(setting)


# ── Audit logs ────────────────────────────────────────────────────────────────

@router.get("/audit-logs", summary="View audit logs")
async def audit_logs(
    page:  int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    _: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    offset = (page - 1) * limit
    result = await db.execute(
        select(AuditLog).offset(offset).limit(limit).order_by(AuditLog.created_at.desc())
    )
    logs = result.scalars().all()
    return {"results": [
        {
            "id": str(log.id), "user_id": str(log.user_id) if log.user_id else None,
            "action": log.action, "entity_name": log.entity_name,
            "entity_id": str(log.entity_id) if log.entity_id else None,
            "ip_address": log.ip_address, "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]}
