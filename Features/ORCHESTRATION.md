# 🔄 Orchestration Engine

> LangGraph-powered state machine workflows for multi-agent coordination.

---

## Overview

The Orchestration Engine uses LangGraph to define multi-agent workflows as directed graphs (state machines). Agents form nodes, handoffs form edges, and a shared state object flows through the graph.

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Workflow** | A complete agent pipeline defined as a directed graph |
| **Node** | An agent that processes a task |
| **Edge** | A transition rule between agents |
| **State** | Shared data passed between all agents |
| **Routing Key** | Determines which edge to follow (e.g., `on_complete`, `on_error`) |

## Workflow Definition

```python
from agentmesh import Workflow

workflow = Workflow(
    name="my-pipeline",
    agents=[agent_a, agent_b, agent_c],
    graph={
        "start": "agent_a",
        "agent_a": {
            "on_complete": "agent_b",
            "on_error": "agent_c"
        },
        "agent_b": {"on_complete": "agent_c"},
        "agent_c": {"on_complete": "end"}
    }
)
```

## Execution Flow

```
1. Workflow receives task + initial state
2. LangGraph builds compiled state machine
3. Entry point agent is activated
4. Agent processes task → produces output + routing key
5. Routing key determines next agent edge
6. Shared state updated, passed to next agent
7. Repeat until terminal node ("end") reached
8. Every step emits WebSocket events to Mission Control
```

## Features

| Feature | Description |
|---------|-------------|
| **Conditional Routing** | Route based on agent output (`on_complete`, `on_error`, custom keys) |
| **Shared State** | All agents read/write to a shared state dictionary |
| **Cycle Support** | Agents can loop back (e.g., "needs more context") |
| **Max Iterations** | Prevent infinite loops with configurable limits |
| **Event Emission** | Every activation, completion, and handoff is broadcasted |
| **Timeout** | Configurable workflow-level timeout |

## State Model

```python
class WorkflowState:
    current_task: str          # The user's original task
    shared_data: dict          # Shared key-value data between agents
    messages: list[dict]       # All agent messages (conversation log)
    token_usage: dict          # Per-agent token counts
    last_agent: str            # Name of the last activated agent
    routing_key: str           # Determines next edge ("on_complete", etc.)
```

## Related Docs

- [IMPLEMENTATION.md](../docs/IMPLEMENTATION.md) — LangGraph code
- [WORKFLOWS.md](../docs/WORKFLOWS.md) — Demo workflow configs
