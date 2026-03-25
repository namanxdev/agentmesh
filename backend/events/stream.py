"""SSE fallback for environments without WebSocket support."""
import asyncio
import json
from typing import AsyncIterator
from .bus import EventBus


async def event_stream(
    bus: EventBus, workflow_id: str | None = None
) -> AsyncIterator[str]:
    """Yield SSE-formatted strings from the event bus buffer.

    Tracks a buffer index so no events are skipped, even when workflow_id
    filtering creates gaps in the buffer.
    """
    # Replay buffered events first
    next_index = 0
    for event in bus._event_buffer:
        next_index += 1
        if workflow_id and event.get("workflow_id") != workflow_id:
            continue
        yield f"data: {json.dumps(event)}\n\n"

    # Poll for new events by index — never re-scans old events
    while True:
        await asyncio.sleep(0.1)
        current_len = len(bus._event_buffer)
        while next_index < current_len:
            event = bus._event_buffer[next_index]
            next_index += 1
            if workflow_id and event.get("workflow_id") != workflow_id:
                continue
            yield f"data: {json.dumps(event)}\n\n"
