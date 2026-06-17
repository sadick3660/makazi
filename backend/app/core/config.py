"""
Application configuration management using Pydantic Settings.
Loads values from environment variables / .env file with strict typing.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_ENV: str = "development"
    APP_TITLE: str = "Kinondoni Housing Intelligence API"
    APP_VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str
    SYNC_DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Google Maps
    GOOGLE_MAPS_API_KEY: str = ""

    # ML Model artifact path
    MODEL_ARTIFACT_PATH: str = "./app/ml/artifacts/price_model.joblib"

    # CORS allowed origins (comma-separated in env)
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    # Geospatial constants — Kinondoni Municipality bounding box (WGS 84)
    KINONDONI_BBOX_MIN_LNG: float = 39.20
    KINONDONI_BBOX_MAX_LNG: float = 39.35
    KINONDONI_BBOX_MIN_LAT: float = -6.85
    KINONDONI_BBOX_MAX_LAT: float = -6.72

    # Target wards within Kinondoni
    TARGET_WARDS: List[str] = [
        "Mikocheni",
        "Mwananyamala",
        "Kijitonyama",
        "Mwenge",
        "Mabatini",
        "Makumbusho",
        "Sinza",
    ]

    # Search radius cap (metres)
    MAX_SEARCH_RADIUS_METRES: float = 5000.0
    DEFAULT_SEARCH_RADIUS_METRES: float = 2000.0


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()
