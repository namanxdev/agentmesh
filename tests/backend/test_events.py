import pytest
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
