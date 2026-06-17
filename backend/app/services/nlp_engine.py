"""
Conversational Engine Pipeline & Code-Switch Parser
====================================================
Handles bilingual Swahili/English input normalization, intent classification,
and named entity recognition with slang/typo correction for Kinondoni wards.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Optional

from rapidfuzz import process, fuzz

from app.schemas.nlp import (
    FinancialConstraints,
    GeographicalBounds,
    ParsedIntent,
    StructuralRequirements,
)

# ---------------------------------------------------------------------------
# Ward normalisation map — slang, abbreviations, and common typos → canonical
# ---------------------------------------------------------------------------
_WARD_ALIASES: dict[str, str] = {
    # Mikocheni
    "mikocheni": "Mikocheni",
    "miko": "Mikocheni",
    "mikochenni": "Mikocheni",
    "mikochenny": "Mikocheni",
    # Mwananyamala
    "mwananyamala": "Mwananyamala",
    "mwana": "Mwananyamala",
    "mwananymala": "Mwananyamala",
    "mwananyamal": "Mwananyamala",
    # Kijitonyama
    "kijitonyama": "Kijitonyama",
    "kijito": "Kijitonyama",
    "kjitonyama": "Kijitonyama",
    "kijitonyma": "Kijitonyama",
    # Mwenge
    "mwenge": "Mwenge",
    "mwengge": "Mwenge",
    "mweng": "Mwenge",
    # Mabatini
    "mabatini": "Mabatini",
    "mabatni": "Mabatini",
    "mabat": "Mabatini",
    # Makumbusho
    "makumbusho": "Makumbusho",
    "makumbu": "Makumbusho",
    "makumbusho ya taifa": "Makumbusho",
    # Sinza
    "sinza": "Sinza",
    "sinz": "Sinza",
    "sinnza": "Sinza",
}

_CANONICAL_WARDS = list(set(_WARD_ALIASES.values()))

# ---------------------------------------------------------------------------
# Swahili/English keyword maps for intent + entity extraction
# ---------------------------------------------------------------------------

_INTENT_SEARCH_KEYWORDS = {
    "natafuta", "tafuta", "search", "find", "looking",
    "ninapotafuta", "nahitaji", "need", "want", "pata",
    "inapatikana", "available", "onyesha", "show",
}

_INTENT_PREDICT_KEYWORDS = {
    "bei", "price", "cost", "gharama", "predict", "estimate",
    "thamani", "value", "bei ya haki", "fair price", "punguza",
    "overpriced", "expensive", "ghali",
}

_INTENT_AMENITY_KEYWORDS = {
    "amenity", "amenities", "cafeteria", "chakula", "food",
    "hospital", "hospitali", "daktari", "transport", "usafiri",
    "daladala", "bus", "transit", "karibu", "nearby", "jirani",
}

_PROPERTY_TYPE_MAP = {
    "chumba": "room",
    "nyumba": "house",
    "ghorofa": "apartment",
    "flat": "apartment",
    "apartment": "apartment",
    "house": "house",
    "room": "room",
    "bedsitter": "bedsitter",
    "studio": "studio",
}

# Currency patterns — handles "150000", "150,000", "150k", "tsh 150000"
_CURRENCY_PATTERN = re.compile(
    r"(?:tsh|tzs|sh)?\s*(\d{1,3}(?:[,\s]\d{3})*|\d+)(?:\s*k\b)?",
    re.IGNORECASE,
)

_BUDGET_CEILING_KEYWORDS = re.compile(
    r"(?:kisichozidi|zaidi ya|max|maximum|below|under|chini ya|hadi)\s*"
    r"(?:tsh|tzs|sh)?\s*(\d{1,3}(?:[,\s]\d{3})*|\d+)(?:k)?",
    re.IGNORECASE,
)

_BUDGET_FLOOR_KEYWORDS = re.compile(
    r"(?:angalau|at least|minimum|min|zaidi|above|above|juu ya)\s*"
    r"(?:tsh|tzs|sh)?\s*(\d{1,3}(?:[,\s]\d{3})*|\d+)(?:k)?",
    re.IGNORECASE,
)

_ROOM_COUNT_PATTERN = re.compile(
    r"(\d+)\s*(?:rooms?|vyumba|chumba|bedrooms?|bed)",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Text normalisation helpers
# ---------------------------------------------------------------------------

def _strip_accents(text: str) -> str:
    """Remove diacritics so accented Swahili chars normalise cleanly."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def normalize_text(raw: str) -> str:
    """
    Linguistic Normalisation Block:
    1. Unicode normalisation + accent stripping
    2. Lowercase
    3. Collapse repeated whitespace
    4. Remove non-alphanumeric except spaces, commas, apostrophes
    5. Fix common Swahili/English bilingual typos
    """
    text = _strip_accents(raw.strip())
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    # Keep letters, digits, spaces, commas, apostrophes, hyphens
    text = re.sub(r"[^\w\s,'\-]", " ", text, flags=re.UNICODE)
    # Common typo corrections
    corrections: dict[str, str] = {
        "natafut ": "natafuta ",
        "chumba ": "chumba ",
        "nyumba ": "nyumba ",
        "hospitali ": "hospitali ",
    }
    for wrong, right in corrections.items():
        text = text.replace(wrong, right)
    return re.sub(r"\s+", " ", text).strip()


# ---------------------------------------------------------------------------
# Ward NER
# ---------------------------------------------------------------------------

def extract_ward(text: str) -> Optional[str]:
    """
    Named Entity Recognition — ward extraction with fuzzy matching.
    Maps slang / typo variants to canonical ward names using RapidFuzz.
    """
    tokens = text.lower().split()

    # 1. Exact alias lookup (single and bigram tokens)
    for i, token in enumerate(tokens):
        if token in _WARD_ALIASES:
            return _WARD_ALIASES[token]
        if i < len(tokens) - 1:
            bigram = f"{token} {tokens[i+1]}"
            if bigram in _WARD_ALIASES:
                return _WARD_ALIASES[bigram]

    # 2. Fuzzy match against canonical ward list (threshold 80)
    result = process.extractOne(
        text,
        _CANONICAL_WARDS,
        scorer=fuzz.partial_ratio,
        score_cutoff=80,
    )
    if result:
        return result[0]

    # 3. Token-level fuzzy match
    for token in tokens:
        if len(token) < 4:
            continue
        match = process.extractOne(
            token,
            _CANONICAL_WARDS,
            scorer=fuzz.ratio,
            score_cutoff=78,
        )
        if match:
            return match[0]

    return None


# ---------------------------------------------------------------------------
# Budget extraction
# ---------------------------------------------------------------------------

def _parse_number(raw: str) -> float:
    """Convert '150,000', '150k', '150 000' → float."""
    cleaned = re.sub(r"[,\s]", "", raw.strip())
    if cleaned.endswith("k"):
        return float(cleaned[:-1]) * 1000
    return float(cleaned)


def extract_budget(text: str) -> tuple[Optional[float], Optional[float]]:
    """Return (max_budget, min_budget) from text, both in TZS."""
    max_budget: Optional[float] = None
    min_budget: Optional[float] = None

    ceiling_match = _BUDGET_CEILING_KEYWORDS.search(text)
    if ceiling_match:
        max_budget = _parse_number(ceiling_match.group(1))

    floor_match = _BUDGET_FLOOR_KEYWORDS.search(text)
    if floor_match:
        min_budget = _parse_number(floor_match.group(1))

    # Fallback: grab any standalone large number as max budget
    if max_budget is None:
        for match in _CURRENCY_PATTERN.finditer(text):
            try:
                val = _parse_number(match.group(1))
                if val >= 10_000:  # Plausible TZS rent
                    max_budget = val
                    break
            except ValueError:
                continue

    return max_budget, min_budget


# ---------------------------------------------------------------------------
# Property type extraction
# ---------------------------------------------------------------------------

def extract_property_type(text: str) -> Optional[str]:
    for keyword, ptype in _PROPERTY_TYPE_MAP.items():
        if keyword in text:
            return ptype
    return None


# ---------------------------------------------------------------------------
# Room count extraction
# ---------------------------------------------------------------------------

def extract_room_count(text: str) -> Optional[int]:
    match = _ROOM_COUNT_PATTERN.search(text)
    if match:
        return int(match.group(1))
    return None


# ---------------------------------------------------------------------------
# Intent Classification
# ---------------------------------------------------------------------------

def classify_intent(
    text: str,
) -> tuple[str, float]:
    """
    Classify text into one of three action states:
      - search_accommodation
      - predict_fair_price
      - view_amenities

    Returns (intent_label, confidence_score).
    """
    words = set(text.lower().split())

    search_score = len(words & _INTENT_SEARCH_KEYWORDS)
    predict_score = len(words & _INTENT_PREDICT_KEYWORDS)
    amenity_score = len(words & _INTENT_AMENITY_KEYWORDS)

    # Also score partial phrase matches
    for kw in _INTENT_SEARCH_KEYWORDS:
        if kw in text:
            search_score += 0.5
    for kw in _INTENT_PREDICT_KEYWORDS:
        if kw in text:
            predict_score += 0.5
    for kw in _INTENT_AMENITY_KEYWORDS:
        if kw in text:
            amenity_score += 0.5

    total = search_score + predict_score + amenity_score
    if total == 0:
        return "unknown", 0.0

    scores = {
        "search_accommodation": search_score,
        "predict_fair_price": predict_score,
        "view_amenities": amenity_score,
    }
    best_intent = max(scores, key=lambda k: scores[k])
    confidence = round(scores[best_intent] / total, 4)
    return best_intent, min(confidence, 1.0)


# ---------------------------------------------------------------------------
# Main pipeline entry point
# ---------------------------------------------------------------------------

def parse_user_message(raw_text: str) -> ParsedIntent:
    """
    Full NLP pipeline:
    1. Normalize → 2. Classify intent → 3. Extract entities

    Example:
        Input:  "Natafuta chumba Mwenge kisichozidi 150,000"
        Output: ParsedIntent(
                    parsed_intent="search_accommodation",
                    geographical_bounds=GeographicalBounds(target_ward="Mwenge"),
                    financial_constraints=FinancialConstraints(max_budget_limit=150000.0),
                    structural_requirements=StructuralRequirements(property_type="room"),
                )
    """
    normalized = normalize_text(raw_text)
    intent, confidence = classify_intent(normalized)
    ward = extract_ward(normalized)
    max_budget, min_budget = extract_budget(normalized)
    property_type = extract_property_type(normalized)
    room_count = extract_room_count(normalized)

    return ParsedIntent(
        parsed_intent=intent,  # type: ignore[arg-type]
        geographical_bounds=GeographicalBounds(
            target_municipality="Kinondoni",
            target_ward=ward,
        ),
        financial_constraints=FinancialConstraints(
            max_budget_limit=max_budget,
            min_budget_limit=min_budget,
            currency_code="TZS",
        ),
        structural_requirements=StructuralRequirements(
            property_type=property_type,
            min_rooms=room_count,
        ),
        raw_normalized_text=normalized,
        confidence=confidence,
    )
