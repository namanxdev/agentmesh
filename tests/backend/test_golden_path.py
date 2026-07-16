"""
Tests for the new-user golden-path reliability fixes.

Covers:
  1. Fire-and-forget _run() exception handling in all three endpoints
     (workflow run, pipeline run, webhook trigger).
  2. Per-run MCP registry disconnect_all() cleanup.
  3. Every PIPELINE_TEMPLATE passes validate_pipeline + pipeline_to_workflow_config.
  4. Provider-key pre-check (missing provider → clear 403).
"""

from __future__ import annotations

import asyncio
import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

os.environ.setdefault("AGENTMESH_ENV", "test")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_mock_orchestrator(raises: Exception | None = None):
    """Return a WorkflowOrchestrator mock that either raises or returns success."""
    from backend.orchestrator.state import WorkflowState

    mock_orch = MagicMock()
    if raises is not None:
        mock_orch.run = AsyncMock(side_effect=raises)
    else:
        fake_state = MagicMock(spec=WorkflowState)
        fake_state.messages = [{"role": "assistant", "content": "done"}]
        fake_state.token_usage = {"input": 10, "output": 5}
        fake_result = MagicMock()
        fake_result.success = True
        fake_result.state = fake_state
        fake_result.total_duration = 0.1
        fake_result.total_tokens = 15
        fake_result.error = None
        mock_orch.run = AsyncMock(return_value=fake_result)
    return mock_orch


def _get_template_ids() -> list[str]:
    """Collect template IDs at collection time (used by fixture params)."""
    from backend.pipelines.templates import PIPELINE_TEMPLATES

    return [t["id"] for t in PIPELINE_TEMPLATES]


# ---------------------------------------------------------------------------
# 1. Fire-and-forget exception handling — workflow run endpoint
# ---------------------------------------------------------------------------


class TestWorkflowRunFireAndForgetExceptionHandling:
    """Workflow run: if orchestrator.run() raises, the run is marked 'error'
    and a 'workflow.error' event is emitted."""

    @pytest.mark.asyncio
    async def test_exception_marks_run_failed_and_emits_event(self):
        from backend.agents.registry import AgentRegistry
        from backend.api.routes import create_app
        from backend.crypto import encrypt
        from backend.events.bus import EventBus
        from backend.mcp.registry import MCPRegistry

        emitted: list[dict] = []

        bus = EventBus()
        original_emit = bus.emit

        async def capturing_emit(event):
            emitted.append(event)
            await original_emit(event)

        bus.emit = capturing_emit

        mock_llm = MagicMock()
        agent_registry = AgentRegistry(llm_provider=mock_llm, event_bus=bus)
        mcp_registry = MCPRegistry(event_bus=bus)

        # Minimal workflow definition (no agents — avoids agent-config lookups)
        workflow_definitions = {
            "test_wf": {
                "description": "test",
                "agents": [],
                "graph": {"start": "end"},
            }
        }

        app = create_app(
            event_bus=bus,
            agent_registry=agent_registry,
            mcp_registry=mcp_registry,
            workflow_definitions=workflow_definitions,
            llm_provider=mock_llm,
        )

        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "user-test"

        encrypted_key = encrypt("fake-gemini-key")

        class _FakeRow:
            provider = "gemini"
            encrypted_key = None  # set per-instance below

        row = _FakeRow()
        row.encrypted_key = encrypted_key

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = [row]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        app.dependency_overrides[get_db] = lambda: mock_db

        boom = RuntimeError("LLM auth error: invalid API key")

        with patch(
            "backend.api.routes.WorkflowOrchestrator",
            return_value=_make_mock_orchestrator(raises=boom),
        ):
            from httpx import ASGITransport, AsyncClient

            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.post(
                    "/api/workflows/run",
                    json={
                        "workflow_name": "test_wf",
                        "task": "do something",
                        "initial_state": {},
                        "config_overrides": {},
                    },
                )

        assert resp.status_code == 200
        workflow_id = resp.json()["workflow_id"]

        # Give the background task time to run
        await asyncio.sleep(0.05)

        failed_events = [e for e in emitted if e.get("type") == "workflow.error"]
        assert len(failed_events) == 1, f"Expected 1 workflow.error event, got: {emitted}"
        assert failed_events[0]["workflow_id"] == workflow_id
        assert "LLM auth error" in failed_events[0]["error"]


# ---------------------------------------------------------------------------
# 2. Fire-and-forget exception handling — pipeline run endpoint
# ---------------------------------------------------------------------------


class TestPipelineRunFireAndForgetExceptionHandling:
    """Pipeline run: if orchestrator.run() raises, the in-memory run is marked
    'error' and a 'workflow.error' event is emitted on the bus."""

    def _valid_pipeline_payload(self) -> dict:
        return {
            "pipeline": {
                "name": "simple",
                "nodes": [
                    {
                        "id": "n1",
                        "kind": "input",
                        "config": {"description": "test"},
                        "position": {"x": 0, "y": 0},
                    },
                    {
                        "id": "n2",
                        "kind": "llm_agent",
                        "config": {
                            "name": "Agent",
                            "system_prompt": "help",
                            "model": "gemini-2.5-flash",
                        },
                        "position": {"x": 100, "y": 0},
                    },
                    {
                        "id": "n3",
                        "kind": "output",
                        "config": {},
                        "position": {"x": 200, "y": 0},
                    },
                ],
                "edges": [
                    {"id": "e1", "source": "n1", "target": "n2"},
                    {"id": "e2", "source": "n2", "target": "n3"},
                ],
            },
            "task": "do something",
        }

    @pytest.mark.asyncio
    async def test_exception_marks_run_failed_and_emits_event(self):
        from backend.agents.registry import AgentRegistry
        from backend.api.routes import create_app
        from backend.crypto import encrypt
        from backend.events.bus import EventBus
        from backend.mcp.registry import MCPRegistry

        emitted: list[dict] = []

        bus = EventBus()
        original_emit = bus.emit

        async def capturing_emit(event):
            emitted.append(event)
            await original_emit(event)

        bus.emit = capturing_emit

        mock_llm = MagicMock()
        agent_registry = AgentRegistry(llm_provider=mock_llm, event_bus=bus)
        mcp_registry = MCPRegistry(event_bus=bus)
        app = create_app(
            event_bus=bus,
            agent_registry=agent_registry,
            mcp_registry=mcp_registry,
            workflow_definitions={},
            llm_provider=mock_llm,
        )

        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "user-test"

        encrypted_key = encrypt("fake-gemini-key")

        class _FakeRow:
            provider = "gemini"
            encrypted_key = None

        row = _FakeRow()
        row.encrypted_key = encrypted_key

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = [row]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        app.dependency_overrides[get_db] = lambda: mock_db

        boom = RuntimeError("MCP connection refused")

        # Patch the orchestrator AND the MCP registry loader to avoid real DB/MCP calls
        with patch(
            "backend.api.routes.WorkflowOrchestrator",
            return_value=_make_mock_orchestrator(raises=boom),
        ), patch(
            "backend.api.routes._load_user_mcp_registry",
            new=AsyncMock(return_value=MCPRegistry(event_bus=bus)),
        ):
            from httpx import ASGITransport, AsyncClient

            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.post(
                    "/api/pipelines/run", json=self._valid_pipeline_payload()
                )

        assert resp.status_code == 200
        workflow_id = resp.json()["workflow_id"]

        await asyncio.sleep(0.05)

        failed_events = [e for e in emitted if e.get("type") == "workflow.error"]
        assert len(failed_events) == 1, f"Expected 1 workflow.error event, got: {emitted}"
        assert failed_events[0]["workflow_id"] == workflow_id
        assert "MCP connection refused" in failed_events[0]["error"]


# ---------------------------------------------------------------------------
# 3. MCP registry disconnect_all()
# ---------------------------------------------------------------------------


class TestMCPRegistryDisconnectAll:
    """MCPRegistry.disconnect_all() resets all clients and clears the maps."""

    @pytest.mark.asyncio
    async def test_disconnect_all_clears_clients(self):
        from backend.events.bus import EventBus
        from backend.mcp.registry import MCPRegistry

        bus = EventBus()
        registry = MCPRegistry(event_bus=bus)

        # Register two fake servers (no real connection needed)
        fake_client_a = MagicMock()
        fake_client_a._connected = True
        fake_client_a._tool_definitions = ["tool1"]
        fake_client_b = MagicMock()
        fake_client_b._connected = True
        fake_client_b._tool_definitions = ["tool2"]
        registry._clients["server-a"] = fake_client_a
        registry._clients["server-b"] = fake_client_b
        registry._configs["server-a"] = {"transport": "stdio", "command": "fake"}
        registry._configs["server-b"] = {"transport": "sse", "url": "http://fake"}

        assert len(registry._clients) == 2

        await registry.disconnect_all()

        assert len(registry._clients) == 0
        assert len(registry._configs) == 0

    @pytest.mark.asyncio
    async def test_disconnect_all_on_empty_registry_is_noop(self):
        from backend.events.bus import EventBus
        from backend.mcp.registry import MCPRegistry

        bus = EventBus()
        registry = MCPRegistry(event_bus=bus)
        # Should not raise
        await registry.disconnect_all()
        assert len(registry._clients) == 0

    @pytest.mark.asyncio
    async def test_disconnect_all_resets_client_connected_flag(self):
        from backend.events.bus import EventBus
        from backend.mcp.client import MCPClientWrapper
        from backend.mcp.registry import MCPRegistry

        bus = EventBus()
        registry = MCPRegistry(event_bus=bus)

        # Build a real MCPClientWrapper with _connected = True
        client = MCPClientWrapper(
            server_name="fake",
            transport_config={"transport": "stdio", "command": "echo"},
            event_bus=bus,
        )
        client._connected = True
        client._tool_definitions = [{"type": "function"}]

        registry._clients["fake"] = client
        registry._configs["fake"] = {"transport": "stdio", "command": "echo"}

        await registry.disconnect_all()

        assert client._connected is False
        assert client._tool_definitions == []


# ---------------------------------------------------------------------------
# 4. All PIPELINE_TEMPLATES pass validation and conversion
# ---------------------------------------------------------------------------


class TestPipelineTemplatesAreValid:
    """Every entry in PIPELINE_TEMPLATES must pass validate_pipeline and
    pipeline_to_workflow_config without raising."""

    @pytest.fixture(params=_get_template_ids())
    def template(self, request):
        from backend.pipelines.templates import PIPELINE_TEMPLATES

        return next(t for t in PIPELINE_TEMPLATES if t["id"] == request.param)

    def test_template_passes_validator(self, template):
        from backend.pipelines.validator import validate_pipeline

        defn = template["definition"]
        nodes = defn["nodes"]
        edges = defn["edges"]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is True, (
            f"Template '{template['id']}' failed validation: {result['errors']}"
        )
        assert result["errors"] == []

    def test_template_converts_to_workflow_config(self, template):
        from backend.events.bus import EventBus
        from backend.pipelines.validator import pipeline_to_workflow_config

        mock_llm = MagicMock()
        bus = EventBus()

        defn = template["definition"]
        config = pipeline_to_workflow_config(defn, mock_llm, bus)

        assert "agent_registry" in config
        assert "graph_config" in config
        assert "task" in config
        # There must be at least one agent registered
        agents = config["agent_registry"].list_all()
        assert len(agents) > 0, f"Template '{template['id']}' produced no agents"
        # graph_config must have a 'start' key
        assert "start" in config["graph_config"], (
            f"Template '{template['id']}' graph_config missing 'start'"
        )


# ---------------------------------------------------------------------------
# 5. Provider key pre-check — missing provider surfaces clear 403
# ---------------------------------------------------------------------------


class TestProviderKeyPreCheck:
    """The pipeline-run endpoint should return 403 with actionable detail when
    a required LLM provider key is missing."""

    def _openai_pipeline_payload(self, agent_name: str = "GPTAgent") -> dict:
        """A pipeline that requires an OpenAI key (gpt-4o model)."""
        return {
            "pipeline": {
                "name": "needs-openai",
                "nodes": [
                    {
                        "id": "n1",
                        "kind": "input",
                        "config": {"description": "test"},
                        "position": {"x": 0, "y": 0},
                    },
                    {
                        "id": "n2",
                        "kind": "llm_agent",
                        "config": {
                            "name": agent_name,
                            "system_prompt": "help",
                            "model": "gpt-4o",
                        },
                        "position": {"x": 100, "y": 0},
                    },
                    {
                        "id": "n3",
                        "kind": "output",
                        "config": {},
                        "position": {"x": 200, "y": 0},
                    },
                ],
                "edges": [
                    {"id": "e1", "source": "n1", "target": "n2"},
                    {"id": "e2", "source": "n2", "target": "n3"},
                ],
            },
            "task": "do something",
        }

    def _make_app_with_gemini_key(self):
        from backend.agents.registry import AgentRegistry
        from backend.api.routes import create_app
        from backend.crypto import encrypt
        from backend.events.bus import EventBus
        from backend.mcp.registry import MCPRegistry

        bus = EventBus()
        mock_llm = MagicMock()
        agent_registry = AgentRegistry(llm_provider=mock_llm, event_bus=bus)
        mcp_registry = MCPRegistry(event_bus=bus)
        app = create_app(
            event_bus=bus,
            agent_registry=agent_registry,
            mcp_registry=mcp_registry,
            workflow_definitions={},
            llm_provider=mock_llm,
        )

        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "user-test"

        encrypted_key = encrypt("fake-gemini-key")

        class _FakeRow:
            provider = "gemini"
            encrypted_key = None

        row = _FakeRow()
        row.encrypted_key = encrypted_key

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = [row]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        app.dependency_overrides[get_db] = lambda: mock_db

        return app

    @pytest.mark.asyncio
    async def test_missing_openai_key_returns_403_with_detail(self):
        """User has only a Gemini key but pipeline requires OpenAI → 403."""
        app = self._make_app_with_gemini_key()

        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/pipelines/run", json=self._openai_pipeline_payload()
            )

        assert resp.status_code == 403
        detail = resp.json()["detail"]
        assert detail["error"] == "missing_provider"
        assert "GPTAgent" in detail["message"]
        assert "OpenAI" in detail["message"]
        assert "Settings" in detail["message"]

    @pytest.mark.asyncio
    async def test_missing_provider_message_includes_agent_name_and_model(self):
        """Error message must mention the agent name and the model."""
        app = self._make_app_with_gemini_key()

        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/pipelines/run", json=self._openai_pipeline_payload("MyOpenAIAgent")
            )

        assert resp.status_code == 403
        message = resp.json()["detail"]["message"]
        assert "MyOpenAIAgent" in message
        assert "gpt-4o" in message

    @pytest.mark.asyncio
    async def test_no_keys_at_all_returns_403(self):
        """User with no keys gets a clear 403 before any processing."""
        from backend.agents.registry import AgentRegistry
        from backend.api.routes import create_app
        from backend.events.bus import EventBus
        from backend.mcp.registry import MCPRegistry

        bus = EventBus()
        mock_llm = MagicMock()
        agent_registry = AgentRegistry(llm_provider=mock_llm, event_bus=bus)
        mcp_registry = MCPRegistry(event_bus=bus)
        app = create_app(
            event_bus=bus,
            agent_registry=agent_registry,
            mcp_registry=mcp_registry,
            workflow_definitions={},
            llm_provider=mock_llm,
        )

        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "user-test"

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []  # no rows
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        app.dependency_overrides[get_db] = lambda: mock_db

        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/pipelines/run",
                json={
                    "pipeline": {
                        "name": "p",
                        "nodes": [
                            {
                                "id": "n1",
                                "kind": "input",
                                "config": {},
                                "position": {"x": 0, "y": 0},
                            },
                            {
                                "id": "n2",
                                "kind": "output",
                                "config": {},
                                "position": {"x": 100, "y": 0},
                            },
                        ],
                        "edges": [{"id": "e1", "source": "n1", "target": "n2"}],
                    },
                    "task": "run",
                },
            )

        assert resp.status_code == 403
        assert resp.json()["detail"]["error"] == "no_keys"
