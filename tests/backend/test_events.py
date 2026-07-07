from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.events.models import (
    AgentActivatedEvent,
    ToolCalledEvent,
    WorkflowCompletedEvent,
)


def test_agent_activated_event_fields():
    e = AgentActivatedEvent(workflow_id="wf_1", agentName="Reviewer", role="Code Reviewer")
    assert e.type == "agent.activated"
    assert e.id.startswith("evt_")
    assert e.timestamp > 0


def test_tool_called_event_fields():
    e = ToolCalledEvent(
        workflow_id="wf_1", agentName="Fetcher",
        server="github", tool="read_file", args={"path": "src/main.py"}
    )
    assert e.type == "tool.called"
    assert e.server == "github"


def test_workflow_completed_event_fields():
    e = WorkflowCompletedEvent(
        workflow_id="wf_1", result={"summary": "Done"}, totalTokens=1500, duration=34.2
    )
    assert e.type == "workflow.completed"
    assert e.totalTokens == 1500


def test_event_serializes_to_dict():
    e = AgentActivatedEvent(workflow_id="wf_1", agentName="A", role="R")
    d = e.model_dump()
    assert d["type"] == "agent.activated"
    assert "id" in d
    assert "timestamp" in d


from backend.events.bus import EventBus


@pytest.mark.asyncio
async def test_bus_broadcasts_to_subscribers():
    bus = EventBus()
    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()

    await bus.subscribe(ws)
    event = AgentActivatedEvent(workflow_id="wf_1", agentName="Fetcher", role="Fetcher")
    await bus.emit(event.model_dump())

    # Called once for buffered replay (0 events) + once for emit
    assert ws.send_json.call_count == 1
    sent = ws.send_json.call_args[0][0]
    assert sent["type"] == "agent.activated"


@pytest.mark.asyncio
async def test_bus_buffers_events():
    bus = EventBus()
    for i in range(5):
        await bus.emit({"type": "test", "workflow_id": "wf_1", "i": i})
    assert len(bus._event_buffer) == 5


@pytest.mark.asyncio
async def test_bus_replays_buffer_on_subscribe():
    bus = EventBus()
    await bus.emit({"type": "workflow.started", "workflow_id": "wf_1"})

    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()
    await bus.subscribe(ws)

    # Should get the 1 buffered event
    assert ws.send_json.call_count == 1


@pytest.mark.asyncio
async def test_bus_buffer_respects_maxlen():
    bus = EventBus(buffer_size=3)
    for i in range(5):
        await bus.emit({"type": "test", "workflow_id": "wf_1", "i": i})
    # Only the last 3 events are retained (oldest dropped).
    assert len(bus._event_buffer) == 3
    assert [e["i"] for e in bus._event_buffer] == [2, 3, 4]


@pytest.mark.asyncio
async def test_bus_replay_sends_buffer_to_single_socket():
    bus = EventBus()
    await bus.emit({"type": "workflow.started", "workflow_id": "wf_1"})
    await bus.emit({"type": "workflow.completed", "workflow_id": "wf_1"})

    ws = MagicMock()
    ws.send_json = AsyncMock()
    await bus.replay(ws)

    assert ws.send_json.call_count == 2


@pytest.mark.asyncio
async def test_bus_removes_disconnected_ws():
    bus = EventBus()
    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock(side_effect=Exception("gone"))
    await bus.subscribe(ws)
    await bus.emit({"type": "test", "workflow_id": "wf_1"})
    assert ws not in bus._subscribers


def _fake_ws():
    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()
    return ws


@pytest.mark.asyncio
async def test_bus_scopes_owned_events_to_owner():
    """A bound workflow's events reach only its owner; unowned events broadcast."""
    bus = EventBus()
    ws_a = _fake_ws()
    ws_b = _fake_ws()
    await bus.subscribe(ws_a, "A")
    await bus.subscribe(ws_b, "B")

    bus.bind_workflow("wf1", "A")

    # Owned by A → only A receives it.
    await bus.emit({"type": "agent.activated", "workflow_id": "wf1"})
    assert ws_a.send_json.call_count == 1
    assert ws_b.send_json.call_count == 0

    # Unowned / system event → everyone receives it.
    await bus.emit({"type": "system.notice", "workflow_id": "wf_free"})
    assert ws_a.send_json.call_count == 2
    assert ws_b.send_json.call_count == 1


@pytest.mark.asyncio
async def test_bus_anonymous_subscriber_sees_only_unowned_events():
    """A subscriber with user_id None never sees owned-workflow events."""
    bus = EventBus()
    ws = _fake_ws()
    await bus.subscribe(ws, None)

    bus.bind_workflow("wf1", "A")
    await bus.emit({"type": "agent.activated", "workflow_id": "wf1"})
    assert ws.send_json.call_count == 0  # owned by A, hidden from anonymous

    await bus.emit({"type": "system.notice", "workflow_id": "wf_free"})
    assert ws.send_json.call_count == 1  # unowned, visible


@pytest.mark.asyncio
async def test_bus_replay_respects_user_scoping():
    """replay() applies the same owner-visibility filter as emit()."""
    bus = EventBus()
    bus.bind_workflow("wf1", "A")
    await bus.emit({"type": "agent.activated", "workflow_id": "wf1"})    # owned by A
    await bus.emit({"type": "system.notice", "workflow_id": "wf_free"})  # unowned

    ws_a = _fake_ws()
    await bus.replay(ws_a, "A")
    assert ws_a.send_json.call_count == 2  # owner sees both

    ws_b = _fake_ws()
    await bus.replay(ws_b, "B")
    assert ws_b.send_json.call_count == 1  # only the unowned event

    ws_n = _fake_ws()
    await bus.replay(ws_n, None)
    assert ws_n.send_json.call_count == 1  # anonymous: only the unowned event


@pytest.mark.asyncio
async def test_bus_stamps_per_workflow_sequence_numbers():
    """emit() stamps a per-workflow monotonic seq starting at 1, independent
    per workflow_id."""
    bus = EventBus()
    await bus.emit({"type": "a", "workflow_id": "wf1"})
    await bus.emit({"type": "b", "workflow_id": "wf1"})
    await bus.emit({"type": "c", "workflow_id": "wf2"})
    await bus.emit({"type": "d", "workflow_id": "wf1"})

    seqs: dict[str, list[int]] = {}
    for e in bus._event_buffer:
        seqs.setdefault(e["workflow_id"], []).append(e["seq"])

    assert seqs["wf1"] == [1, 2, 3]
    assert seqs["wf2"] == [1]
