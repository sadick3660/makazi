"""
Reviews Router — /api/v1/reviews
==================================
Property and landlord reviews with moderation.
"""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routers.auth import _get_current_user
from app.db.session import get_db
from app.models.review import Review
from app.models.user import User, UserRole
from app.schemas.review import ReviewCreate, ReviewModerationUpdate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED,
             summary="Submit a property review")
async def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewOut:
    review = Review(
        reviewer_id=current_user.id,
        property_id=payload.property_id,
        rating=payload.rating,
        review_text=payload.review_text,
        # Simple rule-based sentiment — replace with OpenAI in production
        sentiment=_simple_sentiment(payload.review_text),
        moderation_status="PENDING",
    )
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return ReviewOut.model_validate(review)


@router.get("/property/{property_id}", response_model=List[ReviewOut],
            summary="Get all approved reviews for a property")
async def get_property_reviews(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> List[ReviewOut]:
    result = await db.execute(
        select(Review)
        .where(Review.property_id == property_id, Review.moderation_status == "APPROVED")
        .order_by(Review.created_at.desc())
    )
    return [ReviewOut.model_validate(r) for r in result.scalars().all()]


@router.get("/pending", response_model=List[ReviewOut],
            summary="List pending reviews for moderation (Admin)")
async def pending_reviews(
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ReviewOut]:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Admin only.")
    result = await db.execute(
        select(Review).where(Review.moderation_status == "PENDING").order_by(Review.created_at)
    )
    return [ReviewOut.model_validate(r) for r in result.scalars().all()]


@router.patch("/{review_id}/moderate", response_model=ReviewOut,
              summary="Approve or reject a review (Admin)")
async def moderate_review(
    review_id: uuid.UUID,
    payload: ReviewModerationUpdate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewOut:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Admin only.")
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Review not found.")
    review.moderation_status = payload.moderation_status
    await db.flush()
    await db.refresh(review)
    return ReviewOut.model_validate(review)


def _simple_sentiment(text: str | None) -> str:
    """Very basic rule-based sentiment until OpenAI integration is wired."""
    if not text:
        return "NEUTRAL"
    text_lower = text.lower()
    pos = ["good", "great", "excellent", "clean", "nice", "perfect", "happy", "love", "best"]
    neg = ["bad", "dirty", "terrible", "awful", "worst", "problem", "issue", "broken", "noisy"]
    score = sum(1 for w in pos if w in text_lower) - sum(1 for w in neg if w in text_lower)
    if score > 0:
        return "POSITIVE"
    if score < 0:
        return "NEGATIVE"
    return "NEUTRAL"
