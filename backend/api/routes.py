import os
import uuid
import time
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, WebSocket, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from backend.events.bus import EventBus
from backend.agents.registry import AgentRegistry
from backend.mcp.registry import MCPRegistry
from backend.orchestrator.graph import WorkflowOrchestrator
from backend.llm.base import BaseLLMProvider
from backend.api.middleware import add_middleware
from backend.api.websocket import websocket_events_handler
from backend.api.auth_middleware import get_current_user as get_current_user_dep
from backend.db.engine import get_db


# -- Request / Response models ------------------------------------------------

class WorkflowRunRequest(BaseModel):
    workflow_name: str
    task: str
    initial_state: dict = {}
    config_overrides: dict = {}


class PipelineNodeModel(BaseModel):
    id: str
    kind: str
    config: dict
    position: dict


class PipelineEdgeModel(BaseModel):
    id: str
    source: str
    target: str
    source_handle: Optional[str] = Field(None, alias="sourceHandle")
    target_handle: Optional[str] = Field(None, alias="targetHandle")

    model_config = {"populate_by_name": True}


class PipelineDefinitionModel(BaseModel):
    name: str
    nodes: list[PipelineNodeModel]
    edges: list[PipelineEdgeModel]


class PipelineRunRequest(BaseModel):
    pipeline: PipelineDefinitionModel
    task: str
    initial_state: dict = {}


# -- App factory --------------------------------------------------------------

def create_app(
    event_bus: EventBus,
    agent_registry: AgentRegistry,
    mcp_registry: MCPRegistry,
    workflow_definitions: dict,  # name -> {agents, graph_config, ...}
    llm_provider: BaseLLMProvider = None,
) -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(title="AgentMesh API", version="1.0.0")
    add_middleware(app)

    from backend.api.keys import router as keys_router
    app.include_router(keys_router)

    # In-memory run tracking for GET /api/workflows/{workflow_id}
    _runs: dict[str, dict] = {}

    # -- Workflow endpoints ----------------------------------------------------

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

    # -- Agent endpoints -------------------------------------------------------

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

    # -- MCP server endpoints --------------------------------------------------

    @app.get("/api/mcp/servers")
    async def list_mcp_servers():
        return mcp_registry.get_server_info()

    # -- Pipeline endpoints ----------------------------------------------------

    @app.post("/api/pipelines/validate")
    async def validate_pipeline_endpoint(definition: PipelineDefinitionModel):
        from backend.pipelines.validator import validate_pipeline
        nodes = [{"id": n.id, "kind": n.kind, "config": n.config} for n in definition.nodes]
        edges = [{"id": e.id, "source": e.source, "target": e.target} for e in definition.edges]
        return validate_pipeline(nodes, edges)

    @app.post("/api/pipelines/run")
    async def run_pipeline_endpoint(
        request: PipelineRunRequest,
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        from backend.pipelines.validator import validate_pipeline, pipeline_to_workflow_config
        from backend.crypto import decrypt
        from backend.llm.multi import MultiProvider
        import asyncio

        # Fetch and decrypt user's API keys
        result = await db.execute(
            text("SELECT provider, encrypted_key FROM api_keys WHERE user_id = :uid"),
            {"uid": user_id},
        )
        rows = result.fetchall()
        if not rows:
            raise HTTPException(
                status_code=403,
                detail={"error": "no_keys", "message": "No API keys saved. Add your keys in Settings."},
            )

        providers: dict[str, BaseLLMProvider] = {}
        for row in rows:
            try:
                api_key = decrypt(row.encrypted_key)
            except Exception:
                continue
            if row.provider == "gemini":
                from backend.llm.gemini import GeminiProvider
                providers["gemini"] = GeminiProvider(api_key=api_key)
            elif row.provider == "groq":
                from backend.llm.groq import GroqProvider
                providers["groq"] = GroqProvider(api_key=api_key)
            elif row.provider == "openai":
                from backend.llm.openai_provider import OpenAIProvider
                providers["openai"] = OpenAIProvider(api_key=api_key)

        user_llm = MultiProvider(providers)

        defn = request.pipeline
        nodes = [{"id": n.id, "kind": n.kind, "config": n.config} for n in defn.nodes]
        edges = [
            {"id": e.id, "source": e.source, "target": e.target,
             "source_handle": e.source_handle, "target_handle": e.target_handle}
            for e in defn.edges
        ]

        validation = validate_pipeline(nodes, edges)
        if not validation["is_dag"]:
            raise HTTPException(status_code=422, detail={"errors": validation["errors"]})

        defn_dict = {
            "name": defn.name,
            "nodes": [{"id": n.id, "kind": n.kind, "config": n.config} for n in defn.nodes],
            "edges": edges,
        }

        config = pipeline_to_workflow_config(defn_dict, user_llm, event_bus)
        agent_reg = config["agent_registry"]
        graph_cfg = config["graph_config"]
        task = request.task or config["task"]

        workflow_id = f"wf_{uuid.uuid4().hex[:8]}"
        agents = {a.config.name: agent_reg.get(a.config.name) for a in agent_reg.list_all()}

        orchestrator = WorkflowOrchestrator(
            agents=agents,
            graph_config=graph_cfg,
            event_bus=event_bus,
            workflow_id=workflow_id,
            max_iterations=20,
            timeout_seconds=120,
        )

        _runs[workflow_id] = {
            "workflow_id": workflow_id,
            "status": "running",
            "started_at": time.time(),
        }

        async def _run():
            result = await orchestrator.run(
                task=task,
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

    # -- Auth endpoint ---------------------------------------------------------

    @app.get("/api/me")
    async def get_me(user_id: str = Depends(get_current_user_dep)):
        return {"user_id": user_id}

    # -- WebSocket endpoint ----------------------------------------------------

    @app.websocket("/ws/events")
    async def ws_events(ws: WebSocket):
        await websocket_events_handler(ws, event_bus)

    return app


# -- Entrypoint ----------------------------------------------------------------

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
        llm_provider=llm,
    )


# ASGI entry point for uvicorn.
# Guarded so test imports don't trigger create_default_app() before
# backend.workflows (Task 7) exists.
if os.getenv("AGENTMESH_ENV") != "test":
    app = create_default_app()
