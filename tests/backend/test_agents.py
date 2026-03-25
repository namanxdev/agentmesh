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
