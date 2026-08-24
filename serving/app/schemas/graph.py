"""
SentinelPay - Graph & Ring Detection Schemas
============================================
Pydantic v2 schemas for graph-based fraud ring detection, entity linkage,
and propagated account risk endpoints.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RingMember(BaseModel):
    account_id: str = Field(..., description="Unique simulated account identifier")
    device_id: str = Field(..., description="Hardware device fingerprint")
    ip_subnet: str = Field(..., description="Class C /24 IP subnet")
    xgb_score: float = Field(..., description="Individual transaction risk score from XGBoost (0.0 - 1.0)")
    is_xgb_flagged: bool = Field(..., description="True if individual XGBoost score >= 0.10 threshold")
    ring_risk_score: float = Field(..., description="Propagated graph network risk score (0.0 - 1.0)")
    true_class: int = Field(..., description="Ground truth dataset class (1 = Fraud, 0 = Legitimate)")


class FraudRing(BaseModel):
    ring_id: str = Field(..., description="Unique cluster identifier, e.g. RING-001")
    cluster_size: int = Field(..., description="Number of linked accounts in the ring")
    fraud_count: int = Field(..., description="Number of confirmed fraud accounts in this ring")
    flagged_count: int = Field(..., description="Number of accounts flagged by individual XGBoost threshold")
    linkage_mechanisms: List[str] = Field(..., description="Shared linkage vectors, e.g. ['shared_device', 'shared_ip']")
    average_ring_risk: float = Field(..., description="Mean propagated ring risk across all members")
    members: List[RingMember] = Field(..., description="Member accounts ordered by ring risk score")


class RingsResponse(BaseModel):
    disclaimer: str = Field(
        default="Account/device linkage is simulated for demonstration purposes; the underlying ULB dataset contains no real account telemetry.",
        description="Data authenticity and demonstration disclaimer",
    )
    total_rings: int = Field(..., description="Total number of detected multi-account fraud rings")
    total_accounts_implicated: int = Field(..., description="Total accounts connected within detected rings")
    rings: List[FraudRing] = Field(..., description="List of detected fraud rings")


class ConnectedAccount(BaseModel):
    account_id: str = Field(..., description="Connected neighbor account identifier")
    link_types: List[str] = Field(..., description="Linkage types connecting to this neighbor")
    xgb_score: float = Field(..., description="Individual XGBoost risk score")
    ring_risk_score: float = Field(..., description="Propagated ring risk score")
    is_xgb_flagged: bool = Field(..., description="Flagged status at operating threshold")


class AccountRiskResponse(BaseModel):
    account_id: str = Field(..., description="Account identifier")
    disclaimer: str = Field(
        default="Account/device linkage is simulated for demonstration purposes; the underlying ULB dataset contains no real account telemetry.",
        description="Data authenticity and demonstration disclaimer",
    )
    device_id: str = Field(..., description="Associated hardware device ID")
    ip_subnet: str = Field(..., description="Associated IP subnet")
    individual_xgb_score: float = Field(..., description="Isolated XGBoost transaction fraud probability")
    propagated_ring_risk_score: float = Field(..., description="Graph-propagated network risk score")
    is_flagged: bool = Field(..., description="True if either XGBoost or propagated ring risk exceeds threshold")
    ring_id: Optional[str] = Field(None, description="Associated ring ID if part of a detected multi-account ring")
    connected_accounts_count: int = Field(..., description="Number of direct network neighbor accounts")
    connected_accounts: List[ConnectedAccount] = Field(default_factory=list, description="Directly connected accounts")


class GraphNode(BaseModel):
    id: str
    label: str
    role: str
    xgb_score: float
    ring_risk: float
    device_id: str
    ip_subnet: str
    is_flagged: bool
    true_class: int
    ring_id: Optional[str] = None
    color: str
    val: float


class GraphLink(BaseModel):
    source: str
    target: str
    link_type: str
    color: str
    width: float


class NetworkGraphResponse(BaseModel):
    disclaimer: str = Field(
        default="Account/device linkage is simulated for demonstration purposes; the underlying ULB dataset contains no real account telemetry.",
        description="Data authenticity and demonstration disclaimer",
    )
    nodes: List[GraphNode] = Field(..., description="Graph nodes representing accounts")
    links: List[GraphLink] = Field(..., description="Graph links representing shared device/IP connections")
