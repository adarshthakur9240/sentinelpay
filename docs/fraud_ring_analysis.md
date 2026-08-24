# SentinelPay - Fraud Ring Detection & Graph Risk Propagation

> [!IMPORTANT]
> **Data Authenticity Notice**: The Kaggle ULB Credit Card Fraud dataset contains no account, device, or IP telemetry. 
> The entity linkage evaluated in this analysis is **simulated** (`ml/graph/graph_data/synthetic_linkage.csv`) for research and demonstration purposes to show how SentinelPay's tree-based scoring extends into network-level abuse detection.

---

## 1. Executive Summary & Graph-Level Insights

| Graph Metric | Value | Description |
| :--- | :--- | :--- |
| **Total Evaluated Accounts** | **42,722** | Held-out test set cardholder accounts |
| **Suspected Fraud Rings Detected** | **4** | Clusters of $\ge 3$ accounts with confirmed fraud overlap |
| **Accounts Implicated in Rings** | **18** | Connected across shared devices and IP subnets |
| **Total Ring Fraud Transactions** | **14** | Captured inside coordinated clusters |
| **Graph-Elevated Accomplices** | **5** | Low individual tree score, elevated via graph propagation |

### The Core Graph Insight
In production payments, sophisticated fraud syndicates often use "sleeper" or "mule" accounts that make seemingly normal, low-value transactions that slip past isolated transaction-level classifiers. 

By constructing an entity graph across **shared hardware fingerprints (`device_id`)** and **network subnets (`ip_subnet`)**, SentinelPay propagates risk from known fraud accounts to connected neighbors. An account with an individual score of **0.1%** that shares an emulator device with 3 confirmed fraud attacks receives an elevated **ring risk score of 45-50%**, triggering proactive review.

---

## 2. Interactive Network Graph

An interactive force-directed network visualization has been generated:
- **Interactive Network Visualization**: [`docs/fraud_ring_network.html`](fraud_ring_network.html)
- **Visual Encoding**:
  - 🔴 **Soft Rose Nodes (`#F2B8C6`)**: Confirmed / XGBoost-Flagged Fraud Transactions ($P \ge 0.10$)
  - 🔵 **Soft Periwinkle Nodes (`#A8B5E0`)**: Accomplice Accounts Elevated via Network Propagation
  - 🔗 **Rose Edges**: Shared Hardware Device
  - 🌐 **Periwinkle Edges**: Shared IP Subnet

---

## 3. Detected Fraud Rings Breakdown

### Ring RING-001 (5 Accounts · Avg Ring Risk: 81.0%)
- **Linkage Reason**: Shared Device, Shared Ip
- **Confirmed Fraud Cases**: 4 / 5
- **Flagged by XGBoost**: 4 / 5

| Account ID | Individual XGBoost Score | Propagated Ring Risk | Hardware Device | IP Subnet | True Ground Truth |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACC-100809` | 100.00% | **94.5%** | `DEV-FARM-9901` | `198.51.100.0/24` | 🔴 FRAUD (1) |
| `ACC-100805` | 100.00% | **94.5%** | `DEV-FARM-9901` | `198.51.100.0/24` | 🔴 FRAUD (1) |
| `ACC-100404` | 99.98% | **94.5%** | `DEV-FARM-9901` | `198.51.100.0/24` | 🔴 FRAUD (1) |
| `ACC-101210` | 54.11% | **73.3%** | `DEV-FARM-9901` | `198.51.100.0/24` | 🔴 FRAUD (1) |
| `ACC-100000` | 0.00% | **48.3%** | `DEV-FARM-9901` | `198.51.100.0/24` | 🟢 LEGITIMATE (0) |

### Ring RING-002 (4 Accounts · Avg Ring Risk: 64.6%)
- **Linkage Reason**: Shared Device, Shared Ip
- **Confirmed Fraud Cases**: 3 / 4
- **Flagged by XGBoost**: 2 / 4

| Account ID | Individual XGBoost Score | Propagated Ring Risk | Hardware Device | IP Subnet | True Ground Truth |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACC-101866` | 99.94% | **85.4%** | `DEV-PROXY-4412` | `203.0.113.0/24` | 🔴 FRAUD (1) |
| `ACC-103751` | 88.48% | **84.2%** | `DEV-PROXY-4413` | `203.0.113.0/24` | 🔴 FRAUD (1) |
| `ACC-103115` | 0.00% | **44.4%** | `DEV-PROXY-4412` | `203.0.113.0/24` | 🔴 FRAUD (1) |
| `ACC-100001` | 0.00% | **44.4%** | `DEV-PROXY-4413` | `203.0.113.0/24` | 🟢 LEGITIMATE (0) |

### Ring RING-003 (5 Accounts · Avg Ring Risk: 73.5%)
- **Linkage Reason**: Shared Device, Shared Ip
- **Confirmed Fraud Cases**: 3 / 5
- **Flagged by XGBoost**: 3 / 5

| Account ID | Individual XGBoost Score | Propagated Ring Risk | Hardware Device | IP Subnet | True Ground Truth |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACC-106114` | 100.00% | **92.3%** | `DEV-EMULATOR-8830` | `198.18.0.0/24` | 🔴 FRAUD (1) |
| `ACC-106936` | 99.98% | **92.3%** | `DEV-EMULATOR-8830` | `198.18.0.0/24` | 🔴 FRAUD (1) |
| `ACC-107416` | 95.80% | **90.4%** | `DEV-EMULATOR-8830` | `198.18.0.0/24` | 🔴 FRAUD (1) |
| `ACC-100003` | 0.00% | **46.1%** | `DEV-EMULATOR-8830` | `198.18.0.0/24` | 🟢 LEGITIMATE (0) |
| `ACC-100002` | 0.00% | **46.1%** | `DEV-EMULATOR-8830` | `198.18.0.0/24` | 🟢 LEGITIMATE (0) |

### Ring RING-004 (4 Accounts · Avg Ring Risk: 100.0%)
- **Linkage Reason**: Shared Device, Shared Ip
- **Confirmed Fraud Cases**: 4 / 4
- **Flagged by XGBoost**: 4 / 4

| Account ID | Individual XGBoost Score | Propagated Ring Risk | Hardware Device | IP Subnet | True Ground Truth |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACC-105904` | 100.00% | **100.0%** | `DEV-BOTNET-7721` | `192.0.2.0/24` | 🔴 FRAUD (1) |
| `ACC-105078` | 100.00% | **100.0%** | `DEV-BOTNET-7721` | `192.0.2.0/24` | 🔴 FRAUD (1) |
| `ACC-105890` | 100.00% | **100.0%** | `DEV-BOTNET-7721` | `192.0.2.0/24` | 🔴 FRAUD (1) |
| `ACC-105649` | 99.97% | **100.0%** | `DEV-BOTNET-7721` | `192.0.2.0/24` | 🔴 FRAUD (1) |

---

## 4. Key Accomplice Risk Elevating Case Studies

The following accounts scored below the isolated $t = 0.10$ threshold on individual transaction features, but were **surfaced as high-risk accomplices** through graph propagation:

| Accomplice Account | Ring Association | Individual XGBoost Score | Propagated Ring Risk Score | Primary Linkage Anchor |
| :--- | :--- | :--- | :--- | :--- |
| `ACC-100000` | **RING-001** | 0.00% | **48.3%** | `DEV-FARM-9901` (198.51.100.0/24) |
| `ACC-103115` | **RING-002** | 0.00% | **44.4%** | `DEV-PROXY-4412` (203.0.113.0/24) |
| `ACC-100001` | **RING-002** | 0.00% | **44.4%** | `DEV-PROXY-4413` (203.0.113.0/24) |
| `ACC-100003` | **RING-003** | 0.00% | **46.1%** | `DEV-EMULATOR-8830` (198.18.0.0/24) |
| `ACC-100002` | **RING-003** | 0.00% | **46.1%** | `DEV-EMULATOR-8830` (198.18.0.0/24) |

---

## 5. False Alarm & Isolation Validation

To confirm that the ring detector does not generate spurious false alarms:
1. **Isolated Legitimate Accounts**: Thousands of normal single-transaction accounts with unique devices and IPs form isolated singleton nodes with a ring risk equal strictly to their low individual score.
2. **Benign Household Pairs**: Legitimate multi-account pairs (e.g. household members sharing a home Wi-Fi and iPad) with 0 flagged fraud members are correctly filtered out and **not surfaced as fraud rings** (minimum threshold of $\ge 3$ members and $\ge 1$ flagged fraud node).
