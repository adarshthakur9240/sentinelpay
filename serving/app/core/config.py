"""
SentinelPay Serving - Configuration Settings
============================================
"""

from pathlib import Path
from dataclasses import dataclass
import os


@dataclass
class Settings:
    """Application runtime settings."""
    app_name: str = "SentinelPay Real-Time Fraud Engine"
    version: str = "1.0.0"
    debug: bool = False

    # Threading limits
    num_threads: int = int(os.getenv("SENTINELPAY_NUM_THREADS", "4"))

    # Deployed operational threshold (determined via cost minimization analysis in cost_analysis.md)
    default_threshold: float = float(os.getenv("SENTINELPAY_THRESHOLD", "0.10"))

    # Paths
    project_root: Path = Path(__file__).resolve().parent.parent.parent.parent
    model_path: Path = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "model" / "xgboost_model.joblib"
    scaler_path: Path = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "data" / "processed" / "scaler.joblib"

    # Model threshold-independent performance metrics on held-out test split (42,722 transactions)
    pr_auc: float = 0.8424
    roc_auc: float = 0.9675
    scale_pos_weight: float = 578.55

    # Metrics evaluated strictly AT the deployed operational threshold (0.10)
    operating_threshold: float = 0.10
    test_recall: float = 0.8514
    test_precision: float = 0.7975
    test_f1: float = 0.8235
    test_false_positives: int = 16
    test_false_negatives: int = 11
    test_true_positives: int = 63
    test_true_negatives: int = 42632
    test_false_positives_per_10k: float = 3.7
    total_test_samples: int = 42722
    total_fraud_test: int = 74

    # Baseline comparison metrics (Logistic Regression at balanced threshold)
    baseline_pr_auc: float = 0.7904
    baseline_roc_auc: float = 0.9675
    baseline_precision: float = 0.0673
    baseline_recall: float = 0.8784
    baseline_fp: int = 901

    # Cost model parameters (from cost_analysis.md)
    avg_fraud_loss_per_fn: float = 122.21
    assumed_friction_cost_per_fp: float = 5.00
    total_estimated_test_cost_usd: float = 1424.31


settings = Settings()
