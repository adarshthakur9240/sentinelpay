"""
SentinelPay - Real Graph & Fraud Ring Detection API Routes
============================================================
Exposes multi-account fraud ring clusters, genuine entity linkage vectors, and
individual account risk propagation computed across real Kaggle IEEE-CIS hardware devices,
card fingerprint clusters, and network locations.
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
    description="Returns all detected clusters with >=3 linked accounts and confirmed/flagged fraud members, evaluated on Kaggle IEEE-CIS real entity linkage telemetry.",
)
async def get_detected_fraud_rings() -> RingsResponse:
    """
    Returns detected fraud rings with member accounts, shared linkage vectors (hardware/cards/location),
    isolated risk scores, and propagated ring risk scores.
    """
    return graph_engine.get_rings_response()


@router.get(
    "/account/{account_id}/risk",
    response_model=AccountRiskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Account Propagated Network Risk",
    description="Returns an individual account's isolated transaction score vs. its graph-propagated network risk score and connected neighbors from Kaggle IEEE-CIS.",
)
async def get_account_risk(
    account_id: str = FastAPIPath(..., description="Target account identifier, e.g. TX-IEEE-000042")
) -> AccountRiskResponse:
    """
    Fetches an account's hardware device, location hash, isolated score,
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
    description="Returns nodes and links formatted for 2D/3D force-directed graph rendering with verified IEEE-CIS entity linkages.",
)
async def get_network_graph() -> NetworkGraphResponse:
    """
    Returns nodes and edges formatted for force-directed interactive visualization in the frontend.
    """
    return graph_engine.get_network_graph()
