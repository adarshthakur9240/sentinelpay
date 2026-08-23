#!/usr/bin/env python3
"""
SentinelPay - Data Preparation Pipeline
=======================================
Loads the Kaggle Credit Card Fraud Detection dataset, verifies the extreme
class imbalance (~0.17% fraud), performs stratified train/validation/test splitting,
and scales unnormalized numerical features ('Time' and 'Amount') while preventing
data leakage.
"""

import sys
import logging
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("sentinelpay.ml.prepare_data")


def find_project_paths():
    """Resolve file paths robustly whether executed from repo root or ml/."""
    current_file = Path(__file__).resolve()
    # current_file is ml/data/prepare_data.py
    ml_dir = current_file.parent.parent
    project_root = ml_dir.parent

    raw_data_path = ml_dir / "data" / "raw" / "creditcard.csv"
    processed_dir = ml_dir / "data" / "processed"

    return project_root, ml_dir, raw_data_path, processed_dir


def load_and_audit_data(file_path: Path) -> pd.DataFrame:
    """
    Load raw credit card dataset and verify class distribution.
    The central fact of this dataset is extreme class imbalance (~0.17% fraud).
    """
    if not file_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {file_path}. Please place 'creditcard.csv' in ml/data/raw/."
        )

    logger.info(f"Loading raw dataset from: {file_path}")
    df = pd.read_csv(file_path)

    total_rows = len(df)
    class_counts = df["Class"].value_counts()
    class_props = df["Class"].value_counts(normalize=True)

    n_legit = class_counts.get(0, 0)
    n_fraud = class_counts.get(1, 0)
    pct_fraud = class_props.get(1, 0.0) * 100
    pct_legit = class_props.get(0, 0.0) * 100

    print("\n" + "=" * 65)
    print("           CREDIT CARD FRAUD DATASET - CLASS AUDIT           ")
    print("=" * 65)
    print(f"Total Transactions : {total_rows:,}")
    print(f"Legitimate (Class 0): {n_legit:,} ({pct_legit:.4f}%)")
    print(f"Fraudulent (Class 1): {n_fraud:,} ({pct_fraud:.4f}%)")
    print("=" * 65)

    # Confirm and log explicitly: ~0.17% fraud rate
    logger.info(
        f"CONFIRMED CLASS DISTRIBUTION: {n_fraud} fraud cases out of {total_rows} "
        f"({pct_fraud:.4f}% fraud rate, ~0.17%). Extreme class imbalance is the central fact of this project."
    )

    return df


def split_and_scale_data(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_state: int = 42,
):
    """
    Perform stratified split into Train (70%), Val (15%), and Test (15%).
    Fit StandardScaler ONLY on Train split to prevent data leakage.
    """
    assert np.isclose(train_ratio + val_ratio + test_ratio, 1.0), "Split ratios must sum to 1.0"

    logger.info(
        f"Performing stratified split ({int(train_ratio*100)}/{int(val_ratio*100)}/{int(test_ratio*100)}) "
        f"stratified on 'Class' column (random_state={random_state})..."
    )

    # First split: Train vs Temp (Val + Test)
    temp_ratio = val_ratio + test_ratio
    train_df, temp_df = train_test_split(
        df,
        test_size=temp_ratio,
        stratify=df["Class"],
        random_state=random_state,
    )

    # Second split: Val vs Test from Temp
    val_rel_ratio = val_ratio / temp_ratio
    val_df, test_df = train_test_split(
        temp_df,
        test_size=(1.0 - val_rel_ratio),
        stratify=temp_df["Class"],
        random_state=random_state,
    )

    # Reset index
    train_df = train_df.reset_index(drop=True)
    val_df = val_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)

    print("\n" + "=" * 65)
    print("                  STRATIFIED SPLIT SUMMARY                   ")
    print("=" * 65)
    for name, split_df in [("Train", train_df), ("Validation", val_df), ("Test", test_df)]:
        n_tot = len(split_df)
        n_fr = (split_df["Class"] == 1).sum()
        fr_pct = (n_fr / n_tot) * 100
        print(f"{name:<12} : {n_tot:>7,} rows | Fraud: {n_fr:>4} ({fr_pct:.4f}%)")
    print("=" * 65 + "\n")

    # Feature scaling: Scale 'Time' and 'Amount' (V1-V28 are already PCA-normalized)
    scale_cols = ["Time", "Amount"]
    logger.info(f"Scaling unnormalized features {scale_cols} using StandardScaler...")
    logger.info("Fitting scaler ONLY on train set to prevent data leakage into val/test.")

    scaler = StandardScaler()
    scaler.fit(train_df[scale_cols])

    # Transform all splits
    train_scaled = train_df.copy()
    val_scaled = val_df.copy()
    test_scaled = test_df.copy()

    train_scaled[scale_cols] = scaler.transform(train_df[scale_cols])
    val_scaled[scale_cols] = scaler.transform(val_df[scale_cols])
    test_scaled[scale_cols] = scaler.transform(test_df[scale_cols])

    return train_scaled, val_scaled, test_scaled, scaler


def main():
    project_root, ml_dir, raw_data_path, processed_dir = find_project_paths()

    # 1. Load & audit raw data
    df = load_and_audit_data(raw_data_path)

    # 2. Stratified train/val/test split and scale Time and Amount
    train_df, val_df, test_df, scaler = split_and_scale_data(df, random_state=42)

    # 3. Save processed splits and scaler artifact
    processed_dir.mkdir(parents=True, exist_ok=True)

    train_path = processed_dir / "train.csv"
    val_path = processed_dir / "val.csv"
    test_path = processed_dir / "test.csv"
    scaler_path = processed_dir / "scaler.joblib"

    logger.info(f"Saving processed splits to {processed_dir}...")
    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)
    joblib.dump(scaler, scaler_path)

    logger.info("Successfully saved:")
    logger.info(f"  - Train:      {train_path} ({len(train_df):,} rows)")
    logger.info(f"  - Validation: {val_path} ({len(val_df):,} rows)")
    logger.info(f"  - Test:       {test_path} ({len(test_df):,} rows)")
    logger.info(f"  - Scaler:     {scaler_path}")
    logger.info("Data preparation completed successfully.")


if __name__ == "__main__":
    main()
