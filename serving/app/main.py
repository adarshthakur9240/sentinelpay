"""
SentinelPay - FastAPI Real-Time Fraud Detection & Evidence Serving Engine
==========================================================================
Provides low-latency scoring (/score, /score/batch), SHAP-based dispute
auto-responder generation (/explain), and live inspectable performance metrics (/metrics).
"""

import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from serving.app.core.config import settings
from serving.app.core.engine import engine
from serving.app.api.routes_score import router as score_router
from serving.app.api.routes_explain import router as explain_router
from serving.app.schemas.transaction import HealthResponse, ModelMetricsResponse

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("sentinelpay.serving")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Ensures model and TreeExplainer are loaded and pre-warmed ONCE at startup,
    eliminating per-request overhead and latency spikes.
    """
    logger.info("Starting up SentinelPay Serving Service...")
    engine.initialize()
    logger.info("Model and TreeExplainer pre-warmed and ready for traffic.")
    yield
    logger.info("Shutting down SentinelPay Serving Service...")


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Real-time XGBoost fraud detection, batch scoring, SHAP explainability, and chargeback dispute evidence generation API.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(score_router)
app.include_router(explain_router)


@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["System"],
    summary="Service Health Check",
    description="Returns service availability, model readiness, and uptime statistics.",
)
async def health_check() -> HealthResponse:
    """Service health and uptime endpoint."""
    uptime = time.time() - engine.startup_time
    return HealthResponse(
        status="healthy" if engine.is_ready else "initializing",
        model_loaded=engine.model is not None,
        explainer_loaded=engine.explainer is not None,
        version=settings.version,
        uptime_seconds=round(uptime, 2),
    )


@app.get(
    "/metrics",
    response_model=ModelMetricsResponse,
    status_code=status.HTTP_200_OK,
    tags=["System"],
    summary="Inspectable Model Performance & Benchmark Metrics",
    description="Exposes live inspectable precision, recall, PR-AUC, threshold, and baseline comparisons evaluated on the held-out test split at the deployed operating threshold.",
)
async def get_model_metrics() -> ModelMetricsResponse:
    """Live inspectable model performance metrics on unseen test split at deployed operating point."""
    return ModelMetricsResponse(
        model_name="SentinelPay XGBoost Cost-Sensitive Engine",
        model_type="XGBoost Classifier (scale_pos_weight)",
        scale_pos_weight=settings.scale_pos_weight,
        recommended_threshold=settings.operating_threshold,
        held_out_test_metrics={
            "operating_threshold": settings.operating_threshold,
            "pr_auc": settings.pr_auc,
            "roc_auc": settings.roc_auc,
            "precision": settings.test_precision,
            "recall": settings.test_recall,
            "f1_score": settings.test_f1,
            "false_positives": settings.test_false_positives,
            "false_negatives": settings.test_false_negatives,
            "true_positives": settings.test_true_positives,
            "true_negatives": settings.test_true_negatives,
            "false_positives_per_10k": settings.test_false_positives_per_10k,
            "total_test_transactions": settings.total_test_samples,
            "total_fraud_transactions": settings.total_fraud_test,
        },
        baseline_comparison={
            "baseline_model": "Logistic Regression (class_weight='balanced')",
            "baseline_pr_auc": settings.baseline_pr_auc,
            "baseline_roc_auc": settings.baseline_roc_auc,
            "baseline_precision": settings.baseline_precision,
            "baseline_recall": settings.baseline_recall,
            "baseline_false_positives": settings.baseline_fp,
            "pr_auc_lift": round(settings.pr_auc - settings.baseline_pr_auc, 4),
            "false_positive_reduction_pct": round(
                ((settings.baseline_fp - settings.test_false_positives) / settings.baseline_fp) * 100.0, 2
            ),
        },
        cost_model_assumptions={
            "avg_fraud_loss_per_fn_usd": settings.avg_fraud_loss_per_fn,
            "assumed_friction_cost_per_fp_usd": settings.assumed_friction_cost_per_fp,
            "cost_minimizing_threshold": settings.operating_threshold,
            "total_estimated_cost_test_split_usd": settings.total_estimated_test_cost_usd,
        },
    )


@app.get(
    "/",
    tags=["System"],
    include_in_schema=False,
)
async def root():
    return {
        "service": settings.app_name,
        "version": settings.version,
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics",
    }
