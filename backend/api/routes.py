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


class SavePipelineRequest(BaseModel):
    pipeline_id: Optional[str] = None
    name: str
    definition: PipelineDefinitionModel


# -- App factory --------------------------------------------------------------

def create_app(
    event_bus: EventBus,
    agent_registry: AgentRegistry,
    mcp_registry: MCPRegistry,
    workflow_definitions: dict,  # name -> {agents, graph_config, ...}
    llm_provider: BaseLLMProvider = None,
) -> FastAPI:
    """Create and configure the FastAPI application."""

    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await mcp_registry.connect_all()
        yield

    app = FastAPI(title="AgentMesh API", version="1.0.0", lifespan=lifespan)
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
            raise HTTPException(status_code=404, detail=f"Workflow '{request.workflow_name}' not found.")

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
            raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found.")
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

        config = pipeline_to_workflow_config(defn_dict, user_llm, event_bus, mcp_registry)
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

        import datetime as _datetime
        try:
            await db.execute(
                text(
                    "INSERT INTO pipeline_runs"
                    " (id, user_id, pipeline_id, workflow_id, status, created_at, updated_at)"
                    " VALUES (:id, :uid, NULL, :wid, 'running', :now, :now)"
                ),
                {
                    "id": str(uuid.uuid4()),
                    "uid": user_id,
                    "wid": workflow_id,
                    "now": _datetime.datetime.utcnow(),
                },
            )
            await db.commit()
        except Exception:
            pass  # non-critical, don't fail the run

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

    # -- Pipeline save / load / list / delete / run-history -------------------

    @app.get("/api/pipelines/templates")
    async def list_templates():
        from backend.pipelines.templates import PIPELINE_TEMPLATES
        return {"templates": PIPELINE_TEMPLATES}

    @app.post("/api/pipelines")
    async def save_pipeline(
        request: SavePipelineRequest,
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        import json as _json
        import uuid as _uuid
        import datetime as _datetime
        now = _datetime.datetime.utcnow()
        defn = {
            "name": request.definition.name,
            "nodes": [
                {"id": n.id, "kind": n.kind, "config": n.config, "position": n.position}
                for n in request.definition.nodes
            ],
            "edges": [
                {"id": e.id, "source": e.source, "target": e.target}
                for e in request.definition.edges
            ],
        }
        if request.pipeline_id:
            await db.execute(
                text(
                    "UPDATE pipelines SET name=:name, definition=:defn, updated_at=:now"
                    " WHERE id=:id AND user_id=:uid"
                ),
                {
                    "name": request.name,
                    "defn": _json.dumps(defn),
                    "now": now,
                    "id": request.pipeline_id,
                    "uid": user_id,
                },
            )
            await db.commit()
            return {"id": request.pipeline_id, "name": request.name, "updated_at": now.isoformat()}
        else:
            new_id = str(_uuid.uuid4())
            await db.execute(
                text(
                    "INSERT INTO pipelines (id, user_id, name, definition, created_at, updated_at)"
                    " VALUES (:id, :uid, :name, :defn, :now, :now)"
                ),
                {
                    "id": new_id,
                    "uid": user_id,
                    "name": request.name,
                    "defn": _json.dumps(defn),
                    "now": now,
                },
            )
            await db.commit()
            return {"id": new_id, "name": request.name, "updated_at": now.isoformat()}

    @app.get("/api/pipelines")
    async def list_pipelines(
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        result = await db.execute(
            text(
                "SELECT id, name, updated_at FROM pipelines"
                " WHERE user_id=:uid ORDER BY updated_at DESC"
            ),
            {"uid": user_id},
        )
        rows = result.fetchall()
        return {
            "pipelines": [
                {
                    "id": r.id,
                    "name": r.name,
                    "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                }
                for r in rows
            ]
        }

    @app.get("/api/pipelines/{pipeline_id}/runs")
    async def get_pipeline_runs(
        pipeline_id: str,
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        result = await db.execute(
            text(
                "SELECT id, workflow_id, status, total_tokens, duration_seconds, created_at"
                " FROM pipeline_runs WHERE pipeline_id=:pid ORDER BY created_at DESC LIMIT 20"
            ),
            {"pid": pipeline_id},
        )
        rows = result.fetchall()
        return {
            "runs": [
                {
                    "id": r.id,
                    "workflow_id": r.workflow_id,
                    "status": r.status,
                    "total_tokens": r.total_tokens,
                    "duration_seconds": r.duration_seconds,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in rows
            ]
        }

    @app.get("/api/pipelines/{pipeline_id}")
    async def get_pipeline(
        pipeline_id: str,
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        import json as _json
        result = await db.execute(
            text(
                "SELECT id, name, definition FROM pipelines"
                " WHERE id=:id AND user_id=:uid"
            ),
            {"id": pipeline_id, "uid": user_id},
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Pipeline not found")
        defn = _json.loads(row.definition) if isinstance(row.definition, str) else row.definition
        return {"id": row.id, "name": row.name, "definition": defn}

    @app.delete("/api/pipelines/{pipeline_id}")
    async def delete_pipeline(
        pipeline_id: str,
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        await db.execute(
            text("DELETE FROM pipelines WHERE id=:id AND user_id=:uid"),
            {"id": pipeline_id, "uid": user_id},
        )
        await db.commit()
        return {"deleted": pipeline_id}

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

    # Register MCP servers from environment
    if os.getenv("GITHUB_TOKEN"):
        mcp_registry.register(
            "github",
            transport_config={
                "transport": "stdio",
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-github"],
                "env": {"GITHUB_TOKEN": os.getenv("GITHUB_TOKEN", "")},
            }
        )

    github_ws_url = os.getenv("FILESYSTEM_MCP_URL")
    if github_ws_url:
        mcp_registry.register(
            "filesystem",
            transport_config={"transport": "http", "url": github_ws_url}
        )

    web_search_url = os.getenv("WEB_SEARCH_MCP_URL")
    if web_search_url:
        mcp_registry.register(
            "web-search",
            transport_config={"transport": "http", "url": web_search_url}
        )

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
