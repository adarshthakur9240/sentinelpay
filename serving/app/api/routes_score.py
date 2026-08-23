"""
SentinelPay Serving - Real-Time Scoring Endpoints
==================================================
Exposes high-speed single transaction scoring and vectorized batch scoring.
"""

from fastapi import APIRouter, HTTPException, status
import logging

from serving.app.core.engine import engine
from serving.app.schemas.transaction import (
    ScoreRequest,
    ScoreResponse,
    BatchScoreRequest,
    BatchScoreResponse,
)

logger = logging.getLogger("sentinelpay.serving.routes_score")
router = APIRouter(prefix="", tags=["Fraud Scoring"])


@router.post(
    "/score",
    response_model=ScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Score a single transaction in real-time",
    description="Evaluates all 30 transaction features against the trained XGBoost model and returns the fraud risk score and operational decision.",
)
async def score_transaction(request: ScoreRequest) -> ScoreResponse:
    """Score single transaction with sub-millisecond latency."""
    if not engine.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ModelEngine is not initialized or still warming up.",
        )

    try:
        response = engine.score_single(request)
        return response
    except Exception as e:
        logger.error(f"Error during transaction scoring: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )


@router.post(
    "/score/batch",
    response_model=BatchScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Batch score multiple transactions",
    description="Vectorized matrix scoring for bulk transaction streams (up to 1,000 transactions per batch).",
)
async def score_batch_transactions(request: BatchScoreRequest) -> BatchScoreResponse:
    """Vectorized bulk scoring endpoint."""
    if not engine.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ModelEngine is not initialized or still warming up.",
        )

    try:
        response = engine.score_batch(request.transactions)
        return response
    except Exception as e:
        logger.error(f"Error during batch scoring: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch inference error: {str(e)}",
        )
