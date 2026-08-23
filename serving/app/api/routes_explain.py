"""
SentinelPay Serving - SHAP Explainability & Evidence Routes
============================================================
Exposes real-time SHAP feature attribution and automated chargeback dispute narrative generation.
"""

from fastapi import APIRouter, HTTPException, status
import logging

from serving.app.core.engine import engine
from serving.app.schemas.transaction import (
    ExplainRequest,
    ExplainResponse,
)

logger = logging.getLogger("sentinelpay.serving.routes_explain")
router = APIRouter(prefix="", tags=["Explainability & Evidence"])


@router.post(
    "/explain",
    response_model=ExplainResponse,
    status_code=status.HTTP_200_OK,
    summary="Explain a transaction and generate dispute evidence",
    description="Computes exact game-theoretic SHAP feature attributions via TreeExplainer and generates a chargeback-dispute-ready evidence dossier.",
)
async def explain_transaction(request: ExplainRequest) -> ExplainResponse:
    """Real-time SHAP explanation and evidence generation endpoint."""
    if not engine.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ModelEngine is not initialized or still warming up.",
        )

    try:
        response = engine.explain(request)
        return response
    except Exception as e:
        logger.error(f"Error during SHAP transaction explanation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explainability error: {str(e)}",
        )
