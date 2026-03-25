# 🔧 AgentMesh — Implementation Guide

> Technical architecture deep-dive, backend/frontend implementation details, and development setup.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [WebSocket Protocol](#websocket-protocol)
- [Development Setup](#development-setup)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐│
│  │ Landing Page  │  │ Mission      │  │ Workflow Config           ││
│  │ (Marketing)   │  │ Control      │  │ (YAML/JSON editor)       ││
│  └──────────────┘  └──────┬───────┘  └───────────────────────────┘│
│                           │ WebSocket                              │
├───────────────────────────┼────────────────────────────────────────┤
│                           │                                        │
│                    BACKEND (FastAPI)                                │
│  ┌────────────────────────┴────────────────────────────────────┐  │
│  │                    API Layer (REST + WS)                     │  │
│  ├─────────────┬──────────────┬──────────────┬────────────────┤  │
│  │ Agent       │ Orchestrator │ Event Bus    │ LLM Provider   │  │
│  │ Registry    │ (LangGraph)  │ (WebSocket)  │ (Gemini/Groq)  │  │
│  ├─────────────┴───────┬──────┴──────────────┴────────────────┤  │
│  │                     │                                       │  │
│  │              MCP Client Layer (FastMCP)                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │  │
│  │  │Filesystem│ │ GitHub   │ │Web Search│ │ Custom   │     │  │
│  │  │MCP Server│ │MCP Server│ │MCP Server│ │MCP Server│     │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User submits workflow task via REST API or Dashboard UI
2. API creates a Workflow instance with defined agents
3. LangGraph initializes the state machine graph
4. First agent in the graph is activated
5. Agent queries LLM (Gemini/Groq) with system prompt + task
6. If LLM requests tool calls → agent dispatches via MCP client
7. MCP client executes tool on appropriate MCP server
8. Every step emits events to WebSocket event bus
9. Frontend receives events and updates Mission Control in real-time
10. Agent completes → handoff to next agent per graph rules
11. Workflow completes when terminal node is reached
```

---

## Backend Implementation

### Tech Stack Detail

| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| Web Framework | FastAPI | 0.110+ | REST API + WebSocket |
| Agent Orchestration | LangGraph | 0.2+ | State machine workflows |
| MCP Client | FastMCP | 1.0+ | MCP protocol client |
| LLM (Primary) | google-genai | latest | Gemini 2.0 Flash |
| LLM (Secondary) | groq | latest | Llama 3.3 70B |
| Async Runtime | uvicorn | 0.29+ | ASGI server |
| Data Validation | Pydantic | 2.0+ | Type-safe models |
| WebSocket | websockets | 12+ | Bi-directional comms |

---

### Agent Definition Layer

#### `backend/agents/base.py`

```python
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class AgentStatus(str, Enum):
    IDLE = "idle"
    ACTIVE = "active"
    THINKING = "thinking"
    TOOL_CALLING = "tool_calling"
    COMPLETED = "completed"
    ERROR = "error"

class AgentConfig(BaseModel):
    """Configuration for a single agent."""
    name: str = Field(..., description="Unique agent identifier")
    role: str = Field(..., description="Agent's role description")
    system_prompt: str = Field(..., description="System prompt defining behavior")
    mcp_servers: list[str] = Field(default_factory=list, description="MCP server names to connect")
    handoff_rules: dict[str, str] = Field(default_factory=dict, description="Conditional handoff map")
    model: str = Field(default="gemini-2.0-flash", description="LLM model to use")
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=4096, gt=0)

class Agent:
    """Runtime agent instance."""
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.status = AgentStatus.IDLE
        self.mcp_clients: dict[str, MCPClient] = {}
        self.token_usage = {"input": 0, "output": 0}
        self.message_history: list[dict] = []
    
    async def initialize(self, mcp_registry: MCPRegistry):
        """Connect to configured MCP servers and discover tools."""
        for server_name in self.config.mcp_servers:
            client = await mcp_registry.get_client(server_name)
            self.mcp_clients[server_name] = client
    
    async def process(self, task: str, state: dict) -> AgentResult:
        """Process a task using LLM + MCP tools."""
        self.status = AgentStatus.THINKING
        
        # Build messages with system prompt + conversation history
        messages = self._build_messages(task, state)
        
        # Get available tools from connected MCP servers
        tools = self._get_available_tools()
        
        # Call LLM with tool definitions
        response = await self.llm.generate(
            messages=messages,
            tools=tools,
            model=self.config.model,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens
        )
        
        # Process tool calls if any
        while response.has_tool_calls:
            self.status = AgentStatus.TOOL_CALLING
            tool_results = await self._execute_tool_calls(response.tool_calls)
            response = await self.llm.generate(
                messages=messages + tool_results,
                tools=tools
            )
        
        self.status = AgentStatus.COMPLETED
        return AgentResult(
            output=response.text,
            next_agent=self._determine_handoff(response),
            token_usage=response.usage
        )
```

#### `backend/agents/registry.py`

```python
class AgentRegistry:
    """Central registry for all agent definitions."""
    
    def __init__(self):
        self._agents: dict[str, Agent] = {}
    
    def register(self, config: AgentConfig) -> Agent:
        """Register a new agent configuration."""
        agent = Agent(config)
        self._agents[config.name] = agent
        return agent
    
    def get(self, name: str) -> Agent:
        """Get agent by name."""
        return self._agents[name]
    
    def list_all(self) -> list[Agent]:
        """List all registered agents."""
        return list(self._agents.values())
    
    def get_status_map(self) -> dict[str, AgentStatus]:
        """Get current status of all agents."""
        return {name: agent.status for name, agent in self._agents.items()}
```

---

### MCP Client Integration

#### `backend/mcp/client.py`

```python
from fastmcp import Client

class MCPClientWrapper:
    """Wrapper around FastMCP client with event emission."""
    
    def __init__(self, server_name: str, transport_config: dict, event_bus: EventBus):
        self.server_name = server_name
        self.transport_config = transport_config
        self.event_bus = event_bus
        self._client: Optional[Client] = None
        self._tools: list[dict] = []
    
    async def connect(self):
        """Establish connection to MCP server."""
        self._client = Client(self.transport_config)
        await self._client.connect()
        
        # Discover available tools
        tools_response = await self._client.list_tools()
        self._tools = [
            {
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.input_schema
            }
            for tool in tools_response.tools
        ]
    
    async def call_tool(self, agent_name: str, tool_name: str, args: dict) -> dict:
        """Execute a tool call on the MCP server."""
        # Emit event before call
        await self.event_bus.emit({
            "type": "tool.called",
            "agentName": agent_name,
            "server": self.server_name,
            "tool": tool_name,
            "args": args,
            "timestamp": time.time()
        })
        
        # Execute tool
        result = await self._client.call_tool(tool_name, args)
        
        # Emit result event
        await self.event_bus.emit({
            "type": "tool.result",
            "agentName": agent_name,
            "server": self.server_name,
            "tool": tool_name,
            "result": result.content,
            "timestamp": time.time()
        })
        
        return result.content
    
    def get_tool_definitions(self) -> list[dict]:
        """Get OpenAI-compatible tool definitions for LLM."""
        return [
            {
                "type": "function",
                "function": {
                    "name": f"{self.server_name}__{tool['name']}",
                    "description": tool["description"],
                    "parameters": tool["input_schema"]
                }
            }
            for tool in self._tools
        ]
```

#### `backend/mcp/registry.py`

```python
class MCPRegistry:
    """Registry of available MCP servers."""
    
    def __init__(self, event_bus: EventBus):
        self._servers: dict[str, MCPClientWrapper] = {}
        self.event_bus = event_bus
    
    def register(self, name: str, **transport_config):
        """Register an MCP server configuration."""
        client = MCPClientWrapper(name, transport_config, self.event_bus)
        self._servers[name] = client
    
    async def connect_all(self):
        """Connect to all registered MCP servers."""
        for name, client in self._servers.items():
            try:
                await client.connect()
            except Exception as e:
                await self.event_bus.emit({
                    "type": "mcp.connection_error",
                    "server": name,
                    "error": str(e)
                })
    
    async def get_client(self, name: str) -> MCPClientWrapper:
        """Get a connected MCP client by server name."""
        return self._servers[name]
```

---

### Orchestration Engine (LangGraph)

#### `backend/orchestrator/graph.py`

```python
from langgraph.graph import StateGraph, END

class WorkflowOrchestrator:
    """Builds and executes LangGraph workflows from agent definitions."""
    
    def __init__(self, agents: list[Agent], graph_config: dict, event_bus: EventBus):
        self.agents = {a.config.name: a for a in agents}
        self.graph_config = graph_config
        self.event_bus = event_bus
        self._graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Construct LangGraph state machine from config."""
        graph = StateGraph(WorkflowState)
        
        # Add agent nodes
        for name, agent in self.agents.items():
            graph.add_node(name, self._create_agent_node(agent))
        
        # Add edges from graph config
        start_node = self.graph_config.get("start")
        graph.set_entry_point(start_node)
        
        for source, transitions in self.graph_config.items():
            if source == "start":
                continue
            if isinstance(transitions, str):
                # Simple linear transition
                target = transitions if transitions != "end" else END
                graph.add_edge(source, target)
            elif isinstance(transitions, dict):
                # Conditional transitions
                graph.add_conditional_edges(
                    source,
                    self._create_router(transitions),
                    {k: (v if v != "end" else END) for k, v in transitions.items()}
                )
        
        return graph.compile()
    
    def _create_agent_node(self, agent: Agent):
        """Create a LangGraph node function for an agent."""
        async def node_fn(state: WorkflowState) -> WorkflowState:
            # Emit activation event
            await self.event_bus.emit({
                "type": "agent.activated",
                "agentName": agent.config.name,
                "role": agent.config.role
            })
            
            # Process task
            result = await agent.process(
                task=state.current_task,
                state=state.shared_data
            )
            
            # Update state
            state.messages.append({
                "agent": agent.config.name,
                "content": result.output,
                "timestamp": time.time()
            })
            state.shared_data.update(result.state_updates or {})
            state.token_usage[agent.config.name] = result.token_usage
            state.last_agent = agent.config.name
            state.routing_key = result.routing_key
            
            # Emit completion event
            await self.event_bus.emit({
                "type": "agent.completed",
                "agentName": agent.config.name,
                "output": result.output[:500],
                "tokenUsage": result.token_usage
            })
            
            return state
        
        return node_fn
    
    async def run(self, task: str, initial_state: dict = None) -> WorkflowResult:
        """Execute the workflow."""
        state = WorkflowState(
            current_task=task,
            shared_data=initial_state or {},
            messages=[],
            token_usage={},
        )
        
        await self.event_bus.emit({
            "type": "workflow.started",
            "agents": list(self.agents.keys()),
            "task": task
        })
        
        final_state = await self._graph.ainvoke(state)
        
        await self.event_bus.emit({
            "type": "workflow.completed",
            "result": final_state.messages[-1] if final_state.messages else None,
            "totalTokens": sum(
                u.get("input", 0) + u.get("output", 0) 
                for u in final_state.token_usage.values()
            )
        })
        
        return WorkflowResult(state=final_state)
```

#### `backend/orchestrator/state.py`

```python
from pydantic import BaseModel

class WorkflowState(BaseModel):
    """Shared state passed between all agents in a workflow."""
    current_task: str
    shared_data: dict = {}
    messages: list[dict] = []
    token_usage: dict[str, dict] = {}
    last_agent: str = ""
    routing_key: str = "on_complete"

class WorkflowResult(BaseModel):
    """Final result of a workflow execution."""
    state: WorkflowState
    success: bool = True
    error: Optional[str] = None
    total_duration: float = 0.0
```

---

### Event Bus (WebSocket)

#### `backend/events/bus.py`

```python
import asyncio
import json
import time
from fastapi import WebSocket

class EventBus:
    """WebSocket event bus for real-time event streaming."""
    
    def __init__(self):
        self._subscribers: list[WebSocket] = []
        self._event_buffer: list[dict] = []
        self._buffer_size = 100
    
    async def subscribe(self, ws: WebSocket):
        """Add a WebSocket subscriber and send buffered events."""
        await ws.accept()
        self._subscribers.append(ws)
        
        # Send buffered events to late-joining clients
        for event in self._event_buffer:
            await ws.send_json(event)
    
    def unsubscribe(self, ws: WebSocket):
        """Remove a WebSocket subscriber."""
        self._subscribers.remove(ws)
    
    async def emit(self, event: dict):
        """Broadcast event to all subscribers."""
        event["timestamp"] = event.get("timestamp", time.time())
        event["id"] = str(uuid.uuid4())
        
        # Buffer event
        self._event_buffer.append(event)
        if len(self._event_buffer) > self._buffer_size:
            self._event_buffer.pop(0)
        
        # Broadcast to all subscribers
        disconnected = []
        for ws in self._subscribers:
            try:
                await ws.send_json(event)
            except Exception:
                disconnected.append(ws)
        
        # Clean up disconnected clients
        for ws in disconnected:
            self._subscribers.remove(ws)
```

---

### LLM Provider Abstraction

#### `backend/llm/base.py`

```python
from abc import ABC, abstractmethod

class BaseLLMProvider(ABC):
    """Abstract base for LLM providers."""
    
    @abstractmethod
    async def generate(
        self,
        messages: list[dict],
        tools: list[dict] = None,
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> LLMResponse:
        pass

class LLMResponse(BaseModel):
    text: str
    tool_calls: list[dict] = []
    has_tool_calls: bool = False
    usage: dict = {"input": 0, "output": 0}
```

#### `backend/llm/gemini.py`

```python
import google.generativeai as genai

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
    
    async def generate(self, messages, tools=None, model="gemini-2.0-flash", **kwargs):
        gen_model = genai.GenerativeModel(model)
        response = await gen_model.generate_content_async(
            contents=self._format_messages(messages),
            tools=self._format_tools(tools) if tools else None,
            generation_config=genai.GenerationConfig(
                temperature=kwargs.get("temperature", 0.7),
                max_output_tokens=kwargs.get("max_tokens", 4096)
            )
        )
        return self._parse_response(response)
```

#### `backend/llm/groq.py`

```python
from groq import AsyncGroq

class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.client = AsyncGroq(api_key=api_key)
    
    async def generate(self, messages, tools=None, model="llama-3.3-70b-versatile", **kwargs):
        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 4096)
        )
        return self._parse_response(response)
```

---

### API Layer

#### `backend/api/routes.py`

```python
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AgentMesh API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST Endpoints ──

@app.post("/api/workflows/run")
async def run_workflow(request: WorkflowRunRequest):
    """Start a workflow execution."""
    orchestrator = create_orchestrator(request.workflow_config)
    result = await orchestrator.run(request.task)
    return {"status": "completed", "result": result}

@app.get("/api/agents")
async def list_agents():
    """List all registered agents and their status."""
    return agent_registry.get_status_map()

@app.get("/api/workflows")
async def list_workflows():
    """List available workflow definitions."""
    return workflow_registry.list_all()

@app.get("/api/mcp/servers")
async def list_mcp_servers():
    """List connected MCP servers and their tools."""
    return mcp_registry.get_server_info()

# ── WebSocket Endpoint ──

@app.websocket("/ws/events")
async def websocket_events(ws: WebSocket):
    """Real-time event stream via WebSocket."""
    await event_bus.subscribe(ws)
    try:
        while True:
            # Keep connection alive, receive any client messages
            data = await ws.receive_text()
            # Handle client commands (e.g., filter events, pause)
    except Exception:
        event_bus.unsubscribe(ws)
```

---

## Frontend Implementation

### Tech Stack Detail

| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| Framework | Next.js | 15 | App Router, SSR |
| UI Primitives | shadcn/ui | latest | Buttons, inputs, modals |
| Premium Components | Aceternity UI | latest | Hero sections, bento grids, terminal |
| Animated Components | Magic UI | latest | Number tickers, beams, particles |
| Base Components | HeroUI | latest | Form elements, navigation |
| Animation | Framer Motion | 11+ | Micro-interactions, layouts |
| Graph Visualization | React Flow | 12+ | Agent DAG rendering |
| WebSocket | native | - | Event stream client |
| State Management | Zustand | 5+ | Global UI state |
| Styling | Tailwind CSS | 4+ | Utility-first CSS |

### Key Implementation Patterns

#### WebSocket Hook

```typescript
// hooks/useAgentMeshEvents.ts
import { useEffect, useCallback } from 'react';
import { useEventStore } from '@/stores/eventStore';

export function useAgentMeshEvents() {
  const { addEvent, setConnectionStatus } = useEventStore();
  
  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/ws/events`
    );
    
    ws.onopen = () => setConnectionStatus('connected');
    ws.onclose = () => {
      setConnectionStatus('disconnected');
      // Auto-reconnect after 3s
      setTimeout(() => ws.reconnect(), 3000);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addEvent(data);
    };
    
    return () => ws.close();
  }, []);
}
```

#### Zustand Store

```typescript
// stores/eventStore.ts
import { create } from 'zustand';

interface EventStore {
  events: AgentMeshEvent[];
  agents: Record<string, AgentState>;
  tokenUsage: Record<string, { input: number; output: number }>;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  
  addEvent: (event: AgentMeshEvent) => void;
  setConnectionStatus: (status: string) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  agents: {},
  tokenUsage: {},
  connectionStatus: 'disconnected',
  
  addEvent: (event) =>
    set((state) => {
      const newState = { events: [...state.events, event] };
      
      // Update agent status based on event type
      switch (event.type) {
        case 'agent.activated':
          newState.agents = {
            ...state.agents,
            [event.agentName]: { ...state.agents[event.agentName], status: 'active' },
          };
          break;
        case 'agent.completed':
          newState.agents = {
            ...state.agents,
            [event.agentName]: { ...state.agents[event.agentName], status: 'idle' },
          };
          newState.tokenUsage = {
            ...state.tokenUsage,
            [event.agentName]: event.tokenUsage,
          };
          break;
      }
      
      return newState;
    }),
    
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
```

---

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm 10+
- Gemini API key (free) — [Get one here](https://makersuite.google.com/app/apikey)
- Groq API key (free) — [Get one here](https://console.groq.com)

### Backend Setup

```bash
# Clone repo
git clone https://github.com/yourusername/agentmesh.git
cd agentmesh

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -e ".[dev]"

# Set env variables
cp .env.example .env
# Edit .env with your API keys:
#   GEMINI_API_KEY=your_key_here
#   GROQ_API_KEY=your_key_here

# Run backend
uvicorn backend.api.routes:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set env variables
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Run development server
npm run dev
```

### Combined Development

```bash
# From project root - starts both servers
agentmesh dev
```

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel
# Follow prompts, set env variables in Vercel dashboard
```

### Backend → Render

```yaml
# render.yaml
services:
  - type: web
    name: agentmesh-api
    runtime: python
    buildCommand: pip install -e .
    startCommand: uvicorn backend.api.routes:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: GROQ_API_KEY
        sync: false
```

---

## Project Structure

```
agentmesh/
├── backend/
│   ├── __init__.py
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py              # Agent class + AgentConfig model
│   │   ├── registry.py          # AgentRegistry singleton
│   │   └── prompts/
│   │       ├── code_reviewer.txt
│   │       ├── researcher.txt
│   │       ├── analyst.txt
│   │       └── writer.txt
│   ├── orchestrator/
│   │   ├── __init__.py
│   │   ├── graph.py             # LangGraph workflow builder
│   │   ├── state.py             # WorkflowState + WorkflowResult
│   │   └── handoff.py           # Handoff logic + routing
│   ├── mcp/
│   │   ├── __init__.py
│   │   ├── client.py            # MCPClientWrapper
│   │   ├── registry.py          # MCPRegistry
│   │   └── tools.py             # Tool formatting helpers
│   ├── events/
│   │   ├── __init__.py
│   │   ├── bus.py               # EventBus (WebSocket broadcaster)
│   │   ├── models.py            # Event type definitions (Pydantic)
│   │   └── stream.py            # SSE fallback stream
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── base.py              # BaseLLMProvider ABC
│   │   ├── gemini.py            # GeminiProvider
│   │   └── groq.py              # GroqProvider
│   └── api/
│       ├── __init__.py
│       ├── routes.py            # FastAPI app + REST endpoints
│       ├── websocket.py         # WebSocket handler
│       └── middleware.py        # CORS, error handling
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with fonts + providers
│   │   ├── page.tsx             # Landing page
│   │   ├── globals.css          # Global styles + design tokens
│   │   └── dashboard/
│   │       └── page.tsx         # Mission Control dashboard
│   ├── components/              # (see COMPONENTS.md)
│   ├── hooks/
│   │   ├── useAgentMeshEvents.ts
│   │   ├── useWebSocket.ts
│   │   └── useAnimatedCounter.ts
│   ├── stores/
│   │   ├── eventStore.ts        # Zustand event store
│   │   └── uiStore.ts           # UI preferences store
│   ├── lib/
│   │   ├── api.ts               # REST API client
│   │   ├── ws.ts                # WebSocket client
│   │   ├── utils.ts             # Helper functions
│   │   └── constants.ts         # Config constants
│   ├── types/
│   │   ├── events.ts            # Event type definitions
│   │   ├── agents.ts            # Agent type definitions
│   │   └── workflows.ts         # Workflow type definitions
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── examples/
│   ├── github_review.py         # Demo: GitHub code review pipeline
│   ├── research_synthesis.py    # Demo: Research synthesis workflow
│   └── configs/
│       ├── github_review.yaml   # Workflow config
│       └── research.yaml        # Workflow config
│
├── tests/
│   ├── backend/
│   │   ├── test_agents.py
│   │   ├── test_orchestrator.py
│   │   ├── test_mcp.py
│   │   └── test_events.py
│   └── frontend/
│       └── components/
│
├── docs/
│   ├── FEATURES.md
│   ├── DESIGN.md
│   ├── IMPLEMENTATION.md        # (this file)
│   ├── COMPONENTS.md
│   ├── API.md
│   └── WORKFLOWS.md
│
├── pyproject.toml               # Python package config
├── .env.example                 # Environment variable template
├── render.yaml                  # Render deployment config
├── README.md
└── LICENSE
```
