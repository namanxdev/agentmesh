# AgentMesh

**Self-hosted visual multi-agent AI pipelines — MCP-native, bring your own keys, monitor everything in real-time.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## What is AgentMesh?

AgentMesh is a self-hosted platform for building and running multi-agent AI pipelines with a visual drag-and-drop canvas. Define agents, connect them to any MCP server, and orchestrate collaborative workflows — while monitoring every step in real-time.

Built for developer teams who want full control over their AI infrastructure. Your LLM keys never leave your server.

![AgentMesh Dashboard](landing-desktop-full-updated.png)

---

## Features

### What works today
- **Visual pipeline builder** — drag-and-drop canvas with 8 node types: Input, Output, LLM Agent, Tool, Text, Router, Memory, Transform
- **Sequential multi-agent orchestration** — agents hand off to each other via configurable routing rules
- **MCP-native** — connect any MCP server (GitHub, filesystem, web search, custom) to your agents via FastMCP
- **Multi-LLM support** — Gemini, Groq (Llama), and OpenAI behind a unified provider interface
- **BYOK (bring your own keys)** — per-user AES-256 encrypted key storage; your keys, your spend
- **Real-time monitoring** — WebSocket event streaming: agent status, tool calls, token usage, output — all live
- **Pipeline save / load** — save pipelines to your account and reload them anytime
- **Pipeline templates** — pre-built Research Synthesis and GitHub Code Review workflows to get started immediately
- **Run history** — every pipeline run is logged with status, duration, and token count
- **Google OAuth** — authentication via NextAuth v5

### Roadmap
- 🔜 Docker Compose one-command setup
- 🔜 Parallel agent execution (true mesh topology)
- 🔜 User-managed MCP server configuration UI
- 🔜 Webhook / cron pipeline triggers
- 🔜 Pipeline sharing and marketplace
- 🔜 PyPI package (`pip install agentmesh`)

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL database ([Neon](https://neon.tech) free tier works)
- [`uv`](https://github.com/astral-sh/uv) package manager: `pip install uv`

### 1. Clone and configure

```bash
git clone https://github.com/yourusername/agentmesh.git
cd agentmesh
cp .env.example .env
```

Edit `.env` — minimum required:

| Variable | Where to get it |
|----------|----------------|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API key |
| `DATABASE_CONN` | Your PostgreSQL connection string |
| `ENCRYPTION_KEY` | `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `AUTH_SECRET` | `openssl rand -base64 32` |

Copy the frontend block from `.env.example` into `frontend/.env.local`.

### 2. Start the backend

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn backend.api.routes:app --reload --port 8000
```

Backend runs at `http://localhost:8000` · WebSocket at `ws://localhost:8000/ws/events`

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Landing page |
| `http://localhost:3000/dashboard` | Pipeline builder + Mission Control |
| `http://localhost:3000/settings` | API key management |

---

## How It Works

1. **Build** — drag nodes onto the canvas, connect them, configure each node in the inspector panel
2. **Validate** — click Validate to check for DAG errors before running
3. **Run** — enter a task, hit Run; the pipeline definition is sent to the FastAPI backend
4. **Execute** — the `WorkflowOrchestrator` runs agents sequentially; each agent calls the LLM and any connected MCP tools
5. **Monitor** — events stream back via WebSocket in real-time: agent status, tool calls, token usage, final output

---

## Architecture

```
agentmesh/
├── backend/
│   ├── agents/          # Agent class, registry, system prompts
│   ├── api/             # FastAPI routes, WebSocket handler, auth middleware
│   ├── crypto.py        # Fernet AES-256 key encryption
│   ├── db/              # SQLAlchemy async models + Alembic migrations
│   ├── events/          # WebSocket EventBus (100-event circular buffer)
│   ├── llm/             # Gemini, Groq, OpenAI providers + MultiProvider router
│   ├── mcp/             # FastMCP client wrapper + server registry
│   ├── orchestrator/    # WorkflowOrchestrator sequential state machine
│   ├── pipelines/       # DAG validator, pipeline→workflow converter, templates
│   └── workflows/       # Demo workflow agent definitions
├── frontend/
│   ├── app/             # Next.js pages: landing, dashboard, settings, auth
│   ├── components/      # Pipeline canvas, dashboard panels, UI primitives
│   ├── hooks/           # useAgentMeshEvents, useWebSocket (auto-reconnect)
│   ├── stores/          # Zustand: pipeline state, event stream, UI state
│   └── types/           # TypeScript types for nodes, edges, events
├── docs/                # Architecture and design documentation
├── docker-compose.yml   # One-command setup (coming soon)
└── .env.example         # All environment variables with descriptions
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + uvicorn |
| Orchestration | Custom `WorkflowOrchestrator` (sequential state machine) |
| MCP | FastMCP |
| LLM | Gemini API, Groq, OpenAI via unified `MultiProvider` |
| Frontend | Next.js 16, React 19 |
| State management | Zustand 5 |
| Visual canvas | React Flow (`@xyflow/react` 12) |
| Animations | Framer Motion |
| Auth | NextAuth v5 + Google OAuth |
| Database | PostgreSQL via SQLAlchemy async + Alembic |
| Encryption | Fernet (AES-256) |
| Real-time | WebSocket (custom `EventBus` with 100-event buffer) |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | One of these | Gemini 2.0 Flash / Pro |
| `GROQ_API_KEY` | One of these | Llama 3.3 70B via Groq |
| `OPENAI_API_KEY` | One of these | GPT-4o / GPT-4o-mini |
| `DATABASE_CONN` | Yes | PostgreSQL connection string |
| `ENCRYPTION_KEY` | Yes | Fernet key for per-user API key encryption |
| `GITHUB_TOKEN` | Optional | Enables GitHub MCP server for code review pipeline |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth (demo workflows) |
| `AUTH_SECRET` | Yes (frontend) | NextAuth secret |
| `GOOGLE_CLIENT_ID` | Yes (frontend) | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes (frontend) | Google OAuth client secret |
| `NEXTAUTH_URL` | Yes (frontend) | Your app URL, e.g. `http://localhost:3000` |
| `FASTAPI_URL` | Yes (frontend) | Backend URL, e.g. `http://localhost:8000` |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and test them
4. Open a pull request

---

## License

MIT
