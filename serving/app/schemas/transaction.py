"""
SentinelPay - API Request and Response Schemas
==============================================
Pydantic v2 schemas for single and batch transaction scoring,
SHAP explainability, and live model performance metrics.
"""

from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class TransactionFeatures(BaseModel):
    """
    Transaction input features schema matching Kaggle Credit Card dataset.
    Requires Time, V1-V28 (PCA components), and Amount.
    """
    Time: float = Field(..., description="Seconds elapsed between this transaction and the first transaction")
    V1: float = Field(..., description="PCA component V1")
    V2: float = Field(..., description="PCA component V2")
    V3: float = Field(..., description="PCA component V3")
    V4: float = Field(..., description="PCA component V4")
    V5: float = Field(..., description="PCA component V5")
    V6: float = Field(..., description="PCA component V6")
    V7: float = Field(..., description="PCA component V7")
    V8: float = Field(..., description="PCA component V8")
    V9: float = Field(..., description="PCA component V9")
    V10: float = Field(..., description="PCA component V10")
    V11: float = Field(..., description="PCA component V11")
    V12: float = Field(..., description="PCA component V12")
    V13: float = Field(..., description="PCA component V13")
    V14: float = Field(..., description="PCA component V14")
    V15: float = Field(..., description="PCA component V15")
    V16: float = Field(..., description="PCA component V16")
    V17: float = Field(..., description="PCA component V17")
    V18: float = Field(..., description="PCA component V18")
    V19: float = Field(..., description="PCA component V19")
    V20: float = Field(..., description="PCA component V20")
    V21: float = Field(..., description="PCA component V21")
    V22: float = Field(..., description="PCA component V22")
    V23: float = Field(..., description="PCA component V23")
    V24: float = Field(..., description="PCA component V24")
    V25: float = Field(..., description="PCA component V25")
    V26: float = Field(..., description="PCA component V26")
    V27: float = Field(..., description="PCA component V27")
    V28: float = Field(..., description="PCA component V28")
    Amount: float = Field(..., description="Transaction amount in currency units (scaled)")

    model_config = ConfigDict(extra="ignore")


class ScoreRequest(BaseModel):
    """Payload for single transaction scoring."""
    transaction_id: Optional[str] = Field(None, description="Optional unique transaction reference identifier")
    merchant_id: Optional[str] = Field(None, description="Optional merchant identifier")
    features: TransactionFeatures = Field(..., description="Feature vector for fraud scoring")
    threshold_override: Optional[float] = Field(None, ge=0.0, le=1.0, description="Optional custom decision threshold")


class ScoreResponse(BaseModel):
    """Response payload for single transaction scoring."""
    transaction_id: Optional[str] = None
    risk_score: float = Field(..., description="Fraud probability estimate [0.0 - 1.0]")
    is_flagged: bool = Field(..., description="True if risk_score >= operational threshold")
    decision: str = Field(..., description="Operational decision: FLAGGED_FOR_REVIEW or APPROVED")
    threshold_applied: float = Field(..., description="Classification threshold used for decision")
    latency_ms: float = Field(..., description="Server inference latency in milliseconds")


class BatchScoreRequest(BaseModel):
    """Payload for high-throughput batch scoring."""
    transactions: list[ScoreRequest] = Field(..., min_length=1, max_length=1000, description="List of transactions to score")


class BatchScoreResponse(BaseModel):
    """Response payload for batch transaction scoring."""
    results: list[ScoreResponse]
    total_processed: int
    flagged_count: int
    batch_latency_ms: float
    avg_latency_per_tx_ms: float


class ExplainRequest(BaseModel):
    """Payload for SHAP transaction explanation."""
    transaction_id: Optional[str] = Field(None, description="Optional transaction identifier")
    merchant_id: Optional[str] = Field(None, description="Optional merchant identifier")
    amount_usd: Optional[float] = Field(None, description="Optional raw dollar amount for dispute summary")
    features: TransactionFeatures = Field(..., description="Feature vector for SHAP explanation")
    top_k: int = Field(5, ge=1, le=30, description="Number of top contributing features to return")
    threshold_override: Optional[float] = Field(None, ge=0.0, le=1.0, description="Optional custom decision threshold")


class FeatureAttribution(BaseModel):
    """Detailed SHAP attribution for a single feature."""
    feature: str
    description: str
    value: float
    shap_value: float
    contribution_pct: float
    direction: str  # "increases_risk" or "decreases_risk"


class ExplainResponse(BaseModel):
    """Response payload for SHAP transaction explanation."""
    transaction_id: Optional[str] = None
    risk_score: float
    is_flagged: bool
    decision: str
    threshold_applied: float
    base_value: float
    top_features: list[FeatureAttribution]
    evidence_summary: str = Field(..., description="Dispute-ready formatted narrative text")
    latency_ms: float


class HealthResponse(BaseModel):
    """Service health response."""
    status: str
    model_loaded: bool
    explainer_loaded: bool
    version: str
    uptime_seconds: float


class ModelMetricsResponse(BaseModel):
    """Live inspectable model performance metrics on held-out test split."""
    model_name: str
    model_type: str
    scale_pos_weight: float
    recommended_threshold: float
    held_out_test_metrics: dict[str, Any]
    baseline_comparison: dict[str, Any]
    cost_model_assumptions: dict[str, Any]
