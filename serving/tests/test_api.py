"""
SentinelPay Serving - End-to-End API Integration Test Suite
============================================================
Validates all endpoints (/health, /metrics, /score, /score/batch, /explain)
using real transactions sampled directly from the test split.
"""

import sys
from pathlib import Path
import pandas as pd
import pytest
from fastapi.testclient import TestClient

# Ensure workspace root is in sys.path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from serving.app.main import app

# Load real test dataset
TEST_CSV_PATH = WORKSPACE_ROOT / "ml" / "data" / "processed" / "test.csv"


@pytest.fixture(scope="module")
def client():
    """Create test client with active lifespan context."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def test_data():
    """Load real legitimate and fraudulent transactions from the test split."""
    if not TEST_CSV_PATH.exists():
        pytest.skip(f"Test CSV not found at {TEST_CSV_PATH}")

    df = pd.read_csv(TEST_CSV_PATH)

    fraud_df = df[df["Class"] == 1]
    legit_df = df[df["Class"] == 0]

    fraud_sample = fraud_df.iloc[0].drop("Class").to_dict()
    legit_sample = legit_df.iloc[0].drop("Class").to_dict()
    batch_samples = df.iloc[:10].drop(columns=["Class"]).to_dict(orient="records")

    return {
        "fraud_sample": fraud_sample,
        "legit_sample": legit_sample,
        "batch_samples": batch_samples,
    }


def test_health_endpoint(client):
    """Test GET /health returns healthy status and loaded model artifacts."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["explainer_loaded"] is True
    assert "version" in data
    assert data["uptime_seconds"] >= 0


def test_metrics_endpoint(client):
    """Test GET /metrics returns live inspectable model performance and baseline comparison."""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["model_type"] == "XGBoost Classifier (scale_pos_weight)"
    assert data["recommended_threshold"] == 0.10

    # Test held-out metrics at deployed threshold 0.10
    held_out = data["held_out_test_metrics"]
    assert held_out["operating_threshold"] == 0.10
    assert held_out["pr_auc"] == 0.8424
    assert held_out["roc_auc"] == 0.9675
    assert held_out["precision"] == 0.7975
    assert held_out["recall"] == 0.8514
    assert held_out["f1_score"] == 0.8235
    assert held_out["false_positives"] == 16
    assert held_out["false_negatives"] == 11
    assert held_out["true_positives"] == 63
    assert held_out["false_positives_per_10k"] == 3.7
    assert held_out["total_test_transactions"] == 42722
    assert held_out["total_fraud_transactions"] == 74

    # Test baseline comparisons
    baseline = data["baseline_comparison"]
    assert baseline["baseline_pr_auc"] == 0.7904
    assert baseline["pr_auc_lift"] > 0.0


def test_score_single_fraud_transaction(client, test_data):
    """Test POST /score on a real fraud transaction correctly flags it."""
    payload = {
        "transaction_id": "TXN-TEST-FRAUD-001",
        "merchant_id": "MERCH-9942",
        "features": test_data["fraud_sample"],
        "threshold_override": 0.10,
    }
    response = client.post("/score", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["transaction_id"] == "TXN-TEST-FRAUD-001"
    assert 0.0 <= data["risk_score"] <= 1.0
    assert data["risk_score"] >= 0.10  # Fraud sample should exceed threshold
    assert data["is_flagged"] is True
    assert data["decision"] == "FLAGGED_FOR_REVIEW"
    assert data["threshold_applied"] == 0.10
    assert data["latency_ms"] >= 0.0


def test_score_single_legit_transaction(client, test_data):
    """Test POST /score on a real legitimate transaction correctly approves it."""
    payload = {
        "transaction_id": "TXN-TEST-LEGIT-001",
        "merchant_id": "MERCH-1001",
        "features": test_data["legit_sample"],
        "threshold_override": 0.10,
    }
    response = client.post("/score", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["transaction_id"] == "TXN-TEST-LEGIT-001"
    assert 0.0 <= data["risk_score"] <= 1.0
    assert data["risk_score"] < 0.10
    assert data["is_flagged"] is False
    assert data["decision"] == "APPROVED"
    assert data["latency_ms"] >= 0.0


def test_score_batch_transactions(client, test_data):
    """Test POST /score/batch with 10 real transactions."""
    transactions = [
        {
            "transaction_id": f"TXN-BATCH-{i:03d}",
            "features": feat_dict,
        }
        for i, feat_dict in enumerate(test_data["batch_samples"])
    ]

    payload = {"transactions": transactions}
    response = client.post("/score/batch", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["total_processed"] == 10
    assert len(data["results"]) == 10
    assert data["batch_latency_ms"] >= 0.0
    assert data["avg_latency_per_tx_ms"] >= 0.0

    for res in data["results"]:
        assert 0.0 <= res["risk_score"] <= 1.0
        assert res["decision"] in ["FLAGGED_FOR_REVIEW", "APPROVED"]


def test_explain_endpoint(client, test_data):
    """Test POST /explain generates SHAP attributions and dispute evidence narrative."""
    payload = {
        "transaction_id": "TXN-TEST-DISPUTE-001",
        "merchant_id": "MERCH-4811",
        "amount_usd": 389.50,
        "features": test_data["fraud_sample"],
        "top_k": 5,
        "threshold_override": 0.10,
    }
    response = client.post("/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["transaction_id"] == "TXN-TEST-DISPUTE-001"
    assert 0.0 <= data["risk_score"] <= 1.0
    assert data["is_flagged"] is True
    assert data["decision"] == "FLAGGED_FOR_REVIEW"
    assert len(data["top_features"]) == 5

    # Check top feature attribution properties
    for feat in data["top_features"]:
        assert "feature" in feat
        assert "shap_value" in feat
        assert "contribution_pct" in feat
        assert feat["direction"] in ["increases_risk", "decreases_risk"]

    # Check evidence narrative
    narrative = data["evidence_summary"]
    assert "SentinelPay Automated Fraud Evidence & Chargeback Dossier" in narrative
    assert "TXN-TEST-DISPUTE-001" in narrative
    assert "389.50" in narrative
    assert "SHAP" in narrative
