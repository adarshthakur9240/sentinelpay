#!/usr/bin/env python3
"""
SentinelPay - Baseline Model Training & Evaluation
==================================================
Trains an honest Logistic Regression baseline with balanced class weights on the
Credit Card Fraud dataset, evaluates using imbalance-appropriate metrics (PR-AUC,
Precision, Recall, F1 score), plots the Precision-Recall curve, and documents the
baseline benchmark for future iterations (e.g., XGBoost).
"""

import sys
import logging
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    average_precision_score,
    roc_auc_score,
    precision_recall_curve,
    confusion_matrix,
    classification_report,
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("sentinelpay.ml.baseline")


def find_project_paths():
    """Resolve paths for datasets, models, plots, and documentation."""
    current_file = Path(__file__).resolve()
    # current_file is ml/baseline/train_baseline.py
    ml_dir = current_file.parent.parent
    project_root = ml_dir.parent

    processed_dir = ml_dir / "data" / "processed"
    baseline_dir = ml_dir / "baseline"
    docs_dir = project_root / "docs"

    return project_root, ml_dir, processed_dir, baseline_dir, docs_dir


def load_processed_data(processed_dir: Path):
    """Load train, val, and test datasets."""
    train_path = processed_dir / "train.csv"
    val_path = processed_dir / "val.csv"
    test_path = processed_dir / "test.csv"

    if not train_path.exists() or not test_path.exists():
        raise FileNotFoundError(
            f"Processed data not found in {processed_dir}. Run ml/data/prepare_data.py first."
        )

    logger.info(f"Loading train data from {train_path}...")
    train_df = pd.read_csv(train_path)
    logger.info(f"Loading val data from {val_path}...")
    val_df = pd.read_csv(val_path)
    logger.info(f"Loading test data from {test_path}...")
    test_df = pd.read_csv(test_path)

    feature_cols = [c for c in train_df.columns if c != "Class"]
    target_col = "Class"

    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_val, y_val = val_df[feature_cols], val_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]

    return (X_train, y_train), (X_val, y_val), (X_test, y_test), feature_cols


def train_baseline_model(X_train: pd.DataFrame, y_train: pd.Series) -> LogisticRegression:
    """
    Train LogisticRegression baseline with class_weight='balanced'.
    
    CRITICAL WHY:
    In a dataset with 99.83% negative (legitimate) cases and only 0.17% positive (fraud) cases,
    a standard unweighted model minimizes empirical risk by predicting Class 0 for almost all
    samples. Using `class_weight='balanced'` adjusts the loss function by weighting each class
    inversely proportional to its frequency:
        w_j = n_samples / (n_classes * n_samples_j)
    This penalizes false negatives on rare fraud cases appropriately and forces the decision
    boundary to account for the minority class without artificial downsampling or oversampling.
    """
    logger.info("Training Logistic Regression baseline with class_weight='balanced'...")
    model = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        random_state=42,
        solver="lbfgs",
    )
    model.fit(X_train, y_train)
    logger.info("Baseline Logistic Regression training completed.")
    return model


def evaluate_baseline(model: LogisticRegression, X_test: pd.DataFrame, y_test: pd.Series):
    """
    Evaluate the baseline model on the test set using PR-AUC, Precision, Recall, and F1.
    
    CRITICAL WHY NOT ACCURACY:
    Accuracy is completely meaningless and dangerously deceptive for severe class imbalance.
    A trivial 'dummy classifier' that predicts 0 for all transactions achieves 99.83% accuracy
    while catching 0% of fraud attacks (Recall = 0, Precision = 0).
    We therefore evaluate strictly on Precision, Recall, F1 Score, and PR-AUC.
    """
    logger.info("Evaluating baseline model on unseen test set (42,722 transactions)...")

    # Predict discrete classes and continuous probabilities
    y_pred = model.predict(X_test)
    y_probs = model.predict_proba(X_test)[:, 1]

    # Metrics
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    pr_auc = average_precision_score(y_test, y_probs)
    roc_auc = roc_auc_score(y_test, y_probs)
    cm = confusion_matrix(y_test, y_pred)

    tn, fp, fn, tp = cm.ravel()

    print("\n" + "=" * 65)
    print("           BASELINE EVALUATION RESULTS (TEST SET)            ")
    print("=" * 65)
    print(f"Total Test Samples     : {len(y_test):,}")
    print(f"Total Fraud in Test    : {y_test.sum():,} ({y_test.mean()*100:.4f}%)")
    print("-" * 65)
    print(f"PR-AUC (Primary Metric): {pr_auc:.4f}  <--- (TARGET BENCHMARK TO BEAT)")
    print(f"ROC-AUC (Optimistic)   : {roc_auc:.4f}")
    print(f"Precision (Class 1)    : {prec:.4f} ({prec*100:.2f}%)")
    print(f"Recall (Class 1)       : {rec:.4f} ({rec*100:.2f}%)")
    print(f"F1-Score (Class 1)     : {f1:.4f}")
    print("-" * 65)
    print("Confusion Matrix:")
    print(f"  True Negatives (Legit detected as Legit)   : {tn:>6,}")
    print(f"  False Positives (Legit flagged as Fraud)   : {fp:>6,}")
    print(f"  False Negatives (Fraud missed!)            : {fn:>6,}")
    print(f"  True Positives (Fraud caught!)             : {tp:>6,}")
    print("=" * 65 + "\n")

    logger.info(f"Baseline Test PR-AUC: {pr_auc:.4f} | Recall: {rec:.4f} | Precision: {prec:.4f}")

    metrics = {
        "pr_auc": pr_auc,
        "roc_auc": roc_auc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "tn": tn,
        "fp": fp,
        "fn": fn,
        "tp": tp,
        "total_test": len(y_test),
        "total_fraud_test": int(y_test.sum()),
    }

    return metrics, y_probs


def plot_precision_recall_curve(
    y_test: pd.Series,
    y_probs: np.ndarray,
    pr_auc: float,
    output_path: Path,
):
    """
    Plot and save Precision-Recall Curve.
    
    CRITICAL WHY PR-AUC OVER ROC-AUC:
    For datasets with extreme imbalance (fraud rate ~0.17%), ROC curves plot True Positive Rate
    vs False Positive Rate (FPR = FP / (FP + TN)). Because the negative class is immense
    (TN ~ 42,648 in test set), even hundreds of False Positives produce a negligible FPR (e.g. 500 / 42,648 = 0.011),
    making the ROC curve look nearly perfect (ROC-AUC ~ 0.97+) while the model produces dozens of false alarms
    for every actual fraud detected.
    
    In contrast, Precision = TP / (TP + FP) directly measures false alarms against true detections.
    The Precision-Recall curve correctly reveals the true cost of false alarms and operates
    independently of the overwhelming number of true negatives.
    """
    logger.info(f"Generating Precision-Recall curve plot -> {output_path}...")

    precisions, recalls, thresholds = precision_recall_curve(y_test, y_probs)
    no_skill_ratio = y_test.sum() / len(y_test)

    plt.figure(figsize=(8, 6), dpi=300)
    plt.plot(
        recalls,
        precisions,
        color="#2563EB",
        lw=2.5,
        label=f"Logistic Regression Baseline (PR-AUC = {pr_auc:.4f})",
    )
    plt.axhline(
        y=no_skill_ratio,
        color="#DC2626",
        linestyle="--",
        lw=1.5,
        label=f"No-Skill Baseline ({no_skill_ratio*100:.3f}% Fraud Prevalence)",
    )

    plt.title("Precision-Recall Curve (Baseline: Logistic Regression)", fontsize=13, fontweight="bold", pad=12)
    plt.xlabel("Recall (True Positive Rate)", fontsize=11, labelpad=8)
    plt.ylabel("Precision (Positive Predictive Value)", fontsize=11, labelpad=8)
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.legend(loc="upper right", frameon=True, facecolor="#F8FAFC", edgecolor="#CBD5E1", fontsize=10)
    plt.tight_layout()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300)
    plt.close()
    logger.info(f"Precision-Recall curve saved successfully at: {output_path}")


def write_documentation(metrics: dict, docs_path: Path):
    """Generate docs/baseline_results.md with benchmark results and rationale."""
    logger.info(f"Writing baseline evaluation report to {docs_path}...")
    docs_path.parent.mkdir(parents=True, exist_ok=True)

    content = f"""# SentinelPay - ML Baseline Model Report

## 1. Overview & Benchmark Objective
Before training complex models (such as Gradient Boosted Trees / XGBoost, Deep Neural Networks, or Graph Ensembles), we establish an honest, reproducible baseline using **Logistic Regression with Balanced Class Weights**.

This baseline serves as the benchmark: **Any complex model (e.g., XGBoost) must comfortably beat this PR-AUC number to justify its operational and computational complexity.**

---

## 2. Baseline Model Performance

| Metric | Baseline Score | Interpretation / Target |
| :--- | :--- | :--- |
| **PR-AUC (Primary)** | **`{metrics['pr_auc']:.4f}`** | **Primary benchmark to beat** (Precision-Recall Area Under Curve) |
| **ROC-AUC (Comparative)** | **`{metrics['roc_auc']:.4f}`** | Misleadingly optimistic due to massive True Negative pool |
| **Recall (Class 1)** | **`{metrics['recall']:.4f}` ({metrics['recall']*100:.2f}%)** | Proportion of actual fraud caught ({metrics['tp']}/{metrics['total_fraud_test']}) |
| **Precision (Class 1)** | **`{metrics['precision']:.4f}` ({metrics['precision']*100:.2f}%)** | Proportion of flagged alerts that were genuine fraud |
| **F1-Score (Class 1)** | **`{metrics['f1']:.4f}`** | Harmonic mean of Precision and Recall |

### Test Set Confusion Matrix
- **Total Test Transactions**: {metrics['total_test']:,} (Fraud cases: {metrics['total_fraud_test']})
- **True Positives (Fraud caught)**: `{metrics['tp']}` / {metrics['total_fraud_test']} ({metrics['recall']*100:.1f}%)
- **False Negatives (Fraud missed)**: `{metrics['fn']}`
- **True Negatives (Legitimate passed)**: `{metrics['tn']:,}`
- **False Positives (False alarms)**: `{metrics['fp']:,}`

---

## 3. Why PR-AUC Over ROC-AUC for Fraud Detection

### The Problem with Accuracy
In this dataset, legitimate transactions make up **99.83%** of all samples ({metrics['total_test'] - metrics['total_fraud_test']:,} out of {metrics['total_test']:,} in the test set). 
A dummy classifier that predicts *zero* (legitimate) for every single transaction achieves **99.83% accuracy**, yet catches **0% of fraud** (Recall = 0, financial loss = 100%). Accuracy is thus completely invalid.

### The Problem with ROC-AUC under Extreme Imbalance (~0.17% Fraud)
ROC curves plot the True Positive Rate ($TPR = \\frac{{TP}}{{TP + FN}}$) against the False Positive Rate ($FPR = \\frac{{FP}}{{FP + TN}}$).
- Because the number of legitimate transactions ($TN$) is massive (~42,648 in test split), even a large number of false alarms (e.g. {metrics['fp']:,} false positives) results in a tiny FPR:
  $$\\text{{FPR}} = \\frac{{{metrics['fp']}}}{{{metrics['fp']} + {metrics['tn']}}} = {metrics['fp'] / (metrics['fp'] + metrics['tn']):.4f}$$
- This compresses the False Positive axis and inflates the ROC-AUC to a deceptively stellar **`{metrics['roc_auc']:.4f}`**, masking severe false positive pollution.

### Why Precision-Recall AUC (PR-AUC) is the Honest Metric
Precision-Recall curves plot Precision ($PPV = \\frac{{TP}}{{TP + FP}}$) directly against Recall ($TPR = \\frac{{TP}}{{TP + FN}}$):
- The metric directly contrasts true fraud detections against false customer frictions (false alarms), without being diluted by the immense volume of true negatives.
- The baseline PR-AUC of **`{metrics['pr_auc']:.4f}`** accurately reflects the performance trade-off between catching fraud and managing operational review costs.

---

## 4. Precision-Recall Curve

![Precision-Recall Curve Baseline](pr_curve_baseline.png)

---

## 5. Target for Future Iterations (XGBoost / Advanced Architectures)
- **Baseline PR-AUC to beat**: **`{metrics['pr_auc']:.4f}`**
- Next step: Train an XGBoost model with hyperparameter tuning, scale_pos_weight optimization, and evaluate feature importance / SHAP values to push PR-AUC above this baseline.
"""

    with open(docs_path, "w", encoding="utf-8") as f:
        f.write(content)
    logger.info(f"Baseline documentation generated at: {docs_path}")


def main():
    project_root, ml_dir, processed_dir, baseline_dir, docs_dir = find_project_paths()

    # 1. Load preprocessed splits
    (X_train, y_train), (X_val, y_val), (X_test, y_test), feature_cols = load_processed_data(processed_dir)

    # 2. Train baseline Logistic Regression with class_weight='balanced'
    model = train_baseline_model(X_train, y_train)

    # 3. Save baseline model artifact
    baseline_dir.mkdir(parents=True, exist_ok=True)
    model_artifact_path = baseline_dir / "baseline_model.joblib"
    joblib.dump(model, model_artifact_path)
    logger.info(f"Saved baseline model to {model_artifact_path}")

    # 4. Evaluate on test set
    metrics, y_probs = evaluate_baseline(model, X_test, y_test)

    # 5. Plot and save Precision-Recall curve
    docs_pr_curve_path = docs_dir / "pr_curve_baseline.png"
    plot_precision_recall_curve(y_test, y_probs, metrics["pr_auc"], docs_pr_curve_path)

    # Also save a copy inside ml/baseline/
    ml_pr_curve_path = baseline_dir / "pr_curve_baseline.png"
    plot_precision_recall_curve(y_test, y_probs, metrics["pr_auc"], ml_pr_curve_path)

    # 6. Write docs/baseline_results.md
    docs_results_path = docs_dir / "baseline_results.md"
    write_documentation(metrics, docs_results_path)

    print("\n" + "#" * 65)
    print(f"# BASELINE PR-AUC BENCHMARK: {metrics['pr_auc']:.4f}")
    print(f"# (Target for XGBoost and future models to beat)")
    print("#" * 65 + "\n")


if __name__ == "__main__":
    main()
