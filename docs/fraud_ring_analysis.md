# SentinelPay - Empirical Multi-Account Fraud Ring Analysis (Kaggle IEEE-CIS)

> [!IMPORTANT]
> **Empirical Real-Data Verification Notice**:
> This analysis is evaluated on **real entity linkage telemetry** from the Kaggle IEEE-CIS Fraud Detection dataset (`train_transaction` + `train_identity`), connecting transactions across real hardware devices (`DeviceInfo`, `id_30`, `id_31`), card fingerprint clusters (`card1` - `card6`), and location hashes (`addr1`, `addr2`, `P_emaildomain`).

---

## 1. Executive Summary & Empirical Lift Metrics

| Evaluation Metric | Measured Value | Operational Meaning |
| :--- | :--- | :--- |
| **Dataset Source** | **Kaggle IEEE-CIS Fraud Detection** | Real payment cards & device telemetry |
| **Analyzed Transactions** | **`75,000`** | Representative payment stream sample |
| **Total Graph Nodes** | **`75,000`** | Transactions in linkage network |
| **Total Linkage Edges** | **`285,852`** | Real card/device/network overlaps |
| **Multi-Account Clusters ($\ge 3$)** | **`1,647`** | Coordinated transaction groupings |
| **Confirmed Fraud Syndicates** | **`97`** | Rings with $\ge 1$ confirmed fraud attack |
| **Global Base Fraud Rate** | **`2.6960%`** | Random sample fraud probability |
| **Fraud Rate in Flagged Rings** | **`4.1578%`** | Fraud density inside detected rings |
| **Empirical Fraud Lift Ratio** | **`1.54x`** | **Elevated risk multiplier inside rings** |

---

## 2. Top Detected Real Fraud Syndicates

| Ring ID | Cluster Size | Confirmed Fraud | Flagged Members | Avg Ring Risk | Primary Linkage Vectors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RING-IEEE-023` | **9** | `9` | `9` | `0.9200` | shared_card_cluster |
| `RING-IEEE-080` | **7** | `7` | `7` | `0.9200` | shared_card_cluster |
| `RING-IEEE-068` | **6** | `6` | `6` | `0.9200` | shared_card_cluster |
| `RING-IEEE-044` | **5** | `5` | `5` | `0.9200` | shared_card_cluster |
| `RING-IEEE-055` | **5** | `5` | `5` | `0.9200` | shared_card_cluster |
| `RING-IEEE-054` | **4** | `4` | `4` | `0.9200` | shared_device_fingerprint |
| `RING-IEEE-094` | **4** | `4` | `4` | `0.9200` | shared_device_fingerprint |
| `RING-IEEE-097` | **4** | `4` | `4` | `0.9200` | shared_device_fingerprint |
| `RING-IEEE-004` | **3** | `3` | `3` | `0.9200` | shared_device_fingerprint |
| `RING-IEEE-015` | **3** | `3` | `3` | `0.9200` | shared_card_cluster |
| `RING-IEEE-039` | **3** | `3` | `3` | `0.9200` | shared_card_cluster |
| `RING-IEEE-056` | **3** | `3` | `3` | `0.9200` | shared_device_fingerprint |


---

## 3. Real Entity Linkage Topology & Risk Diffusion

### Real Linkage Mechanisms:
1. **Shared Card Fingerprint Clusters (`card1`-`card6`)**: Transactions originating from the same composite card bin, bank, and cardholder account hash.
2. **Shared Hardware & OS Fingerprints (`DeviceInfo`, `id_30`, `id_31`, `id_33`)**: High-fidelity device identification across emulators, operating systems (Windows 10, Mac OS X, iOS, Android), and screen resolutions.
3. **Network & Billing Region Hashes (`addr1`, `addr2`, `P_emaildomain`)**: Correlated merchant billing coordinates and localized provider domains.

### Graph-Propagated Risk Elevation:
When a transaction within a cluster is flagged as a confirmed fraud attack, SentinelPay's **Personalized Risk Diffusion** propagates risk to connected accomplice accounts. This elevates sleeper accounts sharing the same physical device before they execute subsequent unauthorized charges.
