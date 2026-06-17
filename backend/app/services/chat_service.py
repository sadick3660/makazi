"""
Chat / Conversation Orchestrator
=================================
Bridges the NLP engine with the search and price services,
generating human-readable bilingual (Swahili/English) replies.
"""
from __future__ import annotations

import uuid
from typing import Optional

from app.schemas.nlp import ConversationRequest, ConversationResponse, ParsedIntent
from app.services.nlp_engine import parse_user_message

# ---------------------------------------------------------------------------
# Reply templates (bilingual Swahili / English)
# ---------------------------------------------------------------------------

_REPLY_SEARCH = (
    "Nimeelewa! Unaitafuta {property_type} {ward_info}hadi TZS {budget}. "
    "Naangalia orodha za nyumba zilizopo — I'm searching available listings for you now."
)

_REPLY_SEARCH_NO_BUDGET = (
    "Nimeelewa! Unaitafuta {property_type} {ward_info}. "
    "Naangalia orodha — searching available listings now."
)

_REPLY_PREDICT = (
    "Sawa! Nitakusaidia kupata bei ya haki {ward_info}. "
    "Let me calculate a fair market price estimate — tafadhali subiri kidogo."
)

_REPLY_AMENITY = (
    "Karibu! Nitakuonyesha amenities zilizo karibu {ward_info}. "
    "Showing nearby cafeterias, hospitals, and transit nodes for you."
)

_REPLY_UNKNOWN = (
    "Samahani, sijaelewa vizuri. Unaweza kuandika tena? "
    "Sorry, I didn't quite understand. Could you rephrase? "
    "Try: 'Natafuta chumba Sinza kisichozidi 200,000' or 'What is the fair price for Mwenge?'"
)

_REPLY_WELCOME = (
    "Karibu! Mimi ni msaidizi wa kutafuta nyumba Kinondoni. "
    "Welcome! I help you find accommodation in Kinondoni. "
    "Try: 'Natafuta chumba Mwenge kisichozidi 150,000'"
)


def _format_ward(ward: Optional[str]) -> str:
    return f"katika {ward} " if ward else ""


def _format_budget(budget: Optional[float]) -> str:
    if budget is None:
        return "yoyote"
    return f"{budget:,.0f}"


def _format_property_type(ptype: Optional[str]) -> str:
    return ptype if ptype else "nyumba/chumba"


def generate_reply(intent: ParsedIntent) -> str:
    """Generate a contextual bilingual reply based on parsed intent."""
    ward_info = _format_ward(intent.geographical_bounds.target_ward)
    budget = intent.financial_constraints.max_budget_limit
    ptype = _format_property_type(intent.structural_requirements.property_type)

    if intent.parsed_intent == "search_accommodation":
        if budget:
            return _REPLY_SEARCH.format(
                property_type=ptype,
                ward_info=ward_info,
                budget=_format_budget(budget),
            )
        return _REPLY_SEARCH_NO_BUDGET.format(
            property_type=ptype,
            ward_info=ward_info,
        )

    if intent.parsed_intent == "predict_fair_price":
        return _REPLY_PREDICT.format(ward_info=ward_info)

    if intent.parsed_intent == "view_amenities":
        return _REPLY_AMENITY.format(ward_info=ward_info)

    return _REPLY_UNKNOWN


# ---------------------------------------------------------------------------
# Session-aware conversation handler
# ---------------------------------------------------------------------------

class ConversationSession:
    """Lightweight in-memory session — replace with Redis for production scale."""

    _sessions: dict[str, list[dict]] = {}

    @classmethod
    def get_or_create(cls, session_id: Optional[str]) -> str:
        sid = session_id or str(uuid.uuid4())
        if sid not in cls._sessions:
            cls._sessions[sid] = []
        return sid

    @classmethod
    def append(cls, session_id: str, role: str, content: str) -> None:
        cls._sessions.setdefault(session_id, []).append(
            {"role": role, "content": content}
        )

    @classmethod
    def history(cls, session_id: str) -> list[dict]:
        return cls._sessions.get(session_id, [])


async def process_conversation(
    request: ConversationRequest,
) -> ConversationResponse:
    """
    Full conversation turn:
    1. Resolve / create session
    2. Parse NLP intent from user message
    3. Generate bilingual reply
    4. Log turn to session history
    """
    session_id = ConversationSession.get_or_create(request.session_id)

    # Log user message
    ConversationSession.append(session_id, "user", request.message)

    # Run NLP pipeline
    parsed = parse_user_message(request.message)
    reply = generate_reply(parsed)

    # Log assistant reply
    ConversationSession.append(session_id, "assistant", reply)

    # Determine downstream action hint for the front-end
    action_map = {
        "search_accommodation": "TRIGGER_SEARCH",
        "predict_fair_price": "TRIGGER_PRICE_PREDICT",
        "view_amenities": "TRIGGER_AMENITIES",
        "unknown": None,
    }
    action = action_map.get(parsed.parsed_intent)

    return ConversationResponse(
        session_id=session_id,
        reply=reply,
        parsed_intent=parsed,
        action_triggered=action,
    )
