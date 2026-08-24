"""
SentinelPay Serving - Real-Time Stream Hub & WebSocket Manager
==============================================================
Maintains an in-memory circular ring buffer of live scored streaming transactions
and manages active WebSocket connections for real-time frontend telemetry feeds.
"""

import json
import logging
from collections import deque
from typing import List, Dict, Any, Set
from fastapi import WebSocket

logger = logging.getLogger("sentinelpay.serving.stream_hub")


class StreamHub:
    """
    In-memory ring buffer and real-time WebSocket connection manager.
    """

    def __init__(self, max_buffer_size: int = 200):
        self.max_buffer_size = max_buffer_size
        self.ring_buffer: deque = deque(maxlen=max_buffer_size)
        self.active_connections: Set[WebSocket] = set()

    def add_scored_event(self, event: Dict[str, Any]):
        """Append event to circular ring buffer and broadcast to WebSockets."""
        self.ring_buffer.append(event)

    async def broadcast_event(self, event: Dict[str, Any]):
        """Asynchronously broadcast new streaming event to all connected WebSockets."""
        self.add_scored_event(event)

        if not self.active_connections:
            return

        dead_connections = set()
        message_str = json.dumps(event)

        for ws in self.active_connections:
            try:
                await ws.send_text(message_str)
            except Exception:
                dead_connections.add(ws)

        for dead_ws in dead_connections:
            self.active_connections.discard(dead_ws)

    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket client and send recent buffer history."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

        # Send recent history replay
        recent_events = list(self.ring_buffer)[-20:]
        for ev in recent_events:
            try:
                await websocket.send_text(json.dumps(ev))
            except Exception:
                break

    def disconnect(self, websocket: WebSocket):
        """Remove disconnected WebSocket client."""
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Active connections: {len(self.active_connections)}")

    def get_recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Return the last N scored transactions from ring buffer."""
        items = list(self.ring_buffer)
        return items[-limit:]


stream_hub = StreamHub()
