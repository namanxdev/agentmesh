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
