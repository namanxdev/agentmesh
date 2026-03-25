# 📡 Real-Time Event System

> WebSocket event bus streaming every agent action to Mission Control.

---

## Overview

The Event System is the nervous system of AgentMesh. Every agent activation, tool call, handoff, and completion is emitted as a structured event through a WebSocket event bus. The Mission Control dashboard subscribes to this bus for live updates.

## Architecture

```
Backend (FastAPI)                      Frontend (Next.js)
┌──────────────────┐                   ┌──────────────────┐
│  Agent Process   │──emit──▶│         │                  │
│  Orchestrator    │──emit──▶│ Event   │──subscribe──▶ Zustand Store │
│  MCP Client      │──emit──▶│ Bus     │         │   → Agent Graph  │
│  LLM Provider    │──emit──▶│ (WS)   │         │   → Message Feed │
│                  │         │         │         │   → Token Counter│
└──────────────────┘         └─────────┘         └──────────────────┘
```

## Event Types

| Category | Event | Trigger |
|----------|-------|---------|
| **Workflow** | `workflow.started` | Workflow begins execution |
| **Workflow** | `workflow.completed` | All agents finished |
| **Workflow** | `workflow.error` | Unrecoverable error |
| **Agent** | `agent.activated` | Agent starts processing |
| **Agent** | `agent.thinking` | LLM streaming partial response |
| **Agent** | `agent.completed` | Agent finished task |
| **Agent** | `agent.handoff` | Control transfers between agents |
| **Tool** | `tool.called` | MCP tool invocation started |
| **Tool** | `tool.result` | MCP tool returned result |
| **Tool** | `tool.error` | MCP tool failed |
| **Token** | `token.usage` | Token count updated |

## Event Format

```json
{
  "id": "evt_uuid",
  "type": "tool.called",
  "timestamp": 1711276800.123,
  "workflow_id": "wf_a1b2c3d4",
  "agentName": "Reviewer",
  "server": "github",
  "tool": "read_file",
  "args": { "path": "src/main.py" }
}
```

## Features

| Feature | Description |
|---------|-------------|
| **Auto-reconnect** | Client reconnects with exponential backoff |
| **Event buffering** | Late-joining clients receive recent events |
| **Subscription filters** | Subscribe to specific event types only |
| **Event replay** | Replay events from a timestamp for debugging |
| **Structured JSON** | Type-safe payloads with Pydantic models |

## Client Usage

```typescript
const ws = new WebSocket("ws://localhost:8000/ws/events");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case "agent.activated":
      highlightNode(data.agentName);
      break;
    case "tool.called":
      addToToolLog(data);
      break;
    case "token.usage":
      updateCounter(data.agentName, data.input + data.output);
      break;
  }
};
```

## Related Docs

- [API.md](../docs/API.md) — Full WebSocket protocol documentation
- [COMPONENTS.md](../docs/COMPONENTS.md) — Frontend event-consuming components
