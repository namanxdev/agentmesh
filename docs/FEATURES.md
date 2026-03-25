# 🎯 AgentMesh — Feature Breakdown

> Complete feature documentation for the AgentMesh multi-agent orchestrator platform.

---

## Table of Contents

- [Core Features](#core-features)
- [Agent Definition Layer](#agent-definition-layer)
- [MCP Integration](#mcp-integration)
- [Orchestration Engine](#orchestration-engine)
- [Mission Control Dashboard](#mission-control-dashboard)
- [Real-Time Event System](#real-time-event-system)
- [Demo Workflows](#demo-workflows)
- [MVP Scope & Boundaries](#mvp-scope--boundaries)

---

## Core Features

### 🧠 1. Agent Definition Layer (Python)

Define specialized AI agents as first-class Python objects with declarative configuration.

```python
from agentmesh import Agent

code_reviewer = Agent(
    name="CodeReviewer",
    role="Senior Code Reviewer",
    system_prompt="""You are an expert code reviewer. Analyze code for:
    - Security vulnerabilities
    - Performance bottlenecks
    - Best practice violations
    - Readability and maintainability""",
    mcp_servers=["github", "filesystem"],
    handoff_rules={
        "on_complete": "SummaryAgent",
        "on_error": "DebugAgent"
    },
    config={
        "model": "gemini-2.0-flash",
        "temperature": 0.3,
        "max_tokens": 4096
    }
)
```

**Key capabilities:**

| Feature | Description |
|---------|-------------|
| **Role Assignment** | Named roles with purpose-driven system prompts |
| **MCP Binding** | Each agent connects to one or more MCP servers |
| **Handoff Rules** | Declarative routing — who to pass work to and when |
| **Model Config** | Per-agent LLM config (model, temp, tokens) |
| **Tool Scoping** | Restrict which MCP tools an agent can call |
| **Memory** | In-memory conversation context per workflow run |

---

### 🔌 2. MCP Client Integration

Each agent acts as an MCP client, connecting to external MCP servers to gain capabilities.

```python
from agentmesh.mcp import MCPConnection, MCPRegistry

# Register available MCP servers
registry = MCPRegistry()
registry.register("github", transport="stdio", command="mcp-server-github")
registry.register("filesystem", transport="stdio", command="mcp-server-filesystem", args=["./workspace"])
registry.register("web-search", transport="sse", url="http://localhost:3001/sse")

# Agents auto-discover available tools from their MCP servers
agent = Agent(
    name="Researcher",
    mcp_servers=[registry.get("web-search"), registry.get("filesystem")]
)
# Agent now has access to: web_search, read_file, write_file, etc.
```

**Supported MCP Servers:**

| Server | Transport | Capabilities |
|--------|-----------|-------------|
| **Filesystem** | stdio | Read/write files, list directories |
| **GitHub** | stdio | Search repos, read files, create issues/PRs |
| **Web Search** | SSE | Brave/Google search, fetch web pages |
| **Database** | stdio | Query SQL databases |
| **Custom** | stdio/SSE | Any MCP-compliant server |

**Integration features:**
- Auto-discovery of tools from connected MCP servers
- Tool call routing — the orchestrator dispatches tool calls to the correct agent
- Streaming tool results back to the event bus
- Connection pooling and health checks
- Graceful degradation when an MCP server is unavailable

---

### 🔄 3. Orchestration Engine (LangGraph)

The orchestration layer uses LangGraph to define multi-agent workflows as state machines.

```python
from agentmesh import Workflow, HandoffRule

workflow = Workflow(
    name="code-review-pipeline",
    description="Automated multi-agent code review",
    agents=[fetcher, reviewer, security_scanner, summarizer],
    
    # Define the execution graph
    graph={
        "start": "fetcher",
        "fetcher": {
            "on_complete": "reviewer",
            "on_error": "summarizer"
        },
        "reviewer": {
            "on_complete": "security_scanner",
            "on_needs_clarification": "fetcher"
        },
        "security_scanner": {
            "on_complete": "summarizer"
        },
        "summarizer": {
            "on_complete": "end"
        }
    },
    
    # Shared state accessible by all agents
    initial_state={
        "repository": "",
        "branch": "main",
        "findings": [],
        "severity_counts": {"critical": 0, "warning": 0, "info": 0}
    }
)
```

**State machine features:**

| Feature | Description |
|---------|-------------|
| **Directed Graph** | Agents form nodes, handoffs form edges |
| **Conditional Routing** | Route based on agent output (complete, error, clarification) |
| **Shared State** | All agents read/write to a shared state object |
| **Checkpoints** | Snapshot state at each node for debugging |
| **Parallel Execution** | Fork execution to multiple agents simultaneously |
| **Cycle Detection** | Prevent infinite loops with max-iteration guards |

---

### 🛰️ 4. Mission Control Dashboard

A real-time visual dashboard showing the entire multi-agent system at a glance.

**Dashboard Sections:**

#### 4a. Agent Graph View
- Interactive node-graph visualization of all agents
- Animated edges showing active message flow
- Node colors indicate status: idle (gray), active (green), error (red)
- Click any node to see agent details, prompts, and connected MCP servers

#### 4b. Live Message Stream
- Scrolling feed of every inter-agent message
- Syntax-highlighted tool call payloads
- Collapsible message details (full prompt, response, tokens used)
- Filter by agent, message type, or severity

#### 4c. Tool Call Inspector
- Real-time log of every MCP tool invocation
- Request/response pairs with timing
- Tool call success/failure indicators
- Expandable JSON payloads

#### 4d. Token Usage Monitor
- Per-agent token consumption (input + output)
- Running total across the workflow
- Cost estimation based on model pricing
- Visual bar charts with animated counters

#### 4e. Workflow Timeline
- Gantt-chart-style timeline of agent execution
- Duration per agent step
- Parallel execution visualization
- Hover for detailed timing breakdown

---

### 📡 5. Real-Time Event System

Every action in the system is emitted as a structured WebSocket event.

```typescript
// Event types emitted by the backend
type AgentMeshEvent =
  | { type: "workflow.started"; workflowId: string; timestamp: number }
  | { type: "agent.activated"; agentName: string; taskDescription: string }
  | { type: "agent.thinking"; agentName: string; partialResponse: string }
  | { type: "tool.called"; agentName: string; tool: string; args: object }
  | { type: "tool.result"; agentName: string; tool: string; result: object }
  | { type: "agent.handoff"; from: string; to: string; reason: string }
  | { type: "agent.completed"; agentName: string; output: string }
  | { type: "token.usage"; agentName: string; input: number; output: number }
  | { type: "workflow.completed"; result: object; totalTokens: number }
  | { type: "workflow.error"; error: string; failedAgent: string };
```

**Event bus features:**
- WebSocket with auto-reconnect
- Event buffering for late-joining clients
- Event filtering per subscription
- Structured JSON payloads
- Event replay for debugging

---

### 🎪 6. Demo Workflows

#### Demo 1: GitHub Code Review Pipeline

```
User provides: repository URL + branch name
                    │
                    ▼
        ┌───────────────────┐
        │   Fetch Agent     │  ← GitHub MCP: clone, read files
        │   (Code Fetcher)  │
        └────────┬──────────┘
                 │
                 ▼
        ┌───────────────────┐
        │  Review Agent     │  ← Gemini: analyze code quality
        │  (Code Reviewer)  │
        └────────┬──────────┘
                 │
                 ▼
        ┌───────────────────┐
        │  Security Agent   │  ← Groq: fast security scan
        │  (Vuln Scanner)   │
        └────────┬──────────┘
                 │
                 ▼
        ┌───────────────────┐
        │  Summary Agent    │  ← Filesystem MCP: write report
        │  (Report Writer)  │
        └───────────────────┘
                 │
                 ▼
         📄 Review Report (Markdown)
```

#### Demo 2: Research Synthesis

```
User provides: research question
                    │
                    ▼
        ┌───────────────────┐
        │  Search Agent     │  ← Web Search MCP: find sources
        │  (Web Researcher) │
        └────────┬──────────┘
                 │
                 ▼
        ┌───────────────────┐
        │  Extract Agent    │  ← Web MCP: read page content
        │  (Content Reader) │
        └────────┬──────────┘
                 │
                 ▼
        ┌───────────────────┐
        │  Analyst Agent    │  ← Gemini: synthesize findings
        │  (Data Analyst)   │
        └────────┬──────────┘
                 │
                 ▼
        ┌───────────────────┐
        │  Writer Agent     │  ← Filesystem MCP: save output
        │  (Report Writer)  │
        └───────────────────┘
                 │
                 ▼
         📄 Research Report (Markdown)
```

---

## MVP Scope & Boundaries

### ✅ Included in MVP

| Feature | Status |
|---------|--------|
| Agent definition layer (Python) | 🟢 Core |
| MCP client integration (stdio + SSE) | 🟢 Core |
| LangGraph orchestration engine | 🟢 Core |
| WebSocket real-time event bus | 🟢 Core |
| Mission Control dashboard | 🟢 Core |
| GitHub code review demo workflow | 🟢 Demo |
| Research synthesis demo workflow | 🟢 Demo |
| `pip install agentmesh` | 🟢 Distribution |
| Hosted demo on Vercel + Render | 🟢 Deployment |

### 🚫 Explicitly Cut from MVP

| Feature | Reason |
|---------|--------|
| Authentication / Auth | Complexity — add in v2 |
| Persistent storage | In-memory only for simplicity |
| Custom agent builder UI | Focus on code-first experience |
| Paid LLM APIs | Free-tier only (Gemini + Groq) |
| Multi-tenant support | Single-user for MVP |
| Agent marketplace | Future feature |
| Custom MCP server creation | Users bring existing servers |

---

## Feature Roadmap

### v1.0 (MVP) — Current
- Core agent definition & orchestration
- MCP integration
- Mission Control dashboard
- 2 demo workflows

### v1.1
- Agent builder UI (drag-and-drop)
- Persistent workflow history (SQLite)
- Additional LLM providers (OpenAI, Anthropic)

### v1.2
- Authentication & multi-user
- Agent marketplace
- Custom MCP server templates
- Workflow templates library

### v2.0
- Cloud-hosted agent infrastructure
- Team collaboration features
- Enterprise integrations
- Advanced monitoring & analytics
