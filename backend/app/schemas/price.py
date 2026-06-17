"""
Pydantic v2 schemas for the hedonic price prediction engine.
"""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.property import ElectricityConfig, WardName, WaterReliability


class PricePredictionRequest(BaseModel):
    ward: WardName = Field(..., description="Target ward within Kinondoni Municipality.")
    structural_rooms: int = Field(..., ge=1, le=50, description="Number of rooms.")
    water_reliability: WaterReliability = Field(..., description="Water supply reliability category.")
    electricity_config: ElectricityConfig = Field(..., description="Electricity configuration category.")
    distance_to_transit_m: float = Field(..., ge=0.0, description="Distance to nearest transit node in metres.")
    floor_area_sqm: float = Field(default=25.0, ge=5.0, description="Floor area in square metres.")
    is_furnished: bool = Field(default=False)
    has_wifi: bool = Field(default=False)


class VarianceRange(BaseModel):
    minimum_fair_boundary: float
    maximum_fair_boundary: float


class PricePredictionResponse(BaseModel):
    estimated_fair_market_value: float
    calculated_variance_range: VarianceRange
    confidence_score_metric: float = Field(ge=0.0, le=1.0)
    ward: str
    is_overpriced: bool = False
    overpriced_by_percent: float = 0.0
