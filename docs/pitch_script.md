# SentinelPay - Judge-Facing Pitch & Live Demo Script (3-Minute Walkthrough)

> **Core Anchor**: Built for Track 02 (Defense-First Intelligence & Explainability under Extreme Class Imbalance).

---

## ⏱️ Pitch Timeline Overview

- **[0:00 - 0:35] The Problem & The 0.17% Core Insight** (Why 99.83% accuracy is total failure)
- **[0:35 - 1:15] The Baseline Discipline & Cost Matrix** (Logistic Regression → Cost-Weighted XGBoost at $t=0.10$)
- **[1:15 - 1:55] Real-Time Interactive Console & SHAP Evidence** (Sub-10ms score + mathematically faithful chargeback dossier)
- **[1:55 - 2:35] Live Streaming Velocity & Fraud Ring Graph** (Stateful 5-min sliding window + NetworkX risk diffusion)
- **[2:35 - 3:00] Calibration, GNN Study & Conclusion** (Isotonic calibration + GNN vs classical graph honesty)

---

## 🎬 Step-by-Step Spoken Script & Screen Actions

### Act 1: The Problem & The Core Insight (0:00 - 0:35)
**Screen**: Landing Page (`http://localhost:3000`) with 3D flight corridor.

> **Spoken**:  
> *"In real-world credit card fraud detection, fraudulent transactions account for only 492 out of 284,807 events — exactly 0.17%.  
> If an engineering team builds a model and reports 99.83% accuracy, that model is a complete operational failure: a dummy script that approves every transaction gets 99.83% accuracy while leaking 100% of fraud losses.  
> SentinelPay was designed from day one with mathematical rigor for extreme class imbalance — evaluating strictly via Precision-Recall Area Under the Curve (PR-AUC) and optimizing on financial cost rather than arbitrary metrics."*

---

### Act 2: Baseline Discipline & Parametric Cost Matrix (0:35 - 1:15)
**Screen**: Operational Risk Console (`http://localhost:3000/console`) → Threshold Matrix.

> **Spoken**:  
> *"We didn't jump straight to a complex model. We first built a classical Logistic Regression baseline, which achieved only 6.73% precision with 901 false alarms.  
> We then built a cost-weighted XGBoost model with `scale_pos_weight=578.55` tuned to the true empirical ratio, reaching 79.75% precision and 85.14% recall — a 98% reduction in false alarms.  
> More importantly, we reject default 0.50 thresholds. Using empirical fraud costs — $122.21 per missed fraud versus $5.00 customer re-verification friction — we parameterized an optimal operating threshold at t = 0.10, minimizing total operational loss to $1,424.31."*

---

### Act 3: Interactive Console & SHAP Dispute Evidence (1:15 - 1:55)
**Screen**: Risk Console (`/console`) scoring a transaction → Click "View Full Evidence Dossier" (`/evidence`).

> **Spoken**:  
> *"Watch our sub-10ms inference in action. When we evaluate an incoming transaction, SentinelPay delivers an instant risk score.  
> When flagged, human dispute operators cannot rely on black-box opacity. SentinelPay utilizes native `shap.TreeExplainer` to compute exact mathematical feature attributions.  
> Unlike tools that invent fictional labels for anonymized PCA components, SentinelPay delivers a tamper-evident, audit-ready chargeback evidence packet with quantitative directional drivers ready for immediate banking representation."*

---

### Act 4: Real-Time Streaming Velocity & Fraud Ring Graph (1:55 - 2:35)
**Screen**: Click `/console` "Live Stream Feed" tab → Click "Simulate 25-Tx Burst" → Navigate to `/network` (Ring Network Graph).

> **Spoken**:  
> *"Static tree models only evaluate instantaneous vectors. To capture rapid card testing and automated draining bursts, we built a real-time Kafka streaming pipeline with an in-memory 5-minute sliding window consumer.  
> When card testing velocity exceeds 3 transactions in 5 minutes, our ensemble applies a 1.15x velocity boost, alerting operators before account draining occurs.  
> Beyond isolated cards, syndicates operate in coordinated rings. On our Network page, we detect shared device emulators and IP subnets using connected-components clustering and risk diffusion, surfacing 0.0% risk accomplice accounts that isolated tree models miss completely."*

---

### Act 5: Empirical Honesty: Calibration & GNN Benchmark (2:35 - 3:00)
**Screen**: Architecture Diagram in `README.md` & Summary.

> **Spoken**:  
> *"Finally, we validated our system with two rigorous empirical sanity checks:  
> First, probability calibration analysis: isotonic regression brought our Expected Calibration Error down from 0.04% to 0.01% without hurting PR-AUC.  
> Second, an honest GNN benchmark: we trained a 2-layer GraphSAGE network via PyTorch Geometric and discovered that our lightweight classical graph algorithms achieved identical 100% ring precision with zero training overhead. We kept the classical approach in production.  
> SentinelPay is disciplined, explainable, and production-ready defense-first intelligence."*

---

## 🎯 Quick Reference: Alignment to Track 02 Criteria

| Evaluation Bar | Spoken Proof Point | Live Screen Proof |
| :--- | :--- | :--- |
| **Class Imbalance Rigor** | 0.17% fraud rate (492/284,807), PR-AUC primary metric | Landing Page & Benchmark Table |
| **Baseline Discipline** | Logistic regression first (6.73% precision, 901 FP) | `docs/baseline_results.md` |
| **Cost Optimization** | Optimal threshold $t=0.10$ minimizing $122.21 FN vs $5 FP | `/console` Slider & Matrix |
| **Explainability** | Exact SHAP TreeExplainer mathematical attribution | `/evidence` Dispute Dossier |
| **Real-Time Streaming** | 5-min sliding window velocity engine & WebSocket feed | `/console` Live Stream Tab |
| **Network Intelligence** | Multi-account ring clustering & accomplice risk diffusion | `/network` 2D Force Graph |
| **Scientific Honesty** | GNN vs Classical benchmark & Isotonic calibration | `docs/gnn_vs_classical_graph.md` |
