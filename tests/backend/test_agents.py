import pytest
from unittest.mock import AsyncMock, MagicMock
from backend.agents.base import AgentConfig, AgentStatus, AgentResult


def test_agent_config_defaults():
    config = AgentConfig(
        name="Reviewer",
        role="Code Reviewer",
        system_prompt="You are a code reviewer.",
    )
    assert config.model == "gemini-2.0-flash"
    assert config.temperature == 0.7
    assert config.max_tokens == 4096
    assert config.mcp_servers == []


def test_agent_config_with_handoff_rules():
    config = AgentConfig(
        name="Fetcher",
        role="Fetcher",
        system_prompt="Fetch code.",
        handoff_rules={"on_complete": "Reviewer", "on_error": "end"},
    )
    assert config.handoff_rules["on_complete"] == "Reviewer"


def test_agent_status_enum():
    assert AgentStatus.IDLE == "idle"
    assert AgentStatus.ACTIVE == "active"
    assert AgentStatus.ERROR == "error"


def test_agent_result_fields():
    result = AgentResult(
        output="Review complete.",
        routing_key="on_complete",
        token_usage={"input": 100, "output": 50},
    )
    assert result.routing_key == "on_complete"
    assert result.output == "Review complete."


from backend.agents.base import Agent
from backend.llm.base import LLMResponse


@pytest.mark.asyncio
async def test_agent_process_returns_result():
    """Agent.process calls LLM and returns AgentResult."""
    config = AgentConfig(
        name="Reviewer",
        role="Code Reviewer",
        system_prompt="Review code.",
        handoff_rules={"on_complete": "SecurityScanner"},
    )
    mock_llm = MagicMock()
    mock_llm.generate = AsyncMock(return_value=LLMResponse(
        text="Code looks fine.",
        usage={"input": 100, "output": 50},
    ))

    mock_event_bus = MagicMock()
    mock_event_bus.emit = AsyncMock()

    agent = Agent(config=config, llm_provider=mock_llm, event_bus=mock_event_bus)
    result = await agent.process(task="Review PR #1", state={}, workflow_id="wf_1")

    assert result.output == "Code looks fine."
    assert result.routing_key == "on_complete"
    assert result.token_usage["input"] == 100


@pytest.mark.asyncio
async def test_agent_process_emits_activated_and_completed_events():
    config = AgentConfig(
        name="Fetcher", role="Fetcher", system_prompt="Fetch code."
    )
    mock_llm = MagicMock()
    mock_llm.generate = AsyncMock(return_value=LLMResponse(
        text="Done.", usage={"input": 10, "output": 5}
    ))
    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    agent = Agent(config=config, llm_provider=mock_llm, event_bus=mock_bus)
    await agent.process(task="Fetch files", state={}, workflow_id="wf_1")

    event_types = [c[0][0]["type"] for c in mock_bus.emit.call_args_list]
    assert "agent.activated" in event_types
    assert "agent.completed" in event_types
    assert "token.usage" in event_types


@pytest.mark.asyncio
async def test_agent_process_handles_tool_calls():
    """Agent calls MCP tool and re-calls LLM with result."""
    config = AgentConfig(
        name="Fetcher", role="Fetcher", system_prompt="Fetch.",
        mcp_servers=["github"]
    )
    # First LLM call returns tool call; second returns final text
    mock_llm = MagicMock()
    mock_llm.generate = AsyncMock(side_effect=[
        LLMResponse(
            text="",
            tool_calls=[{"name": "github__read_file", "args": {"path": "main.py"}}],
            usage={"input": 50, "output": 10},
        ),
        LLMResponse(text="Fetched successfully.", usage={"input": 80, "output": 20}),
    ])

    mock_mcp = MagicMock()
    mock_mcp.call_tool = AsyncMock(return_value=["file content here"])

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    agent = Agent(config=config, llm_provider=mock_llm, event_bus=mock_bus)
    agent._mcp_clients["github"] = mock_mcp

    result = await agent.process(task="Fetch main.py", state={}, workflow_id="wf_1")

    assert result.output == "Fetched successfully."
    mock_mcp.call_tool.assert_called_once()


from backend.agents.registry import AgentRegistry
from backend.agents.base import AgentConfig, Agent, AgentStatus


def test_agent_registry_register_and_get():
    mock_llm = MagicMock()
    mock_bus = MagicMock()
    registry = AgentRegistry(llm_provider=mock_llm, event_bus=mock_bus)

    config = AgentConfig(name="Fetcher", role="Fetcher", system_prompt="Fetch.")
    agent = registry.register(config)
    assert isinstance(agent, Agent)
    assert registry.get("Fetcher") is agent


def test_agent_registry_get_unknown_raises():
    registry = AgentRegistry(llm_provider=MagicMock(), event_bus=MagicMock())
    with pytest.raises(KeyError):
        registry.get("Unknown")


def test_agent_registry_status_map():
    mock_llm = MagicMock()
    mock_bus = MagicMock()
    registry = AgentRegistry(llm_provider=mock_llm, event_bus=mock_bus)
    registry.register(AgentConfig(name="A", role="A", system_prompt="A"))
    registry.register(AgentConfig(name="B", role="B", system_prompt="B"))

    status_map = registry.get_status_map()
    assert status_map["A"] == AgentStatus.IDLE
    assert status_map["B"] == AgentStatus.IDLE


# ---------------------------------------------------------------------------
# _determine_routing_key unit tests
# ---------------------------------------------------------------------------

def _make_agent_with_rules(handoff_rules: dict) -> "Agent":
    """Helper: create an Agent with given handoff_rules, using mock LLM and bus."""
    config = AgentConfig(
        name="TestAgent",
        role="tester",
        system_prompt="test",
        handoff_rules=handoff_rules,
    )
    mock_llm = MagicMock()
    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()
    return Agent(config=config, llm_provider=mock_llm, event_bus=mock_bus)


def test_determine_routing_key_parses_route_directive():
    """[ROUTE: on_needs_more_context] in response text returns that key when it exists in rules."""
    agent = _make_agent_with_rules(
        {"on_complete": "Reviewer", "on_needs_more_context": "Fetcher"}
    )
    result = agent._determine_routing_key(
        "analysis done [ROUTE: on_needs_more_context]"
    )
    assert result == "on_needs_more_context"


def test_determine_routing_key_unknown_key_falls_back():
    """[ROUTE: unknown_key] not present in handoff_rules falls back to on_complete."""
    agent = _make_agent_with_rules({"on_complete": "Reviewer"})
    result = agent._determine_routing_key("something [ROUTE: unknown_key]")
    assert result == "on_complete"


def test_determine_routing_key_no_directive_returns_on_complete():
    """Plain response text with no [ROUTE: ...] directive returns on_complete."""
    agent = _make_agent_with_rules({"on_complete": "Reviewer", "on_error": "end"})
    result = agent._determine_routing_key("The code looks fine.")
    assert result == "on_complete"


def test_agent_result_defaults():
    """AgentResult has correct default values for optional fields."""
    result = AgentResult(output="some output")
    assert result.routing_key == "on_complete"
    assert result.token_usage == {"input": 0, "output": 0}
    assert result.state_updates is None
