"""
Review schemas.
"""
from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    property_id: uuid.UUID
    rating:      int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None


class ReviewOut(BaseModel):
    id:                uuid.UUID
    reviewer_id:       uuid.UUID
    property_id:       uuid.UUID
    landlord_id:       Optional[uuid.UUID]
    rating:            Optional[int]
    review_text:       Optional[str]
    sentiment:         Optional[str]
    moderation_status: str
    created_at:        str
    model_config = {"from_attributes": True}


class ReviewModerationUpdate(BaseModel):
    moderation_status: str = Field(..., description="PENDING | APPROVED | REJECTED")
