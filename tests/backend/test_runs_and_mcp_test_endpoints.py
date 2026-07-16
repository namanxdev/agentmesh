"""
Tests for the two new endpoints added to routes.py:

  GET  /api/runs             — global run history (joined with pipelines)
  POST /api/mcp/user-servers/{server_id}/test — MCP server health check
"""

from __future__ import annotations

import os
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

os.environ.setdefault("AGENTMESH_ENV", "test")

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


def _make_app():
    """Return a fresh app with no-op auth and a mock DB dependency."""
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

    app.dependency_overrides[get_current_user] = lambda: "user-abc"

    return app, get_current_user, get_db


def _make_run_row(
    *,
    id: str,
    workflow_id: str,
    pipeline_id: str | None,
    pipeline_name: str | None,
    status: str = "completed",
    total_tokens: int | None = 100,
    duration_seconds: float | None = 1.5,
    error: str | None = None,
    created_at: datetime | None = None,
):
    """Build a SimpleNamespace that mimics a SQLAlchemy Row for pipeline_runs."""
    from types import SimpleNamespace

    return SimpleNamespace(
        id=id,
        workflow_id=workflow_id,
        pipeline_id=pipeline_id,
        pipeline_name=pipeline_name,
        status=status,
        total_tokens=total_tokens,
        duration_seconds=duration_seconds,
        error=error,
        created_at=created_at or datetime(2024, 1, 15, 10, 0, 0, tzinfo=UTC),
    )


def _make_mcp_row(
    *,
    id: str,
    name: str,
    server_type: str = "stdio",
    command_or_url: str = "echo hello",
    env_vars: dict | None = None,
):
    from types import SimpleNamespace

    return SimpleNamespace(
        id=id,
        name=name,
        server_type=server_type,
        command_or_url=command_or_url,
        env_vars=env_vars or {},
    )


# ---------------------------------------------------------------------------
# GET /api/runs — global run history
# ---------------------------------------------------------------------------


class TestListRunsEndpoint:
    """Tests for GET /api/runs."""

    @pytest.mark.asyncio
    async def test_returns_joined_rows_newest_first(self):
        """Rows are returned in the order the DB provides (newest first)."""
        app, get_current_user, get_db = _make_app()

        now1 = datetime(2024, 1, 15, 12, 0, 0, tzinfo=UTC)
        now2 = datetime(2024, 1, 14, 8, 0, 0, tzinfo=UTC)

        rows = [
            _make_run_row(
                id="run-1",
                workflow_id="wf-1",
                pipeline_id="pipe-1",
                pipeline_name="My Pipeline",
                status="completed",
                total_tokens=200,
                duration_seconds=2.3,
                error=None,
                created_at=now1,
            ),
            _make_run_row(
                id="run-2",
                workflow_id="wf-2",
                pipeline_id=None,
                pipeline_name=None,
                status="error",
                total_tokens=50,
                duration_seconds=0.5,
                error="Something went wrong",
                created_at=now2,
            ),
        ]

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = rows
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/runs")

        assert resp.status_code == 200
        body = resp.json()
        assert "runs" in body
        run_list = body["runs"]
        assert len(run_list) == 2

        # First run (newest)
        r0 = run_list[0]
        assert r0["id"] == "run-1"
        assert r0["workflow_id"] == "wf-1"
        assert r0["pipeline_id"] == "pipe-1"
        assert r0["pipeline_name"] == "My Pipeline"
        assert r0["status"] == "completed"
        assert r0["total_tokens"] == 200
        assert r0["duration_seconds"] == 2.3
        assert r0["error"] is None
        assert r0["created_at"] == "2024-01-15T12:00:00+00:00"

        # Second run (older, pipeline deleted → name is null)
        r1 = run_list[1]
        assert r1["id"] == "run-2"
        assert r1["pipeline_id"] is None
        assert r1["pipeline_name"] is None
        assert r1["status"] == "error"
        assert r1["error"] == "Something went wrong"

    @pytest.mark.asyncio
    async def test_respects_limit_query_param(self):
        """The SQL query is called with the user-supplied limit (clamped to 200)."""
        app, get_current_user, get_db = _make_app()

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/runs?limit=10")

        assert resp.status_code == 200

        # Verify the DB was called with limit=10
        call_kwargs = mock_db.execute.call_args
        params = call_kwargs[0][1]  # second positional arg to execute()
        assert params["lim"] == 10

    @pytest.mark.asyncio
    async def test_limit_is_clamped_to_200(self):
        """Requesting limit > 200 is silently clamped to 200."""
        app, get_current_user, get_db = _make_app()

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/runs?limit=9999")

        assert resp.status_code == 200
        params = mock_db.execute.call_args[0][1]
        assert params["lim"] == 200

    @pytest.mark.asyncio
    async def test_excludes_other_users_runs(self):
        """The WHERE clause is scoped to the authenticated user_id."""
        app, get_current_user, get_db = _make_app()

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/runs")

        assert resp.status_code == 200

        # Verify the DB was called with the correct user_id
        call_kwargs = mock_db.execute.call_args
        params = call_kwargs[0][1]
        assert params["uid"] == "user-abc"

        # SQL must reference pr.user_id
        sql_str = str(call_kwargs[0][0])
        assert "user_id" in sql_str.lower() or "uid" in sql_str.lower()

    @pytest.mark.asyncio
    async def test_empty_history_returns_empty_list(self):
        """When no runs exist, response is {"runs": []}."""
        app, get_current_user, get_db = _make_app()

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/runs")

        assert resp.status_code == 200
        assert resp.json() == {"runs": []}


# ---------------------------------------------------------------------------
# POST /api/mcp/user-servers/{server_id}/test — MCP health check
# ---------------------------------------------------------------------------


class TestMCPServerTestEndpoint:
    """Tests for POST /api/mcp/user-servers/{server_id}/test."""

    def _make_tool_definition(self, name: str, description: str) -> dict:
        return {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": {"type": "object", "properties": {}},
            },
        }

    @pytest.mark.asyncio
    async def test_success_path_returns_ok_true_with_tools(self):
        """When MCPClientWrapper.connect() succeeds, return ok:true with tools list."""
        app, get_current_user, get_db = _make_app()

        mcp_row = _make_mcp_row(
            id="srv-1",
            name="my-server",
            server_type="stdio",
            command_or_url="echo hello",
        )

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchone.return_value = mcp_row
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        fake_tool_defs = [
            self._make_tool_definition("my-server__list_files", "List files in a directory"),
            self._make_tool_definition("my-server__read_file", "Read a file"),
        ]

        mock_client_instance = MagicMock()
        mock_client_instance.connect = AsyncMock()
        mock_client_instance.get_tool_definitions = MagicMock(return_value=fake_tool_defs)
        mock_client_instance._connected = False
        mock_client_instance._tool_definitions = []

        from httpx import ASGITransport, AsyncClient

        with patch("backend.mcp.client.MCPClientWrapper", return_value=mock_client_instance):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.post("/api/mcp/user-servers/srv-1/test")

        assert resp.status_code == 200
        body = resp.json()
        assert body["ok"] is True
        assert body["latency_ms"] is not None
        assert isinstance(body["latency_ms"], float)
        assert len(body["tools"]) == 2
        assert body["tools"][0]["name"] == "my-server__list_files"
        assert body["tools"][0]["description"] == "List files in a directory"
        assert body["tools"][1]["name"] == "my-server__read_file"
        assert "error" not in body

    @pytest.mark.asyncio
    async def test_failure_path_returns_ok_false_with_error_and_200(self):
        """When connect() raises, return HTTP 200 with ok:false and the error message."""
        app, get_current_user, get_db = _make_app()

        mcp_row = _make_mcp_row(
            id="srv-2",
            name="broken-server",
            server_type="stdio",
            command_or_url="nonexistent-binary",
        )

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchone.return_value = mcp_row
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_client_instance = MagicMock()
        mock_client_instance.connect = AsyncMock(
            side_effect=ConnectionError("No such file or directory: 'nonexistent-binary'")
        )
        mock_client_instance._connected = False
        mock_client_instance._tool_definitions = []

        from httpx import ASGITransport, AsyncClient

        with patch("backend.mcp.client.MCPClientWrapper", return_value=mock_client_instance):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.post("/api/mcp/user-servers/srv-2/test")

        assert resp.status_code == 200
        body = resp.json()
        assert body["ok"] is False
        assert body["latency_ms"] is None
        assert body["tools"] == []
        assert "nonexistent-binary" in body["error"]

    @pytest.mark.asyncio
    async def test_timeout_returns_ok_false(self):
        """An asyncio.TimeoutError is treated as a failed health check, not a 5xx."""
        app, get_current_user, get_db = _make_app()

        mcp_row = _make_mcp_row(
            id="srv-3",
            name="slow-server",
            server_type="sse",
            command_or_url="http://192.0.2.1/sse",
        )

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchone.return_value = mcp_row
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_client_instance = MagicMock()
        mock_client_instance.connect = AsyncMock(side_effect=TimeoutError())
        mock_client_instance._connected = False
        mock_client_instance._tool_definitions = []

        from httpx import ASGITransport, AsyncClient

        with patch("backend.mcp.client.MCPClientWrapper", return_value=mock_client_instance):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.post("/api/mcp/user-servers/srv-3/test")

        assert resp.status_code == 200
        body = resp.json()
        assert body["ok"] is False
        assert body["tools"] == []
        assert body["latency_ms"] is None

    @pytest.mark.asyncio
    async def test_server_not_found_returns_404(self):
        """When the server_id belongs to another user (or doesn't exist), return 404."""
        app, get_current_user, get_db = _make_app()

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchone.return_value = None  # not found / wrong user
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/mcp/user-servers/other-users-server/test")

        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_server_id_scoped_to_current_user(self):
        """The DB query must include both server_id AND user_id in its WHERE clause."""
        app, get_current_user, get_db = _make_app()

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchone.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/mcp/user-servers/some-id/test")

        call_kwargs = mock_db.execute.call_args
        params = call_kwargs[0][1]
        assert params["id"] == "some-id"
        assert params["uid"] == "user-abc"

    @pytest.mark.asyncio
    async def test_client_is_cleaned_up_after_success(self):
        """The finally block resets _connected and _tool_definitions."""
        app, get_current_user, get_db = _make_app()

        mcp_row = _make_mcp_row(id="srv-4", name="cleanup-test")

        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.fetchone.return_value = mcp_row
        mock_db.execute = AsyncMock(return_value=mock_result)
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_client_instance = MagicMock()
        mock_client_instance.connect = AsyncMock()
        mock_client_instance.get_tool_definitions = MagicMock(return_value=[])
        mock_client_instance._connected = True
        mock_client_instance._tool_definitions = [{"some": "tool"}]

        from httpx import ASGITransport, AsyncClient

        with patch("backend.mcp.client.MCPClientWrapper", return_value=mock_client_instance):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                await client.post("/api/mcp/user-servers/srv-4/test")

        # The finally block must have run
        assert mock_client_instance._connected is False
        assert mock_client_instance._tool_definitions == []
