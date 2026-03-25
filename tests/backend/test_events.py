import pytest
from unittest.mock import AsyncMock, MagicMock
from backend.events.models import (
    AgentActivatedEvent, AgentCompletedEvent, ToolCalledEvent,
    TokenUsageEvent, WorkflowStartedEvent, WorkflowCompletedEvent,
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
async def test_bus_removes_disconnected_ws():
    bus = EventBus()
    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock(side_effect=Exception("gone"))
    await bus.subscribe(ws)
    await bus.emit({"type": "test", "workflow_id": "wf_1"})
    assert ws not in bus._subscribers
