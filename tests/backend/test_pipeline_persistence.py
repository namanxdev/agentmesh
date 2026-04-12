"""Tests for pipeline save/load/list/delete, templates, and run history routes."""
import os
import pytest

os.environ["AGENTMESH_ENV"] = "test"

from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def app():
    from backend.api.routes import create_app
    from backend.events.bus import EventBus
    from backend.agents.registry import AgentRegistry
    from backend.mcp.registry import MCPRegistry

    event_bus = EventBus()
    mock_llm = MagicMock()
    agent_registry = AgentRegistry(llm_provider=mock_llm, event_bus=event_bus)
    mcp_registry = MCPRegistry(event_bus=event_bus)

    return create_app(
        event_bus=event_bus,
        agent_registry=agent_registry,
        mcp_registry=mcp_registry,
        workflow_definitions={},
        llm_provider=mock_llm,
    )


def _make_db_mock(rows=None, one_row=None):
    """Return a mock AsyncSession whose execute() returns rows / fetchone()."""
    db = AsyncMock()
    result = MagicMock()
    result.fetchall.return_value = rows if rows is not None else []
    result.fetchone.return_value = one_row
    db.execute = AsyncMock(return_value=result)
    db.commit = AsyncMock()
    return db


def _minimal_pipeline_payload(name: str = "My Pipeline") -> dict:
    return {
        "name": name,
        "definition": {
            "name": name,
            "nodes": [
                {"id": "n1", "kind": "input", "config": {}, "position": {"x": 0, "y": 0}},
                {"id": "n2", "kind": "output", "config": {}, "position": {"x": 100, "y": 0}},
            ],
            "edges": [{"id": "e1", "source": "n1", "target": "n2"}],
        },
    }


# ---------------------------------------------------------------------------
# GET /api/pipelines/templates — no auth required
# ---------------------------------------------------------------------------

class TestListTemplates:
    @pytest.mark.asyncio
    async def test_returns_two_templates(self, app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/templates")
        assert resp.status_code == 200
        body = resp.json()
        assert "templates" in body
        assert len(body["templates"]) == 3

    @pytest.mark.asyncio
    async def test_template_ids(self, app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/templates")
        ids = [t["id"] for t in resp.json()["templates"]]
        assert "research-synthesis" in ids
        assert "github-code-review" in ids

    @pytest.mark.asyncio
    async def test_each_template_has_required_keys(self, app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/templates")
        for tmpl in resp.json()["templates"]:
            assert "id" in tmpl
            assert "name" in tmpl
            assert "description" in tmpl
            assert "definition" in tmpl

    @pytest.mark.asyncio
    async def test_template_definition_has_nodes_and_edges(self, app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/templates")
        for tmpl in resp.json()["templates"]:
            defn = tmpl["definition"]
            assert "nodes" in defn
            assert "edges" in defn
            assert len(defn["nodes"]) > 0
            assert len(defn["edges"]) > 0

    @pytest.mark.asyncio
    async def test_research_synthesis_has_four_agents(self, app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/templates")
        tmpl = next(t for t in resp.json()["templates"] if t["id"] == "research-synthesis")
        agent_nodes = [n for n in tmpl["definition"]["nodes"] if n["kind"] == "llm_agent"]
        assert len(agent_nodes) == 4

    @pytest.mark.asyncio
    async def test_github_code_review_has_four_agents(self, app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/templates")
        tmpl = next(t for t in resp.json()["templates"] if t["id"] == "github-code-review")
        agent_nodes = [n for n in tmpl["definition"]["nodes"] if n["kind"] == "llm_agent"]
        assert len(agent_nodes) == 4

    @pytest.mark.asyncio
    async def test_no_auth_required(self, app):
        """Templates endpoint must be accessible without an Authorization header."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/templates")
        # Should not be 401/403
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# POST /api/pipelines — save (insert)
# ---------------------------------------------------------------------------

class TestSavePipelineInsert:
    @pytest.mark.asyncio
    async def test_insert_returns_new_id_and_name(self, app):
        mock_db = _make_db_mock()
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "user-123"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/pipelines",
                json=_minimal_pipeline_payload("New Pipeline"),
                headers={"Authorization": "Bearer fake-token"},
            )

        app.dependency_overrides.clear()
        assert resp.status_code == 200
        body = resp.json()
        assert "id" in body
        assert body["name"] == "New Pipeline"
        assert "updated_at" in body

    @pytest.mark.asyncio
    async def test_insert_executes_db_insert(self, app):
        mock_db = _make_db_mock()
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "user-abc"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/pipelines",
                json=_minimal_pipeline_payload("Pipeline X"),
                headers={"Authorization": "Bearer fake"},
            )

        app.dependency_overrides.clear()
        # execute() should have been called (the INSERT)
        assert mock_db.execute.called
        assert mock_db.commit.called

    @pytest.mark.asyncio
    async def test_update_when_pipeline_id_provided(self, app):
        mock_db = _make_db_mock()
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "user-abc"
        app.dependency_overrides[get_db] = lambda: mock_db

        payload = _minimal_pipeline_payload("Updated Name")
        payload["pipeline_id"] = "existing-uuid-123"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/pipelines",
                json=payload,
                headers={"Authorization": "Bearer fake"},
            )

        app.dependency_overrides.clear()
        assert resp.status_code == 200
        body = resp.json()
        # Must return the same id that was passed in
        assert body["id"] == "existing-uuid-123"
        assert body["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_save_requires_auth(self, app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/pipelines",
                json=_minimal_pipeline_payload(),
                # No Authorization header — real auth_middleware will reject
            )
        assert resp.status_code in (401, 403, 422)


# ---------------------------------------------------------------------------
# GET /api/pipelines — list
# ---------------------------------------------------------------------------

class TestListPipelines:
    @pytest.mark.asyncio
    async def test_returns_pipelines_list(self, app):
        import datetime

        row = MagicMock()
        row.id = "pipe-1"
        row.name = "My Pipeline"
        row.updated_at = datetime.datetime(2026, 1, 1, 12, 0, 0)

        mock_db = _make_db_mock(rows=[row])
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "user-xyz"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines", headers={"Authorization": "Bearer fake"})

        app.dependency_overrides.clear()
        assert resp.status_code == 200
        body = resp.json()
        assert "pipelines" in body
        assert len(body["pipelines"]) == 1
        assert body["pipelines"][0]["id"] == "pipe-1"
        assert body["pipelines"][0]["name"] == "My Pipeline"

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_pipelines(self, app):
        mock_db = _make_db_mock(rows=[])
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "user-xyz"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines", headers={"Authorization": "Bearer fake"})

        app.dependency_overrides.clear()
        assert resp.status_code == 200
        assert resp.json()["pipelines"] == []

    @pytest.mark.asyncio
    async def test_updated_at_none_serialized_as_null(self, app):
        row = MagicMock()
        row.id = "pipe-2"
        row.name = "Old"
        row.updated_at = None

        mock_db = _make_db_mock(rows=[row])
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "u"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines", headers={"Authorization": "Bearer fake"})

        app.dependency_overrides.clear()
        assert resp.json()["pipelines"][0]["updated_at"] is None


# ---------------------------------------------------------------------------
# GET /api/pipelines/{pipeline_id} — load
# ---------------------------------------------------------------------------

class TestGetPipeline:
    @pytest.mark.asyncio
    async def test_returns_pipeline_definition(self, app):
        import json

        row = MagicMock()
        row.id = "pipe-42"
        row.name = "Cool Pipeline"
        row.definition = json.dumps({"name": "Cool Pipeline", "nodes": [], "edges": []})

        mock_db = _make_db_mock(one_row=row)
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "u1"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/pipe-42", headers={"Authorization": "Bearer fake"})

        app.dependency_overrides.clear()
        assert resp.status_code == 200
        body = resp.json()
        assert body["id"] == "pipe-42"
        assert body["name"] == "Cool Pipeline"
        assert "definition" in body

    @pytest.mark.asyncio
    async def test_404_when_not_found(self, app):
        mock_db = _make_db_mock(one_row=None)
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "u1"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/nonexistent", headers={"Authorization": "Bearer fake"})

        app.dependency_overrides.clear()
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_definition_string_is_parsed_to_dict(self, app):
        import json

        row = MagicMock()
        row.id = "p1"
        row.name = "P"
        row.definition = json.dumps({"name": "P", "nodes": [], "edges": []})

        mock_db = _make_db_mock(one_row=row)
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "u"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/p1", headers={"Authorization": "Bearer fake"})

        app.dependency_overrides.clear()
        # definition must be a dict in the JSON response, not a string
        assert isinstance(resp.json()["definition"], dict)

    @pytest.mark.asyncio
    async def test_definition_dict_passthrough(self, app):
        """If definition is already a dict (JSONB column), it should pass through cleanly."""
        row = MagicMock()
        row.id = "p2"
        row.name = "P2"
        row.definition = {"name": "P2", "nodes": [], "edges": []}  # already a dict

        mock_db = _make_db_mock(one_row=row)
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "u"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/pipelines/p2", headers={"Authorization": "Bearer fake"})

        app.dependency_overrides.clear()
        assert resp.status_code == 200
        assert isinstance(resp.json()["definition"], dict)


# ---------------------------------------------------------------------------
# DELETE /api/pipelines/{pipeline_id}
# ---------------------------------------------------------------------------

class TestDeletePipeline:
    @pytest.mark.asyncio
    async def test_returns_deleted_id(self, app):
        mock_db = _make_db_mock()
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "u1"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.delete("/api/pipelines/pipe-99", headers={"Authorization": "Bearer fake"})

        app.dependency_overrides.clear()
        assert resp.status_code == 200
        assert resp.json()["deleted"] == "pipe-99"

    @pytest.mark.asyncio
    async def test_executes_delete_and_commits(self, app):
        mock_db = _make_db_mock()
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "u1"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.delete("/api/pipelines/pipe-99", headers={"Authorization": "Bearer fake"})

        app.dependency_overrides.clear()
        assert mock_db.execute.called
        assert mock_db.commit.called


# ---------------------------------------------------------------------------
# GET /api/pipelines/{pipeline_id}/runs
# ---------------------------------------------------------------------------

class TestGetPipelineRuns:
    @pytest.mark.asyncio
    async def test_returns_runs_list(self, app):
        import datetime

        run_row = MagicMock()
        run_row.id = "run-1"
        run_row.workflow_id = "wf_abc123"
        run_row.status = "completed"
        run_row.total_tokens = 1500
        run_row.duration_seconds = 12.4
        run_row.created_at = datetime.datetime(2026, 3, 1, 10, 0, 0)

        mock_db = _make_db_mock(rows=[run_row])
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "u1"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get(
                "/api/pipelines/pipe-1/runs",
                headers={"Authorization": "Bearer fake"},
            )

        app.dependency_overrides.clear()
        assert resp.status_code == 200
        body = resp.json()
        assert "runs" in body
        assert len(body["runs"]) == 1
        r = body["runs"][0]
        assert r["id"] == "run-1"
        assert r["workflow_id"] == "wf_abc123"
        assert r["status"] == "completed"
        assert r["total_tokens"] == 1500
        assert r["duration_seconds"] == 12.4

    @pytest.mark.asyncio
    async def test_returns_empty_runs_list(self, app):
        mock_db = _make_db_mock(rows=[])
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "u1"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get(
                "/api/pipelines/pipe-1/runs",
                headers={"Authorization": "Bearer fake"},
            )

        app.dependency_overrides.clear()
        assert resp.status_code == 200
        assert resp.json()["runs"] == []

    @pytest.mark.asyncio
    async def test_created_at_none_serializes_as_null(self, app):
        run_row = MagicMock()
        run_row.id = "run-2"
        run_row.workflow_id = "wf_x"
        run_row.status = "error"
        run_row.total_tokens = None
        run_row.duration_seconds = None
        run_row.created_at = None

        mock_db = _make_db_mock(rows=[run_row])
        from backend.api.auth_middleware import get_current_user
        from backend.db.engine import get_db

        app.dependency_overrides[get_current_user] = lambda: "u1"
        app.dependency_overrides[get_db] = lambda: mock_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get(
                "/api/pipelines/pipe-1/runs",
                headers={"Authorization": "Bearer fake"},
            )

        app.dependency_overrides.clear()
        assert resp.json()["runs"][0]["created_at"] is None


# ---------------------------------------------------------------------------
# PIPELINE_TEMPLATES unit tests (no HTTP, import directly)
# ---------------------------------------------------------------------------

class TestPipelineTemplatesModule:
    def test_module_exports_list(self):
        from backend.pipelines.templates import PIPELINE_TEMPLATES
        assert isinstance(PIPELINE_TEMPLATES, list)
        assert len(PIPELINE_TEMPLATES) == 3

    def test_research_synthesis_node_ids(self):
        from backend.pipelines.templates import PIPELINE_TEMPLATES
        tmpl = next(t for t in PIPELINE_TEMPLATES if t["id"] == "research-synthesis")
        node_ids = {n["id"] for n in tmpl["definition"]["nodes"]}
        assert "input-1" in node_ids
        assert "output-1" in node_ids
        assert "agent-searcher" in node_ids
        assert "agent-extractor" in node_ids
        assert "agent-analyst" in node_ids
        assert "agent-writer" in node_ids

    def test_research_synthesis_edge_ids(self):
        from backend.pipelines.templates import PIPELINE_TEMPLATES
        tmpl = next(t for t in PIPELINE_TEMPLATES if t["id"] == "research-synthesis")
        edge_ids = {e["id"] for e in tmpl["definition"]["edges"]}
        assert "e-input-searcher" in edge_ids
        assert "e-searcher-extractor" in edge_ids
        assert "e-extractor-analyst" in edge_ids
        assert "e-analyst-writer" in edge_ids
        assert "e-writer-output" in edge_ids

    def test_github_code_review_node_ids(self):
        from backend.pipelines.templates import PIPELINE_TEMPLATES
        tmpl = next(t for t in PIPELINE_TEMPLATES if t["id"] == "github-code-review")
        node_ids = {n["id"] for n in tmpl["definition"]["nodes"]}
        assert "agent-fetcher" in node_ids
        assert "agent-reviewer" in node_ids
        assert "agent-security-scanner" in node_ids
        assert "agent-summarizer" in node_ids

    def test_all_llm_agent_configs_have_required_fields(self):
        from backend.pipelines.templates import PIPELINE_TEMPLATES
        for tmpl in PIPELINE_TEMPLATES:
            for node in tmpl["definition"]["nodes"]:
                if node["kind"] == "llm_agent":
                    cfg = node["config"]
                    assert "name" in cfg, f"Missing 'name' in {node['id']}"
                    assert "system_prompt" in cfg, f"Missing 'system_prompt' in {node['id']}"
                    assert "model" in cfg, f"Missing 'model' in {node['id']}"
                    assert "temperature" in cfg, f"Missing 'temperature' in {node['id']}"
                    assert "mcp_servers" in cfg, f"Missing 'mcp_servers' in {node['id']}"

    def test_all_nodes_have_position(self):
        from backend.pipelines.templates import PIPELINE_TEMPLATES
        for tmpl in PIPELINE_TEMPLATES:
            for node in tmpl["definition"]["nodes"]:
                pos = node.get("position", {})
                assert "x" in pos and "y" in pos, f"Node {node['id']} missing position"

    def test_all_edges_have_source_and_target(self):
        from backend.pipelines.templates import PIPELINE_TEMPLATES
        for tmpl in PIPELINE_TEMPLATES:
            for edge in tmpl["definition"]["edges"]:
                assert "source" in edge
                assert "target" in edge

    def test_research_synthesis_model_is_gemini(self):
        from backend.pipelines.templates import PIPELINE_TEMPLATES
        tmpl = next(t for t in PIPELINE_TEMPLATES if t["id"] == "research-synthesis")
        for node in tmpl["definition"]["nodes"]:
            if node["kind"] == "llm_agent":
                assert node["config"]["model"] == "gemini-2.0-flash"
