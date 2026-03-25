import os
import pytest

os.environ["AGENTMESH_ENV"] = "test"

from backend.pipelines.validator import validate_pipeline, pipeline_to_workflow_config


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _make_node(nid: str, kind: str, config: dict | None = None) -> dict:
    return {"id": nid, "kind": kind, "config": config or {}}


def _make_edge(eid: str, src: str, tgt: str) -> dict:
    return {"id": eid, "source": src, "target": tgt}


# ---------------------------------------------------------------------------
# validate_pipeline — structural checks
# ---------------------------------------------------------------------------

class TestValidatePipelineStructural:
    def test_minimal_valid_pipeline(self):
        nodes = [_make_node("n1", "input"), _make_node("n2", "output")]
        edges = [_make_edge("e1", "n1", "n2")]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is True
        assert result["errors"] == []
        assert result["num_nodes"] == 2
        assert result["num_edges"] == 1

    def test_missing_input_node(self):
        nodes = [_make_node("n1", "output")]
        edges = []
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is False
        assert any("input" in e for e in result["errors"])

    def test_missing_output_node(self):
        nodes = [_make_node("n1", "input")]
        edges = []
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is False
        assert any("output" in e for e in result["errors"])

    def test_multiple_input_nodes(self):
        nodes = [
            _make_node("n1", "input"),
            _make_node("n2", "input"),
            _make_node("n3", "output"),
        ]
        edges = [_make_edge("e1", "n1", "n3"), _make_edge("e2", "n2", "n3")]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is False
        assert any("2" in e and "input" in e for e in result["errors"])

    def test_multiple_output_nodes(self):
        nodes = [
            _make_node("n1", "input"),
            _make_node("n2", "output"),
            _make_node("n3", "output"),
        ]
        edges = [_make_edge("e1", "n1", "n2"), _make_edge("e2", "n1", "n3")]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is False
        assert any("2" in e and "output" in e for e in result["errors"])

    def test_edge_with_unknown_node(self):
        nodes = [_make_node("n1", "input"), _make_node("n2", "output")]
        edges = [_make_edge("e1", "n1", "GHOST")]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is False
        assert any("unknown node" in e for e in result["errors"])


# ---------------------------------------------------------------------------
# validate_pipeline — cycle detection
# ---------------------------------------------------------------------------

class TestValidatePipelineCycleDetection:
    def test_cycle_detected(self):
        nodes = [
            _make_node("n1", "input"),
            _make_node("n2", "llm_agent"),
            _make_node("n3", "llm_agent"),
            _make_node("n4", "output"),
        ]
        edges = [
            _make_edge("e1", "n1", "n2"),
            _make_edge("e2", "n2", "n3"),
            _make_edge("e3", "n3", "n2"),  # cycle
            _make_edge("e4", "n3", "n4"),
        ]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is False
        assert any("Cycle" in e for e in result["errors"])

    def test_no_cycle_linear(self):
        nodes = [
            _make_node("n1", "input"),
            _make_node("n2", "llm_agent", {"name": "A", "system_prompt": ""}),
            _make_node("n3", "output"),
        ]
        edges = [
            _make_edge("e1", "n1", "n2"),
            _make_edge("e2", "n2", "n3"),
        ]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is True
        assert result["errors"] == []


# ---------------------------------------------------------------------------
# validate_pipeline — connectivity checks
# ---------------------------------------------------------------------------

class TestValidatePipelineConnectivity:
    def test_disconnected_agent_no_incoming(self):
        nodes = [
            _make_node("n1", "input"),
            _make_node("n2", "llm_agent", {"name": "A", "system_prompt": ""}),
            _make_node("n3", "llm_agent", {"name": "B", "system_prompt": ""}),
            _make_node("n4", "output"),
        ]
        # n3 has no incoming edge
        edges = [
            _make_edge("e1", "n1", "n2"),
            _make_edge("e2", "n2", "n4"),
        ]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is False
        assert any("n3" in e and "no incoming" in e for e in result["errors"])

    def test_disconnected_agent_no_outgoing(self):
        nodes = [
            _make_node("n1", "input"),
            _make_node("n2", "llm_agent", {"name": "A", "system_prompt": ""}),
            _make_node("n3", "output"),
        ]
        # n2 has no outgoing edge
        edges = [
            _make_edge("e1", "n1", "n2"),
        ]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is False
        assert any("n2" in e and "no outgoing" in e for e in result["errors"])

    def test_router_with_single_outgoing_edge(self):
        nodes = [
            _make_node("n1", "input"),
            _make_node("n2", "llm_agent", {"name": "A", "system_prompt": ""}),
            _make_node("n3", "router", {"conditions": []}),
            _make_node("n4", "output"),
        ]
        edges = [
            _make_edge("e1", "n1", "n2"),
            _make_edge("e2", "n2", "n3"),
            _make_edge("e3", "n3", "n4"),  # only 1 outgoing
        ]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is False
        assert any("Router" in e and "n3" in e for e in result["errors"])

    def test_router_with_two_outgoing_edges_passes(self):
        nodes = [
            _make_node("n1", "input"),
            _make_node("n2", "llm_agent", {"name": "A", "system_prompt": ""}),
            _make_node("n3", "router", {"conditions": []}),
            _make_node("n4", "llm_agent", {"name": "B", "system_prompt": ""}),
            _make_node("n5", "output"),
        ]
        edges = [
            _make_edge("e1", "n1", "n2"),
            _make_edge("e2", "n2", "n3"),
            _make_edge("e3", "n3", "n4"),
            _make_edge("e4", "n3", "n5"),
            _make_edge("e5", "n4", "n5"),
        ]
        result = validate_pipeline(nodes, edges)
        assert result["is_dag"] is True
        assert result["errors"] == []


# ---------------------------------------------------------------------------
# validate_pipeline — return shape
# ---------------------------------------------------------------------------

class TestValidatePipelineReturnShape:
    def test_return_keys_present(self):
        result = validate_pipeline(
            [_make_node("n1", "input"), _make_node("n2", "output")],
            [_make_edge("e1", "n1", "n2")],
        )
        assert set(result.keys()) == {"num_nodes", "num_edges", "is_dag", "errors"}

    def test_is_dag_false_when_errors_present(self):
        # Empty pipeline — no input or output nodes
        result = validate_pipeline([], [])
        assert result["is_dag"] is False
        assert len(result["errors"]) > 0


# ---------------------------------------------------------------------------
# pipeline_to_workflow_config
# ---------------------------------------------------------------------------

class TestPipelineToWorkflowConfig:
    """Unit tests for pipeline_to_workflow_config."""

    def _make_llm_node(self, nid: str, name: str, system_prompt: str = "You help.") -> dict:
        return {
            "id": nid,
            "kind": "llm_agent",
            "config": {
                "name": name,
                "system_prompt": system_prompt,
                "model": "gemini-2.0-flash",
                "temperature": 0.5,
            },
        }

    def _make_registry_and_bus(self):
        from unittest.mock import MagicMock
        from backend.events.bus import EventBus
        mock_llm = MagicMock()
        event_bus = EventBus()
        return mock_llm, event_bus

    def test_single_agent_pipeline(self):
        mock_llm, event_bus = self._make_registry_and_bus()
        nodes = [
            _make_node("n1", "input", {"description": "Summarise this"}),
            self._make_llm_node("n2", "summariser"),
            _make_node("n3", "output"),
        ]
        edges = [
            _make_edge("e1", "n1", "n2"),
            _make_edge("e2", "n2", "n3"),
        ]
        definition = {"name": "test", "nodes": nodes, "edges": edges}
        result = pipeline_to_workflow_config(definition, mock_llm, event_bus)

        assert result["task"] == "Summarise this"
        assert result["graph_config"]["start"] == "summariser"
        assert result["graph_config"]["summariser"] == {"on_complete": "end"}
        reg = result["agent_registry"]
        agent = reg.get("summariser")
        assert agent.config.name == "summariser"
        assert agent.config.model == "gemini-2.0-flash"
        assert agent.config.temperature == 0.5

    def test_two_agent_pipeline_in_series(self):
        mock_llm, event_bus = self._make_registry_and_bus()
        nodes = [
            _make_node("n1", "input"),
            self._make_llm_node("n2", "first"),
            self._make_llm_node("n3", "second"),
            _make_node("n4", "output"),
        ]
        edges = [
            _make_edge("e1", "n1", "n2"),
            _make_edge("e2", "n2", "n3"),
            _make_edge("e3", "n3", "n4"),
        ]
        definition = {"name": "test", "nodes": nodes, "edges": edges}
        result = pipeline_to_workflow_config(definition, mock_llm, event_bus)

        gc = result["graph_config"]
        assert gc["start"] == "first"
        assert gc["first"] == {"on_complete": "second"}
        assert gc["second"] == {"on_complete": "end"}

    def test_default_task_when_no_input_description(self):
        mock_llm, event_bus = self._make_registry_and_bus()
        nodes = [
            _make_node("n1", "input", {}),
            self._make_llm_node("n2", "agent"),
            _make_node("n3", "output"),
        ]
        edges = [_make_edge("e1", "n1", "n2"), _make_edge("e2", "n2", "n3")]
        definition = {"name": "test", "nodes": nodes, "edges": edges}
        result = pipeline_to_workflow_config(definition, mock_llm, event_bus)
        assert result["task"] == "Execute pipeline"

    def test_text_node_prepended_to_downstream_agent_system_prompt(self):
        mock_llm, event_bus = self._make_registry_and_bus()
        nodes = [
            _make_node("n1", "input"),
            _make_node("n2", "text", {"content": "You are a poet."}),
            self._make_llm_node("n3", "poet", "Write poems."),
            _make_node("n4", "output"),
        ]
        edges = [
            _make_edge("e1", "n1", "n2"),
            _make_edge("e2", "n2", "n3"),
            _make_edge("e3", "n3", "n4"),
        ]
        definition = {"name": "test", "nodes": nodes, "edges": edges}
        result = pipeline_to_workflow_config(definition, mock_llm, event_bus)

        agent = result["agent_registry"].get("poet")
        assert agent.config.system_prompt.startswith("You are a poet.\n\n")
        assert "Write poems." in agent.config.system_prompt

    def test_tool_node_attaches_mcp_server_to_upstream_agent(self):
        mock_llm, event_bus = self._make_registry_and_bus()
        nodes = [
            _make_node("n1", "input"),
            self._make_llm_node("n2", "searcher"),
            _make_node("n3", "tool", {"server": "brave_search"}),
            _make_node("n4", "output"),
        ]
        edges = [
            _make_edge("e1", "n1", "n2"),
            _make_edge("e2", "n2", "n3"),
            _make_edge("e3", "n3", "n4"),
        ]
        definition = {"name": "test", "nodes": nodes, "edges": edges}
        result = pipeline_to_workflow_config(definition, mock_llm, event_bus)

        agent = result["agent_registry"].get("searcher")
        assert "brave_search" in agent.config.mcp_servers

    def test_empty_agent_pipeline_returns_empty_graph(self):
        mock_llm, event_bus = self._make_registry_and_bus()
        nodes = [_make_node("n1", "input"), _make_node("n2", "output")]
        edges = [_make_edge("e1", "n1", "n2")]
        definition = {"name": "test", "nodes": nodes, "edges": edges}
        result = pipeline_to_workflow_config(definition, mock_llm, event_bus)
        assert result["graph_config"] == {}


# ---------------------------------------------------------------------------
# Pipeline API endpoints
# ---------------------------------------------------------------------------

class TestPipelineAPIEndpoints:
    @pytest.fixture
    def app(self):
        from unittest.mock import MagicMock
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

    @pytest.mark.asyncio
    async def test_validate_valid_pipeline(self, app):
        from httpx import AsyncClient, ASGITransport
        payload = {
            "name": "test",
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
    async def test_validate_invalid_pipeline_returns_errors(self, app):
        from httpx import AsyncClient, ASGITransport
        # No input node, no output node
        payload = {
            "name": "bad",
            "nodes": [
                {"id": "n1", "kind": "llm_agent", "config": {"name": "a", "system_prompt": ""}, "position": {"x": 0, "y": 0}},
            ],
            "edges": [],
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/pipelines/validate", json=payload)
        assert resp.status_code == 200
        body = resp.json()
        assert body["is_dag"] is False
        assert len(body["errors"]) > 0

    @pytest.mark.asyncio
    async def test_run_pipeline_invalid_returns_422(self, app):
        from httpx import AsyncClient, ASGITransport
        # Cyclic pipeline
        payload = {
            "pipeline": {
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
            },
            "task": "do something",
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/pipelines/run", json=payload)
        assert resp.status_code == 422
        body = resp.json()
        assert "errors" in body["detail"]
