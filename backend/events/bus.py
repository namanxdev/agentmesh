import logging
import time
import uuid
from collections import deque

from fastapi import WebSocket

_log = logging.getLogger(__name__)


class EventBus:
    """Async WebSocket event bus with replay buffer and per-user scoping."""

    def __init__(self, buffer_size: int = 100):
        # socket -> user_id (None = unauthenticated).  A dict keeps
        # `ws in bus._subscribers` and len() working like the old list did.
        self._subscribers: dict[WebSocket, str | None] = {}
        self._event_buffer: deque[dict] = deque(maxlen=buffer_size)
        self._buffer_size = buffer_size
        # workflow_id -> owning user_id.  Intentionally never pruned: the replay
        # buffer can still hold a completed workflow's events, and dropping the
        # owner here would make those events visible to every subscriber.  Left
        # unbounded for that reason.
        self._workflow_owners: dict[str, str] = {}
        # workflow_id -> last stamped sequence number (per-workflow, starts at 1).
        self._workflow_seq: dict[str, int] = {}

    def bind_workflow(self, workflow_id: str, user_id: str) -> None:
        """Record which user owns a workflow so its events stay private to them."""
        self._workflow_owners[workflow_id] = user_id

    def _is_visible(self, event: dict, user_id: str | None) -> bool:
        """Visibility rule: an event is visible iff its workflow is unowned
        (system/broadcast events stay global) or owned by this subscriber."""
        owner = self._workflow_owners.get(event.get("workflow_id"))
        return owner is None or owner == user_id

    async def replay(self, ws: WebSocket, user_id: str | None = None):
        """Send the buffered events visible to `user_id` to a single socket."""
        # Iterate over a snapshot so a concurrent emit mid-replay can't mutate
        # the deque during iteration.
        for event in list(self._event_buffer):
            if self._is_visible(event, user_id):
                await ws.send_json(event)

    async def subscribe(self, ws: WebSocket, user_id: str | None = None):
        """Accept connection and replay the buffered events visible to the user."""
        await ws.accept()
        self._subscribers[ws] = user_id
        try:
            await self.replay(ws, user_id)
        except Exception as e:
            _log.warning("Error replaying events to new subscriber: %s", e)
            if ws in self._subscribers:
                del self._subscribers[ws]
            raise

    def unsubscribe(self, ws: WebSocket):
        if ws in self._subscribers:
            del self._subscribers[ws]

    async def emit(self, event: dict):
        """Broadcast to subscribers allowed to see it; buffer for late-joiners."""
        event.setdefault("id", f"evt_{uuid.uuid4().hex[:8]}")
        event.setdefault("timestamp", time.time())

        # Stamp a per-workflow monotonic sequence number (starting at 1) so
        # clients can detect gaps and ordering.  Stamped only here so replays
        # preserve their original seq values.
        workflow_id = event.get("workflow_id")
        if workflow_id is not None:
            seq = self._workflow_seq.get(workflow_id, 0) + 1
            self._workflow_seq[workflow_id] = seq
            event["seq"] = seq

        self._event_buffer.append(event)

        disconnected = []
        for ws, user_id in list(self._subscribers.items()):
            if not self._is_visible(event, user_id):
                continue
            try:
                await ws.send_json(event)
            except Exception as e:
                _log.warning("Error sending event to subscriber, marking for removal: %s", e)
                disconnected.append(ws)
        for ws in disconnected:
            if ws in self._subscribers:
                del self._subscribers[ws]
