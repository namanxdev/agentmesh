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


# ---------------------------------------------------------------------------
# Additional orchestrator tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_orchestrator_timeout_raises_error():
    """Workflow timeout is detected between iterations and returns a failed result."""
    # Use a two-agent chain. Patch time.time so that after the first agent
    # completes the elapsed time exceeds the timeout.
    from unittest.mock import patch as _patch

    # time sequence: start_time=100, first loop check=100 (ok), after agent: irrelevant,
    # second loop top check=200 → elapsed 100s > timeout 1s → triggers TimeoutError
    time_values = iter([100.0, 100.0, 100.0, 200.0, 200.0])

    def make_agent(name):
        a = MagicMock()
        a.config = AgentConfig(name=name, role="R", system_prompt="S")
        a.process = AsyncMock(return_value=AgentResult(output=f"{name} done", routing_key="on_complete"))
        return a

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orch = WorkflowOrchestrator(
        agents={"A": make_agent("A"), "B": make_agent("B")},
        graph_config={"start": "A", "A": {"on_complete": "B"}, "B": {"on_complete": "end"}},
        event_bus=mock_bus,
        workflow_id="wf_timeout",
        timeout_seconds=1.0,
    )

    with _patch("backend.orchestrator.graph.time.time", side_effect=time_values):
        result = await orch.run(task="too slow")

    assert result.success is False
    assert result.error is not None
    assert "timeout" in result.error.lower() or "Timeout" in result.error


@pytest.mark.asyncio
async def test_orchestrator_max_iterations_exceeded():
    """Workflow that loops forever (A->B->A) is stopped at max_iterations."""
    def make_agent(name):
        a = MagicMock()
        a.config = AgentConfig(name=name, role=name, system_prompt=name)
        a.process = AsyncMock(return_value=AgentResult(output=f"{name} done", routing_key="on_complete"))
        return a

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    # A -> B -> A creates an infinite loop in the router, but max_iterations stops it
    orch = WorkflowOrchestrator(
        agents={"A": make_agent("A"), "B": make_agent("B")},
        graph_config={
            "start": "A",
            "A": {"on_complete": "B"},
            "B": {"on_complete": "A"},  # loops back
        },
        event_bus=mock_bus,
        workflow_id="wf_loop",
        max_iterations=3,
    )

    result = await orch.run(task="loop forever")
    assert result.success is False
    assert result.error is not None
    assert "Max iterations" in result.error or "iterations" in result.error.lower()


@pytest.mark.asyncio
async def test_orchestrator_emits_agent_handoff_event():
    """Two-agent chain emits an agent.handoff event between A and B."""
    def make_agent(name):
        a = MagicMock()
        a.config = AgentConfig(name=name, role=name, system_prompt=name)
        a.process = AsyncMock(return_value=AgentResult(output=f"{name} done", routing_key="on_complete"))
        return a

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orch = WorkflowOrchestrator(
        agents={"A": make_agent("A"), "B": make_agent("B")},
        graph_config={"start": "A", "A": {"on_complete": "B"}, "B": {"on_complete": "end"}},
        event_bus=mock_bus,
        workflow_id="wf_handoff",
    )

    await orch.run(task="handoff test")

    event_types = [c[0][0]["type"] for c in mock_bus.emit.call_args_list]
    assert "agent.handoff" in event_types

    handoff_calls = [c[0][0] for c in mock_bus.emit.call_args_list if c[0][0]["type"] == "agent.handoff"]
    assert handoff_calls[0]["fromAgent"] == "A"
    assert handoff_calls[0]["toAgent"] == "B"


@pytest.mark.asyncio
async def test_orchestrator_unknown_agent_raises_error():
    """Graph config references an agent name not in the agents dict — returns failed result."""
    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orch = WorkflowOrchestrator(
        agents={},  # no agents registered
        graph_config={"start": "MissingAgent", "MissingAgent": {"on_complete": "end"}},
        event_bus=mock_bus,
        workflow_id="wf_missing",
    )

    result = await orch.run(task="will fail")
    assert result.success is False
    assert result.error is not None
    assert "MissingAgent" in result.error


@pytest.mark.asyncio
async def test_orchestrator_state_updates_propagated():
    """Agent A returns state_updates; agent B receives those updates in its state parameter."""
    received_state = {}

    async def agent_b_process(task, state, workflow_id=""):
        received_state.update(state)
        return AgentResult(output="B done", routing_key="on_complete")

    agent_a = MagicMock()
    agent_a.config = AgentConfig(name="A", role="R", system_prompt="S")
    agent_a.process = AsyncMock(return_value=AgentResult(
        output="A done",
        routing_key="on_complete",
        state_updates={"key": "value_from_A"},
    ))

    agent_b = MagicMock()
    agent_b.config = AgentConfig(name="B", role="R", system_prompt="S")
    agent_b.process = agent_b_process

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orch = WorkflowOrchestrator(
        agents={"A": agent_a, "B": agent_b},
        graph_config={"start": "A", "A": {"on_complete": "B"}, "B": {"on_complete": "end"}},
        event_bus=mock_bus,
        workflow_id="wf_state",
    )

    result = await orch.run(task="state propagation")
    assert result.success is True
    assert received_state.get("key") == "value_from_A"


@pytest.mark.asyncio
async def test_orchestrator_error_emits_workflow_error_event():
    """When an agent raises an exception, the orchestrator emits a workflow.error event."""
    mock_agent = MagicMock()
    mock_agent.config = AgentConfig(name="BadAgent", role="R", system_prompt="S")
    mock_agent.process = AsyncMock(side_effect=RuntimeError("Something went wrong"))

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orch = WorkflowOrchestrator(
        agents={"BadAgent": mock_agent},
        graph_config={"start": "BadAgent", "BadAgent": {"on_complete": "end"}},
        event_bus=mock_bus,
        workflow_id="wf_error",
    )

    result = await orch.run(task="will error")
    assert result.success is False

    event_types = [c[0][0]["type"] for c in mock_bus.emit.call_args_list]
    assert "workflow.error" in event_types
