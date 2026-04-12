import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from backend.events.bus import EventBus

_log = logging.getLogger(__name__)


async def websocket_events_handler(ws: WebSocket, event_bus: EventBus):
    """
    Handle a WebSocket connection on /ws/events.
    Replays buffered events on connect, then streams live events.
    Accepts client commands: ping, subscribe (no-op for MVP), replay.
    """
    try:
        await event_bus.subscribe(ws)
    except Exception as e:
        _log.warning("Failed to subscribe WebSocket client: %s", e)
        try:
            await ws.close()
        except Exception as close_err:
            _log.warning("Failed to close WebSocket after subscription error: %s", close_err)
        return
    try:
        while True:
            raw = await ws.receive_text()
            try:
                command = json.loads(raw)
            except json.JSONDecodeError:
                continue

            cmd = command.get("command")
            if cmd == "ping":
                await ws.send_json({"type": "pong"})
            elif cmd == "replay":
                # Re-send entire buffer
                for event in event_bus._event_buffer:
                    await ws.send_json(event)
            # subscribe/unsubscribe are no-ops for MVP (all events broadcast)

    except WebSocketDisconnect:
        event_bus.unsubscribe(ws)
    except Exception as e:
        _log.warning("WebSocket error during message handling: %s", e)
        event_bus.unsubscribe(ws)
