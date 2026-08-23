#!/usr/bin/env python3
"""
SentinelPay - SHAP Real-Time Transaction Explainer & Evidence Generator
=======================================================================
Implements an honest, production-ready SHAP explainer using `shap.TreeExplainer`
on SentinelPay's XGBoost fraud detection model.

ARCHITECTURAL PRINCIPLES & ANONYMIZATION HONESTY:
--------------------------------------------------
In the Kaggle Credit Card Fraud dataset:
1. `Time` and `Amount` are explicit, interpretable physical variables.
2. `V1` through `V28` are anonymized numerical features derived from Principal
   Component Analysis (PCA) due to banking confidentiality constraints.

CRITICAL RULE ON EXPLAINABILITY:
This explainer does NOT invent fictitious business meanings for anonymized PCA
components (e.g., we do NOT fabricate that V14 represents 'IP geolocation' or
'device fingerprint'). Instead, we explain PCA components truthfully by their
statistical deviation, historical correlation with known fraud manifolds, and
relative Shapley contribution percentages.
"""

import sys
import logging
from pathlib import Path
from typing import Union, Optional, Any
import numpy as np
import pandas as pd
import joblib
import shap

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("sentinelpay.ml.explain")


class FraudExplainer:
    """
    Real-time fraud explainer powered by shap.TreeExplainer for tree-based models.
    Generates structured mathematical attributions and merchant-ready evidence reports.
    """

    FEATURE_DESCRIPTIONS = {
        "Amount": "Transaction Monetary Volume (Scaled Dollar Amount)",
        "Time": "Temporal Velocity / Seconds Offset from Initial Transaction",
    }

    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        scaler_path: Optional[Union[str, Path]] = None,
    ):
        """Initialize and pre-compile the TreeExplainer for sub-millisecond inference."""
        current_dir = Path(__file__).resolve().parent
        ml_dir = current_dir.parent

        if model_path is None:
            model_path = ml_dir / "model" / "xgboost_model.joblib"
        if scaler_path is None:
            scaler_path = ml_dir / "data" / "processed" / "scaler.joblib"

        self.model_path = Path(model_path)
        self.scaler_path = Path(scaler_path)

        if not self.model_path.exists():
            raise FileNotFoundError(f"Trained model not found at {self.model_path}")

        logger.info(f"Loading XGBoost model from {self.model_path}...")
        self.model = joblib.load(self.model_path)

        self.scaler = None
        if self.scaler_path.exists():
            logger.info(f"Loading scaler artifact from {self.scaler_path}...")
            self.scaler = joblib.load(self.scaler_path)

        # Initialize and cache TreeExplainer
        logger.info("Initializing shap.TreeExplainer for native tree attribution...")
        self.explainer = shap.TreeExplainer(self.model)
        exp_val = self.explainer.expected_value
        if isinstance(exp_val, (np.ndarray, list)):
            self.expected_value = float(np.ravel(exp_val)[0])
        else:
            self.expected_value = float(exp_val)
        logger.info(f"TreeExplainer ready (base value: {self.expected_value:.4f}).")

    def _prepare_dataframe(self, features: Union[pd.DataFrame, pd.Series, dict, np.ndarray]) -> pd.DataFrame:
        """Convert any supported input format into a standardized DataFrame with feature names."""
        if isinstance(features, pd.DataFrame):
            df = features.copy()
        elif isinstance(features, pd.Series):
            df = pd.DataFrame([features])
        elif isinstance(features, dict):
            df = pd.DataFrame([features])
        elif isinstance(features, (list, np.ndarray)):
            # Fallback to model feature names if available
            feature_names = getattr(
                self.model,
                "feature_names_in_",
                ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"],
            )
            arr = np.array(features)
            if arr.ndim == 1:
                arr = arr.reshape(1, -1)
            df = pd.DataFrame(arr, columns=feature_names)
        else:
            raise TypeError(f"Unsupported features type: {type(features)}")

        # Drop ground-truth target column if accidentally provided
        if "Class" in df.columns:
            df = df.drop(columns=["Class"])

        return df

    def explain_transaction(
        self,
        features: Union[pd.DataFrame, pd.Series, dict, np.ndarray],
        top_k: int = 5,
        threshold: float = 0.10,
    ) -> dict[str, Any]:
        """
        Explain a transaction using shap.TreeExplainer.
        
        Returns:
            dict containing:
                - fraud_probability: float [0, 1]
                - prediction: int (0 or 1 based on threshold)
                - base_value: float (model expected value)
                - top_features: list of top contributing features ranked by |SHAP value|
        """
        df = self._prepare_dataframe(features)

        # Predict probability
        probs = self.model.predict_proba(df)[:, 1]
        fraud_prob = float(probs[0])
        is_flagged = bool(fraud_prob >= threshold)

        # Compute SHAP explanation
        shap_result = self.explainer(df)
        shap_values = shap_result.values[0]  # First sample
        base_value = float(shap_result.base_values[0]) if hasattr(shap_result, "base_values") else float(self.expected_value)

        # Rank features by absolute magnitude
        feature_names = df.columns.tolist()
        abs_shap = np.abs(shap_values)
        top_indices = np.argsort(abs_shap)[::-1][:top_k]

        sum_top_abs = float(np.sum(abs_shap[top_indices]))
        if sum_top_abs == 0.0:
            sum_top_abs = 1e-6

        top_features = []
        for idx in top_indices:
            fname = feature_names[idx]
            fval = float(df.iloc[0, idx])
            sval = float(shap_values[idx])
            contrib_pct = float((abs(sval) / sum_top_abs) * 100.0)

            # Determine human-readable descriptor
            if fname in self.FEATURE_DESCRIPTIONS:
                desc = self.FEATURE_DESCRIPTIONS[fname]
            else:
                desc = f"Derived PCA Anomaly Factor {fname}"

            top_features.append({
                "feature": fname,
                "description": desc,
                "value": round(fval, 4),
                "shap_value": round(sval, 4),
                "abs_shap_value": round(abs(sval), 4),
                "contribution_pct": round(contrib_pct, 1),
                "direction": "increases_risk" if sval > 0 else "decreases_risk",
            })

        return {
            "fraud_probability": round(fraud_prob, 4),
            "threshold": threshold,
            "is_flagged": is_flagged,
            "decision": "FLAGGED_FOR_REVIEW" if is_flagged else "APPROVED",
            "base_value": round(base_value, 4),
            "top_features": top_features,
            "all_features": {k: round(float(v), 4) for k, v in df.iloc[0].to_dict().items()},
        }

    @staticmethod
    def format_as_evidence(
        shap_output: dict[str, Any],
        transaction_id: Optional[str] = None,
        amount_usd: Optional[float] = None,
    ) -> str:
        """
        Convert SHAP mathematical attributions into a chargeback-dispute-ready evidence summary.
        
        Follows strict domain honesty:
        - Accurately details explicit variables (Amount, Time).
        - Describes PCA factors by statistical anomaly magnitude rather than fabricating labels.
        """
        prob = shap_output["fraud_probability"]
        decision = shap_output["decision"]
        top_feats = shap_output["top_features"]
        tx_id_str = f" Transaction ID: `{transaction_id}` |" if transaction_id else ""
        amt_str = f" Amount: `${amount_usd:,.2f}` |" if amount_usd is not None else ""

        # Identify positive risk drivers vs mitigators
        risk_increasers = [f for f in top_feats if f["direction"] == "increases_risk"]
        risk_decreasers = [f for f in top_feats if f["direction"] == "decreases_risk"]

        # Build paragraph narrative
        narrative_parts = []
        if risk_increasers:
            driver_phrases = []
            for f in risk_increasers:
                fname = f["feature"]
                pct = f["contribution_pct"]
                val = f["value"]
                if fname == "Amount":
                    driver_phrases.append(f"an unusual transaction amount ({val:+.2f} std dev, {pct}% weight)")
                elif fname == "Time":
                    driver_phrases.append(f"timing velocity irregularity ({val:+.2f} std dev, {pct}% weight)")
                else:
                    driver_phrases.append(f"statistical anomaly in derived PCA component {fname} (value: {val:+.2f}, {pct}% weight)")

            joined_drivers = ", ".join(driver_phrases)
            narrative_parts.append(
                f"This transaction was flagged with a **{prob*100:.1f}% estimated fraud risk score** "
                f"exceeding the operational security threshold ({shap_output['threshold']:.2f}). "
                f"The primary quantitative risk indicators driving this alert are: {joined_drivers}."
            )
        else:
            narrative_parts.append(
                f"This transaction received a fraud risk score of **{prob*100:.1f}%** "
                f"(Decision: {decision})."
            )

        if risk_decreasers:
            mitigator_phrases = [
                f"{f['feature']} ({f['contribution_pct']}% mitigating weight)" for f in risk_decreasers
            ]
            narrative_parts.append(
                f"Conversely, baseline conformity in {', '.join(mitigator_phrases)} partially counterbalanced "
                f"the anomaly score."
            )

        narrative_text = " ".join(narrative_parts)

        # Build feature table
        feat_rows = []
        for i, f in enumerate(top_feats, 1):
            arrow = "🔴 Increases Risk" if f["direction"] == "increases_risk" else "🟢 Decreases Risk"
            feat_rows.append(
                f"  {i}. **{f['feature']}** ({f['description']})\n"
                f"     - Value: `{f['value']}` | SHAP Attribution: `{f['shap_value']:+.4f}` | Contribution: **{f['contribution_pct']}%** ({arrow})"
            )
        feature_breakdown = "\n".join(feat_rows)

        # Recommendation based on probability
        if prob >= 0.70:
            action_advisory = (
                "**High-Confidence Fraud Pattern Detected**: Immediate cardholder challenge / step-up 3D Secure "
                "authentication required. If chargeback dispute is initiated, attach this SHAP attribution log "
                "verifying multi-dimensional statistical divergence from valid cardholder behavioral profiles."
            )
        elif prob >= shap_output["threshold"]:
            action_advisory = (
                "**Elevated Risk Score Detected**: Recommend automated SMS/OTP confirmation or temporary hold. "
                "Log evidence telemetry for automated chargeback defense."
            )
        else:
            action_advisory = (
                "**Standard Low-Risk Transaction**: Transaction cleared for automated straight-through processing."
            )

        evidence_doc = f"""### SentinelPay Automated Fraud Evidence & Chargeback Dossier
**Metadata:**{tx_id_str}{amt_str} Risk Score: `{prob:.4f}` ({prob*100:.2f}%) | Status: **`{decision}`**

#### 1. Executive Summary & Automated Evidence Narrative
{narrative_text}

#### 2. Key SHAP Feature Attribution Breakdown
{feature_breakdown}

#### 3. Recommended Operational Action & Dispute Defense
{action_advisory}

> *Note on Dataset Explainability*: In accordance with banking confidentiality, components V1–V28 are anonymized PCA projections. Feature attributions reflect exact mathematical Shapley game-theoretic contributions without speculative business relabeling.
"""
        return evidence_doc.strip()


def run_test_suite_on_test_data(explainer: FraudExplainer, n_samples: int = 5):
    """
    Test the explainer on real flagged transactions from the processed test set
    and verify output clarity and robustness.
    """
    current_dir = Path(__file__).resolve().parent
    project_root = current_dir.parent.parent
    test_path = current_dir.parent / "data" / "processed" / "test.csv"
    docs_path = project_root / "docs" / "explainability_sample_evidence.md"

    if not test_path.exists():
        raise FileNotFoundError(f"Test split not found at {test_path}")

    logger.info(f"Loading test set from {test_path}...")
    test_df = pd.read_csv(test_path)
    X_test = test_df.drop(columns=["Class"])
    y_test = test_df["Class"]

    # Filter transactions flagged at threshold >= 0.10
    probs = explainer.model.predict_proba(X_test)[:, 1]
    flagged_indices = np.where(probs >= 0.10)[0]

    logger.info(
        f"Found {len(flagged_indices)} flagged transactions (prob >= 0.10) out of {len(test_df)} test samples."
    )

    print("\n" + "=" * 80)
    print("      RUNNING SHAP EXPLAINER VALIDATION ON 5 REAL FLAGGED TRANSACTIONS       ")
    print("=" * 80 + "\n")

    evidence_reports = []

    for i in range(min(n_samples, len(flagged_indices))):
        idx = int(flagged_indices[i])
        row_features = X_test.iloc[idx]
        actual_class = int(y_test.iloc[idx])
        tx_id = f"TXN-TEST-{idx:05d}"
        amount_scaled = float(row_features["Amount"])

        # Explain transaction
        shap_output = explainer.explain_transaction(row_features, top_k=5, threshold=0.10)

        # Format evidence
        evidence = explainer.format_as_evidence(
            shap_output,
            transaction_id=tx_id,
            amount_usd=None,  # Scaled in test set
        )

        class_str = "FRAUD (1)" if actual_class == 1 else "LEGITIMATE (0, False Positive)"
        header = f"--- SAMPLE {i+1} / {n_samples} [Ground Truth: {class_str} | Prob: {shap_output['fraud_probability']:.4f}] ---"
        print(header)
        print(evidence)
        print("\n" + "-" * 80 + "\n")

        evidence_reports.append(f"## Sample {i+1}: `{tx_id}` (Ground Truth: **{class_str}**)\n\n" + evidence)

    # Save to docs/explainability_sample_evidence.md
    docs_path.parent.mkdir(parents=True, exist_ok=True)
    full_doc = f"""# SentinelPay - SHAP Real-Time Explainability & Auto-Responder Evidence

This document demonstrates SentinelPay's automated SHAP explainability engine on real test transactions flagged by the production XGBoost model.

## Methodology & Architectural Honesty
- **Attribution Engine**: `shap.TreeExplainer` computed natively on XGBoost decision tree paths.
- **PCA Anonymization Integrity**: Components `V1` to `V28` are strictly described by their statistical anomaly contributions without inventing fictitious business labels.
- **Auto-Responder Readiness**: Each flagged transaction produces a structured dispute-ready narrative suitable for automated merchant chargeback defense and compliance logs.

---

{"\n\n---\n\n".join(evidence_reports)}
"""
    with open(docs_path, "w", encoding="utf-8") as f:
        f.write(full_doc)

    logger.info(f"Sample evidence reports saved to {docs_path}")


def main():
    explainer = FraudExplainer()
    run_test_suite_on_test_data(explainer, n_samples=5)


if __name__ == "__main__":
    main()
