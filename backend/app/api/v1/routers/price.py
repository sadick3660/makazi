"""
Price Prediction Router — /api/v1/predict-price
================================================
Exposes the XGBoost hedonic pricing engine to detect inflated broker listings.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.ml.price_predictor import price_predictor
from app.schemas.price import PricePredictionRequest, PricePredictionResponse

router = APIRouter(prefix="/predict-price", tags=["Price Intelligence"])


@router.post(
    "/",
    response_model=PricePredictionResponse,
    summary="Predict fair market rental value and detect dalali price inflation",
)
async def predict_price(
    payload: PricePredictionRequest,
) -> PricePredictionResponse:
    """
    Accepts structural property features and returns:
    - `estimated_fair_market_value` — XGBoost point estimate
    - `calculated_variance_range`   — ±10 % confidence band
    - `confidence_score_metric`     — model confidence [0, 1]

    If a `listed_price` is present in the request (optional extension),
    the engine compares it against the estimate and sets `is_overpriced`.
    """
    try:
        return price_predictor.predict(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Price prediction failed: {exc}",
        ) from exc


@router.post(
    "/flag-listing",
    response_model=PricePredictionResponse,
    summary="Compare a listed price against ML estimate to flag dalali inflation",
)
async def flag_listing_price(
    payload: PricePredictionRequest,
    listed_price: float,
) -> PricePredictionResponse:
    """
    Accepts a listed price alongside property features.
    Returns `is_overpriced=True` if the listed price exceeds
    the fair market estimate by more than 10%.
    """
    try:
        return price_predictor.flag_overpriced(listed_price, payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Price flagging failed: {exc}",
        ) from exc
