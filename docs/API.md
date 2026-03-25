# 📡 AgentMesh — API Reference

> Backend REST API + WebSocket protocol documentation.

---

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [REST API](#rest-api)
- [WebSocket API](#websocket-api)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)

---

## Base URL

| Environment | URL |
|-------------|-----|
| **Development** | `http://localhost:8000` |
| **Production** | `https://agentmesh-api.onrender.com` |

---

## Authentication

> **MVP Note:** No authentication is required for v1.0. All endpoints are publicly accessible. Auth will be added in v1.2.

---

## REST API

### Workflows

#### `POST /api/workflows/run`

Start a workflow execution.

**Request Body:**

```json
{
  "workflow_name": "github-code-review",
  "task": "Review the latest PR on repository user/repo",
  "config_overrides": {
    "max_iterations": 10,
    "timeout_seconds": 120
  },
  "initial_state": {
    "repository": "user/repo",
    "branch": "feature-branch"
  }
}
```

**Response (200):**

```json
{
  "workflow_id": "wf_a1b2c3d4",
  "status": "running",
  "agents": ["Fetcher", "Reviewer", "SecurityScanner", "Summarizer"],
  "started_at": "2026-03-24T12:00:00Z",
  "websocket_url": "ws://localhost:8000/ws/events?workflow_id=wf_a1b2c3d4"
}
```

---

#### `GET /api/workflows`

List available workflow definitions.

**Response (200):**

```json
{
  "workflows": [
    {
      "name": "github-code-review",
      "description": "Multi-agent code review pipeline",
      "agents": ["Fetcher", "Reviewer", "SecurityScanner", "Summarizer"],
      "estimated_duration": "30-60s"
    },
    {
      "name": "research-synthesis",
      "description": "Web research + synthesis pipeline",
      "agents": ["Searcher", "Extractor", "Analyst", "Writer"],
      "estimated_duration": "45-90s"
    }
  ]
}
```

---

#### `GET /api/workflows/{workflow_id}`

Get the status and result of a workflow execution.

**Response (200) — Running:**

```json
{
  "workflow_id": "wf_a1b2c3d4",
  "status": "running",
  "current_agent": "Reviewer",
  "progress": {
    "completed_agents": ["Fetcher"],
    "active_agent": "Reviewer",
    "remaining_agents": ["SecurityScanner", "Summarizer"]
  },
  "token_usage": {
    "Fetcher": { "input": 1240, "output": 856 }
  },
  "elapsed_seconds": 12.4
}
```

**Response (200) — Completed:**

```json
{
  "workflow_id": "wf_a1b2c3d4",
  "status": "completed",
  "result": {
    "summary": "Code review completed. 2 critical issues found...",
    "findings": [...],
    "report_url": "/api/reports/wf_a1b2c3d4"
  },
  "token_usage": {
    "Fetcher": { "input": 1240, "output": 856 },
    "Reviewer": { "input": 3420, "output": 2100 },
    "SecurityScanner": { "input": 2800, "output": 1500 },
    "Summarizer": { "input": 1800, "output": 1200 }
  },
  "total_tokens": 14916,
  "duration_seconds": 34.2,
  "completed_at": "2026-03-24T12:00:34Z"
}
```

---

### Agents

#### `GET /api/agents`

List all registered agents and their current status.

**Response (200):**

```json
{
  "agents": [
    {
      "name": "Fetcher",
      "role": "Code Fetcher",
      "status": "idle",
      "model": "gemini-2.0-flash",
      "mcp_servers": ["github", "filesystem"],
      "available_tools": [
        "github__search_repositories",
        "github__read_file",
        "filesystem__read_file",
        "filesystem__list_directory"
      ],
      "token_usage_total": { "input": 0, "output": 0 }
    },
    {
      "name": "Reviewer",
      "role": "Code Reviewer",
      "status": "active",
      "model": "gemini-2.0-flash",
      "mcp_servers": ["github"],
      "available_tools": ["github__read_file", "github__create_review"],
      "current_task": "Reviewing file: src/main.py",
      "token_usage_total": { "input": 3420, "output": 2100 }
    }
  ]
}
```

---

#### `GET /api/agents/{agent_name}`

Get detailed info about a specific agent.

**Response (200):**

```json
{
  "name": "Reviewer",
  "role": "Code Reviewer",
  "system_prompt": "You are an expert code reviewer...",
  "status": "active",
  "model": "gemini-2.0-flash",
  "temperature": 0.3,
  "max_tokens": 4096,
  "mcp_servers": [
    {
      "name": "github",
      "transport": "stdio",
      "status": "connected",
      "tools": [
        {
          "name": "read_file",
          "description": "Read a file from a GitHub repository"
        },
        {
          "name": "create_review",
          "description": "Create a code review comment"
        }
      ]
    }
  ],
  "handoff_rules": {
    "on_complete": "SecurityScanner",
    "on_needs_clarification": "Fetcher"
  },
  "message_history": [
    {
      "role": "system",
      "content": "You are an expert code reviewer..."
    },
    {
      "role": "user",
      "content": "Review the following code..."
    }
  ],
  "token_usage": { "input": 3420, "output": 2100 }
}
```

---

### MCP Servers

#### `GET /api/mcp/servers`

List all connected MCP servers and their available tools.

**Response (200):**

```json
{
  "servers": [
    {
      "name": "github",
      "transport": "stdio",
      "command": "mcp-server-github",
      "status": "connected",
      "tools_count": 15,
      "tools": [
        {
          "name": "search_repositories",
          "description": "Search for GitHub repositories",
          "input_schema": {
            "type": "object",
            "properties": {
              "query": { "type": "string" }
            }
          }
        }
      ]
    },
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "mcp-server-filesystem",
      "args": ["./workspace"],
      "status": "connected",
      "tools_count": 8,
      "tools": [...]
    },
    {
      "name": "web-search",
      "transport": "sse",
      "url": "http://localhost:3001/sse",
      "status": "disconnected",
      "error": "Connection refused"
    }
  ]
}
```

---

#### `POST /api/mcp/servers/{server_name}/test`

Test an MCP tool call directly (for debugging).

**Request Body:**

```json
{
  "tool_name": "search_repositories",
  "args": {
    "query": "agentmesh python"
  }
}
```

**Response (200):**

```json
{
  "server": "github",
  "tool": "search_repositories",
  "result": {
    "repositories": [...]
  },
  "duration_ms": 340
}
```

---

## WebSocket API

### Connection

```
ws://localhost:8000/ws/events
```

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `workflow_id` | No | Filter events for a specific workflow |
| `event_types` | No | Comma-separated list of event types to subscribe to |

**Example:**
```
ws://localhost:8000/ws/events?workflow_id=wf_a1b2c3d4&event_types=agent.activated,agent.completed,tool.called
```

---

### Event Types

All events follow this base structure:

```typescript
interface AgentMeshEvent {
  id: string;          // Unique event ID (UUID)
  type: string;        // Event type identifier
  timestamp: number;   // Unix timestamp (seconds)
  workflow_id: string; // Associated workflow ID
  [key: string]: any;  // Type-specific fields
}
```

#### Workflow Events

| Event Type | Fields | Description |
|-----------|--------|-------------|
| `workflow.started` | `agents: string[]`, `task: string` | Workflow execution begins |
| `workflow.completed` | `result: object`, `totalTokens: number`, `duration: number` | Workflow finished successfully |
| `workflow.error` | `error: string`, `failedAgent: string` | Workflow failed |

#### Agent Events

| Event Type | Fields | Description |
|-----------|--------|-------------|
| `agent.activated` | `agentName: string`, `role: string`, `taskDescription: string` | Agent starts processing |
| `agent.thinking` | `agentName: string`, `partialResponse: string` | Agent LLM is streaming (partial) |
| `agent.completed` | `agentName: string`, `output: string`, `tokenUsage: object` | Agent finished task |
| `agent.handoff` | `from: string`, `to: string`, `reason: string` | Control passes between agents |

#### Tool Events

| Event Type | Fields | Description |
|-----------|--------|-------------|
| `tool.called` | `agentName: string`, `server: string`, `tool: string`, `args: object` | MCP tool invocation started |
| `tool.result` | `agentName: string`, `server: string`, `tool: string`, `result: object`, `duration_ms: number` | MCP tool returned result |
| `tool.error` | `agentName: string`, `server: string`, `tool: string`, `error: string` | MCP tool failed |

#### Token Events

| Event Type | Fields | Description |
|-----------|--------|-------------|
| `token.usage` | `agentName: string`, `input: number`, `output: number`, `total: number` | Token count update |

---

### Client Commands

The client can send commands via the WebSocket connection:

```typescript
// Subscribe to specific event types
ws.send(JSON.stringify({
  command: "subscribe",
  event_types: ["agent.activated", "tool.called"]
}));

// Unsubscribe from event types
ws.send(JSON.stringify({
  command: "unsubscribe",
  event_types: ["tool.called"]
}));

// Request event replay (get buffered events)
ws.send(JSON.stringify({
  command: "replay",
  from_timestamp: 1711276800
}));

// Ping (keepalive)
ws.send(JSON.stringify({ command: "ping" }));
// Response: { "type": "pong", "timestamp": ... }
```

---

### Frontend Connection Example

```typescript
class AgentMeshWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(
    private url: string,
    private onEvent: (event: AgentMeshEvent) => void,
    private onStatusChange: (status: string) => void
  ) {}
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onStatusChange('connected');
    };
    
    this.ws.onmessage = (msg) => {
      const event = JSON.parse(msg.data);
      if (event.type === 'pong') return;
      this.onEvent(event);
    };
    
    this.ws.onclose = () => {
      this.onStatusChange('disconnected');
      this.reconnect();
    };
    
    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      this.onStatusChange('error');
    };
  }
  
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onStatusChange('failed');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.onStatusChange('reconnecting');
    
    setTimeout(() => this.connect(), delay);
  }
  
  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
  
  send(command: object) {
    this.ws?.send(JSON.stringify(command));
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "WORKFLOW_NOT_FOUND",
    "message": "Workflow with ID 'wf_invalid' not found",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `WORKFLOW_NOT_FOUND` | 404 | Requested workflow ID doesn't exist |
| `WORKFLOW_ALREADY_RUNNING` | 409 | A workflow is already executing |
| `AGENT_NOT_FOUND` | 404 | Requested agent name doesn't exist |
| `MCP_CONNECTION_ERROR` | 502 | Cannot connect to MCP server |
| `MCP_TOOL_ERROR` | 500 | MCP tool call failed |
| `LLM_ERROR` | 502 | LLM API call failed |
| `LLM_RATE_LIMIT` | 429 | LLM API rate limit exceeded |
| `VALIDATION_ERROR` | 422 | Invalid request body |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limits

| Endpoint | Limit (MVP) |
|----------|-------------|
| `POST /api/workflows/run` | 10 requests/minute |
| `GET /api/*` | 60 requests/minute |
| WebSocket connections | 5 concurrent |

> Rate limits are deliberately generous for MVP. In production, these would be per-user with auth.
