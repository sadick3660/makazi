"""
Payment request/response schemas for the backend API.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class PaymentInitiateRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Payment amount in TZS")
    phone: str = Field(..., min_length=10, max_length=13, description="M-Pesa phone number")
    description: Optional[str] = Field(default="Accommodation payment", max_length=255)
    property_id: Optional[str] = None
    payment_type: Literal["booking", "promotion", "subscription"] = "booking"


class PaymentOut(BaseModel):
    id: str
    user_id: str = "demo-user"
    property_id: Optional[str] = None
    type: Literal["booking", "promotion", "subscription"]
    amount: float
    currency: Literal["TZS"] = "TZS"
    status: Literal["pending", "completed", "failed", "refunded"] = "pending"
    mpesa_ref: str
    description: str
    created_at: str


class PaymentHistoryResponse(BaseModel):
    items: list[PaymentOut]
