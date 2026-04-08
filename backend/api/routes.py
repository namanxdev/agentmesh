import os
import uuid
import time
import hmac
import hashlib
import secrets
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, WebSocket, Depends, HTTPException, Request
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


class CreateMCPServerRequest(BaseModel):
    name: str
    server_type: str  # "stdio" | "sse" | "http"
    command_or_url: str
    env_vars: dict = {}


class CreateTriggerRequest(BaseModel):
    trigger_type: str  # "webhook" | "cron"
    cron_schedule: Optional[str] = None


# -- App factory --------------------------------------------------------------

def create_app(
    event_bus: EventBus,
    agent_registry: AgentRegistry,
    mcp_registry: MCPRegistry,
    workflow_definitions: dict,  # name -> {agents, graph_config, ...}
    llm_provider: BaseLLMProvider = None,
) -> FastAPI:
    """Create and configure the FastAPI application."""

    import asyncio
    from contextlib import asynccontextmanager, suppress

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Optional MCP servers should not block the API from becoming ready.
        startup_task = asyncio.create_task(mcp_registry.connect_all())
        try:
            yield
        finally:
            if not startup_task.done():
                startup_task.cancel()
            with suppress(asyncio.CancelledError):
                await startup_task

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

    @app.post("/api/mcp/user-servers")
    async def create_user_mcp_server(
        request: CreateMCPServerRequest,
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        import datetime as _datetime
        import json as _json
        new_id = str(uuid.uuid4())
        now = _datetime.datetime.utcnow()
        await db.execute(
            text(
                "INSERT INTO mcp_servers (id, user_id, name, server_type, command_or_url, env_vars, created_at)"
                " VALUES (:id, :uid, :name, :server_type, :command_or_url, :env_vars, :now)"
            ),
            {
                "id": new_id,
                "uid": user_id,
                "name": request.name,
                "server_type": request.server_type,
                "command_or_url": request.command_or_url,
                "env_vars": _json.dumps(request.env_vars),
                "now": now,
            },
        )
        await db.commit()
        return {
            "id": new_id,
            "name": request.name,
            "server_type": request.server_type,
            "command_or_url": request.command_or_url,
            "created_at": now.isoformat(),
        }

    @app.get("/api/mcp/user-servers")
    async def list_user_mcp_servers(
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        result = await db.execute(
            text(
                "SELECT id, name, server_type, command_or_url, created_at"
                " FROM mcp_servers WHERE user_id=:uid ORDER BY created_at DESC"
            ),
            {"uid": user_id},
        )
        rows = result.fetchall()
        return {
            "servers": [
                {
                    "id": r.id,
                    "name": r.name,
                    "server_type": r.server_type,
                    "command_or_url": r.command_or_url,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in rows
            ]
        }

    @app.delete("/api/mcp/user-servers/{server_id}")
    async def delete_user_mcp_server(
        server_id: str,
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        await db.execute(
            text("DELETE FROM mcp_servers WHERE id=:id AND user_id=:uid"),
            {"id": server_id, "uid": user_id},
        )
        await db.commit()
        return {"deleted": server_id}

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

    # -- Trigger endpoints -----------------------------------------------------

    @app.post("/api/pipelines/{pipeline_id}/triggers")
    async def create_trigger(
        pipeline_id: str,
        request: CreateTriggerRequest,
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        import datetime as _datetime
        # Verify pipeline belongs to user
        row = await db.execute(
            text("SELECT id FROM pipelines WHERE id=:pid AND user_id=:uid"),
            {"pid": pipeline_id, "uid": user_id},
        )
        if not row.fetchone():
            raise HTTPException(status_code=404, detail="Pipeline not found")

        trigger_id = str(uuid.uuid4())
        secret = secrets.token_hex(32)
        now = _datetime.datetime.utcnow()
        await db.execute(
            text(
                "INSERT INTO triggers (id, user_id, pipeline_id, trigger_type, secret, cron_schedule, is_active, created_at)"
                " VALUES (:id, :uid, :pid, :ttype, :secret, :cron, true, :now)"
            ),
            {
                "id": trigger_id,
                "uid": user_id,
                "pid": pipeline_id,
                "ttype": request.trigger_type,
                "secret": secret,
                "cron": request.cron_schedule,
                "now": now,
            },
        )
        await db.commit()
        return {
            "id": trigger_id,
            "trigger_type": request.trigger_type,
            "secret": secret,
            "webhook_url": f"/api/webhooks/{trigger_id}",
        }

    @app.get("/api/pipelines/{pipeline_id}/triggers")
    async def list_triggers(
        pipeline_id: str,
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        result = await db.execute(
            text(
                "SELECT id, trigger_type, cron_schedule, is_active, created_at"
                " FROM triggers WHERE pipeline_id=:pid AND user_id=:uid ORDER BY created_at DESC"
            ),
            {"pid": pipeline_id, "uid": user_id},
        )
        rows = result.fetchall()
        return {
            "triggers": [
                {
                    "id": r.id,
                    "trigger_type": r.trigger_type,
                    "cron_schedule": r.cron_schedule,
                    "is_active": r.is_active,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "webhook_url": f"/api/webhooks/{r.id}",
                }
                for r in rows
            ]
        }

    @app.delete("/api/pipelines/{pipeline_id}/triggers/{trigger_id}")
    async def delete_trigger(
        pipeline_id: str,
        trigger_id: str,
        user_id: str = Depends(get_current_user_dep),
        db: AsyncSession = Depends(get_db),
    ):
        await db.execute(
            text("DELETE FROM triggers WHERE id=:id AND pipeline_id=:pid AND user_id=:uid"),
            {"id": trigger_id, "pid": pipeline_id, "uid": user_id},
        )
        await db.commit()
        return {"deleted": trigger_id}

    @app.post("/api/webhooks/{trigger_id}")
    async def fire_webhook(
        trigger_id: str,
        raw_request: Request,
        db: AsyncSession = Depends(get_db),
    ):
        """Public endpoint — no auth required. Secured via HMAC-SHA256 signature."""
        import asyncio
        import datetime as _datetime

        body_bytes = await raw_request.body()

        # Fetch trigger and its secret
        result = await db.execute(
            text("SELECT id, user_id, pipeline_id, secret, is_active FROM triggers WHERE id=:id"),
            {"id": trigger_id},
        )
        trigger_row = result.fetchone()
        if not trigger_row:
            raise HTTPException(status_code=404, detail="Trigger not found")
        if not trigger_row.is_active:
            raise HTTPException(status_code=403, detail="Trigger is inactive")

        # Validate HMAC-SHA256 signature
        sig_header = raw_request.headers.get("x-hub-signature-256", "")
        expected = "sha256=" + hmac.new(
            trigger_row.secret.encode(), body_bytes, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(sig_header, expected):
            raise HTTPException(status_code=403, detail="Invalid signature")

        # Fetch pipeline definition
        pipeline_result = await db.execute(
            text("SELECT id, definition FROM pipelines WHERE id=:pid"),
            {"pid": trigger_row.pipeline_id},
        )
        pipeline_row = pipeline_result.fetchone()
        if not pipeline_row:
            raise HTTPException(status_code=404, detail="Pipeline not found")

        # Parse request body for optional task
        import json as _json
        try:
            body_data = _json.loads(body_bytes) if body_bytes else {}
        except Exception:
            body_data = {}
        task = body_data.get("task", "Triggered via webhook")

        # Fetch user's API keys to build LLM provider
        keys_result = await db.execute(
            text("SELECT provider, encrypted_key FROM api_keys WHERE user_id=:uid"),
            {"uid": trigger_row.user_id},
        )
        key_rows = keys_result.fetchall()

        from backend.crypto import decrypt
        from backend.llm.multi import MultiProvider
        from backend.pipelines.validator import validate_pipeline, pipeline_to_workflow_config

        providers: dict = {}
        for krow in key_rows:
            try:
                api_key = decrypt(krow.encrypted_key)
            except Exception:
                continue
            if krow.provider == "gemini":
                from backend.llm.gemini import GeminiProvider
                providers["gemini"] = GeminiProvider(api_key=api_key)
            elif krow.provider == "groq":
                from backend.llm.groq import GroqProvider
                providers["groq"] = GroqProvider(api_key=api_key)
            elif krow.provider == "openai":
                from backend.llm.openai_provider import OpenAIProvider
                providers["openai"] = OpenAIProvider(api_key=api_key)

        user_llm = MultiProvider(providers)

        defn = pipeline_row.definition if isinstance(pipeline_row.definition, dict) else _json.loads(pipeline_row.definition)
        nodes = defn.get("nodes", [])
        edges = defn.get("edges", [])

        config = pipeline_to_workflow_config(
            {"name": defn.get("name", "webhook"), "nodes": nodes, "edges": edges},
            user_llm,
            event_bus,
            mcp_registry,
        )
        agent_reg = config["agent_registry"]
        graph_cfg = config["graph_config"]

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
            result = await orchestrator.run(task=task, initial_state={})
            _runs[workflow_id].update({
                "status": "completed" if result.success else "error",
                "result": result.state.messages[-1] if result.state.messages else {},
                "token_usage": result.state.token_usage,
                "duration_seconds": result.total_duration,
                "error": result.error,
            })

        asyncio.create_task(_run())

        return {"workflow_id": workflow_id, "status": "started"}

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
