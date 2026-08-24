"""
SentinelPay - Real-Time Streaming & WebSocket API Routes
=========================================================
Exposes real-time WebSocket live feeds (/ws/live-feed) and recent
streaming transaction telemetry for frontend monitoring and alerting.
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status

from serving.app.core.stream_hub import stream_hub

logger = logging.getLogger("sentinelpay.serving.api.stream")

router = APIRouter(prefix="", tags=["Streaming & Live Feed"])


@router.websocket("/ws/live-feed")
async def websocket_live_feed(websocket: WebSocket):
    """
    Real-time WebSocket endpoint that broadcasts scored transactions with rolling
    velocity features (velocity_5min, amount_sum_5min, combined_risk_score).
    """
    await stream_hub.connect(websocket)
    try:
        while True:
            # Keep connection alive; accept optional client ping/control messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        stream_hub.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client connection closed: {e}")
        stream_hub.disconnect(websocket)


@router.get(
    "/stream/recent",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="Get Recent Streaming Transactions",
    description="Returns the last N transactions scored through the streaming velocity pipeline from the circular in-memory ring buffer.",
)
async def get_recent_streaming_transactions(
    limit: int = Query(default=50, ge=1, le=200, description="Number of recent streaming transactions to return")
) -> List[Dict[str, Any]]:
    """Fetch recent streaming scored events from in-memory ring buffer."""
    return stream_hub.get_recent(limit=limit)
