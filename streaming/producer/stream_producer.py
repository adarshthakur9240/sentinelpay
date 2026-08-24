#!/usr/bin/env python3
"""
SentinelPay - Real-Time Transaction Stream Producer (Kafka Replay Engine)
==========================================================================
Replays the held-out test set through Apache Kafka (`transactions-stream` topic),
attaching synthetic `card_id` identifiers to model realistic multi-transaction
card velocity patterns for real-time feature computation.

SIMULATION NOTICE & DATA HONESTY:
card_id is SIMULATED for this demo since the anonymized dataset has no account 
linkage — this models realistic repeat-usage patterns for feature engineering 
purposes only.
"""

import sys
import os
import time
import json
import asyncio
import argparse
import logging
import signal
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd
import numpy as np

try:
    from aiokafka import AIOKafkaProducer
    from aiokafka.errors import KafkaConnectionError
except ImportError:
    AIOKafkaProducer = None
    KafkaConnectionError = Exception

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("sentinelpay.streaming.producer")


def resolve_test_csv_path() -> Path:
    """Locate test.csv in ml/data/processed."""
    current_file = Path(__file__).resolve()
    # current_file: streaming/producer/stream_producer.py
    project_root = current_file.parent.parent.parent
    test_path = project_root / "ml" / "data" / "processed" / "test.csv"
    if not test_path.exists():
        raise FileNotFoundError(f"Test dataset not found at {test_path}")
    return test_path


def assign_synthetic_card_ids(df: pd.DataFrame, repeat_ratio: float = 0.05) -> list[str]:
    """
    Assign realistic synthetic card_id values:
    ~5% of transactions share a card_id in burst clusters of 2-4 transactions
    within close time proximity (simulating repeat card velocity), while 95%
    have unique cardholders.
    """
    n_samples = len(df)
    card_ids = [f"CARD-UNIQ-{i+100000:06d}" for i in range(n_samples)]

    # Pool of recurring cardholders
    num_repeat_cards = max(10, int(n_samples * repeat_ratio / 3.0))
    repeat_card_pool = [f"CARD-BURST-{i+1000:04d}" for i in range(num_repeat_cards)]

    # Step through transactions and plant repeat clusters
    rng = np.random.default_rng(seed=42)
    step = int(1.0 / repeat_ratio)

    for i in range(0, n_samples - 4, step):
        chosen_card = repeat_card_pool[i % len(repeat_card_pool)]
        cluster_len = rng.integers(2, 5)  # 2 to 4 repeat transactions
        for offset in range(cluster_len):
            if i + offset < n_samples:
                card_ids[i + offset] = chosen_card

    return card_ids


class TransactionStreamProducer:
    """
    Asynchronous Kafka Producer that streams transactions at controllable velocity.
    """

    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        topic: str = "transactions-stream",
        speed: float = 1.0,
        base_delay_ms: float = 50.0,
        limit: int | None = None,
        dry_run: bool = False,
    ):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.speed = max(0.01, speed)
        # Delay in seconds scaled inversely by speed multiplier
        self.delay_seconds = (base_delay_ms / 1000.0) / self.speed
        self.limit = limit
        self.dry_run = dry_run
        self.running = True
        self.producer = None
        self.total_published = 0

    async def start(self):
        """Initialize Kafka connection unless in dry-run mode."""
        if self.dry_run:
            logger.info("Running in DRY-RUN mode (Kafka publishing simulated).")
            return

        if AIOKafkaProducer is None:
            raise ImportError("aiokafka is not installed. Run `pip install aiokafka`.")

        logger.info(f"Connecting to Kafka broker at {self.bootstrap_servers}...")
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            request_timeout_ms=5000,
        )
        await self.producer.start()
        logger.info(f"Connected to Kafka. Publishing to topic '{self.topic}'.")

    async def stop(self):
        """Gracefully flush and close producer."""
        self.running = False
        if self.producer:
            logger.info("Flushing and closing Kafka producer...")
            await self.producer.stop()
            logger.info("Kafka producer stopped.")

    async def stream_transactions(self, test_path: Path):
        """Replay test dataset transactions through Kafka stream."""
        logger.info(f"Loading transactions from {test_path}...")
        df = pd.read_csv(test_path)
        if self.limit:
            df = df.iloc[: self.limit]

        n_rows = len(df)
        logger.info(f"Assigning simulated card_ids across {n_rows:,} transactions...")
        card_ids = assign_synthetic_card_ids(df)

        logger.info(
            f"Starting transaction stream: {n_rows:,} events | Speed: {self.speed}x | "
            f"Inter-message delay: {self.delay_seconds * 1000:.1f}ms | Topic: {self.topic}"
        )

        start_time = time.time()
        fraud_published = 0

        for idx, row in df.iterrows():
            if not self.running:
                logger.info("Streaming cancelled by user.")
                break

            card_id = card_ids[idx]
            tx_id = f"TXN-STRM-{idx+1:06d}"
            is_fraud = int(row["Class"])
            amount = float(row["Amount"])
            time_offset = float(row["Time"])

            # Feature dictionary (excluding Class)
            feature_dict = row.drop("Class").to_dict()

            message = {
                "transaction_id": tx_id,
                "card_id": card_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "time_offset_seconds": time_offset,
                "amount_usd": round(amount, 2),
                "features": feature_dict,
                "ground_truth_class": is_fraud,
            }

            if not self.dry_run and self.producer:
                try:
                    await self.producer.send_and_wait(
                        topic=self.topic,
                        key=card_id,
                        value=message,
                    )
                except Exception as e:
                    logger.error(f"Failed to publish {tx_id} to Kafka: {e}")

            self.total_published += 1
            if is_fraud:
                fraud_published += 1

            if self.total_published % 100 == 0 or self.total_published == 1:
                elapsed = time.time() - start_time
                rate = self.total_published / elapsed if elapsed > 0 else 0
                logger.info(
                    f"Streamed {self.total_published:,}/{n_rows:,} tx | Rate: {rate:.1f} tx/s | "
                    f"Fraud Count: {fraud_published} | Latest: {tx_id} ({card_id}, ${amount:.2f})"
                )

            # Artificial delay between stream events
            if self.delay_seconds > 0:
                await asyncio.sleep(self.delay_seconds)

        elapsed = time.time() - start_time
        avg_rate = self.total_published / elapsed if elapsed > 0 else 0
        logger.info(
            f"Streaming completed: {self.total_published:,} transactions published in {elapsed:.2f}s "
            f"(Avg: {avg_rate:.1f} tx/s, Fraud events: {fraud_published})."
        )


async def main():
    parser = argparse.ArgumentParser(
        description="SentinelPay - Kafka Real-Time Transaction Stream Producer"
    )
    parser.add_argument(
        "--bootstrap-servers",
        default="localhost:9092",
        help="Kafka bootstrap server address (default: localhost:9092)",
    )
    parser.add_argument(
        "--topic",
        default="transactions-stream",
        help="Target Kafka topic name (default: transactions-stream)",
    )
    parser.add_argument(
        "--speed",
        default="1.0",
        help="Replay speed multiplier (e.g. 1.0, 5.0, 10.0, max) (default: 1.0)",
    )
    parser.add_argument(
        "--delay-ms",
        type=float,
        default=50.0,
        help="Base inter-message delay in milliseconds (default: 50.0)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of transactions to stream (e.g. 500 for testing)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate streaming without connecting to live Kafka broker",
    )

    args = parser.parse_args()

    # Parse speed multiplier
    if str(args.speed).lower() == "max":
        speed_val = 1000.0
    else:
        try:
            speed_val = float(str(args.speed).rstrip("xX"))
        except ValueError:
            speed_val = 1.0

    test_csv_path = resolve_test_csv_path()

    producer = TransactionStreamProducer(
        bootstrap_servers=args.bootstrap_servers,
        topic=args.topic,
        speed=speed_val,
        base_delay_ms=args.delay_ms,
        limit=args.limit,
        dry_run=args.dry_run,
    )

    loop = asyncio.get_running_loop()

    def handle_sigint():
        logger.warning("Received shutdown signal. Stopping producer...")
        asyncio.create_task(producer.stop())

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, handle_sigint)
        except NotImplementedError:
            pass

    try:
        await producer.start()
        await producer.stream_transactions(test_csv_path)
    except Exception as e:
        logger.error(f"Stream producer encountered error: {e}", exc_info=True)
    finally:
        await producer.stop()


if __name__ == "__main__":
    asyncio.run(main())
