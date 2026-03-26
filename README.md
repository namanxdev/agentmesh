# 🕸️ AgentMesh

<div align="center">

**MCP-Native Multi-Agent Orchestrator with Live Mission Control**

*Define specialized AI agents, connect them to any MCP server, and orchestrate collaborative workflows — with a real-time WebSocket "mission control" UI.*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[Live Demo](https://agentmesh.vercel.app) · [Documentation](./docs) · [Get Started](#quick-start) · [Contributing](#contributing)

</div>

---

## ✨ What is AgentMesh?

AgentMesh is an open-source Python framework + visual dashboard that lets you:

- **Define specialized AI agents** with roles, system prompts, MCP server connections, and handoff rules
- **Connect to any MCP server** — filesystem, GitHub, web search, databases, and more
- **Orchestrate multi-agent workflows** using LangGraph's state machine architecture
- **Monitor everything in real-time** through a stunning WebSocket-powered Mission Control dashboard

> Think of it as **Kubernetes for AI agents** — but with a beautiful control plane.

---

## 🎬 Preview

```
┌─────────────────────────────────────────────────────────┐
│  🛰️ MISSION CONTROL                                     
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │ Research │───▶│ Analyst  │───▶│ Writer   │           │
│  │ Agent    │    │ Agent    │    │ Agent    │           │
│  └──────────┘    └──────────┘    └──────────┘           │
│       │               │               │                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│  │ Web MCP │    │ GH MCP  │    │ FS MCP  │              │
│  └─────────┘    └─────────┘    └─────────┘              │
│                                                         │
│  📊 Live Token Usage  │  🔄 Active Tasks  │  📝 Logs   │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Installation

```bash
pip install agentmesh
```

### Define Your First Workflow

```python
from agentmesh import Agent, Workflow, MCPConnection

# Define agents with MCP connections
researcher = Agent(
    name="Researcher",
    role="Research specialist",
    system_prompt="You are a thorough researcher...",
    mcp_servers=[
        MCPConnection("web-search"),
        MCPConnection("filesystem")
    ]
)

analyst = Agent(
    name="Analyst",
    role="Data analyst",
    system_prompt="You analyze research data...",
    mcp_servers=[MCPConnection("github")]
)

# Create workflow with handoff rules
workflow = Workflow(
    agents=[researcher, analyst],
    handoff_rules={
        "researcher": ["analyst"],
        "analyst": ["researcher"]
    }
)

# Execute with real-time monitoring
result = await workflow.run(
    task="Analyze the latest trends in AI agent frameworks"
)
```

### Launch Mission Control

```bash
agentmesh serve --port 8000
```

Open `http://localhost:8000` to see the live Mission Control dashboard.

---

## 🖥️ Running Locally

### 1. Clone & configure environment

```bash
git clone https://github.com/yourusername/agentmesh.git
cd agentmesh
cp .env.example .env
```

Edit `.env` and fill in your keys:

| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API key |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `GITHUB_CLIENT_ID` | GitHub → Settings → Developer settings → OAuth Apps |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens |

### 2. Start the backend

```bash
# Install dependencies (Python 3.11+, uv required)
uv sync

# Start FastAPI server with hot-reload
uv run uvicorn backend.api.routes:app --reload --port 8000
```

Backend runs at `http://localhost:8000` · WebSocket at `ws://localhost:8000/ws/events`

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

| Route | Description |
|---|---|
| `http://localhost:3000` | Landing page |
| `http://localhost:3000/dashboard` | Mission Control (live agent monitoring) |

> **Note**: Install `uv` with `pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`

---

## 🏗️ Architecture

```
agentmesh/
├── backend/                    # FastAPI + LangGraph + FastMCP
│   ├── agents/                 # Agent definition layer
│   │   ├── base.py            # Base agent class
│   │   ├── registry.py        # Agent registry & discovery
│   │   └── prompts/           # System prompt templates
│   ├── orchestrator/          # LangGraph workflow engine
│   │   ├── graph.py           # State machine definitions
│   │   ├── state.py           # Shared state management
│   │   └── handoff.py         # Agent handoff logic
│   ├── mcp/                   # MCP client integration
│   │   ├── client.py          # FastMCP client wrapper
│   │   ├── registry.py        # MCP server registry
│   │   └── tools.py           # Tool call abstraction
│   ├── events/                # Real-time event system
│   │   ├── bus.py             # WebSocket event bus
│   │   ├── models.py          # Event type definitions
│   │   └── stream.py          # SSE/WebSocket streaming
│   ├── llm/                   # LLM provider abstraction
│   │   ├── gemini.py          # Gemini API integration
│   │   ├── groq.py            # Groq API integration
│   │   └── base.py            # Base LLM interface
│   └── api/                   # FastAPI routes
│       ├── routes.py          # REST endpoints
│       └── websocket.py       # WebSocket handlers
│
├── frontend/                   # Next.js Mission Control UI
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   │   ├── dashboard/         # Mission control views
│   │   ├── agents/            # Agent visualization
│   │   ├── graph/             # Workflow graph renderer
│   │   └── ui/                # Shared UI primitives
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities & WebSocket client
│   └── styles/                # Global styles & theme
│
├── examples/                   # Demo workflows
│   ├── github_review.py       # GitHub code review pipeline
│   └── research_synthesis.py  # Research synthesis workflow
│
└── docs/                       # Documentation
```

---

## 📦 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | FastAPI | REST API + WebSocket server |
| **Orchestration** | LangGraph | Agent workflow state machines |
| **MCP Client** | FastMCP | Connect agents to MCP servers |
| **LLM** | Gemini API + Groq | AI inference (free tiers) |
| **Frontend** | Next.js 15 | Mission Control dashboard |
| **UI Components** | shadcn/ui + Aceternity UI + Magic UI | Premium component library |
| **Animations** | Framer Motion | Smooth micro-interactions |
| **Real-time** | WebSocket | Live event streaming |
| **Deploy** | Vercel + Render | Free-tier hosting |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**FEATURES.md**](./docs/FEATURES.md) | Complete feature breakdown & capabilities |
| [**DESIGN.md**](./docs/DESIGN.md) | UI/UX design system, themes, and visual language |
| [**IMPLEMENTATION.md**](./docs/IMPLEMENTATION.md) | Technical implementation guide & architecture deep-dive |
| [**COMPONENTS.md**](./docs/COMPONENTS.md) | Frontend component library documentation |
| [**API.md**](./docs/API.md) | Backend API reference & WebSocket protocol |
| [**WORKFLOWS.md**](./docs/WORKFLOWS.md) | Demo workflow documentation & examples |

---

## 🎯 Demo Workflows

### 1. GitHub Code Review Pipeline
```
User Request → Research Agent (web search) → Code Agent (GitHub MCP)
→ Review Agent (analysis) → Summary Agent (report generation)
```

### 2. Research Synthesis
```
User Query → Search Agent (web MCP) → Data Agent (filesystem MCP)
→ Analyst Agent (synthesis) → Writer Agent (formatted output)
```

---

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repo
git clone https://github.com/yourusername/agentmesh.git
cd agentmesh

# Install backend dependencies
pip install -e ".[dev]"

# Install frontend dependencies
cd frontend && npm install

# Run development servers
agentmesh dev  # Starts both backend + frontend
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the AI agent community**

[⭐ Star on GitHub](https://github.com/yourusername/agentmesh) · [🐛 Report Bug](https://github.com/yourusername/agentmesh/issues) · [💡 Request Feature](https://github.com/yourusername/agentmesh/issues)

</div>
