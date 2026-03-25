import pytest
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
