"""
Pydantic v2 schemas for NLP / conversational engine request-response contracts.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ConversationRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None


class GeographicalBounds(BaseModel):
    target_municipality: str = "Kinondoni"
    target_ward: Optional[str] = None


class FinancialConstraints(BaseModel):
    max_budget_limit: Optional[float] = None
    min_budget_limit: Optional[float] = None
    currency_code: str = "TZS"


class StructuralRequirements(BaseModel):
    property_type: Optional[str] = None
    min_rooms: Optional[int] = None


class ParsedIntent(BaseModel):
    parsed_intent: Literal["search_accommodation", "predict_fair_price", "view_amenities", "unknown"]
    geographical_bounds: GeographicalBounds
    financial_constraints: FinancialConstraints
    structural_requirements: StructuralRequirements
    raw_normalized_text: str
    confidence: float = Field(ge=0.0, le=1.0)


class ConversationResponse(BaseModel):
    session_id: str
    reply: str
    parsed_intent: Optional[ParsedIntent] = None
    action_triggered: Optional[str] = None
