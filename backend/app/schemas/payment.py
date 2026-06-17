"""
Payment schemas.
"""
from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel, Field


class PaymentInitiate(BaseModel):
    property_id:    uuid.UUID
    amount:         float = Field(..., gt=0)
    payment_method: str = Field(..., description="MPESA | AIRTEL | TIGO | HALOPESA | CARD")
    phone_number:   Optional[str] = None
    description:    Optional[str] = None


class PaymentOut(BaseModel):
    id:                    uuid.UUID
    user_id:               uuid.UUID
    property_id:           Optional[uuid.UUID]
    amount:                Optional[float]
    payment_method:        Optional[str]
    transaction_reference: Optional[str]
    payment_status:        Optional[str]
    paid_at:               Optional[str]
    model_config = {"from_attributes": True}


class ReceiptOut(BaseModel):
    id:             uuid.UUID
    payment_id:     uuid.UUID
    receipt_number: Optional[str]
    receipt_url:    Optional[str]
    generated_at:   str
    model_config = {"from_attributes": True}
