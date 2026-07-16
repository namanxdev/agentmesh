"""
Tests for backend/observability/tcc.py — graceful-degradation wrapper around
The Context Company SDK.

These tests must pass whether or not TCC_API_KEY is set in the environment,
proving that the no-op sentinel path works correctly.
"""

from __future__ import annotations

import importlib
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _reload_tcc():
    """Re-import the module so global state (_tcc_import_attempted etc.) resets."""
    mod_name = "backend.observability.tcc"
    if mod_name in sys.modules:
        del sys.modules[mod_name]
    return importlib.import_module(mod_name)


# ---------------------------------------------------------------------------
# No-op sentinel tests — SDK absent or TCC_API_KEY unset
# ---------------------------------------------------------------------------


class TestNoOpWhenSdkMissing:
    """All helpers return no-op objects when contextcompany cannot be imported."""

    def test_start_run_returns_noop(self):
        obs = _reload_tcc()
        with patch.dict("sys.modules", {"contextcompany": None}):
            # Force import attempt to re-run by resetting state
            obs._tcc = None
            obs._tcc_import_attempted = False
            run = obs.start_run("wf_test")
        # Should be a _NoOpRun — all methods callable without raising
        run.prompt("hello")
        run.response("world")
        run.metadata({"tcc.agent": "A"})
        run.end()

    def test_start_step_returns_noop(self):
        obs = _reload_tcc()
        obs._tcc = None
        obs._tcc_import_attempted = True  # pretend import failed
        noop_run = obs._NoOpRun()
        step = obs.start_step(noop_run)
        step.prompt("p")
        step.response("r")
        step.model(requested="m", used="m")
        step.tokens(prompt_uncached=10, completion=5)
        step.end()

    def test_start_tool_call_returns_noop(self):
        obs = _reload_tcc()
        obs._tcc = None
        obs._tcc_import_attempted = True
        noop_run = obs._NoOpRun()
        tc = obs.start_tool_call(noop_run, "github__read_file")
        tc.args({"path": "main.py"})
        tc.result("file contents")
        tc.end()

    def test_noop_error_methods_do_not_raise(self):
        obs = _reload_tcc()
        noop_run = obs._NoOpRun()
        noop_run.error(status_message="something failed")

        noop_step = obs._NoOpStep()
        noop_step.error(status_message="step failed")

        noop_tc = obs._NoOpToolCall()
        noop_tc.error("tool failed")


class TestNoOpWhenKeyMissing:
    """start_run returns _NoOpRun when TCC_API_KEY is absent."""

    def test_returns_noop_when_no_api_key(self):
        obs = _reload_tcc()
        # Provide a mock contextcompany module but no key
        fake_sdk = MagicMock()
        obs._tcc = None
        obs._tcc_import_attempted = False
        obs._warned_no_key = False

        with patch.dict("sys.modules", {"contextcompany": fake_sdk}), patch.dict(
            "os.environ", {}, clear=False
        ):
            # Remove TCC_API_KEY if present
            import os

            os.environ.pop("TCC_API_KEY", None)
            run = obs.start_run("wf_abc")

        # Must be a _NoOpRun (not a real run)
        assert isinstance(run, obs._NoOpRun)
        # SDK run() should NOT have been called
        fake_sdk.run.assert_not_called()


# ---------------------------------------------------------------------------
# messages_to_prompt helper
# ---------------------------------------------------------------------------


class TestMessagesToPrompt:
    def test_returns_last_user_message(self):
        from backend.observability.tcc import messages_to_prompt

        messages = [
            {"role": "system", "content": "You are an agent."},
            {"role": "user", "content": "Do the thing."},
        ]
        assert messages_to_prompt(messages) == "Do the thing."

    def test_returns_last_tool_message_over_earlier_user(self):
        from backend.observability.tcc import messages_to_prompt

        messages = [
            {"role": "user", "content": "start"},
            {"role": "assistant", "content": ""},
            {"role": "tool", "content": "tool result here"},
        ]
        assert messages_to_prompt(messages) == "tool result here"

    def test_falls_back_to_json_when_no_user_or_tool(self):
        from backend.observability.tcc import messages_to_prompt

        messages = [{"role": "system", "content": "sys"}]
        result = messages_to_prompt(messages)
        assert "system" in result or "sys" in result

    def test_truncates_long_content(self):
        from backend.observability.tcc import messages_to_prompt

        long_content = "x" * 5000
        messages = [{"role": "user", "content": long_content}]
        result = messages_to_prompt(messages)
        assert len(result) <= 2000

    def test_empty_messages_fallback(self):
        from backend.observability.tcc import messages_to_prompt

        result = messages_to_prompt([])
        assert isinstance(result, str)


# ---------------------------------------------------------------------------
# current_user_id ContextVar
# ---------------------------------------------------------------------------


class TestCurrentUserIdContextVar:
    def test_default_is_none(self):
        from backend.observability.tcc import current_user_id

        assert current_user_id.get() is None

    def test_set_and_get(self):
        from backend.observability.tcc import current_user_id

        token = current_user_id.set("user-123")
        try:
            assert current_user_id.get() == "user-123"
        finally:
            current_user_id.reset(token)

    def test_reset_restores_default(self):
        from backend.observability.tcc import current_user_id

        token = current_user_id.set("user-abc")
        current_user_id.reset(token)
        assert current_user_id.get() is None


# ---------------------------------------------------------------------------
# Agent.process integration — TCC calls with mocked SDK
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_agent_process_calls_tcc_run_when_sdk_available():
    """When TCC SDK is available, Agent.process starts and ends a run."""
    import backend.agents.base as base_mod
    from backend.agents.base import Agent, AgentConfig
    from backend.llm.base import LLMResponse

    # Build a fake TCC SDK object graph
    fake_step = MagicMock()
    fake_step.prompt = MagicMock(return_value=fake_step)
    fake_step.response = MagicMock(return_value=fake_step)
    fake_step.model = MagicMock(return_value=fake_step)
    fake_step.tokens = MagicMock(return_value=fake_step)
    fake_step.end = MagicMock()
    fake_step.error = MagicMock()

    fake_run = MagicMock()
    fake_run.prompt = MagicMock(return_value=fake_run)
    fake_run.response = MagicMock(return_value=fake_run)
    fake_run.metadata = MagicMock(return_value=fake_run)
    fake_run.end = MagicMock()
    fake_run.error = MagicMock()
    fake_run.step = MagicMock(return_value=fake_step)
    fake_run.tool_call = MagicMock()

    config = AgentConfig(name="TestAgent", role="tester", system_prompt="test")
    mock_llm = MagicMock()
    mock_llm.generate = AsyncMock(
        return_value=LLMResponse(text="done", usage={"input": 10, "output": 5})
    )
    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    agent = Agent(config=config, llm_provider=mock_llm, event_bus=mock_bus)

    # Patch via the _tcc_obs reference that base.py holds (base_mod._tcc_obs)
    with patch.object(base_mod._tcc_obs, "start_run", return_value=fake_run) as mock_start_run, \
            patch.object(base_mod._tcc_obs, "start_step", return_value=fake_step) as mock_start_step:
        result = await agent.process(task="do something", state={}, workflow_id="wf_x")

    assert result.output == "done"
    mock_start_run.assert_called_once_with("wf_x")
    mock_start_step.assert_called_once()
    fake_run.prompt.assert_called_once_with("do something")
    fake_run.response.assert_called_once_with("done")
    fake_run.end.assert_called_once()
    fake_run.error.assert_not_called()
    fake_step.end.assert_called_once()


@pytest.mark.asyncio
async def test_agent_process_calls_tcc_error_on_llm_failure():
    """When LLM raises, Agent.process calls tcc_run.error and re-raises."""
    import backend.agents.base as base_mod
    from backend.agents.base import Agent, AgentConfig

    fake_step = MagicMock()
    fake_step.prompt = MagicMock(return_value=fake_step)
    fake_step.response = MagicMock(return_value=fake_step)
    fake_step.model = MagicMock(return_value=fake_step)
    fake_step.tokens = MagicMock(return_value=fake_step)
    fake_step.end = MagicMock()
    fake_step.error = MagicMock()

    fake_run = MagicMock()
    fake_run.prompt = MagicMock(return_value=fake_run)
    fake_run.response = MagicMock(return_value=fake_run)
    fake_run.metadata = MagicMock(return_value=fake_run)
    fake_run.end = MagicMock()
    fake_run.error = MagicMock()
    fake_run.step = MagicMock(return_value=fake_step)

    config = AgentConfig(name="TestAgent", role="tester", system_prompt="test")
    mock_llm = MagicMock()
    mock_llm.generate = AsyncMock(side_effect=RuntimeError("LLM down"))
    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    agent = Agent(config=config, llm_provider=mock_llm, event_bus=mock_bus)

    with patch.object(base_mod._tcc_obs, "start_run", return_value=fake_run), \
            patch.object(base_mod._tcc_obs, "start_step", return_value=fake_step):
        with pytest.raises(RuntimeError, match="LLM down"):
            await agent.process(task="fail task", state={}, workflow_id="wf_err")

    # run.end must NOT be called; run.error MUST be called
    fake_run.end.assert_not_called()
    fake_run.error.assert_called_once()
    # step.error must have been called (LLM failed inside step context)
    fake_step.error.assert_called_once()


@pytest.mark.asyncio
async def test_agent_process_records_tool_call():
    """Agent.process records a TCC tool_call for each MCP invocation."""
    import backend.agents.base as base_mod
    from backend.agents.base import Agent, AgentConfig
    from backend.llm.base import LLMResponse

    fake_tc = MagicMock()
    fake_tc.args = MagicMock(return_value=fake_tc)
    fake_tc.result = MagicMock(return_value=fake_tc)
    fake_tc.end = MagicMock()
    fake_tc.error = MagicMock()

    fake_step = MagicMock()
    fake_step.prompt = MagicMock(return_value=fake_step)
    fake_step.response = MagicMock(return_value=fake_step)
    fake_step.model = MagicMock(return_value=fake_step)
    fake_step.tokens = MagicMock(return_value=fake_step)
    fake_step.end = MagicMock()
    fake_step.error = MagicMock()

    fake_run = MagicMock()
    fake_run.prompt = MagicMock(return_value=fake_run)
    fake_run.response = MagicMock(return_value=fake_run)
    fake_run.metadata = MagicMock(return_value=fake_run)
    fake_run.end = MagicMock()
    fake_run.error = MagicMock()
    fake_run.step = MagicMock(return_value=fake_step)

    config = AgentConfig(
        name="ToolAgent", role="fetcher", system_prompt="fetch", mcp_servers=["github"]
    )
    mock_llm = MagicMock()
    mock_llm.generate = AsyncMock(
        side_effect=[
            LLMResponse(
                text="",
                tool_calls=[{"name": "github__read_file", "args": {"path": "x.py"}}],
                usage={"input": 20, "output": 5},
            ),
            LLMResponse(text="fetched!", usage={"input": 30, "output": 10}),
        ]
    )
    mock_mcp = MagicMock()
    mock_mcp.call_tool = AsyncMock(return_value=["contents"])
    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    agent = Agent(config=config, llm_provider=mock_llm, event_bus=mock_bus)
    agent._mcp_clients["github"] = mock_mcp

    with patch.object(base_mod._tcc_obs, "start_run", return_value=fake_run), \
            patch.object(base_mod._tcc_obs, "start_step", return_value=fake_step), \
            patch.object(base_mod._tcc_obs, "start_tool_call", return_value=fake_tc) as mock_stc:
        result = await agent.process(task="fetch x.py", state={}, workflow_id="wf_tc")

    assert result.output == "fetched!"
    mock_stc.assert_called_once_with(fake_run, "github__read_file")
    fake_tc.args.assert_called_once_with({"path": "x.py"})
    fake_tc.result.assert_called_once()
    fake_tc.end.assert_called_once()
    fake_tc.error.assert_not_called()


@pytest.mark.asyncio
async def test_agent_process_gracefully_degrades_when_tcc_unavailable():
    """Agent.process completes normally when TCC returns _NoOpRun."""
    import backend.agents.base as base_mod
    from backend.agents.base import Agent, AgentConfig
    from backend.llm.base import LLMResponse
    from backend.observability.tcc import _NoOpRun

    config = AgentConfig(name="GraceAgent", role="r", system_prompt="s")
    mock_llm = MagicMock()
    mock_llm.generate = AsyncMock(
        return_value=LLMResponse(text="ok", usage={"input": 1, "output": 1})
    )
    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    agent = Agent(config=config, llm_provider=mock_llm, event_bus=mock_bus)

    # start_run returns a genuine _NoOpRun; the real helpers are used
    with patch.object(base_mod._tcc_obs, "start_run", return_value=_NoOpRun()):
        result = await agent.process(task="graceful test", state={}, workflow_id="wf_noop")

    assert result.output == "ok"
