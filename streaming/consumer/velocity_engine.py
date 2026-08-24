#!/usr/bin/env python3
"""
SentinelPay - Real-Time Velocity & Stream Feature Ensemble Engine
==================================================================
Consumes transactions from Apache Kafka (`transactions-stream`), maintains
an in-memory 5-minute sliding window per `card_id`, computes rolling velocity
and volume features, enriches the XGBoost model score with a velocity boost rule,
and publishes enriched events to `scored-transactions-stream` and the WebSocket feed.

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
from collections import defaultdict, deque
from typing import Dict, Tuple, Any, Optional

import pandas as pd
import numpy as np

# Ensure workspace root in sys.path
CURRENT_FILE = Path(__file__).resolve()
PROJECT_ROOT = CURRENT_FILE.parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
except ImportError:
    AIOKafkaConsumer = None
    AIOKafkaProducer = None

from serving.app.core.engine import engine as model_engine, FEATURE_COLUMNS
from serving.app.core.stream_hub import stream_hub

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("sentinelpay.streaming.velocity_engine")


class VelocityFeatureEngine:
    """
    Maintains in-memory sliding windows per card_id to compute rolling
    temporal features and ensembles them with XGBoost inference.
    """

    def __init__(
        self,
        window_seconds: float = 300.0,  # 5 minutes
        velocity_threshold: int = 3,    # >3 transactions in 5 min triggers velocity risk flag
        operating_threshold: float = 0.10,
    ):
        self.window_seconds = window_seconds
        self.velocity_threshold = velocity_threshold
        self.operating_threshold = operating_threshold
        # card_id -> deque of (timestamp_seconds, amount_usd)
        self.card_windows: Dict[str, deque[Tuple[float, float]]] = defaultdict(deque)
        self.total_processed = 0
        self.velocity_flags_triggered = 0

    def process_transaction(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Statefully update the sliding window for this card_id, compute velocity,
        and ensemble with the XGBoost model risk score.
        """
        t0 = time.perf_counter()

        tx_id = event.get("transaction_id", "TXN-UNKNOWN")
        card_id = event.get("card_id", "CARD-UNKNOWN")
        amount = float(event.get("amount_usd", 0.0))
        time_offset = float(event.get("time_offset_seconds", 0.0))
        features_dict = event.get("features", {})
        ground_truth = event.get("ground_truth_class", 0)

        # 1. Prune sliding window for this card_id (remove events older than window_seconds)
        window = self.card_windows[card_id]
        cutoff_time = time_offset - self.window_seconds

        while window and window[0][0] < cutoff_time:
            window.popleft()

        # 2. Compute stateful rolling velocity BEFORE adding current transaction
        past_count = len(window)
        past_amount_sum = sum(amt for _, amt in window)

        # Add current transaction to window
        window.append((time_offset, amount))

        # Current 5-minute metrics
        velocity_5min = past_count + 1
        amount_sum_5min = round(past_amount_sum + amount, 2)
        velocity_risk_flag = bool(velocity_5min > self.velocity_threshold)

        # 3. Model Inference (XGBoost)
        if model_engine.model is not None:
            # Build single-row DataFrame aligned with FEATURE_COLUMNS
            row_df = pd.DataFrame([features_dict], columns=FEATURE_COLUMNS)
            probs = model_engine.model.predict_proba(row_df)[:, 1]
            raw_model_risk = float(probs[0])
        else:
            raw_model_risk = 0.0

        # 4. Ensemble Combination Rule (Explainable & Grounded)
        # If rapid repeat usage detected, boost risk by 15% (capped at 1.0)
        if velocity_risk_flag:
            combined_risk = float(min(1.0, raw_model_risk * 1.15))
            self.velocity_flags_triggered += 1
        else:
            combined_risk = raw_model_risk

        is_flagged = bool(combined_risk >= self.operating_threshold)
        decision = "FLAGGED_FOR_REVIEW" if is_flagged else "APPROVED"
        latency_ms = (time.perf_counter() - t0) * 1000.0

        self.total_processed += 1

        enriched_result = {
            "transaction_id": tx_id,
            "card_id": card_id,
            "timestamp": event.get("timestamp", datetime.now(timezone.utc).isoformat()),
            "time_offset_seconds": time_offset,
            "amount_usd": amount,
            "velocity_5min": velocity_5min,
            "amount_sum_5min": amount_sum_5min,
            "velocity_risk_flag": velocity_risk_flag,
            "raw_model_risk_score": round(raw_model_risk, 4),
            "combined_risk_score": round(combined_risk, 4),
            "is_flagged": is_flagged,
            "decision": decision,
            "ground_truth_class": ground_truth,
            "latency_ms": round(latency_ms, 2),
        }

        return enriched_result


class StreamingConsumerService:
    """
    Kafka consumer daemon that processes incoming transactions and publishes scored events.
    """

    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        in_topic: str = "transactions-stream",
        out_topic: str = "scored-transactions-stream",
        group_id: str = "sentinelpay-velocity-group",
        dry_run: bool = False,
    ):
        self.bootstrap_servers = bootstrap_servers
        self.in_topic = in_topic
        self.out_topic = out_topic
        self.group_id = group_id
        self.dry_run = dry_run
        self.running = True
        self.consumer = None
        self.producer = None
        self.velocity_engine = VelocityFeatureEngine()

    async def start(self):
        """Initialize ModelEngine and Kafka connections."""
        logger.info("Initializing ModelEngine for in-process streaming inference...")
        if not model_engine.is_ready:
            model_engine.initialize()

        if self.dry_run:
            logger.info("Consumer running in DRY-RUN / IN-MEMORY mode.")
            return

        if AIOKafkaConsumer is None or AIOKafkaProducer is None:
            raise ImportError("aiokafka is not installed. Run `pip install aiokafka`.")

        logger.info(f"Connecting consumer to Kafka {self.bootstrap_servers} on '{self.in_topic}'...")
        self.consumer = AIOKafkaConsumer(
            self.in_topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            auto_offset_reset="latest",
        )
        await self.consumer.start()

        logger.info(f"Connecting producer to Kafka {self.bootstrap_servers} on '{self.out_topic}'...")
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
        )
        await self.producer.start()
        logger.info("Kafka consumer and producer successfully started.")

    async def stop(self):
        """Gracefully shut down connections."""
        self.running = False
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()
        logger.info("Streaming consumer service stopped.")

    async def run(self):
        """Main event loop consuming from Kafka."""
        logger.info(f"Listening for transactions on topic '{self.in_topic}'...")
        try:
            async for msg in self.consumer:
                if not self.running:
                    break

                raw_event = msg.value
                scored_event = self.velocity_engine.process_transaction(raw_event)

                # Broadcast to WebSockets & in-memory ring buffer
                await stream_hub.broadcast_event(scored_event)

                # Publish to output Kafka topic
                if self.producer:
                    await self.producer.send_and_wait(
                        topic=self.out_topic,
                        key=scored_event["card_id"],
                        value=scored_event,
                    )

                if self.velocity_engine.total_processed % 50 == 0:
                    logger.info(
                        f"Processed {self.velocity_engine.total_processed:,} stream events | "
                        f"Velocity Flags: {self.velocity_engine.velocity_flags_triggered} | "
                        f"Latest: {scored_event['transaction_id']} (Risk: {scored_event['combined_risk_score']*100:.1f}%, "
                        f"Vel5m: {scored_event['velocity_5min']}, Flag: {scored_event['velocity_risk_flag']})"
                    )

        except Exception as e:
            logger.error(f"Consumer loop error: {e}", exc_info=True)


async def main():
    parser = argparse.ArgumentParser(description="SentinelPay Velocity Feature & Stream Scoring Engine")
    parser.add_argument("--bootstrap-servers", default="localhost:9092", help="Kafka broker address")
    parser.add_argument("--in-topic", default="transactions-stream", help="Input Kafka topic")
    parser.add_argument("--out-topic", default="scored-transactions-stream", help="Output Kafka topic")
    parser.add_argument("--dry-run", action="store_true", help="Run without connecting to live Kafka")

    args = parser.parse_args()

    service = StreamingConsumerService(
        bootstrap_servers=args.bootstrap_servers,
        in_topic=args.in_topic,
        out_topic=args.out_topic,
        dry_run=args.dry_run,
    )

    loop = asyncio.get_running_loop()

    def handle_sigint():
        logger.warning("Stopping consumer...")
        asyncio.create_task(service.stop())

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, handle_sigint)
        except NotImplementedError:
            pass

    try:
        await service.start()
        if not args.dry_run:
            await service.run()
    finally:
        await service.stop()


if __name__ == "__main__":
    asyncio.run(main())
