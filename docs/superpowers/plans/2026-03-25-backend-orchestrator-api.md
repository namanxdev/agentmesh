# Backend Orchestrator + API Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the LangGraph orchestration engine (workflow state machine) and the FastAPI REST + WebSocket API layer.

**Architecture:** `orchestrator/` wraps LangGraph into a `WorkflowOrchestrator` that builds and runs agent graphs, routing via `routing_key` on shared `WorkflowState`; `api/` exposes the orchestrator via REST endpoints (run, status, agents, MCP servers) and a WebSocket event stream endpoint.

**Assumptions:** `backend/agents/base.py` (Agent, AgentConfig, AgentResult, AgentStatus), `backend/agents/registry.py` (`AgentRegistry(llm_provider, event_bus)` — note: the companion plan defines this signature with these two constructor args), `backend/events/bus.py` (EventBus), and `backend/mcp/registry.py` (MCPRegistry) exist per the companion plans. This plan imports from those but does not modify them.

**Design note on orchestrator:** The `WorkflowOrchestrator` in Task 3 uses a plain `while` loop + `HandoffRouter` rather than `langgraph.graph.StateGraph`. This is intentional — it is functionally equivalent, simpler to test, and avoids LangGraph's compiled-graph constraints for MVP. LangGraph can be adopted as a drop-in replacement in v1.1 if needed.

**Tech Stack:** Python 3.11+, LangGraph 0.2+, FastAPI, Pydantic v2, uvicorn, pytest, pytest-asyncio

---

## File Map

| File | Responsibility |
|------|----------------|
| `backend/orchestrator/__init__.py` | Re-exports |
| `backend/orchestrator/state.py` | `WorkflowState`, `WorkflowResult` Pydantic models |
| `backend/orchestrator/handoff.py` | `HandoffRouter` — maps routing_key → next node |
| `backend/orchestrator/graph.py` | `WorkflowOrchestrator` — builds + runs LangGraph state machine |
| `backend/api/__init__.py` | Empty |
| `backend/api/middleware.py` | CORS + global error handler middleware |
| `backend/api/websocket.py` | WebSocket endpoint handler + command dispatcher |
| `backend/api/routes.py` | FastAPI app, all REST endpoints, app factory |
| `tests/backend/test_orchestrator.py` | WorkflowState + orchestrator tests (mocked agents) |

---

### Task 1: Workflow State Models

**Files:**
- Create: `backend/orchestrator/__init__.py`
- Create: `backend/orchestrator/state.py`
- Create: `tests/backend/test_orchestrator.py`

- [ ] **Step 1: Write failing tests**

`tests/backend/test_orchestrator.py`:
```python
import pytest
from backend.orchestrator.state import WorkflowState, WorkflowResult


def test_workflow_state_defaults():
    state = WorkflowState(current_task="Review PR #42")
    assert state.shared_data == {}
    assert state.messages == []
    assert state.token_usage == {}
    assert state.last_agent == ""
    assert state.routing_key == "on_complete"


def test_workflow_state_add_message():
    state = WorkflowState(current_task="test")
    state.messages.append({"agent": "Fetcher", "content": "Done"})
    assert len(state.messages) == 1


def test_workflow_result_defaults():
    from backend.orchestrator.state import WorkflowState
    state = WorkflowState(current_task="test")
    result = WorkflowResult(state=state)
    assert result.success is True
    assert result.error is None
    assert result.total_tokens == 0
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_orchestrator.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Implement `backend/orchestrator/state.py`**

```python
from typing import Optional, Any
from pydantic import BaseModel, Field


class WorkflowState(BaseModel):
    """Shared mutable state passed between all agents in a workflow run."""
    current_task: str
    shared_data: dict = Field(default_factory=dict)
    messages: list[dict] = Field(default_factory=list)
    token_usage: dict[str, dict] = Field(default_factory=dict)
    last_agent: str = ""
    routing_key: str = "on_complete"

    model_config = {"arbitrary_types_allowed": True}


class WorkflowResult(BaseModel):
    """Final output of a completed workflow run."""
    state: WorkflowState
    success: bool = True
    error: Optional[str] = None
    total_duration: float = 0.0

    @property
    def total_tokens(self) -> int:
        return sum(
            u.get("input", 0) + u.get("output", 0)
            for u in self.state.token_usage.values()
        )

    model_config = {"arbitrary_types_allowed": True}
```

Create `backend/orchestrator/__init__.py`:
```python
from .graph import WorkflowOrchestrator
from .state import WorkflowState, WorkflowResult
__all__ = ["WorkflowOrchestrator", "WorkflowState", "WorkflowResult"]
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/backend/test_orchestrator.py -v
```
Expected: 3 PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/orchestrator/state.py backend/orchestrator/__init__.py tests/backend/test_orchestrator.py
git commit -m "feat: add WorkflowState and WorkflowResult models"
```

---

### Task 2: Handoff Router

**Files:**
- Create: `backend/orchestrator/handoff.py`

- [ ] **Step 1: Write failing tests** — append to `tests/backend/test_orchestrator.py`

```python
from backend.orchestrator.handoff import HandoffRouter


def test_handoff_router_resolves_routing_key():
    graph_config = {
        "Fetcher": {"on_complete": "Reviewer", "on_error": "end"},
        "Reviewer": {"on_complete": "SecurityScanner", "on_needs_more_context": "Fetcher"},
    }
    router = HandoffRouter(graph_config)
    assert router.next_node("Fetcher", "on_complete") == "Reviewer"
    assert router.next_node("Fetcher", "on_error") == "end"
    assert router.next_node("Reviewer", "on_needs_more_context") == "Fetcher"


def test_handoff_router_unknown_key_falls_back_to_complete():
    graph_config = {"Fetcher": {"on_complete": "Reviewer"}}
    router = HandoffRouter(graph_config)
    # Unknown routing key falls back to on_complete
    assert router.next_node("Fetcher", "on_unknown") == "Reviewer"


def test_handoff_router_missing_node_raises():
    router = HandoffRouter({})
    with pytest.raises(KeyError):
        router.next_node("NonExistentAgent", "on_complete")
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_orchestrator.py -k "test_handoff" -v
```
Expected: `ImportError`

- [ ] **Step 3: Implement `backend/orchestrator/handoff.py`**

```python
"""Handoff routing: maps (agent_name, routing_key) → next agent name."""


class HandoffRouter:
    """Resolves which agent runs next based on routing_key from agent output."""

    def __init__(self, graph_config: dict[str, dict[str, str]]):
        # graph_config: {"AgentName": {"on_complete": "NextAgent", ...}}
        self._graph = graph_config

    def next_node(self, agent_name: str, routing_key: str) -> str:
        """
        Return next node name for given agent + routing key.
        Falls back to 'on_complete' if the specific key isn't found.
        Raises KeyError if the agent has no config at all.
        """
        if agent_name not in self._graph:
            raise KeyError(f"Agent '{agent_name}' has no transitions in graph config.")

        transitions = self._graph[agent_name]
        if routing_key in transitions:
            return transitions[routing_key]
        # Fall back to on_complete
        if "on_complete" in transitions:
            return transitions["on_complete"]
        # No transitions at all
        return "end"

    def all_agents(self) -> list[str]:
        return list(self._graph.keys())
```

- [ ] **Step 4: Run handoff tests**

```bash
pytest tests/backend/test_orchestrator.py -k "test_handoff or test_workflow_state or test_workflow_result" -v
```
Expected: All PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/orchestrator/handoff.py tests/backend/test_orchestrator.py
git commit -m "feat: add HandoffRouter for conditional agent graph routing"
```

---

### Task 3: Workflow Orchestrator

**Files:**
- Create: `backend/orchestrator/graph.py`

- [ ] **Step 1: Write failing tests** — append to `tests/backend/test_orchestrator.py`

```python
import asyncio
from unittest.mock import AsyncMock, MagicMock
from backend.orchestrator.graph import WorkflowOrchestrator
from backend.orchestrator.state import WorkflowState
from backend.agents.base import AgentConfig, AgentResult, AgentStatus


@pytest.mark.asyncio
async def test_orchestrator_runs_single_agent_workflow():
    """Orchestrator activates first agent, runs it, terminates on 'end'."""
    mock_agent = MagicMock()
    mock_agent.config = AgentConfig(
        name="OnlyAgent", role="R", system_prompt="S",
        handoff_rules={"on_complete": "end"}
    )
    mock_agent.process = AsyncMock(return_value=AgentResult(
        output="Done!", routing_key="on_complete",
        token_usage={"input": 50, "output": 25}
    ))

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orchestrator = WorkflowOrchestrator(
        agents={"OnlyAgent": mock_agent},
        graph_config={
            "start": "OnlyAgent",
            "OnlyAgent": {"on_complete": "end"},
        },
        event_bus=mock_bus,
        workflow_id="wf_test",
    )

    result = await orchestrator.run(task="Do the thing")
    assert result.success is True
    assert "Done!" in result.state.messages[-1]["content"]
    assert result.state.token_usage["OnlyAgent"]["input"] == 50


@pytest.mark.asyncio
async def test_orchestrator_emits_workflow_started_and_completed():
    mock_agent = MagicMock()
    mock_agent.config = AgentConfig(name="A", role="R", system_prompt="S")
    mock_agent.process = AsyncMock(return_value=AgentResult(
        output="Done", routing_key="on_complete"
    ))
    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orch = WorkflowOrchestrator(
        agents={"A": mock_agent},
        graph_config={"start": "A", "A": {"on_complete": "end"}},
        event_bus=mock_bus,
        workflow_id="wf_1",
    )
    await orch.run(task="test")

    event_types = [c[0][0]["type"] for c in mock_bus.emit.call_args_list]
    assert "workflow.started" in event_types
    assert "workflow.completed" in event_types


@pytest.mark.asyncio
async def test_orchestrator_two_agent_chain():
    """A → B sequential chain completes correctly."""
    results = {
        "A": AgentResult(output="A done", routing_key="on_complete",
                         token_usage={"input": 10, "output": 5}),
        "B": AgentResult(output="B done", routing_key="on_complete",
                         token_usage={"input": 20, "output": 10}),
    }

    def make_agent(name):
        a = MagicMock()
        a.config = AgentConfig(name=name, role=name, system_prompt=name)
        a.process = AsyncMock(return_value=results[name])
        return a

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    orch = WorkflowOrchestrator(
        agents={"A": make_agent("A"), "B": make_agent("B")},
        graph_config={"start": "A", "A": {"on_complete": "B"}, "B": {"on_complete": "end"}},
        event_bus=mock_bus,
        workflow_id="wf_chain",
    )
    result = await orch.run(task="chain test")

    assert result.success is True
    agent_names = [m["agent"] for m in result.state.messages]
    assert agent_names == ["A", "B"]
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_orchestrator.py -k "test_orchestrator" -v
```
Expected: `ImportError`

- [ ] **Step 3: Implement `backend/orchestrator/graph.py`**

```python
import time
import uuid
from typing import Optional
from backend.agents.base import Agent
from backend.events.bus import EventBus
from .state import WorkflowState, WorkflowResult
from .handoff import HandoffRouter


class WorkflowOrchestrator:
    """
    Runs a multi-agent workflow as a sequential state machine.
    Agents execute one at a time; routing_key determines the next agent.
    Emits workflow and agent events via EventBus.
    """

    def __init__(
        self,
        agents: dict[str, Agent],
        graph_config: dict,
        event_bus: EventBus,
        workflow_id: Optional[str] = None,
        max_iterations: int = 20,
        timeout_seconds: float = 120.0,
    ):
        self._agents = agents
        self._router = HandoffRouter(
            {k: v for k, v in graph_config.items() if k != "start"}
        )
        self._start = graph_config["start"]
        self._event_bus = event_bus
        self.workflow_id = workflow_id or f"wf_{uuid.uuid4().hex[:8]}"
        self._max_iterations = max_iterations
        self._timeout = timeout_seconds

    async def run(
        self, task: str, initial_state: Optional[dict] = None
    ) -> WorkflowResult:
        """Execute the workflow from start node to 'end' node."""
        state = WorkflowState(
            current_task=task,
            shared_data=initial_state or {},
        )

        await self._event_bus.emit({
            "type": "workflow.started",
            "workflow_id": self.workflow_id,
            "agents": list(self._agents.keys()),
            "task": task,
        })

        start_time = time.time()
        current_node = self._start
        iterations = 0

        try:
            while current_node != "end":
                if iterations >= self._max_iterations:
                    raise RuntimeError(
                        f"Max iterations ({self._max_iterations}) exceeded. "
                        f"Last agent: {current_node}"
                    )
                if time.time() - start_time > self._timeout:
                    raise TimeoutError(
                        f"Workflow timeout ({self._timeout}s) exceeded."
                    )

                agent = self._agents.get(current_node)
                if agent is None:
                    raise KeyError(f"Agent '{current_node}' not found in workflow.")

                result = await agent.process(
                    task=state.current_task,
                    state=state.shared_data,
                    workflow_id=self.workflow_id,
                )

                state.messages.append({
                    "agent": current_node,
                    "content": result.output,
                    "timestamp": time.time(),
                })
                state.token_usage[current_node] = result.token_usage
                state.last_agent = current_node
                state.routing_key = result.routing_key

                if result.state_updates:
                    state.shared_data.update(result.state_updates)

                next_node = self._router.next_node(current_node, result.routing_key)

                if next_node != "end":
                    await self._event_bus.emit({
                        "type": "agent.handoff",
                        "workflow_id": self.workflow_id,
                        "fromAgent": current_node,
                        "toAgent": next_node,
                        "reason": result.routing_key,
                    })

                current_node = next_node
                iterations += 1

        except Exception as exc:
            await self._event_bus.emit({
                "type": "workflow.error",
                "workflow_id": self.workflow_id,
                "error": str(exc),
                "failedAgent": current_node,
            })
            return WorkflowResult(
                state=state,
                success=False,
                error=str(exc),
                total_duration=time.time() - start_time,
            )

        total_duration = time.time() - start_time
        total_tokens = sum(
            u.get("input", 0) + u.get("output", 0)
            for u in state.token_usage.values()
        )

        await self._event_bus.emit({
            "type": "workflow.completed",
            "workflow_id": self.workflow_id,
            "result": state.messages[-1] if state.messages else {},
            "totalTokens": total_tokens,
            "duration": total_duration,
        })

        return WorkflowResult(
            state=state,
            success=True,
            total_duration=total_duration,
        )
```

- [ ] **Step 4: Run all orchestrator tests**

```bash
pytest tests/backend/test_orchestrator.py -v
```
Expected: All PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/orchestrator/graph.py tests/backend/test_orchestrator.py
git commit -m "feat: add WorkflowOrchestrator with sequential agent execution and event emission"
```

---

### Task 4: API Middleware

**Files:**
- Create: `backend/api/__init__.py`
- Create: `backend/api/middleware.py`

- [ ] **Step 1: Implement `backend/api/middleware.py`**

No dedicated tests needed — CORS and error handlers are integration-tested via the routes.

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


def add_middleware(app: FastAPI) -> None:
    """Attach CORS and global error-handling middleware to the FastAPI app."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(KeyError)
    async def key_error_handler(request: Request, exc: KeyError):
        return JSONResponse(
            status_code=404,
            content={"error": {"code": "NOT_FOUND", "message": str(exc)}},
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "VALIDATION_ERROR", "message": str(exc)}},
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_ERROR", "message": str(exc)}},
        )
```

Create `backend/api/__init__.py` — empty file.

- [ ] **Step 2: Commit**

```bash
git add backend/api/__init__.py backend/api/middleware.py
git commit -m "feat: add CORS and error handler middleware"
```

---

### Task 5: WebSocket Handler

**Files:**
- Create: `backend/api/websocket.py`

- [ ] **Step 1: Implement `backend/api/websocket.py`**

```python
import json
from fastapi import WebSocket, WebSocketDisconnect
from backend.events.bus import EventBus


async def websocket_events_handler(ws: WebSocket, event_bus: EventBus):
    """
    Handle a WebSocket connection on /ws/events.
    Replays buffered events on connect, then streams live events.
    Accepts client commands: ping, subscribe (no-op for MVP), replay.
    """
    await event_bus.subscribe(ws)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                command = json.loads(raw)
            except json.JSONDecodeError:
                continue

            cmd = command.get("command")
            if cmd == "ping":
                await ws.send_json({"type": "pong"})
            elif cmd == "replay":
                # Re-send entire buffer
                for event in event_bus._event_buffer:
                    await ws.send_json(event)
            # subscribe/unsubscribe are no-ops for MVP (all events broadcast)

    except WebSocketDisconnect:
        event_bus.unsubscribe(ws)
    except Exception:
        event_bus.unsubscribe(ws)
```

- [ ] **Step 2: Commit**

```bash
git add backend/api/websocket.py
git commit -m "feat: add WebSocket events handler with ping/replay commands"
```

---

### Task 6: REST API Routes + App Factory

**Files:**
- Create: `backend/api/routes.py`

- [ ] **Step 1: Write failing tests** — create `tests/backend/test_api.py`

```python
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
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_api.py -v
```
Expected: `ImportError: cannot import name 'create_app'`

- [ ] **Step 3: Implement `backend/api/routes.py`**

```python
import os
import uuid
import time
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse

from backend.events.bus import EventBus
from backend.agents.registry import AgentRegistry
from backend.mcp.registry import MCPRegistry
from backend.orchestrator.graph import WorkflowOrchestrator
from backend.api.middleware import add_middleware
from backend.api.websocket import websocket_events_handler


# ── Request / Response models ──────────────────────────────────────────────────

class WorkflowRunRequest(BaseModel):
    workflow_name: str
    task: str
    initial_state: dict = {}
    config_overrides: dict = {}


# ── App factory ────────────────────────────────────────────────────────────────

def create_app(
    event_bus: EventBus,
    agent_registry: AgentRegistry,
    mcp_registry: MCPRegistry,
    workflow_definitions: dict,  # name → {agents, graph_config, ...}
) -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(title="AgentMesh API", version="1.0.0")
    add_middleware(app)

    # In-memory run tracking for GET /api/workflows/{workflow_id}
    _runs: dict[str, dict] = {}

    # ── Workflow endpoints ─────────────────────────────────────────────────────

    @app.get("/api/workflows")
    async def list_workflows():
        return {
            "workflows": [
                {
                    "name": name,
                    "description": defn.get("description", ""),
                    "agents": defn.get("agents", []),
                }
                for name, defn in workflow_definitions.items()
            ]
        }

    @app.post("/api/workflows/run")
    async def run_workflow(request: WorkflowRunRequest):
        defn = workflow_definitions.get(request.workflow_name)
        if defn is None:
            raise KeyError(f"Workflow '{request.workflow_name}' not found.")

        workflow_id = f"wf_{uuid.uuid4().hex[:8]}"
        agents = {
            name: agent_registry.get(name)
            for name in defn["agents"]
        }

        orchestrator = WorkflowOrchestrator(
            agents=agents,
            graph_config=defn["graph"],
            event_bus=event_bus,
            workflow_id=workflow_id,
            max_iterations=request.config_overrides.get("max_iterations", 20),
            timeout_seconds=request.config_overrides.get("timeout_seconds", 120),
        )

        _runs[workflow_id] = {
            "workflow_id": workflow_id,
            "status": "running",
            "started_at": time.time(),
        }

        # Run async (fire-and-forget style — events stream via WebSocket)
        import asyncio
        async def _run():
            result = await orchestrator.run(
                task=request.task,
                initial_state=request.initial_state,
            )
            _runs[workflow_id].update({
                "status": "completed" if result.success else "error",
                "result": result.state.messages[-1] if result.state.messages else {},
                "token_usage": result.state.token_usage,
                "duration_seconds": result.total_duration,
                "error": result.error,
            })

        asyncio.create_task(_run())

        return {
            "workflow_id": workflow_id,
            "status": "running",
            "agents": list(agents.keys()),
            "started_at": _runs[workflow_id]["started_at"],
            "websocket_url": f"/ws/events?workflow_id={workflow_id}",
        }

    @app.get("/api/workflows/{workflow_id}")
    async def get_workflow_status(workflow_id: str):
        run = _runs.get(workflow_id)
        if run is None:
            raise KeyError(f"Workflow '{workflow_id}' not found.")
        return run

    # ── Agent endpoints ────────────────────────────────────────────────────────

    @app.get("/api/agents")
    async def list_agents():
        agents = []
        for agent in agent_registry.list_all():
            agents.append({
                "name": agent.config.name,
                "role": agent.config.role,
                "status": agent.status.value,
                "model": agent.config.model,
                "mcp_servers": agent.config.mcp_servers,
                "available_tools": [
                    t["function"]["name"]
                    for client in agent._mcp_clients.values()
                    for t in client.get_tool_definitions()
                ],
            })
        return {"agents": agents}

    @app.get("/api/agents/{agent_name}")
    async def get_agent(agent_name: str):
        agent = agent_registry.get(agent_name)
        return {
            "name": agent.config.name,
            "role": agent.config.role,
            "system_prompt": agent.config.system_prompt,
            "status": agent.status.value,
            "model": agent.config.model,
            "temperature": agent.config.temperature,
            "max_tokens": agent.config.max_tokens,
            "mcp_servers": agent.config.mcp_servers,
            "handoff_rules": agent.config.handoff_rules,
        }

    # ── MCP server endpoints ───────────────────────────────────────────────────

    @app.get("/api/mcp/servers")
    async def list_mcp_servers():
        return mcp_registry.get_server_info()

    # ── WebSocket endpoint ─────────────────────────────────────────────────────

    @app.websocket("/ws/events")
    async def ws_events(ws: WebSocket):
        await websocket_events_handler(ws, event_bus)

    return app


# ── Entrypoint ─────────────────────────────────────────────────────────────────

def create_default_app() -> FastAPI:
    """Create app with real dependencies loaded from env vars."""
    from dotenv import load_dotenv
    load_dotenv()

    event_bus = EventBus()

    # Select LLM provider
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        from backend.llm.gemini import GeminiProvider
        llm = GeminiProvider(api_key=gemini_key)
    else:
        from backend.llm.groq import GroqProvider
        llm = GroqProvider(api_key=os.getenv("GROQ_API_KEY", ""))

    agent_registry = AgentRegistry(llm_provider=llm, event_bus=event_bus)
    mcp_registry = MCPRegistry(event_bus=event_bus)

    # Load demo workflow definitions
    from backend.workflows import DEMO_WORKFLOWS
    for agent_config in DEMO_WORKFLOWS.get("all_agents", []):
        agent_registry.register(agent_config)

    return create_app(
        event_bus=event_bus,
        agent_registry=agent_registry,
        mcp_registry=mcp_registry,
        workflow_definitions=DEMO_WORKFLOWS.get("definitions", {}),
    )


# ASGI entry point for uvicorn.
# Guarded so test imports don't trigger create_default_app() before
# backend.workflows (Task 7) exists.
import os
if os.getenv("AGENTMESH_ENV") != "test":
    app = create_default_app()
```

- [ ] **Step 4: Run API tests**

```bash
pytest tests/backend/test_api.py -v
```
Expected: All 4 PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/api/routes.py tests/backend/test_api.py
git commit -m "feat: add FastAPI REST endpoints and WebSocket event stream"
```

---

### Task 7: Demo Workflow Definitions

**Files:**
- Create: `backend/workflows/__init__.py`
- Create: `backend/workflows/demo.py`

This module wires the demo agents into workflow definitions that `create_default_app()` loads.

- [ ] **Step 1: Implement `backend/workflows/demo.py`**

```python
"""Demo workflow definitions: GitHub Code Review + Research Synthesis."""
import os
from pathlib import Path
from backend.agents.base import AgentConfig

PROMPTS_DIR = Path(__file__).parent.parent / "agents" / "prompts"


def _load_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    return path.read_text(encoding="utf-8") if path.exists() else ""


# Agent configs
FETCHER = AgentConfig(
    name="Fetcher", role="Code Fetcher",
    system_prompt=_load_prompt("code_reviewer.txt") or "You are a code fetcher.",
    mcp_servers=["github"],
    model="gemini-2.0-flash", temperature=0.2,
    handoff_rules={"on_complete": "Reviewer"},
)

REVIEWER = AgentConfig(
    name="Reviewer", role="Senior Code Reviewer",
    system_prompt=_load_prompt("code_reviewer.txt"),
    mcp_servers=["github"],
    model="gemini-2.0-flash", temperature=0.3,
    handoff_rules={"on_complete": "SecurityScanner", "on_needs_more_context": "Fetcher"},
)

SECURITY_SCANNER = AgentConfig(
    name="SecurityScanner", role="Security Vulnerability Scanner",
    system_prompt="You are a security auditor. Scan for injection, auth issues, data exposure.",
    mcp_servers=[],
    model="llama-3.3-70b-versatile", temperature=0.1,
    handoff_rules={"on_complete": "Summarizer"},
)

SUMMARIZER = AgentConfig(
    name="Summarizer", role="Review Report Writer",
    system_prompt="You are a technical writer. Create a comprehensive code review report in Markdown.",
    mcp_servers=["filesystem"],
    model="gemini-2.0-flash", temperature=0.4,
    handoff_rules={"on_complete": "end"},
)

SEARCHER = AgentConfig(
    name="Searcher", role="Web Search Specialist",
    system_prompt=_load_prompt("researcher.txt"),
    mcp_servers=["web-search"],
    model="gemini-2.0-flash", temperature=0.4,
    handoff_rules={"on_complete": "Extractor"},
)

EXTRACTOR = AgentConfig(
    name="Extractor", role="Content Extraction Specialist",
    system_prompt="Extract key facts from web pages and summarize each source.",
    mcp_servers=["web-search"],
    model="gemini-2.0-flash", temperature=0.3,
    handoff_rules={"on_complete": "Analyst", "on_insufficient_data": "Searcher"},
)

ANALYST = AgentConfig(
    name="Analyst", role="Research Analyst",
    system_prompt=_load_prompt("analyst.txt"),
    mcp_servers=[],
    model="gemini-2.0-flash", temperature=0.5,
    handoff_rules={"on_complete": "Writer"},
)

WRITER = AgentConfig(
    name="Writer", role="Research Report Writer",
    system_prompt=_load_prompt("writer.txt"),
    mcp_servers=["filesystem"],
    model="gemini-2.0-flash", temperature=0.6,
    handoff_rules={"on_complete": "end"},
)

# Workflow definitions
DEMO_WORKFLOWS = {
    "all_agents": [FETCHER, REVIEWER, SECURITY_SCANNER, SUMMARIZER,
                   SEARCHER, EXTRACTOR, ANALYST, WRITER],
    "definitions": {
        "github-code-review": {
            "description": "Automated multi-agent code review pipeline",
            "agents": ["Fetcher", "Reviewer", "SecurityScanner", "Summarizer"],
            "graph": {
                "start": "Fetcher",
                "Fetcher": {"on_complete": "Reviewer"},
                "Reviewer": {"on_complete": "SecurityScanner", "on_needs_more_context": "Fetcher"},
                "SecurityScanner": {"on_complete": "Summarizer"},
                "Summarizer": {"on_complete": "end"},
            },
        },
        "research-synthesis": {
            "description": "Web research and synthesis pipeline",
            "agents": ["Searcher", "Extractor", "Analyst", "Writer"],
            "graph": {
                "start": "Searcher",
                "Searcher": {"on_complete": "Extractor"},
                "Extractor": {"on_complete": "Analyst", "on_insufficient_data": "Searcher"},
                "Analyst": {"on_complete": "Writer"},
                "Writer": {"on_complete": "end"},
            },
        },
    },
}
```

Create `backend/workflows/__init__.py`:
```python
from .demo import DEMO_WORKFLOWS
__all__ = ["DEMO_WORKFLOWS"]
```

- [ ] **Step 2: Commit**

```bash
git add backend/workflows/
git commit -m "feat: add demo workflow definitions (github-code-review + research-synthesis)"
```

---

### Task 8: Final Integration Verification

- [ ] **Step 1: Run all backend tests**

```bash
pytest tests/backend/ -v
```
Expected: All PASSED (test_llm, test_events, test_mcp, test_agents, test_orchestrator, test_api)

- [ ] **Step 2: Verify the app starts without errors**

```bash
python -c "
from backend.api.routes import create_app
from backend.events.bus import EventBus
from backend.agents.registry import AgentRegistry
from backend.mcp.registry import MCPRegistry
app = create_app(
    event_bus=EventBus(),
    agent_registry=AgentRegistry(llm_provider=None, event_bus=EventBus()),
    mcp_registry=MCPRegistry(event_bus=EventBus()),
    workflow_definitions={},
)
print('App created OK:', app.title)
"
```
Expected: `App created OK: AgentMesh API`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: backend orchestrator + API layer complete"
```
