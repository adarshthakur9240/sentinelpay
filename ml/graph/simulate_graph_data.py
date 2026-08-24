#!/usr/bin/env python3
"""
SentinelPay - Synthetic Entity Linkage Simulator
=================================================
IMPORTANT DISCLAIMER & HONESTY NOTICE:
SYNTHETIC DATA — The ULB Credit Card Fraud dataset contains no account, device, or 
IP information. This linkage is simulated for demonstration purposes only, to show 
how the detection algorithm WOULD work if such data were available in a real payments 
system. Do not present this as detecting real fraud rings in the dataset.

This script enriches the held-out test transactions with simulated:
- account_id: Unique customer/cardholder identifier
- device_id: Hardware/fingerprint identifier (e.g. browser canvas, mobile IMEI hash)
- ip_subnet: Class C (/24) network routing prefix

It deliberately constructs 4 coordinated fraud rings with multi-account device/IP
overlap to benchmark graph-based abuse-ring detection algorithms.
"""

import sys
import logging
from pathlib import Path
import numpy as np
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("sentinelpay.ml.graph.simulate")

DISCLAIMER_HEADER = """# ==============================================================================
# SYNTHETIC DATA — the ULB Credit Card Fraud dataset contains no account, device,
# or IP information. This linkage is simulated for demonstration purposes only,
# to show how the detection algorithm WOULD work if such data were available in a
# real payments system. Do not present this as detecting real fraud rings in the
# dataset.
# ==============================================================================
"""


def resolve_paths():
    current_file = Path(__file__).resolve()
    graph_dir = current_file.parent
    ml_dir = graph_dir.parent
    processed_dir = ml_dir / "data" / "processed"
    data_out_dir = graph_dir / "graph_data"
    data_out_dir.mkdir(parents=True, exist_ok=True)
    return processed_dir, data_out_dir


def generate_synthetic_graph_data():
    processed_dir, data_out_dir = resolve_paths()
    test_path = processed_dir / "test.csv"
    output_path = data_out_dir / "synthetic_linkage.csv"

    logger.info(f"Loading test set from {test_path}...")
    test_df = pd.read_csv(test_path)
    n_samples = len(test_df)
    logger.info(f"Loaded {n_samples:,} test transactions.")

    # Identify fraud and legitimate indices
    fraud_indices = test_df[test_df["Class"] == 1].index.tolist()
    legit_indices = test_df[test_df["Class"] == 0].index.tolist()

    logger.info(f"Found {len(fraud_indices)} fraud cases and {len(legit_indices)} legitimate cases.")

    # Initialize default unique identifiers for all transactions
    account_ids = [f"ACC-{i+100000:06d}" for i in range(n_samples)]
    device_ids = [f"DEV-{i+100000:06d}" for i in range(n_samples)]
    ip_subnets = [f"{10 + (i % 200)}.{1 + ((i // 200) % 254)}.{1 + ((i // 50000) % 254)}.0/24" for i in range(n_samples)]
    simulated_ring_label = ["None"] * n_samples

    # ─── PLANT DELIBERATE FRAUD RINGS (Coordinated Linkage Clusters) ─────────
    # Ring 1: "Device Farm Syndicate" - 5 accounts sharing 1 device & subnet (4 fraud, 1 low-risk accomplice)
    ring_1_fraud = fraud_indices[0:4]
    ring_1_legit = legit_indices[0:1]
    ring_1_all = ring_1_fraud + ring_1_legit
    for idx in ring_1_all:
        device_ids[idx] = "DEV-FARM-9901"
        ip_subnets[idx] = "198.51.100.0/24"
        simulated_ring_label[idx] = "Ring_Alpha_DeviceFarm"

    # Ring 2: "Distributed Proxy Cluster" - 4 accounts sharing subnet & 2 paired devices (3 fraud, 1 legit mule)
    ring_2_fraud = fraud_indices[4:7]
    ring_2_legit = legit_indices[1:2]
    ring_2_all = ring_2_fraud + ring_2_legit
    for i, idx in enumerate(ring_2_all):
        device_ids[idx] = "DEV-PROXY-4412" if i < 2 else "DEV-PROXY-4413"
        ip_subnets[idx] = "203.0.113.0/24"
        simulated_ring_label[idx] = "Ring_Beta_ProxyCluster"

    # Ring 3: "Automated Carding Botnet" - 4 accounts sharing device & subnet (4 fraud)
    ring_3_fraud = fraud_indices[7:11]
    for idx in ring_3_fraud:
        device_ids[idx] = "DEV-BOTNET-7721"
        ip_subnets[idx] = "192.0.2.0/24"
        simulated_ring_label[idx] = "Ring_Gamma_Botnet"

    # Ring 4: "Multi-Account Emulator Ring" - 5 accounts sharing emulator ID & subnet (3 fraud, 2 legit mules)
    ring_4_fraud = fraud_indices[11:14]
    ring_4_legit = legit_indices[2:4]
    ring_4_all = ring_4_fraud + ring_4_legit
    for idx in ring_4_all:
        device_ids[idx] = "DEV-EMULATOR-8830"
        ip_subnets[idx] = "198.18.0.0/24"
        simulated_ring_label[idx] = "Ring_Delta_Emulator"

    # ─── PLANT A FEW BENIGN/LEGITIMATE INCIDENTAL OVERLAPS (e.g. household pair) ───
    # Household legitimate pair sharing 1 device/IP (2 accounts, 0 fraud -> should NOT be flagged as fraud ring)
    household_pair = legit_indices[10:12]
    for idx in household_pair:
        device_ids[idx] = "DEV-HOME-1001"
        ip_subnets[idx] = "10.0.50.0/24"
        simulated_ring_label[idx] = "Benign_Household_Pair"

    # Assemble Output DataFrame
    enriched_df = test_df.copy()
    enriched_df.insert(0, "account_id", account_ids)
    enriched_df.insert(1, "device_id", device_ids)
    enriched_df.insert(2, "ip_subnet", ip_subnets)
    enriched_df.insert(3, "simulated_ring_label", simulated_ring_label)

    logger.info(f"Writing synthetic linkage dataset to {output_path}...")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(DISCLAIMER_HEADER)
        enriched_df.to_csv(f, index=False)

    logger.info(f"Successfully generated synthetic linkage dataset with {len(enriched_df):,} records.")
    return output_path


if __name__ == "__main__":
    generate_synthetic_graph_data()
