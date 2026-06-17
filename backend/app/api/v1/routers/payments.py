"""
Payments Router — /api/v1/payments
====================================
M-Pesa / Airtel / Tigo payment initiation and history.
Payment processing is stubbed — integrate Vodacom/Airtel APIs in production.
"""
from __future__ import annotations

import random
import string
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routers.auth import _get_current_user
from app.db.session import get_db
from app.models.payment import Payment, Receipt
from app.models.user import User
from app.schemas.payment import PaymentInitiate, PaymentOut, ReceiptOut

router = APIRouter(prefix="/payments", tags=["Payments"])

ALLOWED_METHODS = {"MPESA", "AIRTEL", "TIGO", "HALOPESA", "CARD"}


def _gen_ref() -> str:
    return "TXN" + "".join(random.choices(string.ascii_uppercase + string.digits, k=12))


def _gen_receipt() -> str:
    return "RCT" + "".join(random.choices(string.digits, k=8))


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED,
             summary="Initiate a payment (M-Pesa, Airtel, Tigo, HaloPesa, Card)")
async def initiate_payment(
    payload: PaymentInitiate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaymentOut:
    if payload.payment_method.upper() not in ALLOWED_METHODS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Payment method must be one of: {', '.join(ALLOWED_METHODS)}",
        )

    # In production: call Vodacom / Airtel push API here, wait for callback
    payment = Payment(
        user_id=current_user.id,
        property_id=payload.property_id,
        amount=payload.amount,
        payment_method=payload.payment_method.upper(),
        transaction_reference=_gen_ref(),
        payment_status="PENDING",
    )
    db.add(payment)
    await db.flush()

    # Auto-generate receipt for completed payments (stub sets COMPLETED)
    payment.payment_status = "COMPLETED"
    payment.paid_at = datetime.now(timezone.utc)
    receipt = Receipt(
        payment_id=payment.id,
        receipt_number=_gen_receipt(),
        receipt_url=f"https://receipts.nyumbalink.co.tz/{payment.id}",
    )
    db.add(receipt)
    await db.flush()
    await db.refresh(payment)
    return PaymentOut.model_validate(payment)


@router.get("/history", response_model=List[PaymentOut], summary="My payment history")
async def payment_history(
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[PaymentOut]:
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.paid_at.desc())
    )
    return [PaymentOut.model_validate(p) for p in result.scalars().all()]


@router.get("/{payment_id}/receipt", response_model=ReceiptOut, summary="Get payment receipt")
async def get_receipt(
    payment_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReceiptOut:
    result = await db.execute(
        select(Receipt).where(Receipt.payment_id == payment_id)
    )
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Receipt not found.")
    return ReceiptOut.model_validate(receipt)
