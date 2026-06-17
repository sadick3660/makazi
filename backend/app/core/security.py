"""
Security utilities: password hashing, JWT token creation / verification,
and coordinate-level input sanitisation to prevent PostGIS injection.
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload.get("sub")
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# Geospatial parameter sanitisation
# ---------------------------------------------------------------------------

# Only digits, minus sign, and decimal point are valid in a coordinate string.
_COORD_PATTERN = re.compile(r"^-?\d{1,3}(\.\d{1,10})?$")


def sanitise_coordinate(value: float, label: str) -> float:
    """
    Reject coordinate values that fall outside plausible WGS-84 ranges
    and do not match the safe numeric pattern, preventing injection
    vectors into PostGIS query strings.
    """
    raw = str(value)
    if not _COORD_PATTERN.match(raw):
        raise ValueError(
            f"Coordinate '{label}' contains invalid characters: {raw!r}"
        )
    return float(raw)


def validate_kinondoni_bounds(lng: float, lat: float) -> tuple[float, float]:
    """
    Ensure the supplied coordinate pair lies within the Kinondoni
    Municipality bounding box (WGS 84).  Raises ValueError otherwise,
    preventing queries from escaping the geographic isolation target.
    """
    lng = sanitise_coordinate(lng, "longitude")
    lat = sanitise_coordinate(lat, "latitude")

    if not (settings.KINONDONI_BBOX_MIN_LNG <= lng <= settings.KINONDONI_BBOX_MAX_LNG):
        raise ValueError(
            f"Longitude {lng} is outside Kinondoni bounds "
            f"[{settings.KINONDONI_BBOX_MIN_LNG}, {settings.KINONDONI_BBOX_MAX_LNG}]."
        )
    if not (settings.KINONDONI_BBOX_MIN_LAT <= lat <= settings.KINONDONI_BBOX_MAX_LAT):
        raise ValueError(
            f"Latitude {lat} is outside Kinondoni bounds "
            f"[{settings.KINONDONI_BBOX_MIN_LAT}, {settings.KINONDONI_BBOX_MAX_LAT}]."
        )
    return lng, lat
