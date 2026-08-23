"""
SentinelPay Serving - Core Model & Explainer Engine
===================================================
Manages model loading, thread concurrency limits, pre-warmed TreeExplainer,
and high-throughput matrix scoring.
"""

import sys
import os
import time
import logging
from pathlib import Path
from typing import Optional, Any
import numpy as np
import pandas as pd
import joblib
import shap

from serving.app.core.config import settings
from serving.app.schemas.transaction import (
    TransactionFeatures,
    ScoreRequest,
    ScoreResponse,
    BatchScoreResponse,
    ExplainRequest,
    ExplainResponse,
    FeatureAttribution,
)

logger = logging.getLogger("sentinelpay.serving.engine")

FEATURE_COLUMNS = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"]

FEATURE_DESCRIPTIONS = {
    "Amount": "Transaction Monetary Volume (Scaled Dollar Amount)",
    "Time": "Temporal Velocity / Seconds Offset from Initial Transaction",
}


class ModelEngine:
    """
    Singleton inference and explainability engine loaded once during application startup.
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.explainer = None
        self.expected_value: float = 0.0
        self.is_ready: bool = False
        self.startup_time: float = time.time()

    def initialize(self):
        """Load model, scaler, configure thread limits, and pre-warm TreeExplainer."""
        logger.info("Initializing SentinelPay ModelEngine...")

        # 1. Thread limits for production deployment
        num_threads = str(settings.num_threads)
        os.environ["OMP_NUM_THREADS"] = num_threads
        os.environ["OPENBLAS_NUM_THREADS"] = num_threads
        os.environ["MKL_NUM_THREADS"] = num_threads
        os.environ["VECLIB_MAXIMUM_THREADS"] = num_threads
        os.environ["NUMEXPR_NUM_THREADS"] = num_threads

        # 2. Load Model
        if not settings.model_path.exists():
            raise FileNotFoundError(f"XGBoost model not found at {settings.model_path}")
        logger.info(f"Loading trained XGBoost model from {settings.model_path}...")
        self.model = joblib.load(settings.model_path)

        # 3. Load Scaler if available
        if settings.scaler_path.exists():
            logger.info(f"Loading scaler from {settings.scaler_path}...")
            self.scaler = joblib.load(settings.scaler_path)

        # 4. Initialize and cache TreeExplainer
        logger.info("Pre-warming shap.TreeExplainer for zero-cold-start inference...")
        self.explainer = shap.TreeExplainer(self.model)
        exp_val = self.explainer.expected_value
        if isinstance(exp_val, (np.ndarray, list)):
            self.expected_value = float(np.ravel(exp_val)[0])
        else:
            self.expected_value = float(exp_val)

        # 5. Warm-up dummy prediction
        dummy_row = pd.DataFrame([np.zeros(len(FEATURE_COLUMNS))], columns=FEATURE_COLUMNS)
        _ = self.model.predict_proba(dummy_row)
        _ = self.explainer(dummy_row)

        self.is_ready = True
        logger.info(f"ModelEngine initialized successfully. Base log-odds: {self.expected_value:.4f}")

    def score_single(self, request: ScoreRequest) -> ScoreResponse:
        """Score a single transaction with latency tracking."""
        t0 = time.perf_counter()

        features_dict = request.features.model_dump()
        df = pd.DataFrame([features_dict], columns=FEATURE_COLUMNS)

        probs = self.model.predict_proba(df)[:, 1]
        risk_score = float(probs[0])

        threshold = request.threshold_override if request.threshold_override is not None else settings.default_threshold
        is_flagged = bool(risk_score >= threshold)
        decision = "FLAGGED_FOR_REVIEW" if is_flagged else "APPROVED"

        latency_ms = (time.perf_counter() - t0) * 1000.0

        return ScoreResponse(
            transaction_id=request.transaction_id,
            risk_score=round(risk_score, 4),
            is_flagged=is_flagged,
            decision=decision,
            threshold_applied=round(threshold, 2),
            latency_ms=round(latency_ms, 3),
        )

    def score_batch(self, batch_requests: list[ScoreRequest]) -> BatchScoreResponse:
        """High-throughput vectorized batch scoring."""
        t0 = time.perf_counter()

        rows = [req.features.model_dump() for req in batch_requests]
        df = pd.DataFrame(rows, columns=FEATURE_COLUMNS)

        probs = self.model.predict_proba(df)[:, 1]

        results = []
        flagged_count = 0

        for i, req in enumerate(batch_requests):
            score = float(probs[i])
            threshold = req.threshold_override if req.threshold_override is not None else settings.default_threshold
            is_flagged = bool(score >= threshold)
            decision = "FLAGGED_FOR_REVIEW" if is_flagged else "APPROVED"

            if is_flagged:
                flagged_count += 1

            results.append(
                ScoreResponse(
                    transaction_id=req.transaction_id,
                    risk_score=round(score, 4),
                    is_flagged=is_flagged,
                    decision=decision,
                    threshold_applied=round(threshold, 2),
                    latency_ms=0.0,  # Computed as aggregate for batch
                )
            )

        total_latency_ms = (time.perf_counter() - t0) * 1000.0
        avg_latency = total_latency_ms / len(batch_requests) if batch_requests else 0.0

        # Update per-item latency in response
        for r in results:
            r.latency_ms = round(avg_latency, 3)

        return BatchScoreResponse(
            results=results,
            total_processed=len(results),
            flagged_count=flagged_count,
            batch_latency_ms=round(total_latency_ms, 3),
            avg_latency_per_tx_ms=round(avg_latency, 3),
        )

    def explain(self, request: ExplainRequest) -> ExplainResponse:
        """Generate SHAP feature attributions and formatted dispute-ready evidence narrative."""
        t0 = time.perf_counter()

        features_dict = request.features.model_dump()
        df = pd.DataFrame([features_dict], columns=FEATURE_COLUMNS)

        probs = self.model.predict_proba(df)[:, 1]
        risk_score = float(probs[0])

        threshold = request.threshold_override if request.threshold_override is not None else settings.default_threshold
        is_flagged = bool(risk_score >= threshold)
        decision = "FLAGGED_FOR_REVIEW" if is_flagged else "APPROVED"

        # Compute SHAP explanation
        shap_res = self.explainer(df)
        shap_values = shap_res.values[0]
        base_value = float(shap_res.base_values[0]) if hasattr(shap_res, "base_values") else float(self.expected_value)

        # Rank by |SHAP|
        abs_shap = np.abs(shap_values)
        top_k = min(request.top_k, len(FEATURE_COLUMNS))
        top_indices = np.argsort(abs_shap)[::-1][:top_k]

        sum_top_abs = float(np.sum(abs_shap[top_indices]))
        if sum_top_abs == 0.0:
            sum_top_abs = 1e-6

        top_features = []
        for idx in top_indices:
            fname = FEATURE_COLUMNS[idx]
            fval = float(df.iloc[0, idx])
            sval = float(shap_values[idx])
            contrib_pct = float((abs(sval) / sum_top_abs) * 100.0)

            desc = FEATURE_DESCRIPTIONS.get(fname, f"Derived PCA Anomaly Factor {fname}")

            top_features.append(
                FeatureAttribution(
                    feature=fname,
                    description=desc,
                    value=round(fval, 4),
                    shap_value=round(sval, 4),
                    contribution_pct=round(contrib_pct, 1),
                    direction="increases_risk" if sval > 0 else "decreases_risk",
                )
            )

        # Format Evidence Narrative
        evidence_summary = self._format_evidence_text(
            risk_score=risk_score,
            decision=decision,
            threshold=threshold,
            top_features=top_features,
            transaction_id=request.transaction_id,
            amount_usd=request.amount_usd,
        )

        latency_ms = (time.perf_counter() - t0) * 1000.0

        return ExplainResponse(
            transaction_id=request.transaction_id,
            risk_score=round(risk_score, 4),
            is_flagged=is_flagged,
            decision=decision,
            threshold_applied=round(threshold, 2),
            base_value=round(base_value, 4),
            top_features=top_features,
            evidence_summary=evidence_summary,
            latency_ms=round(latency_ms, 3),
        )

    def _format_evidence_text(
        self,
        risk_score: float,
        decision: str,
        threshold: float,
        top_features: list[FeatureAttribution],
        transaction_id: Optional[str],
        amount_usd: Optional[float],
    ) -> str:
        """Format dispute-ready evidence narrative text."""
        tx_str = f" Transaction ID: `{transaction_id}` |" if transaction_id else ""
        amt_str = f" Amount: `${amount_usd:,.2f}` |" if amount_usd is not None else ""

        risk_increasers = [f for f in top_features if f.direction == "increases_risk"]
        risk_decreasers = [f for f in top_features if f.direction == "decreases_risk"]

        narrative_parts = []
        if risk_increasers:
            driver_phrases = []
            for f in risk_increasers:
                if f.feature == "Amount":
                    driver_phrases.append(f"unusual transaction monetary volume ({f.value:+.2f} std dev, {f.contribution_pct}% weight)")
                elif f.feature == "Time":
                    driver_phrases.append(f"timing velocity irregularity ({f.value:+.2f} std dev, {f.contribution_pct}% weight)")
                else:
                    driver_phrases.append(f"statistical anomaly in derived component {f.feature} (value: {f.value:+.2f}, {f.contribution_pct}% weight)")

            narrative_parts.append(
                f"This transaction was flagged with an estimated fraud risk score of **{risk_score*100:.1f}%** "
                f"exceeding the operational security threshold ({threshold:.2f}). "
                f"Primary quantitative risk drivers: {', '.join(driver_phrases)}."
            )
        else:
            narrative_parts.append(
                f"This transaction received an estimated fraud risk score of **{risk_score*100:.1f}%** "
                f"(Decision: {decision})."
            )

        if risk_decreasers:
            mitigators = [f"{f.feature} ({f.contribution_pct}% mitigating weight)" for f in risk_decreasers]
            narrative_parts.append(
                f"Conversely, baseline consistency in {', '.join(mitigators)} partially mitigated the risk score."
            )

        narrative_text = " ".join(narrative_parts)

        # Top feature list
        feat_rows = []
        for i, f in enumerate(top_features, 1):
            arrow = "🔴 Increases Risk" if f.direction == "increases_risk" else "🟢 Decreases Risk"
            feat_rows.append(
                f"  {i}. **{f.feature}** ({f.description})\n"
                f"     - Value: `{f.value}` | SHAP Attribution: `{f.shap_value:+.4f}` | Contribution: **{f.contribution_pct}%** ({arrow})"
            )
        feature_breakdown = "\n".join(feat_rows)

        # Action advisory
        if risk_score >= 0.70:
            action_advisory = (
                "**High-Confidence Fraud Pattern Detected**: Immediate cardholder challenge / step-up 3D Secure "
                "authentication required. If chargeback dispute is initiated, attach this SHAP attribution log "
                "verifying multi-dimensional statistical divergence from valid cardholder behavioral profiles."
            )
        elif risk_score >= threshold:
            action_advisory = (
                "**Elevated Risk Score Detected**: Recommend automated SMS/OTP confirmation or temporary hold. "
                "Log evidence telemetry for automated chargeback defense."
            )
        else:
            action_advisory = (
                "**Standard Low-Risk Transaction**: Transaction cleared for automated straight-through processing."
            )

        return f"""### SentinelPay Automated Fraud Evidence & Chargeback Dossier
**Metadata:**{tx_str}{amt_str} Risk Score: `{risk_score:.4f}` ({risk_score*100:.2f}%) | Status: **`{decision}`**

#### 1. Executive Summary & Automated Evidence Narrative
{narrative_text}

#### 2. Key SHAP Feature Attribution Breakdown
{feature_breakdown}

#### 3. Recommended Operational Action & Dispute Defense
{action_advisory}

> *Note on Dataset Explainability*: In accordance with banking confidentiality, components V1–V28 are anonymized PCA projections. Feature attributions reflect exact mathematical Shapley game-theoretic contributions without speculative business relabeling.
""".strip()


# Global engine instance
engine = ModelEngine()
