# AgentMesh

**Self-hosted visual multi-agent AI pipelines — MCP-native, bring your own keys, monitor everything in real-time.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## Executive Summary

The market for AI agent tooling is fragmenting fast. Developers get raw SDKs with no visibility. No-code platforms give visibility but no control. Enterprise orchestrators cost $40k+/year and still put your keys on someone else's server.

AgentMesh is the gap filler: a self-hosted, open-source platform that gives you the visual pipeline builder and real-time mission control of a premium SaaS product — with none of the lock-in, none of the data exposure, and zero per-seat pricing.

**Core value proposition in one sentence:** *Build multi-agent AI pipelines visually, run them against any MCP server, and watch every decision, tool call, and handoff happen in real-time — on infrastructure you own.*

---

## Table of Contents

1. [Who This Is For](#1-who-this-is-for)
2. [How AgentMesh Is Different](#2-how-agentmesh-is-different)
3. [What's Built Today](#3-whats-built-today)
4. [How to Use It](#4-how-to-use-it)
5. [Architecture](#5-architecture)
6. [Tech Stack](#6-tech-stack)
7. [Environment Variables](#7-environment-variables)
8. [Roadmap to Completion](#8-roadmap-to-completion)
9. [Demo Video Plan](#9-demo-video-plan)
10. [Deployment Guide](#10-deployment-guide)
11. [Contributing](#11-contributing)

---

## 1. Who This Is For

AgentMesh is built for three distinct user personas, each with a different entry point and a different definition of value.

### Persona A — The AI-Native Developer

> *"I want to chain agents together and see what's actually happening, without setting up LangSmith, Datadog, and three other tools."*

- Builds with FastAPI, Next.js, or similar
- Has used LangChain/LangGraph but frustrated by observability gaps
- BYOK mentality — doesn't want vendor lock-in on LLM spend
- **Reaches for AgentMesh because:** it's the only tool that ships a visual canvas, real-time event stream, and a self-hosted backend in one repo

### Persona B — The Technical Founder / Solo Builder

> *"I need to prototype an AI-powered product fast. I need to ship a demo, not configure infrastructure."*

- Building a product on top of AI agents (code review tool, research assistant, document processor)
- Needs something demo-able in days, not weeks
- Values open source so they can fork and customize
- **Reaches for AgentMesh because:** `make dev` and two MCP servers gets them to a working demo with a professional UI in hours

### Persona C — The AI Platform Engineer (Enterprise Entry Point)

> *"My team runs 12 different agent scripts. None of them have monitoring. My manager wants a dashboard."*

- Works in a team with multiple AI initiatives running in parallel
- Needs a shared platform that centralizes orchestration and observability
- Cares about per-user key isolation, audit trails, run history
- **Reaches for AgentMesh because:** self-hosted deployment + AES-256 per-user key encryption + PostgreSQL run history satisfies their security requirements without procurement

### Who It Is NOT For

| Profile | Why AgentMesh isn't right | What they should use |
|---|---|---|
| Non-technical users who want no-code | Requires `git clone` and env setup | Relay, Make.com, Gumloop |
| Enterprise teams that need SAML/SSO | Auth is Google OAuth only today | Vertex AI Pipelines, Weights & Biases |
| Teams that need production SLAs | No managed hosting today | LangSmith Cloud, AWS Bedrock Agents |

---

## 2. How AgentMesh Is Different

### Competitive Landscape

| Capability | **AgentMesh** | LangSmith | Gumloop | Relay.app | LangGraph Cloud | n8n |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Visual pipeline builder | ✅ | ❌ | ✅ | ✅ | ⚠️ limited | ✅ |
| Real-time agent monitoring | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| MCP-native (any MCP server) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Self-hosted / open-source | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| BYOK (your API keys) | ✅ | partial | ❌ | ❌ | ❌ | ✅ |
| Multi-LLM (Gemini/Groq/OpenAI) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Per-user encrypted key storage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Parallel agent execution | ✅ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ |
| Human-in-the-loop gates | ✅ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| Free to use | ✅ | ⚠️ limited | ❌ | ❌ | ❌ | ✅ |

### The Three Unfair Advantages

**1. MCP-Native From Day One**
Every other platform treats tool integrations as a proprietary plugin system (n8n nodes, Relay integrations, Gumloop connectors). AgentMesh uses the Model Context Protocol — the emerging open standard from Anthropic. This means any MCP-compliant server (GitHub, filesystem, web search, databases, or your custom internal tool) connects automatically with zero custom code.

**2. Full Observability Without a Separate Product**
LangSmith is observability-only. Gumloop is builder-only. AgentMesh ships both in a single repo. The WebSocket event bus emits 11 structured event types covering the full agent lifecycle — activation, tool calls, handoffs, token usage, errors, completions. The Mission Control dashboard renders all of them live, with zero additional setup.

**3. Self-Hosted With Zero Compromise on UX**
n8n is also open-source and self-hosted, but its UI is clearly built for automation engineers, not AI developers. AgentMesh's pipeline canvas, agent sidebar, tool call inspector, and message stream are purpose-built for AI agent workflows — designed to make the "black box" of LLM reasoning transparent.

---

## 3. What's Built Today

### Feature Inventory

| Feature | Status | Notes |
|---|---|---|
| Visual drag-and-drop pipeline canvas | ✅ Shipped | React Flow, 8 node types |
| LLM Agent nodes | ✅ Shipped | Name, model, system prompt, temperature config |
| Tool nodes (MCP) | ✅ Shipped | Connects to registered MCP servers |
| Router nodes | ✅ Shipped | Conditional branching logic |
| Human Gate nodes | ✅ Shipped | Pause pipeline for human approval |
| Parallel Fork / Merge nodes | ✅ Shipped | True parallel agent execution |
| Sequential orchestration | ✅ Shipped | WorkflowOrchestrator state machine |
| Parallel orchestration | ✅ Shipped | Fork/join execution graph |
| WebSocket real-time event stream | ✅ Shipped | 11 event types, 100-event circular buffer |
| Mission Control dashboard | ✅ Shipped | Agent sidebar, canvas, tool inspector, message stream |
| MCP client (stdio + HTTP) | ✅ Shipped | FastMCP with connect_all lifecycle |
| User-managed MCP server config | ✅ Shipped | Add/remove servers from Settings UI |
| Webhook pipeline triggers | ✅ Shipped | HTTP POST endpoint triggers a named pipeline |
| Multi-LLM provider | ✅ Shipped | Gemini, Groq, OpenAI via unified MultiProvider |
| BYOK API key storage | ✅ Shipped | AES-256 (Fernet) per-user encryption |
| Pipeline save / load | ✅ Shipped | Persisted to PostgreSQL, My Pipelines drawer |
| Pipeline templates | ✅ Shipped | Research Synthesis, GitHub Code Review |
| Run history | ✅ Shipped | Status, duration, token count per run |
| Google OAuth authentication | ✅ Shipped | NextAuth v5 |
| DAG validator | ✅ Shipped | Checks for cycles, disconnected nodes before run |
| Docker Compose | ✅ Shipped | One-command local setup |
| `make dev` | ✅ Shipped | Starts frontend + backend simultaneously |
| Test coverage | ✅ Shipped | Orchestrator, routing, validator, MCP registry |
| Landing page | ✅ Shipped | Editorial brutalism design, animated |

### What's Not Done (Honest Gaps)

| Gap | Impact | Effort to fix |
|---|---|---|
| No PyPI package (`pip install agentmesh`) | Blocks Persona A adoption | Medium — packaging + CI |
| No one-click cloud deploy (Vercel + Render button) | Increases setup friction | Low — env var config |
| Landing page shows placeholder screenshot | First impression hit | Low — screenshot + swap |
| No agent execution timeout UI feedback | Pipeline hangs silently on error | Low — frontend state |
| Docker Compose not tested end-to-end | Claimed but untested | Medium — integration test |
| No mobile / tablet responsive dashboard | Dashboard is desktop-only | Low priority |

---

## 4. How to Use It

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL database ([Neon](https://neon.tech) free tier works)
- [`uv`](https://github.com/astral-sh/uv): `pip install uv`

### Setup in 5 Minutes

**Step 1 — Clone and configure**

```bash
git clone https://github.com/yourusername/agentmesh.git
cd agentmesh
cp .env.example .env
```

Minimum `.env` values:

| Variable | Source |
|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API key |
| `DATABASE_CONN` | Your PostgreSQL connection string |
| `ENCRYPTION_KEY` | `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `AUTH_SECRET` | `openssl rand -base64 32` |

Copy the frontend block into `frontend/.env.local`.

**Step 2 — Start everything**

```bash
source .venv/Scripts/activate   # Windows (bash)
# or: source .venv/bin/activate  # macOS/Linux

make dev
```

This runs the database migration, starts uvicorn on port 8000, and Next.js on port 3000 simultaneously.

| URL | What you get |
|---|---|
| `http://localhost:3000` | Landing page |
| `http://localhost:3000/dashboard` | Pipeline builder + Mission Control |
| `http://localhost:3000/settings` | API key management + MCP server config |
| `http://localhost:8000/docs` | FastAPI auto-generated API docs |

### Building Your First Pipeline

1. **Open Dashboard** at `/dashboard`
2. **Switch to Build mode** using the header toggle
3. **Drag nodes** from the left palette onto the canvas:
   - Start with an `LLM Agent` node — configure its name, model, and system prompt in the right inspector
   - Add a `Tool` node and connect it to a registered MCP server
   - Chain them with edges; add a `Router` if you need conditional branching
4. **Validate** — click the validate button to check for DAG errors
5. **Switch to Run mode** — enter a task prompt and click Run
6. **Watch Mission Control** — the agent sidebar shows live status, the canvas shows active nodes glowing, the tool call inspector logs every MCP invocation, and the message stream shows the full event timeline

### Using the Pre-Built Templates

Click `Templates` in the pipeline header to load:

- **Research Synthesis** — Search agent → Content extraction agent → Analyst agent → Report writer. Give it any research question.
- **GitHub Code Review** — Fetches a repo branch, runs a code review agent, security scan, and writes a summary report. Requires `GITHUB_TOKEN` in your env.

### Triggering Pipelines via Webhook

Once a pipeline is saved, trigger it programmatically:

```bash
curl -X POST http://localhost:8000/api/webhooks/trigger \
  -H "Content-Type: application/json" \
  -d '{"pipeline_name": "research-synthesis", "task": "What is the state of MCP adoption in 2025?"}'
```

---

## 5. Architecture

```
agentmesh/
├── backend/
│   ├── agents/          # Agent base class, registry, system prompts
│   ├── api/
│   │   ├── routes.py    # All FastAPI endpoints + app factory (create_app)
│   │   ├── websocket.py # WebSocket event handler
│   │   ├── auth_middleware.py
│   │   ├── middleware.py # CORS + global error handlers
│   │   └── keys.py      # API key CRUD routes
│   ├── crypto.py        # Fernet AES-256 per-user key encryption
│   ├── db/              # SQLAlchemy async models + Alembic migrations
│   ├── events/          # EventBus: 100-event circular buffer, WebSocket broadcast
│   ├── llm/             # Gemini, Groq, OpenAI + unified MultiProvider router
│   ├── mcp/             # FastMCP client wrapper + MCPRegistry
│   ├── orchestrator/    # WorkflowOrchestrator: sequential + parallel state machine
│   ├── pipelines/       # DAG validator, pipeline→workflow converter, templates
│   └── workflows/       # Demo workflow definitions (DEMO_WORKFLOWS dict)
├── frontend/
│   ├── app/             # Next.js app router: landing, dashboard, settings, auth
│   ├── components/
│   │   ├── landing/     # HeroSection, FeaturesBento, HowItWorks, etc.
│   │   ├── dashboard/   # DashboardLayout, AgentSidebar, MessageStream, ToolCallInspector
│   │   ├── pipeline/    # PipelineCanvas (React Flow), PipelineHeader, NodePalette, NodeConfigInspector
│   │   ├── graph/       # FlowCanvas, AgentFlowNode, AnimatedEdge
│   │   └── ui/          # Primitive components
│   ├── hooks/           # useAgentMeshEvents, useWebSocket (auto-reconnect)
│   ├── stores/          # Zustand: pipelineStore, eventStore
│   └── types/           # TypeScript: nodes, edges, events
├── tests/               # pytest: orchestrator, routing, validator, MCP registry, API
├── docker-compose.yml
├── Makefile
└── pyproject.toml
```

### Data Flow

```
User action (Run pipeline)
        │
        ▼
  Next.js (BFF proxy)
        │  POST /api/workflows/run
        ▼
  FastAPI (routes.py)
        │
        ▼
  WorkflowOrchestrator
        │  Builds LangGraph state machine from pipeline definition
        ├──► Agent 1 activated → calls LLM → calls MCP tools
        │         └──► EventBus.emit(agent_start, tool_call, tool_result, agent_complete)
        ├──► Agent 2 activated (handoff)
        │         └──► EventBus.emit(handoff, agent_start, ...)
        └──► Workflow complete → EventBus.emit(workflow_complete)
                   │
                   ▼
          WebSocket broadcast
                   │
                   ▼
        useAgentMeshEvents (React hook)
                   │
        Zustand eventStore.addEvent()
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
  AgentSidebar  MessageStream  ToolCallInspector
  (status dots)  (event feed)  (tool call cards)
```

---

## 6. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend framework | FastAPI + uvicorn | Async-first, auto OpenAPI docs, fast |
| Orchestration | Custom `WorkflowOrchestrator` (state machine) | Full control over execution + event emission |
| MCP client | FastMCP | Official Python MCP client, stdio + HTTP |
| LLM providers | Gemini, Groq, OpenAI via `MultiProvider` | Free-tier heavy, model-agnostic |
| Real-time | WebSocket + `EventBus` (100-event buffer) | Low latency, auto-reconnect support |
| Database | PostgreSQL + SQLAlchemy async + Alembic | Prod-grade, Neon free tier compatible |
| Encryption | Fernet (AES-256) via `cryptography` | Per-user key isolation |
| Auth | NextAuth v5 + Google OAuth | Fast to implement, widely trusted |
| Frontend | Next.js 16 (App Router), React 19 | Latest, Turbopack dev server |
| Pipeline canvas | `@xyflow/react` 12 (React Flow) | Best-in-class node graph library |
| State management | Zustand 5 | Minimal, performant, no boilerplate |
| Animations | Framer Motion | Landing page animations |
| Styling | Tailwind CSS v4 | Utility-first, CSS variable design tokens |
| Typography | Outfit (display) + Inter (body) + JetBrains Mono (labels) | Editorial brutalism aesthetic |
| Package manager | `uv` (Python) + npm (Node) | Fast Python deps, standard Node |
| Testing | pytest + pytest-asyncio + pytest-mock | Async test support |

---

## 7. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | One of these three | Gemini 2.0 Flash / Pro |
| `GROQ_API_KEY` | One of these three | Llama 3.3 70B via Groq |
| `OPENAI_API_KEY` | One of these three | GPT-4o / GPT-4o-mini |
| `DATABASE_CONN` | Yes | PostgreSQL connection string |
| `ENCRYPTION_KEY` | Yes | Fernet key for per-user API key encryption |
| `GITHUB_TOKEN` | Optional | Enables GitHub MCP server |
| `AUTH_SECRET` | Yes (frontend) | NextAuth session secret |
| `GOOGLE_CLIENT_ID` | Yes (frontend) | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes (frontend) | Google OAuth client secret |
| `NEXTAUTH_URL` | Yes (frontend) | App URL e.g. `http://localhost:3000` |
| `FASTAPI_URL` | Yes (frontend) | Backend URL e.g. `http://localhost:8000` |

---

## 8. Roadmap to Completion

### What "done" means

AgentMesh is functionally complete as a product. "Done" here means: *ready for public launch, capable of earning GitHub stars, and able to support a hosted demo that converts visitors.*

### Phase 1 — Pre-Launch Polish (3–5 days)

| Task | Why it matters | Effort |
|---|---|---|
| Replace placeholder screenshot in README with actual dashboard screenshot | First thing visitors see on GitHub | 1 hr |
| Test Docker Compose end-to-end on a clean machine | The quick-start path must work first try | 2 hrs |
| Fix `.env.example` completeness — verify every variable is documented | Reduces setup abandonment | 1 hr |
| Add a `/health` endpoint to the backend | Required for deploy platform health checks | 30 min |
| Write a `CONTRIBUTING.md` with dev setup and PR conventions | Signals project maturity | 1 hr |
| Add GitHub Actions CI: run pytest on every PR | Credibility signal for open source | 2 hrs |

### Phase 2 — Distribution (2–3 days)

| Task | Why it matters | Effort |
|---|---|---|
| Publish to PyPI as `agentmesh` | Enables `pip install agentmesh`; dramatically expands reach | 3 hrs |
| Add "Deploy to Render" button to README | One-click deploy removes the biggest friction for Persona B | 1 hr |
| Add "Deploy to Railway" button as alternative | Railway has better free tier than Render for persistent DBs | 1 hr |
| Submit to Hacker News Show HN | Primary launch channel for developer tools | 0 hrs (write the post) |
| Post to r/LocalLLaMA and r/MachineLearning | Active communities for self-hosted AI | 0 hrs |

### Phase 3 — Post-Launch Iteration (ongoing)

| Feature | Target audience impact |
|---|---|
| Workflow execution timeout UI feedback | Removes confusion when a pipeline hangs |
| Pipeline sharing (export/import JSON) | Enables community workflow sharing |
| More MCP server templates in Settings | Lowers the "how do I connect X" question |
| Agent marketplace / community workflows | Network effects, long-term retention |
| `pip install agentmesh` Python SDK | Persona A programmatic access |

---

## 9. Demo Video Plan

A great demo video is the single highest-leverage asset for this project. It will live on the README, the landing page, and be shared everywhere. Target length: **90 seconds.**

### Structure (90-second script)

| Timestamp | What's shown | Narration |
|---|---|---|
| 0:00–0:08 | Landing page loads, hero animates in | *"Most AI agent frameworks are black boxes. AgentMesh makes the whole thing visible."* |
| 0:08–0:20 | Open dashboard, Build mode — drag 3 nodes onto canvas (LLM Agent → Tool → Human Gate), connect them | *"Drag nodes onto the canvas to build your pipeline. LLM agents, MCP tools, human approval gates."* |
| 0:20–0:30 | Configure an LLM Agent node in the right inspector — type a system prompt, select model | *"Configure each agent — model, system prompt, temperature — right in the inspector."* |
| 0:30–0:40 | Switch to Run mode, type a task, click Run | *"Switch to Run mode, give it a task, and hit Run."* |
| 0:40–0:65 | Mission Control: agent sidebar shows status dots going active/thinking, canvas nodes glow, tool call inspector fills with github.search_code calls, message stream scrolls | *"Watch every decision in real-time. Which agent is active. Which MCP tool it's calling. What the output looks like."* |
| 0:65–0:75 | Settings page — connect a new MCP server (paste URL, hit connect) | *"Connect any MCP server from Settings — filesystem, GitHub, or your own."* |
| 0:75–0:90 | Back to landing page CTA. GitHub star count. | *"Self-hosted, open source, MIT licensed. Your keys never leave your server."* |

### Recording Setup

**Tools:**
- Screen recorder: [OBS Studio](https://obsproject.com) (free) or [Loom](https://loom.com) for quick recording
- Editing: [CapCut](https://capcut.com) (free, fast) or DaVinci Resolve for more control
- Audio: External mic if available; use noise suppression in OBS

**Before recording:**
1. Run `make dev` and verify everything is working
2. Pre-load the Research Synthesis template so the pipeline is already there
3. Pre-seed the database with a completed run so the message stream shows populated data on first load
4. Set browser zoom to 90% for more canvas space
5. Use a clean browser profile with no extensions visible in the tab bar
6. Record at 1920×1080 minimum; the dashboard is desktop-only

**Post-production checklist:**
- Add captions (CapCut auto-captions or Rev.ai)
- Add subtle background music (Pixabay royalty-free)
- Export as MP4 and WebM (for landing page autoplay)
- Upload to YouTube (unlisted is fine) and embed in README using a thumbnail image linking to YouTube
- Host the WebM directly on the landing page for autoplay hero

---

## 10. Deployment Guide

### Option A — Render + Neon (Recommended for demos, free tier)

**Backend on Render:**

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - Build command: `uv sync && uv run alembic upgrade head`
   - Start command: `.venv/bin/uvicorn backend.api.routes:app --host 0.0.0.0 --port $PORT`
   - Runtime: Python 3.11
5. Add all environment variables from `.env` in the Render dashboard
6. Deploy — Render gives you a URL like `https://agentmesh-api.onrender.com`

**Frontend on Vercel:**

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set root directory to `frontend`
3. Add environment variables:
   - `FASTAPI_URL` = your Render URL
   - `NEXTAUTH_URL` = your Vercel URL
   - All Google OAuth and auth variables
4. Deploy — Vercel gives you `https://agentmesh.vercel.app`

**Database:**
- Create a free [Neon](https://neon.tech) PostgreSQL database
- Copy the connection string into `DATABASE_CONN` on Render

**Total cost: $0/month** on free tiers. Render spins down after 15 minutes of inactivity (add a UptimeRobot ping to keep it warm for a demo).

---

### Option B — Railway (Better for persistent workloads)

Railway keeps your service running continuously on the free tier.

1. Install Railway CLI: `npm i -g @railway/cli`
2. `railway login && railway init`
3. `railway up` — Railway auto-detects the Dockerfile
4. Add a PostgreSQL plugin from the Railway dashboard
5. Set all env vars via Railway dashboard or `railway variables set KEY=value`

---

### Option C — VPS / Self-Hosted (Production)

For teams self-hosting on DigitalOcean, Hetzner, or AWS EC2:

```bash
# On your server
git clone https://github.com/yourusername/agentmesh.git
cd agentmesh
cp .env.example .env
# Fill in .env

docker-compose up -d
```

The included `docker-compose.yml` runs the backend, frontend, and a PostgreSQL container. Add an Nginx reverse proxy and Let's Encrypt cert for HTTPS.

**Minimum server spec:** 1 vCPU, 1GB RAM (Hetzner CX11 = €3.79/month)

---

### Environment Variables in Production

Never commit `.env` to git. Use:
- Render/Vercel/Railway secret management for cloud deploys
- Docker secrets or a `.env` file outside the repo for self-hosted

**Generate production keys:**
```bash
# Encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Auth secret
openssl rand -base64 32
```

---

## 11. Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Run tests: `uv run pytest`
4. Open a pull request against `main`

Issues, feature requests, and workflow contributions are welcome. If you build a useful MCP server integration or pipeline template, please share it.

---

## License

MIT — use it, fork it, build on it.
