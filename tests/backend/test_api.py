import os
import pytest
os.environ["AGENTMESH_ENV"] = "test"  # prevent module-level create_default_app() call

from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture
def app():
    """Create a test FastAPI app with mocked dependencies."""
    from backend.api.routes import create_app
    from backend.events.bus import EventBus
    from backend.agents.registry import AgentRegistry
    from backend.mcp.registry import MCPRegistry
    from backend.orchestrator.state import WorkflowState, WorkflowResult

    event_bus = EventBus()
    mock_llm = MagicMock()
    agent_registry = AgentRegistry(llm_provider=mock_llm, event_bus=event_bus)
    mcp_registry = MCPRegistry(event_bus=event_bus)

    return create_app(
        event_bus=event_bus,
        agent_registry=agent_registry,
        mcp_registry=mcp_registry,
        workflow_definitions={},
    )


@pytest.mark.asyncio
async def test_get_workflows_empty(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/workflows")
    assert resp.status_code == 200
    assert "workflows" in resp.json()


@pytest.mark.asyncio
async def test_get_agents_empty(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/agents")
    assert resp.status_code == 200
    assert "agents" in resp.json()


@pytest.mark.asyncio
async def test_get_mcp_servers_empty(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/mcp/servers")
    assert resp.status_code == 200
    assert "servers" in resp.json()


@pytest.mark.asyncio
async def test_run_unknown_workflow_returns_404(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/workflows/run", json={
            "workflow_name": "nonexistent",
            "task": "do something",
        })
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_pipeline_templates_returns_at_least_two(app):
    """GET /api/pipelines/templates returns a templates list with at least 2 items."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/pipelines/templates")
    assert resp.status_code == 200
    body = resp.json()
    assert "templates" in body
    assert len(body["templates"]) >= 2


@pytest.mark.asyncio
async def test_validate_pipeline_valid_returns_is_dag_true(app):
    """POST /api/pipelines/validate with a valid input→output pipeline → is_dag: True, errors: []."""
    payload = {
        "name": "simple",
        "nodes": [
            {"id": "n1", "kind": "input", "config": {}, "position": {"x": 0, "y": 0}},
            {"id": "n2", "kind": "output", "config": {}, "position": {"x": 100, "y": 0}},
        ],
        "edges": [{"id": "e1", "source": "n1", "target": "n2"}],
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/pipelines/validate", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["is_dag"] is True
    assert body["errors"] == []


@pytest.mark.asyncio
async def test_validate_pipeline_cycle_returns_is_dag_false(app):
    """POST /api/pipelines/validate with a cyclic graph → is_dag: False, errors non-empty."""
    payload = {
        "name": "cyclic",
        "nodes": [
            {"id": "n1", "kind": "input", "config": {}, "position": {"x": 0, "y": 0}},
            {"id": "n2", "kind": "llm_agent", "config": {"name": "a", "system_prompt": ""}, "position": {"x": 0, "y": 0}},
            {"id": "n3", "kind": "llm_agent", "config": {"name": "b", "system_prompt": ""}, "position": {"x": 0, "y": 0}},
            {"id": "n4", "kind": "output", "config": {}, "position": {"x": 0, "y": 0}},
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n2"},  # cycle
            {"id": "e4", "source": "n3", "target": "n4"},
        ],
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/pipelines/validate", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["is_dag"] is False
    assert len(body["errors"]) > 0


@pytest.mark.asyncio
async def test_get_mcp_servers_returns_servers_key(app):
    """GET /api/mcp/servers returns a dict with a 'servers' list."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/mcp/servers")
    assert resp.status_code == 200
    body = resp.json()
    assert "servers" in body
    assert isinstance(body["servers"], list)
