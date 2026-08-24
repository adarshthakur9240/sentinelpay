"""
SentinelPay - Graph & Fraud Ring Detection API Routes
======================================================
Exposes multi-account fraud ring clusters, entity linkage reasons, and
individual account risk propagation computed across shared hardware devices
and IP subnets.

IMPORTANT DISCLAIMER:
These endpoints operate on simulated entity linkage data (ml/graph/graph_data/synthetic_linkage.csv).
The underlying ULB Credit Card Fraud dataset contains no real account, device, or IP telemetry.
"""

import logging
from fastapi import APIRouter, HTTPException, status, Path as FastAPIPath

from serving.app.core.graph_engine import graph_engine
from serving.app.schemas.graph import (
    RingsResponse,
    AccountRiskResponse,
    NetworkGraphResponse,
)

logger = logging.getLogger("sentinelpay.serving.api.graph")

router = APIRouter(prefix="/graph", tags=["Graph & Abuse Rings"])


@router.get(
    "/rings",
    response_model=RingsResponse,
    status_code=status.HTTP_200_OK,
    summary="List Detected Multi-Account Fraud Rings",
    description="Returns all detected clusters with >=3 linked accounts and at least one confirmed/flagged fraud member, ordered by average ring risk. Operates on simulated linkage telemetry.",
)
async def get_detected_fraud_rings() -> RingsResponse:
    """
    Returns detected fraud rings with member accounts, shared linkage vectors (device/IP),
    individual XGBoost scores, and propagated ring risk scores.
    """
    return graph_engine.get_rings_response()


@router.get(
    "/account/{account_id}/risk",
    response_model=AccountRiskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Account Propagated Network Risk",
    description="Returns an individual account's isolated XGBoost score vs. its graph-propagated network risk score and connected neighbors. Operates on simulated linkage telemetry.",
)
async def get_account_risk(
    account_id: str = FastAPIPath(..., description="Target account identifier, e.g. ACC-100000 or ACC-100404")
) -> AccountRiskResponse:
    """
    Fetches an account's hardware device, IP subnet, individual XGBoost score,
    graph-propagated ring risk score, and all directly connected neighbor accounts.
    """
    account_risk = graph_engine.get_account_risk(account_id)
    if not account_risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account '{account_id}' not found in the entity graph database.",
        )
    return account_risk


@router.get(
    "/network",
    response_model=NetworkGraphResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Interactive Network Graph Payload",
    description="Returns nodes and links formatted for 2D/3D force-directed graph rendering. Operates on simulated linkage telemetry.",
)
async def get_network_graph() -> NetworkGraphResponse:
    """
    Returns nodes and edges formatted for force-directed interactive visualization in the frontend.
    """
    return graph_engine.get_network_graph()
