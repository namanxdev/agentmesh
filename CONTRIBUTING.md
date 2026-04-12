# Contributing to AgentMesh

Thanks for your interest in contributing. This document covers everything you need to get the dev environment running, understand the codebase, and open a pull request.

---

## Table of contents

- [Dev environment setup](#dev-environment-setup)
- [Project structure](#project-structure)
- [Running tests](#running-tests)
- [Code conventions](#code-conventions)
- [Adding things](#adding-things)
  - [A new node type](#a-new-node-type)
  - [A new LLM provider](#a-new-llm-provider)
  - [A new pipeline template](#a-new-pipeline-template)
- [Pull request process](#pull-request-process)
- [Commit format](#commit-format)

---

## Dev environment setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- [`uv`](https://github.com/astral-sh/uv): `pip install uv`
- A PostgreSQL database — [Neon](https://neon.tech) free tier is easiest

### 1. Fork and clone

```bash
git clone https://github.com/your-username/agentmesh.git
cd agentmesh
```

### 2. Configure environment

There are two separate env files:

**Backend — `.env` at the repo root:**
```bash
cp .env.example .env
# Fill in the backend block (LLM keys, DATABASE_CONN, ENCRYPTION_KEY)
```

**Frontend — `frontend/.env.local`:**
```bash
# Copy the frontend block from .env.example into frontend/.env.local
cp .env.example frontend/.env.local
# Keep only the frontend variables (NEXTAUTH_URL, AUTH_SECRET, etc.)
```

See `.env.example` — it's annotated with what goes where and how to generate each value.

### 3. Install dependencies

```bash
# Python
uv sync

# Node
cd frontend && npm install && cd ..
```

### 4. Run database migrations

```bash
uv run alembic upgrade head
```

### 5. Start the dev servers

```bash
source .venv/Scripts/activate   # Windows (bash)
source .venv/bin/activate       # macOS / Linux

make dev
```

This starts uvicorn on `:8000` and Next.js on `:3000` simultaneously with hot reload on both sides.

### Useful URLs

| URL | What |
|---|---|
| `http://localhost:3000` | Frontend |
| `http://localhost:3000/dashboard` | Pipeline builder |
| `http://localhost:3000/settings` | API keys + MCP servers |
| `http://localhost:8000/docs` | FastAPI interactive docs |
| `http://localhost:8000/redoc` | FastAPI ReDoc |

---

## Project structure

```
agentmesh/
├── backend/
│   ├── agents/
│   │   ├── base.py          # BaseAgent — all agents inherit from this
│   │   └── registry.py      # AgentRegistry — register + retrieve agents by name
│   ├── api/
│   │   ├── routes.py        # All FastAPI routes + app factory (create_app)
│   │   ├── websocket.py     # WebSocket handler — subscribes to EventBus
│   │   ├── keys.py          # /api/keys CRUD (encrypted BYOK storage)
│   │   ├── auth_middleware.py
│   │   └── middleware.py    # CORS + error handlers
│   ├── crypto.py            # Fernet AES-256 encrypt/decrypt
│   ├── db/
│   │   ├── engine.py        # SQLAlchemy async engine + session factory
│   │   └── models.py        # ORM models
│   ├── events/
│   │   └── bus.py           # EventBus: circular buffer + WebSocket broadcast
│   ├── llm/
│   │   ├── base.py          # LLMProvider protocol
│   │   ├── gemini.py
│   │   ├── groq.py
│   │   ├── openai_provider.py
│   │   └── multi.py         # MultiProvider — routes to whichever key is available
│   ├── mcp/
│   │   ├── client.py        # MCPClientWrapper — connects, lists tools, calls tools
│   │   ├── registry.py      # MCPRegistry — register + connect_all on startup
│   │   └── tools.py         # Tool definition formatting helpers
│   ├── orchestrator/
│   │   └── graph.py         # WorkflowOrchestrator — runs the pipeline state machine
│   └── pipelines/
│       ├── validator.py     # DAG validation (cycles, disconnected nodes)
│       ├── converter.py     # Pipeline definition → WorkflowOrchestrator config
│       └── templates.py     # Static pre-built pipeline templates
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/
│   │   ├── dashboard/       # DashboardLayout, AgentSidebar, MessageStream, etc.
│   │   ├── pipeline/        # PipelineCanvas, NodePalette, NodeConfigInspector
│   │   │   └── nodes/       # One file per node type + index.ts
│   │   └── ui/              # Primitive / shared components
│   ├── hooks/               # useAgentMeshEvents, useWebSocket
│   ├── stores/              # Zustand stores (pipelineStore, eventStore, uiStore)
│   └── types/               # Shared TypeScript types
├── tests/
│   └── backend/             # pytest test files
├── alembic/                 # Database migration scripts
├── .env.example             # Annotated template for both env files
├── docker-compose.yml
├── Dockerfile               # Backend only
├── Makefile
└── pyproject.toml
```

---

## Running tests

```bash
# All tests
uv run pytest

# Specific file
uv run pytest tests/backend/test_orchestrator.py

# With output
uv run pytest -s -v

# Stop on first failure
uv run pytest -x
```

Tests use `pytest-asyncio` for async code and `pytest-mock` for mocking. The test database is mocked — no real PostgreSQL connection needed for the test suite.

Set `AGENTMESH_ENV=test` to prevent the backend from calling `create_default_app()` on import:

```bash
AGENTMESH_ENV=test uv run pytest
```

---

## Code conventions

### Python (backend)

- **Formatting:** no enforced formatter yet — match the surrounding code style
- **Async everywhere:** all I/O is `async/await`; never use `time.sleep` or blocking calls
- **Type hints:** use them on function signatures; `dict` / `list` are fine without subscripts in most places
- **Datetime:** use `datetime.now(datetime.UTC)` — `utcnow()` is deprecated in Python 3.12+
- **Error handling:** catch specific exceptions; avoid bare `except:` outside of event emission paths
- **Imports:** standard library → third-party → local, one blank line between groups

### TypeScript (frontend)

- **No `any`** unless genuinely unavoidable — use `unknown` + type guards instead
- **Components:** `"use client"` at the top only when the component actually needs browser APIs or hooks
- **Stores:** state mutations go in Zustand store actions, not in component handlers
- **Styles:** CSS variables from the design token system (`var(--accent-primary)`, etc.) over hardcoded hex values
- **NodeTypes / EdgeTypes:** always define outside the component (module level) — React Flow warns and re-renders otherwise

---

## Adding things

### A new node type

**1. Add the backend kind**

In `backend/pipelines/validator.py`, add the new kind to the allowed set.

In `backend/pipelines/converter.py`, handle the new kind when converting a pipeline definition to a `WorkflowOrchestrator` config.

**2. Create the frontend node component**

```
frontend/components/pipeline/nodes/YourNode.tsx
```

Follow the pattern of `LLMAgentNode.tsx` or `ToolNode.tsx` — use `BaseNode` as the wrapper, accept `NodeProps`, and read config from `data.config`.

**3. Register it**

In `frontend/components/pipeline/nodes/index.ts`:

```ts
import { YourNode } from "./YourNode";

export const pipelineNodeTypes = {
  // ... existing types
  your_kind: YourNode,
} as const;
```

**4. Add to the palette**

In `frontend/components/pipeline/NodePalette.tsx`, add an entry to `PALETTE_ITEMS`:

```ts
{ kind: "your_kind", name: "Your Node", description: "What it does" }
```

**5. Add a default config**

In `frontend/stores/pipelineStore.ts`, add a default config for your node kind in `addNode`.

**6. Add TypeScript types**

In `frontend/types/pipeline.ts`, add a `YourNodeConfig` interface and include `your_kind` in the `NodeKind` union.

---

### A new LLM provider

**1. Create the provider**

```
backend/llm/yourprovider.py
```

Implement the `LLMProvider` protocol from `backend/llm/base.py`. You need:
- `async def complete(self, messages: list[dict], tools: list[dict] | None) -> dict`
- Handle tool call response format consistently with existing providers

**2. Register in MultiProvider**

In `backend/llm/multi.py`, add your provider to the routing logic.

**3. Expose in settings**

In `frontend/app/settings/page.tsx`, add your provider to the `PROVIDERS` array.

**4. Add model names**

In `frontend/app/settings/page.tsx` and `frontend/components/pipeline/nodes/LLMAgentNode.tsx`, add the model names to the relevant dropdowns.

---

### A new pipeline template

Add an entry to `PIPELINE_TEMPLATES` in `backend/pipelines/templates.py`. Each template is a plain dict matching the `PipelineDefinition` shape:

```python
{
    "id": "your-template-id",          # kebab-case, unique
    "name": "Your Template Name",
    "description": "One-line description",
    "definition": {
        "name": "Your Template Name",
        "nodes": [ ... ],              # list of node dicts with id, kind, config, position
        "edges": [ ... ],              # list of edge dicts with id, source, target
    }
}
```

Copy an existing template as a starting point and adjust the nodes/edges.

---

## Pull request process

1. **Fork** the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   # or: fix/short-description
   ```

2. **Keep PRs focused** — one feature or fix per PR. If you're unsure whether something is in scope, open an issue first.

3. **Run the tests** before pushing:
   ```bash
   uv run pytest
   ```

4. **Fill in the PR description** — explain what changed and why, not just what. If it touches the UI, include a screenshot.

5. **Target `main`** — we don't use a separate `develop` branch.

PRs are reviewed within a few days. Small, well-scoped changes merge faster than large ones.

---

## Commit format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

Optional longer body explaining why, not what.
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither adds a feature nor fixes a bug |
| `chore` | Tooling, deps, config (no production code change) |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `perf` | Performance improvement |

**Examples:**
```
feat: add memory node type to pipeline canvas
fix: handle websocket disconnect during event replay
docs: add node type guide to CONTRIBUTING.md
chore: add .claude to .gitignore
```

Keep the subject line under 72 characters. No period at the end.
