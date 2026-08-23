# SentinelPay - SHAP Real-Time Explainability & Auto-Responder Evidence

This document demonstrates SentinelPay's automated SHAP explainability engine on real test transactions flagged by the production XGBoost model.

## Methodology & Architectural Honesty
- **Attribution Engine**: `shap.TreeExplainer` computed natively on XGBoost decision tree paths.
- **PCA Anonymization Integrity**: Components `V1` to `V28` are strictly described by their statistical anomaly contributions without inventing fictitious business labels.
- **Auto-Responder Readiness**: Each flagged transaction produces a structured dispute-ready narrative suitable for automated merchant chargeback defense and compliance logs.

---

## Sample 1: `TXN-TEST-00404` (Ground Truth: **FRAUD (1)**)

### SentinelPay Automated Fraud Evidence & Chargeback Dossier
**Metadata:** Transaction ID: `TXN-TEST-00404` | Risk Score: `0.9998` (99.98%) | Status: **`FLAGGED_FOR_REVIEW`**

#### 1. Executive Summary & Automated Evidence Narrative
This transaction was flagged with a **100.0% estimated fraud risk score** exceeding the operational security threshold (0.10). The primary quantitative risk indicators driving this alert are: statistical anomaly in derived PCA component V14 (value: -5.21, 52.2% weight), statistical anomaly in derived PCA component V10 (value: -3.23, 18.7% weight), statistical anomaly in derived PCA component V3 (value: -5.00, 11.6% weight), statistical anomaly in derived PCA component V12 (value: -3.10, 9.7% weight). Conversely, baseline conformity in V1 (7.8% mitigating weight) partially counterbalanced the anomaly score.

#### 2. Key SHAP Feature Attribution Breakdown
  1. **V14** (Derived PCA Anomaly Factor V14)
     - Value: `-5.2101` | SHAP Attribution: `+4.9198` | Contribution: **52.2%** (🔴 Increases Risk)
  2. **V10** (Derived PCA Anomaly Factor V10)
     - Value: `-3.2322` | SHAP Attribution: `+1.7590` | Contribution: **18.7%** (🔴 Increases Risk)
  3. **V3** (Derived PCA Anomaly Factor V3)
     - Value: `-5.0042` | SHAP Attribution: `+1.0967` | Contribution: **11.6%** (🔴 Increases Risk)
  4. **V12** (Derived PCA Anomaly Factor V12)
     - Value: `-3.0969` | SHAP Attribution: `+0.9131` | Contribution: **9.7%** (🔴 Increases Risk)
  5. **V1** (Derived PCA Anomaly Factor V1)
     - Value: `1.3786` | SHAP Attribution: `-0.7322` | Contribution: **7.8%** (🟢 Decreases Risk)

#### 3. Recommended Operational Action & Dispute Defense
**High-Confidence Fraud Pattern Detected**: Immediate cardholder challenge / step-up 3D Secure authentication required. If chargeback dispute is initiated, attach this SHAP attribution log verifying multi-dimensional statistical divergence from valid cardholder behavioral profiles.

> *Note on Dataset Explainability*: In accordance with banking confidentiality, components V1–V28 are anonymized PCA projections. Feature attributions reflect exact mathematical Shapley game-theoretic contributions without speculative business relabeling.

---

## Sample 2: `TXN-TEST-00595` (Ground Truth: **LEGITIMATE (0, False Positive)**)

### SentinelPay Automated Fraud Evidence & Chargeback Dossier
**Metadata:** Transaction ID: `TXN-TEST-00595` | Risk Score: `0.8823` (88.23%) | Status: **`FLAGGED_FOR_REVIEW`**

#### 1. Executive Summary & Automated Evidence Narrative
This transaction was flagged with a **88.2% estimated fraud risk score** exceeding the operational security threshold (0.10). The primary quantitative risk indicators driving this alert are: statistical anomaly in derived PCA component V14 (value: -5.82, 45.1% weight), statistical anomaly in derived PCA component V10 (value: -2.33, 14.1% weight), statistical anomaly in derived PCA component V4 (value: +3.84, 13.9% weight). Conversely, baseline conformity in V16 (17.6% mitigating weight), V8 (9.4% mitigating weight) partially counterbalanced the anomaly score.

#### 2. Key SHAP Feature Attribution Breakdown
  1. **V14** (Derived PCA Anomaly Factor V14)
     - Value: `-5.822` | SHAP Attribution: `+4.1476` | Contribution: **45.1%** (🔴 Increases Risk)
  2. **V16** (Derived PCA Anomaly Factor V16)
     - Value: `2.9269` | SHAP Attribution: `-1.6192` | Contribution: **17.6%** (🟢 Decreases Risk)
  3. **V10** (Derived PCA Anomaly Factor V10)
     - Value: `-2.332` | SHAP Attribution: `+1.2954` | Contribution: **14.1%** (🔴 Increases Risk)
  4. **V4** (Derived PCA Anomaly Factor V4)
     - Value: `3.8449` | SHAP Attribution: `+1.2766` | Contribution: **13.9%** (🔴 Increases Risk)
  5. **V8** (Derived PCA Anomaly Factor V8)
     - Value: `0.3238` | SHAP Attribution: `-0.8671` | Contribution: **9.4%** (🟢 Decreases Risk)

#### 3. Recommended Operational Action & Dispute Defense
**High-Confidence Fraud Pattern Detected**: Immediate cardholder challenge / step-up 3D Secure authentication required. If chargeback dispute is initiated, attach this SHAP attribution log verifying multi-dimensional statistical divergence from valid cardholder behavioral profiles.

> *Note on Dataset Explainability*: In accordance with banking confidentiality, components V1–V28 are anonymized PCA projections. Feature attributions reflect exact mathematical Shapley game-theoretic contributions without speculative business relabeling.

---

## Sample 3: `TXN-TEST-00805` (Ground Truth: **FRAUD (1)**)

### SentinelPay Automated Fraud Evidence & Chargeback Dossier
**Metadata:** Transaction ID: `TXN-TEST-00805` | Risk Score: `1.0000` (100.00%) | Status: **`FLAGGED_FOR_REVIEW`**

#### 1. Executive Summary & Automated Evidence Narrative
This transaction was flagged with a **100.0% estimated fraud risk score** exceeding the operational security threshold (0.10). The primary quantitative risk indicators driving this alert are: statistical anomaly in derived PCA component V14 (value: -15.45, 43.4% weight), statistical anomaly in derived PCA component V4 (value: +8.34, 23.0% weight), statistical anomaly in derived PCA component V10 (value: -11.44, 12.3% weight), statistical anomaly in derived PCA component V12 (value: -14.30, 11.1% weight), statistical anomaly in derived PCA component V3 (value: -8.53, 10.3% weight).

#### 2. Key SHAP Feature Attribution Breakdown
  1. **V14** (Derived PCA Anomaly Factor V14)
     - Value: `-15.445` | SHAP Attribution: `+4.7672` | Contribution: **43.4%** (🔴 Increases Risk)
  2. **V4** (Derived PCA Anomaly Factor V4)
     - Value: `8.3444` | SHAP Attribution: `+2.5214` | Contribution: **23.0%** (🔴 Increases Risk)
  3. **V10** (Derived PCA Anomaly Factor V10)
     - Value: `-11.4356` | SHAP Attribution: `+1.3493` | Contribution: **12.3%** (🔴 Increases Risk)
  4. **V12** (Derived PCA Anomaly Factor V12)
     - Value: `-14.2961` | SHAP Attribution: `+1.2204` | Contribution: **11.1%** (🔴 Increases Risk)
  5. **V3** (Derived PCA Anomaly Factor V3)
     - Value: `-8.5325` | SHAP Attribution: `+1.1260` | Contribution: **10.3%** (🔴 Increases Risk)

#### 3. Recommended Operational Action & Dispute Defense
**High-Confidence Fraud Pattern Detected**: Immediate cardholder challenge / step-up 3D Secure authentication required. If chargeback dispute is initiated, attach this SHAP attribution log verifying multi-dimensional statistical divergence from valid cardholder behavioral profiles.

> *Note on Dataset Explainability*: In accordance with banking confidentiality, components V1–V28 are anonymized PCA projections. Feature attributions reflect exact mathematical Shapley game-theoretic contributions without speculative business relabeling.

---

## Sample 4: `TXN-TEST-00809` (Ground Truth: **FRAUD (1)**)

### SentinelPay Automated Fraud Evidence & Chargeback Dossier
**Metadata:** Transaction ID: `TXN-TEST-00809` | Risk Score: `1.0000` (100.00%) | Status: **`FLAGGED_FOR_REVIEW`**

#### 1. Executive Summary & Automated Evidence Narrative
This transaction was flagged with a **100.0% estimated fraud risk score** exceeding the operational security threshold (0.10). The primary quantitative risk indicators driving this alert are: statistical anomaly in derived PCA component V14 (value: -9.15, 45.9% weight), statistical anomaly in derived PCA component V4 (value: +6.01, 21.8% weight), statistical anomaly in derived PCA component V10 (value: -4.06, 14.4% weight), statistical anomaly in derived PCA component V3 (value: -5.65, 9.2% weight), statistical anomaly in derived PCA component V7 (value: -1.82, 8.7% weight).

#### 2. Key SHAP Feature Attribution Breakdown
  1. **V14** (Derived PCA Anomaly Factor V14)
     - Value: `-9.151` | SHAP Attribution: `+4.7468` | Contribution: **45.9%** (🔴 Increases Risk)
  2. **V4** (Derived PCA Anomaly Factor V4)
     - Value: `6.0094` | SHAP Attribution: `+2.2495` | Contribution: **21.8%** (🔴 Increases Risk)
  3. **V10** (Derived PCA Anomaly Factor V10)
     - Value: `-4.0631` | SHAP Attribution: `+1.4861` | Contribution: **14.4%** (🔴 Increases Risk)
  4. **V3** (Derived PCA Anomaly Factor V3)
     - Value: `-5.6473` | SHAP Attribution: `+0.9463` | Contribution: **9.2%** (🔴 Increases Risk)
  5. **V7** (Derived PCA Anomaly Factor V7)
     - Value: `-1.8193` | SHAP Attribution: `+0.9038` | Contribution: **8.7%** (🔴 Increases Risk)

#### 3. Recommended Operational Action & Dispute Defense
**High-Confidence Fraud Pattern Detected**: Immediate cardholder challenge / step-up 3D Secure authentication required. If chargeback dispute is initiated, attach this SHAP attribution log verifying multi-dimensional statistical divergence from valid cardholder behavioral profiles.

> *Note on Dataset Explainability*: In accordance with banking confidentiality, components V1–V28 are anonymized PCA projections. Feature attributions reflect exact mathematical Shapley game-theoretic contributions without speculative business relabeling.

---

## Sample 5: `TXN-TEST-01210` (Ground Truth: **FRAUD (1)**)

### SentinelPay Automated Fraud Evidence & Chargeback Dossier
**Metadata:** Transaction ID: `TXN-TEST-01210` | Risk Score: `0.5411` (54.11%) | Status: **`FLAGGED_FOR_REVIEW`**

#### 1. Executive Summary & Automated Evidence Narrative
This transaction was flagged with a **54.1% estimated fraud risk score** exceeding the operational security threshold (0.10). The primary quantitative risk indicators driving this alert are: statistical anomaly in derived PCA component V14 (value: -5.21, 46.2% weight), statistical anomaly in derived PCA component V12 (value: -4.58, 8.6% weight). Conversely, baseline conformity in V4 (25.9% mitigating weight), V10 (12.1% mitigating weight), V26 (7.1% mitigating weight) partially counterbalanced the anomaly score.

#### 2. Key SHAP Feature Attribution Breakdown
  1. **V14** (Derived PCA Anomaly Factor V14)
     - Value: `-5.2083` | SHAP Attribution: `+5.5817` | Contribution: **46.2%** (🔴 Increases Risk)
  2. **V4** (Derived PCA Anomaly Factor V4)
     - Value: `0.2178` | SHAP Attribution: `-3.1303` | Contribution: **25.9%** (🟢 Decreases Risk)
  3. **V10** (Derived PCA Anomaly Factor V10)
     - Value: `-1.2503` | SHAP Attribution: `-1.4578` | Contribution: **12.1%** (🟢 Decreases Risk)
  4. **V12** (Derived PCA Anomaly Factor V12)
     - Value: `-4.5831` | SHAP Attribution: `+1.0430` | Contribution: **8.6%** (🔴 Increases Risk)
  5. **V26** (Derived PCA Anomaly Factor V26)
     - Value: `-0.3498` | SHAP Attribution: `-0.8616` | Contribution: **7.1%** (🟢 Decreases Risk)

#### 3. Recommended Operational Action & Dispute Defense
**Elevated Risk Score Detected**: Recommend automated SMS/OTP confirmation or temporary hold. Log evidence telemetry for automated chargeback defense.

> *Note on Dataset Explainability*: In accordance with banking confidentiality, components V1–V28 are anonymized PCA projections. Feature attributions reflect exact mathematical Shapley game-theoretic contributions without speculative business relabeling.
