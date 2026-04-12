# Backend — AgentMesh FastAPI Service

## Stack
- **Framework:** FastAPI (async throughout — use `async def` for all route handlers and service methods)
- **Database:** PostgreSQL via SQLAlchemy `asyncpg` driver (`AsyncSession`)
- **ORM base:** `backend.db.engine.Base` (DeclarativeBase)
- **Migrations:** Alembic (`backend/alembic/`)
- **LLM default model:** `gemini-2.0-flash` (see `backend/llm/`)
- **Event system:** Internal `EventBus` (`backend/events/bus.py`) — emit typed dicts, not custom classes

## Auth Pattern (BFF proxy)
- The Next.js frontend acts as a BFF. It forwards trusted headers to FastAPI:
  - `x-user-id` — Google sub (primary key in `users` table)
  - `x-user-email`, `x-user-name`, `x-user-image`
- FastAPI **never** handles OAuth directly. Use `get_current_user` dep from `backend.api.auth_middleware`.
- Users are lazy-upserted on every authenticated request — no separate registration step.

## Key Modules
| Path | Purpose |
|------|---------|
| `backend/api/routes.py` | All HTTP + WebSocket routes, FastAPI app instance |
| `backend/api/auth_middleware.py` | `get_current_user` dependency (reads BFF headers) |
| `backend/api/middleware.py` | CORS, logging, and other middleware setup |
| `backend/agents/base.py` | `Agent`, `AgentConfig`, `AgentResult`, `AgentStatus` |
| `backend/agents/registry.py` | `AgentRegistry` — register and look up agents by name |
| `backend/orchestrator/graph.py` | `WorkflowOrchestrator` — drives agent execution graph |
| `backend/orchestrator/state.py` | Shared workflow state |
| `backend/orchestrator/handoff.py` | Agent-to-agent handoff routing logic |
| `backend/llm/base.py` | `BaseLLMProvider`, `LLMResponse` — all LLM providers implement this |
| `backend/llm/gemini.py` | Gemini provider |
| `backend/llm/openai_provider.py` | OpenAI provider |
| `backend/llm/groq.py` | Groq provider |
| `backend/llm/multi.py` | Multi-provider routing |
| `backend/mcp/client.py` | `MCPClientWrapper` — wraps MCP server connections |
| `backend/mcp/registry.py` | `MCPRegistry` — maps server names to clients |
| `backend/mcp/tools.py` | Tool definition helpers |
| `backend/db/engine.py` | `engine`, `AsyncSessionLocal`, `get_db` dependency |
| `backend/db/models.py` | SQLAlchemy ORM models |
| `backend/events/bus.py` | `EventBus` — async pub/sub |
| `backend/events/stream.py` | SSE streaming helper |
| `backend/pipelines/` | Pipeline templates and validation |
| `backend/crypto.py` | Signing/hashing utilities |

## Agent Routing
Agents signal routing via `[ROUTE: key]` in their response text. The orchestrator matches this against `AgentConfig.handoff_rules` (dict of key → next agent name). Default route is `on_complete`.

## Environment Variables
**Never hardcode. Never commit real values. Ask the user to set these — do not edit env files.**
| Variable | Purpose |
|----------|---------|
| `DATABASE_CONN` | PostgreSQL connection string (`postgres://...`) |
| `AGENTMESH_ENV` | Set to `test` for in-memory test DB |
| Any LLM keys | Set per provider (Gemini, OpenAI, Groq) |

## Conventions
- All DB queries use `text()` with named params — no string interpolation in SQL.
- Pydantic models for all request/response shapes — no raw dicts at API boundaries.
- `async def` everywhere — no blocking calls inside route handlers.
- Import paths use `backend.` prefix (package is installed or run from repo root).
- Do not add `__all__` unless a module is a public library surface.
