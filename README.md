# AgentMesh

**Self-hosted visual multi-agent AI pipelines — MCP-native, bring your own keys, monitor everything in real-time.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

Build multi-agent AI pipelines visually, run them against any MCP server, and watch every decision, tool call, and handoff happen in real-time — on infrastructure you own.

---

## What makes it different

| Capability | AgentMesh | LangSmith | Gumloop | n8n |
|---|:---:|:---:|:---:|:---:|
| Visual pipeline builder | ✅ | ❌ | ✅ | ✅ |
| Real-time agent monitoring | ✅ | ✅ | ❌ | ❌ |
| MCP-native (any MCP server) | ✅ | ❌ | ❌ | ❌ |
| Self-hosted / open-source | ✅ | ❌ | ❌ | ✅ |
| Per-user encrypted key storage | ✅ | ❌ | ❌ | ❌ |
| Free to use | ✅ | ⚠️ | ❌ | ✅ |

---

## Quick start

### Prerequisites

- Python 3.11+, Node.js 20+
- PostgreSQL ([Neon](https://neon.tech) free tier works)
- [`uv`](https://github.com/astral-sh/uv): `pip install uv`

### 1. Clone and configure

```bash
git clone https://github.com/yourusername/agentmesh.git
cd agentmesh
```

There are **two separate env files** — one for each process:

**Backend** — create `.env` at the repo root:
```bash
cp .env.example .env
# Fill in the backend block
```

**Frontend** — create `frontend/.env.local`:
```bash
# Copy just the frontend block from .env.example
```

See `.env.example` — it's annotated with every variable, what it does, and how to generate it. Minimum required:

| Variable | File | How to get it |
|---|---|---|
| `GEMINI_API_KEY` | `.env` | [aistudio.google.com](https://aistudio.google.com) |
| `DATABASE_CONN` | `.env` | Your PostgreSQL connection string |
| `ENCRYPTION_KEY` | `.env` | `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `AUTH_SECRET` | `frontend/.env.local` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID/SECRET` | `frontend/.env.local` | Google Cloud Console → OAuth 2.0 |
| `NEXTAUTH_URL` | `frontend/.env.local` | `http://localhost:3000` for local dev |
| `FASTAPI_URL` | `frontend/.env.local` | `http://localhost:8000` for local dev |

### 2. Install dependencies and migrate

```bash
uv sync
uv run alembic upgrade head
cd frontend && npm install
```

### 3. Start everything

```bash
# Activate the virtual environment first
source .venv/Scripts/activate   # Windows (bash)
source .venv/bin/activate       # macOS / Linux

make dev
```

| URL | What you get |
|---|---|
| `http://localhost:3000` | Landing page |
| `http://localhost:3000/dashboard` | Pipeline builder + Mission Control |
| `http://localhost:3000/settings` | API keys + MCP server config |
| `http://localhost:8000/docs` | FastAPI interactive docs |

---

## Building your first pipeline

1. Open `/dashboard` — make sure you're in **Build mode**
2. **Drag nodes** from the left palette onto the canvas
3. **Connect them** by drawing edges between node handles
4. Configure each node in the **right inspector** (model, system prompt, temperature)
5. Click **Validate** to check for DAG errors
6. Click **Run pipeline**, enter a task, and watch Mission Control

### Node types

| Node | Purpose |
|---|---|
| `Input` | Pipeline entry point |
| `LLM Agent` | AI reasoning agent — model, system prompt, temperature |
| `Tool` | Calls a registered MCP server tool |
| `Router` | Conditional branch based on agent output |
| `Memory` | Context / vector store pass-through |
| `Transform` | JSON parse, extract, format |
| `Parallel` | Fan-out to multiple agents simultaneously |
| `Output` | Collects final result |

### Pre-built templates

Click **Templates** in the pipeline header to load:

- **Research Synthesis** — search → extract → analyze → write
- **GitHub Code Review** — fetch branch → review → security scan → summary (requires `GITHUB_TOKEN`)

---

## Architecture

```
agentmesh/
├── backend/
│   ├── agents/          # Agent base class, registry
│   ├── api/
│   │   ├── routes.py    # All FastAPI endpoints + app factory
│   │   ├── websocket.py # WebSocket event handler
│   │   └── keys.py      # API key CRUD
│   ├── crypto.py        # Fernet AES-256 per-user key encryption
│   ├── db/              # SQLAlchemy async + Alembic migrations
│   ├── events/          # EventBus: 100-event circular buffer, WS broadcast
│   ├── llm/             # Gemini, Groq, OpenAI + MultiProvider router
│   ├── mcp/             # FastMCP client wrapper + MCPRegistry
│   ├── orchestrator/    # WorkflowOrchestrator: sequential + parallel execution
│   └── pipelines/       # DAG validator, pipeline→workflow converter, templates
├── frontend/
│   ├── app/             # Next.js App Router: landing, dashboard, settings, auth
│   ├── components/
│   │   ├── dashboard/   # DashboardLayout, AgentSidebar, MessageStream, ToolCallInspector
│   │   ├── pipeline/    # PipelineCanvas (React Flow), NodePalette, NodeConfigInspector
│   │   └── ui/          # Primitive components
│   ├── hooks/           # useAgentMeshEvents, useWebSocket (auto-reconnect)
│   ├── stores/          # Zustand: pipelineStore, eventStore
│   └── types/           # TypeScript: nodes, edges, events
└── tests/               # pytest: orchestrator, routing, validator, MCP registry
```

### Request flow

```
Browser → Next.js BFF proxy → FastAPI → WorkflowOrchestrator
                                                │
                                ┌───────────────┼───────────────┐
                           Agent 1          Agent 2         Agent N
                                └───────────────┴───────────────┘
                                                │
                                    EventBus (WebSocket)
                                                │
                                    useAgentMeshEvents
                                                │
                          ┌─────────────────────┼─────────────────────┐
                    AgentSidebar          MessageStream         ToolCallInspector
```

---

## Deployment

### Render + Neon + Vercel (free tier)

**Backend on [Render](https://render.com)**
- Build command: `uv sync && uv run alembic upgrade head`
- Start command: `.venv/bin/uvicorn backend.api.routes:app --host 0.0.0.0 --port $PORT`
- Add all backend env vars in the Render dashboard

**Frontend on [Vercel](https://vercel.com)**
- Root directory: `frontend`
- Add frontend env vars; set `FASTAPI_URL` to your Render service URL

**Database:** [Neon](https://neon.tech) free PostgreSQL — paste the connection string into `DATABASE_CONN`.

> Render's free tier spins down after 15 min of inactivity. Use [UptimeRobot](https://uptimerobot.com) to keep it warm for demos.

### Railway

```bash
npm i -g @railway/cli
railway login && railway init
railway up
```

Add a PostgreSQL plugin from the Railway dashboard and set env vars via `railway variables set KEY=value`.

### Self-hosted (Docker Compose)

```bash
cp .env.example .env   # fill in values
docker-compose up -d
```

Minimum spec: 1 vCPU / 1 GB RAM. Add Nginx + Let's Encrypt for HTTPS.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + uvicorn |
| Orchestration | Custom `WorkflowOrchestrator` state machine |
| MCP | FastMCP (stdio + HTTP) |
| LLM providers | Gemini, Groq, OpenAI via `MultiProvider` |
| Real-time | WebSocket + `EventBus` (100-event circular buffer) |
| Database | PostgreSQL + SQLAlchemy async + Alembic |
| Encryption | Fernet (AES-256) |
| Auth | NextAuth v5 + Google OAuth |
| Frontend | Next.js 15 (App Router) + React 19 |
| Canvas | `@xyflow/react` (React Flow) |
| State | Zustand 5 |
| Styling | Tailwind CSS v4 |
| Testing | pytest + pytest-asyncio |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, project conventions, and how to open a pull request.

---

## License

MIT — use it, fork it, build on it.
