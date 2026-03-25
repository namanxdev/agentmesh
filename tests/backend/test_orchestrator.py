import pytest
from backend.orchestrator.state import WorkflowState, WorkflowResult


def test_workflow_state_defaults():
    state = WorkflowState(current_task="Review PR #42")
    assert state.shared_data == {}
    assert state.messages == []
    assert state.token_usage == {}
    assert state.last_agent == ""
    assert state.routing_key == "on_complete"


def test_workflow_state_add_message():
    state = WorkflowState(current_task="test")
    state.messages.append({"agent": "Fetcher", "content": "Done"})
    assert len(state.messages) == 1


def test_workflow_result_defaults():
    from backend.orchestrator.state import WorkflowState
    state = WorkflowState(current_task="test")
    result = WorkflowResult(state=state)
    assert result.success is True
    assert result.error is None
    assert result.total_tokens == 0


from backend.orchestrator.handoff import HandoffRouter


def test_handoff_router_resolves_routing_key():
    graph_config = {
        "Fetcher": {"on_complete": "Reviewer", "on_error": "end"},
        "Reviewer": {"on_complete": "SecurityScanner", "on_needs_more_context": "Fetcher"},
    }
    router = HandoffRouter(graph_config)
    assert router.next_node("Fetcher", "on_complete") == "Reviewer"
    assert router.next_node("Fetcher", "on_error") == "end"
    assert router.next_node("Reviewer", "on_needs_more_context") == "Fetcher"


def test_handoff_router_unknown_key_falls_back_to_complete():
    graph_config = {"Fetcher": {"on_complete": "Reviewer"}}
    router = HandoffRouter(graph_config)
    # Unknown routing key falls back to on_complete
    assert router.next_node("Fetcher", "on_unknown") == "Reviewer"


def test_handoff_router_missing_node_raises():
    router = HandoffRouter({})
    with pytest.raises(KeyError):
        router.next_node("NonExistentAgent", "on_complete")


import asyncio
from unittest.mock import AsyncMock, MagicMock
from backend.orchestrator.graph import WorkflowOrchestrator
from backend.agents.base import AgentConfig, AgentResult, AgentStatus


@pytest.mark.asyncio
async def test_orchestrator_runs_single_agent_workflow():
    """Orchestrator activates first agent, runs it, terminates on 'end'."""
    mock_agent = MagicMock()
    mock_agent.config = AgentConfig(
        name="OnlyAgent", role="R", system_prompt="S",
        handoff_rules={"on_complete": "end"}
    )
    mock_agent.process = AsyncMock(return_value=AgentResult(
        output="Done!", routing_key="on_complete",
        token_usage={"input": 50, "output": 25}
    ))

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orchestrator = WorkflowOrchestrator(
        agents={"OnlyAgent": mock_agent},
        graph_config={
            "start": "OnlyAgent",
            "OnlyAgent": {"on_complete": "end"},
        },
        event_bus=mock_bus,
        workflow_id="wf_test",
    )

    result = await orchestrator.run(task="Do the thing")
    assert result.success is True
    assert "Done!" in result.state.messages[-1]["content"]
    assert result.state.token_usage["OnlyAgent"]["input"] == 50


@pytest.mark.asyncio
async def test_orchestrator_emits_workflow_started_and_completed():
    mock_agent = MagicMock()
    mock_agent.config = AgentConfig(name="A", role="R", system_prompt="S")
    mock_agent.process = AsyncMock(return_value=AgentResult(
        output="Done", routing_key="on_complete"
    ))
    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orch = WorkflowOrchestrator(
        agents={"A": mock_agent},
        graph_config={"start": "A", "A": {"on_complete": "end"}},
        event_bus=mock_bus,
        workflow_id="wf_1",
    )
    await orch.run(task="test")

    event_types = [c[0][0]["type"] for c in mock_bus.emit.call_args_list]
    assert "workflow.started" in event_types
    assert "workflow.completed" in event_types


@pytest.mark.asyncio
async def test_orchestrator_two_agent_chain():
    """A -> B sequential chain completes correctly."""
    results = {
        "A": AgentResult(output="A done", routing_key="on_complete",
                         token_usage={"input": 10, "output": 5}),
        "B": AgentResult(output="B done", routing_key="on_complete",
                         token_usage={"input": 20, "output": 10}),
    }

    def make_agent(name):
        a = MagicMock()
        a.config = AgentConfig(name=name, role=name, system_prompt=name)
        a.process = AsyncMock(return_value=results[name])
        return a

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orch = WorkflowOrchestrator(
        agents={"A": make_agent("A"), "B": make_agent("B")},
        graph_config={"start": "A", "A": {"on_complete": "B"}, "B": {"on_complete": "end"}},
        event_bus=mock_bus,
        workflow_id="wf_chain",
    )
    result = await orch.run(task="chain test")

    assert result.success is True
    agent_names = [m["agent"] for m in result.state.messages]
    assert agent_names == ["A", "B"]
