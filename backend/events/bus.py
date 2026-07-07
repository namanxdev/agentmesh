import logging
import time
import uuid
from collections import deque

from fastapi import WebSocket

_log = logging.getLogger(__name__)


class EventBus:
    """Async WebSocket event bus with replay buffer."""

    def __init__(self, buffer_size: int = 100):
        self._subscribers: list[WebSocket] = []
        self._event_buffer: deque[dict] = deque(maxlen=buffer_size)
        self._buffer_size = buffer_size

    async def replay(self, ws: WebSocket):
        """Send the buffered events to a single socket."""
        # Iterate over a snapshot so a concurrent emit mid-replay can't mutate
        # the deque during iteration.
        for event in list(self._event_buffer):
            await ws.send_json(event)

    async def subscribe(self, ws: WebSocket):
        """Accept connection and replay buffered events."""
        await ws.accept()
        self._subscribers.append(ws)
        try:
            await self.replay(ws)
        except Exception as e:
            _log.warning("Error replaying events to new subscriber: %s", e)
            if ws in self._subscribers:
                self._subscribers.remove(ws)
            raise

    def unsubscribe(self, ws: WebSocket):
        if ws in self._subscribers:
            self._subscribers.remove(ws)

    async def emit(self, event: dict):
        """Broadcast to all subscribers; buffer for late-joiners."""
        event.setdefault("id", f"evt_{uuid.uuid4().hex[:8]}")
        event.setdefault("timestamp", time.time())

        self._event_buffer.append(event)

        disconnected = []
        for ws in self._subscribers:
            try:
                await ws.send_json(event)
            except Exception as e:
                _log.warning("Error sending event to subscriber, marking for removal: %s", e)
                disconnected.append(ws)
        for ws in disconnected:
            self._subscribers.remove(ws)
