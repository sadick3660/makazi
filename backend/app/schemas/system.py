"""
System schemas — notifications, complaints, audit logs, settings, admin.
"""
from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id:                uuid.UUID
    user_id:           uuid.UUID
    title:             Optional[str]
    message:           Optional[str]
    notification_type: Optional[str]
    is_read:           bool
    created_at:        str
    model_config = {"from_attributes": True}


# ── Complaints ────────────────────────────────────────────────────────────────

class ComplaintCreate(BaseModel):
    property_id:    Optional[uuid.UUID] = None
    complaint_text: str = Field(..., min_length=10)


class ComplaintOut(BaseModel):
    id:             uuid.UUID
    complainant_id: uuid.UUID
    property_id:    Optional[uuid.UUID]
    complaint_text: Optional[str]
    status:         str
    resolved_by:    Optional[uuid.UUID]
    created_at:     str
    model_config = {"from_attributes": True}


# ── Settings ──────────────────────────────────────────────────────────────────

class SystemSettingOut(BaseModel):
    id:            int
    setting_key:   Optional[str]
    setting_value: Optional[str]
    updated_at:    str
    model_config = {"from_attributes": True}


class SystemSettingUpdate(BaseModel):
    setting_value: str


class AnnouncementCreate(BaseModel):
    title:   str = Field(..., min_length=4)
    message: str = Field(..., min_length=10)


class AnnouncementOut(BaseModel):
    id:         uuid.UUID
    title:      str
    message:    str
    sent_by:    str
    created_at: str
    model_config = {"from_attributes": True}


class SubscriptionPlanOut(BaseModel):
    id:            int
    name:          str
    description:   str
    price_tzs:     int
    billing_cycle: str
    is_active:     bool
    model_config = {"from_attributes": True}


class SubscriptionPlanUpdate(BaseModel):
    name:          str | None = None
    description:   str | None = None
    price_tzs:     int | None = None
    billing_cycle: str | None = None
    is_active:     bool | None = None


class ReportSummary(BaseModel):
    total_users:      int
    total_properties: int
    total_revenue:    float
    open_complaints:  int
    pending_reviews:  int
    generated_at:     str


class BackupResult(BaseModel):
    status:    str
    timestamp: str


# ── Admin dashboard stats ─────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users:                    int
    total_properties:               int
    active_listings:                int
    total_revenue:                  float
    pending_approvals:              int
    pending_landlord_verifications: int
    fraud_reports:                  int
    open_complaints:                int
    pending_reviews:                int
    users_by_role:                  Dict[str, int]
    properties_by_type:             Dict[str, int]
