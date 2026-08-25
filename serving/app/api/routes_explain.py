"""
SentinelPay Serving - SHAP Explainability & Evidence Routes
============================================================
Exposes real-time SHAP feature attribution, automated chargeback dispute narrative generation,
and executive 1-page PDF dossier generation.
"""

from fastapi import APIRouter, HTTPException, Response, status
import logging

from serving.app.core.engine import engine
from serving.app.core.pdf_generator import generate_dispute_dossier_pdf
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


@router.post(
    "/evidence/pdf",
    status_code=status.HTTP_200_OK,
    summary="Generate downloadable PDF dispute evidence dossier",
    description="Renders a clean 1-page PDF dispute dossier containing transaction metadata, SHAP feature attributions, and dispute defense narrative.",
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Binary PDF dispute evidence dossier.",
        }
    },
)
@router.post(
    "/explain/pdf",
    include_in_schema=False,
)
async def generate_evidence_pdf(request: ExplainRequest):
    """Generates a downloadable PDF of the dispute evidence dossier."""
    if not engine.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ModelEngine is not initialized or still warming up.",
        )

    try:
        explain_response = engine.explain(request)
        pdf_bytes = generate_dispute_dossier_pdf(
            explain_data=explain_response,
            amount_usd=request.amount_usd,
            merchant_id=request.merchant_id,
        )

        tx_id = request.transaction_id or "TXN-TEST-00404"
        filename = f"dispute-evidence-{tx_id}.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf",
            },
        )
    except Exception as e:
        logger.error(f"Error generating PDF dossier: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF generation error: {str(e)}",
        )
