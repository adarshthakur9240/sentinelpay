# SentinelPay 🛡️
> **Real-Time Fraud Intelligence Engine & SHAP Dispute Evidence Generator for Extreme Class Imbalance (0.17%)**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.1.4-EB5424?logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io)
[![SHAP](https://img.shields.io/badge/SHAP-TreeExplainer-FF6F00)](https://shap.readthedocs.io)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. The Bar We're Answering

| Evaluation Dimension | Challenge Standard | SentinelPay Implementation | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Class Imbalance Rigor** | Prevent misleading accuracy scores on sparse data | Trained on 284,807 transactions (only 492 / 0.17% fraud). Optimized strictly on PR-AUC. | `0.8424` PR-AUC (`docs/xgboost_results.md`) |
| **Empirical Discipline** | Establish clear classical baselines before complexity | Evaluated Logistic Regression baseline first (6.73% precision, 901 false positives). | `docs/baseline_results.md` |
| **Model Architecture** | Cost-weighted machine learning tailored to distribution | XGBoost with exact class weighting (`scale_pos_weight=578.55`), outperforming SMOTE. | `docs/xgboost_results.md` |
| **Cost-Sensitive Decisioning** | Avoid arbitrary 0.50 decision thresholds | Parametric threshold sweep balancing $5 FP friction vs $122.21 FN chargeback loss. | Optimal $t=0.10$ (`docs/cost_analysis.md`) |
| **Auditability & Explainability** | Transparent, tamper-evident feature attributions | Native `shap.TreeExplainer` providing mathematical attribution without fictional PCA labels. | `docs/explainability_sample_evidence.md` |
| **Low-Latency Production API** | Real-time transaction decisioning (<50ms SLA) | Asynchronous FastAPI service delivering sub-10ms tree scoring and SHAP generation. | `serving/app/main.py` + OpenAPI docs |
| **Defense-Only Scope** | Zero offensive or autonomous blocking capability | Strictly advisory intelligence layer: scoring risk and generating dispute defense dossiers. | Architecture & track compliance |

---

## 2. Live Demo & API Endpoints

- **Interactive Web Client**: [`http://localhost:3000`](http://localhost:3000)
- **Operational Risk Console**: [`http://localhost:3000/console`](http://localhost:3000/console)
- **SHAP Dispute Evidence Dossier**: [`http://localhost:3000/evidence`](http://localhost:3000/evidence)
- **Interactive OpenAPI Documentation**: [`http://localhost:8000/docs`](http://localhost:8000/docs)
- **FastAPI Health & Telemetry**: [`http://localhost:8000/health`](http://localhost:8000/health)

---

## 3. The Core Insight: Why Accuracy is the Wrong Metric

In credit card fraud detection, fraudulent transactions account for only **492 out of 284,807 total transactions (0.17%)**. A naive model that blindly approves every single transaction achieves **99.83% accuracy** while catching exactly zero fraud attacks, resulting in catastrophic financial loss. 

Because class imbalance is extreme (578 legitimate charges for every single fraud event), SentinelPay evaluates performance strictly via **Precision-Recall Area Under the Curve (PR-AUC)**. PR-AUC measures genuine fraud capture (recall) against false alarm customer friction (precision), ensuring operational effectiveness where accuracy is completely meaningless.

---

## 4. System Architecture

```mermaid
flowchart TD
    subgraph Data["Data Pipeline & Training"]
        RawData["Kaggle ULB Dataset<br/>284,807 Transactions<br/>492 Fraud Cases (0.17%)"] --> Split["Stratified 70/15/15 Split<br/>Train / Val / Test"]
        Split --> Baseline["Logistic Regression Baseline<br/>PR-AUC: 0.7904"]
        Split --> XGB["XGBoost Classifier<br/>scale_pos_weight: 578.55<br/>PR-AUC: 0.8424"]
        XGB --> CostOpt["Parametric Cost Optimization<br/>Threshold t: 0.10<br/>Min Cost: $1,424.31"]
    end

    subgraph Serving["FastAPI Inference Engine"]
        API["FastAPI App<br/>Port 8000"]
        API --> ScoreRoute["POST /score<br/>Sub-10ms Inference"]
        API --> ExplainRoute["POST /explain<br/>SHAP TreeExplainer"]
        ScoreRoute --> CostOpt
        ExplainRoute --> SHAPEngine["shap.TreeExplainer<br/>Exact Mathematical Values"]
    end

    subgraph Frontend["Next.js Web Experience"]
        Landing["Landing Experience<br/>3D R3F Flight Corridor"]
        Console["Operational Risk Console<br/>Live Threshold Slider"]
        Evidence["Dispute Evidence Dossier<br/>One-Click Chargeback Pack"]
        Landing --> Console
        Landing --> Evidence
        Console --> ScoreRoute
        Evidence --> ExplainRoute
    end
```

---

## 5. Key Results: Baseline vs. XGBoost

Evaluated on the identical held-out test split of **42,722 transactions** (74 fraud cases, 42,648 legitimate cases):

| Architecture / Configuration | PR-AUC (Primary) | ROC-AUC | Recall (% Caught) | Precision | False Positives | FP per 10k tx |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline (Logistic Regression)** | `0.7904` | `0.9675` | `87.84%` (65/74) | `6.73%` | `901` | `210.9` |
| **XGBoost + SMOTE Oversampling** | `0.7947` | `0.9614` | `85.14%` (63/74) | `26.81%` | `172` | `40.3` |
| **XGBoost (SentinelPay Production)** | **`0.8424`** | **`0.9675`** | **`85.14%` (63/74)** | **`79.75%`** | **`16`** | **`3.7`** |

> **Key Finding on SMOTE**: Synthetic oversampling degraded precision by generating artificial minority samples that crossed the boundary into legitimate high-dimensional PCA space (172 false alarms vs. 16 for native cost-weighting). SentinelPay's exact `scale_pos_weight=578.55` weights loss gradients directly without fabricating fake data.

---

## 6. The Operational Cost Matrix (Our Core Differentiator)

SentinelPay rejects default $0.50$ thresholds. We parameterize financial loss using empirical data ($C_{FN} = \$122.21$, average fraud transaction size) and customer friction ($C_{FP} = \$5.00$, re-verification & review overhead):

$$\text{Total Operational Cost} = (\text{FN} \times \$122.21) + (\text{FP} \times \$5.00)$$

| Operating Threshold | Recall (% Fraud Caught) | Precision | False Positives / 10k | FP Count | FN Count | Fraud Losses (FN) | Friction Cost (FP) | Total Estimated Cost |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`0.10` (Optimal)** | **`85.14%` (63/74)** | **`79.75%`** | **`3.7`** | **`16`** | **`11`** | **$1,344.31** | **$80.00** | **`$1,424.31`** |
| `0.20` | `82.43%` (61/74) | `83.56%` | `2.8` | `12` | `13` | $1,588.73 | $60.00 | `$1,648.73` |
| `0.30` | `82.43%` (61/74) | `87.14%` | `2.1` | `9` | `13` | $1,588.73 | $45.00 | `$1,633.73` |
| `0.40` | `82.43%` (61/74) | `87.14%` | `2.1` | `9` | `13` | $1,588.73 | $45.00 | `$1,633.73` |
| `0.50` (Default) | `82.43%` (61/74) | `87.14%` | `2.1` | `9` | `13` | $1,588.73 | $45.00 | `$1,633.73` |
| `0.60` | `79.73%` (59/74) | `86.76%` | `2.1` | `9` | `15` | $1,833.15 | $45.00 | `$1,878.15` |
| `0.70` | `79.73%` (59/74) | `88.06%` | `1.9` | `8` | `15` | $1,833.15 | $40.00 | `$1,873.15` |
| `0.80` | `78.38%` (58/74) | `89.23%` | `1.6` | `7` | `16` | $1,955.36 | $35.00 | `$1,990.36` |
| `0.90` | `77.03%` (57/74) | `95.00%` | `0.7` | `3` | `17` | $2,077.57 | $15.00 | `$2,092.57` |

---

## 7. Chargeback Evidence Sample Output

When a transaction is flagged, SentinelPay's `POST /explain` endpoint outputs a verified, audit-ready SHAP evidence dossier:

```markdown
### SentinelPay Automated Fraud Evidence & Chargeback Dossier
**Metadata:** Transaction ID: `TXN-TEST-00404` | Amount: `$122.21` | Risk Score: `0.9998` (99.98%) | Status: **`FLAGGED_FOR_REVIEW`**

#### 1. Executive Summary & Automated Evidence Narrative
This transaction was flagged with a **99.98% estimated fraud risk score** exceeding the operational security threshold (0.10). Primary quantitative risk drivers: statistical anomaly in derived component V14 (value: -5.21, 52.2% weight), statistical anomaly in derived component V10 (value: -3.23, 18.7% weight), statistical anomaly in derived component V3 (value: -5.00, 11.6% weight), statistical anomaly in derived component V12 (value: -3.10, 9.7% weight).

#### 2. Key SHAP Feature Attribution Breakdown
1. **V14** (Derived PCA Factor V14): Value: `-5.2101` | SHAP: `+4.9198` | Weight: **52.2%** (🔴 Increases Risk)
2. **V10** (Derived PCA Factor V10): Value: `-3.2322` | SHAP: `+1.7590` | Weight: **18.7%** (🔴 Increases Risk)
3. **V3**  (Derived PCA Factor V3) : Value: `-5.0042` | SHAP: `+1.0967` | Weight: **11.6%** (🔴 Increases Risk)
4. **V12** (Derived PCA Factor V12): Value: `-3.0969` | SHAP: `+0.9131` | Weight: **9.7%**  (🔴 Increases Risk)
5. **V1**  (Derived PCA Factor V1) : Value: `+1.3786` | SHAP: `-0.7322` | Weight: **7.8%**  (🟢 Decreases Risk)

#### 3. Recommended Operational Action & Dispute Defense
**High-Confidence Fraud Pattern Detected**: Cardholder step-up authentication required. Attach this attribution log to chargeback dispute representation to substantiate behavioral divergence.
```

---

## 8. Tech Stack

- **Model & Explainability**: XGBoost 2.1.4, SHAP 0.46 (TreeExplainer), Scikit-Learn, Pandas, NumPy.
- **Inference API**: FastAPI, Uvicorn (ASGI), Pydantic v2 validation.
- **Frontend & UI**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS (Claymorphism), Framer Motion, GSAP ScrollTrigger.
- **3D Graphics**: Three.js, React Three Fiber (R3F), React Three Drei.

---

## 9. Setup & Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Start the FastAPI Backend
```bash
# From workspace root
python -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt -r serving/requirements.txt

# Launch FastAPI inference server
uvicorn serving.app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API docs will be available at [`http://localhost:8000/docs`](http://localhost:8000/docs)*

### 2. Start the Next.js Frontend
```bash
# In a new terminal
cd frontend
npm install
npm run dev
```
*Web client will be available at [`http://localhost:3000`](http://localhost:3000)*

### 3. Run Backend Test Suite
```bash
pytest serving/tests/test_api.py -v
```

---

## 10. What We'd Add With More Time

1. **Real-Time Streaming Ingestion (Apache Kafka / Flink)**:
   - Transition from micro-batch REST API scoring to continuous event-driven stream processing, computing stateful rolling velocity features (e.g. 5-minute card velocity, device switching counts) in-memory before inference.

2. **Graph-Based Abuse-Ring Detection across Related Accounts**:
   - Integrate a lightweight graph neural network (GNN) or GraphX layer to detect coordinated fraud rings sharing device fingerprints, IP subnets, or proxy hops across merchant networks.

3. **Probability Calibration Analysis (Isotonic Regression / Platt Scaling)**:
   - Apply post-hoc isotonic calibration to raw tree margin outputs to ensure predicted probabilities match empirical Bayesian event likelihoods precisely across merchant sub-segments.
