import json
from fastapi import WebSocket, WebSocketDisconnect
from backend.events.bus import EventBus


async def websocket_events_handler(ws: WebSocket, event_bus: EventBus):
    """
    Handle a WebSocket connection on /ws/events.
    Replays buffered events on connect, then streams live events.
    Accepts client commands: ping, subscribe (no-op for MVP), replay.
    """
    await event_bus.subscribe(ws)
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
    except Exception:
        event_bus.unsubscribe(ws)
