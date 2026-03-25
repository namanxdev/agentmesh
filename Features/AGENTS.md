# 🧠 Agent Definition Layer

> Define specialized AI agents as first-class Python objects with declarative configuration.

---

## Overview

The Agent Definition Layer is the foundation of AgentMesh. It provides a clean, Pythonic API for creating agents with specific roles, behaviors, and tool access.

## Key Capabilities

| Feature | Description |
|---------|-------------|
| **Role Assignment** | Named roles with purpose-driven system prompts |
| **MCP Binding** | Each agent connects to one or more MCP servers |
| **Handoff Rules** | Declarative routing — who to pass work to and when |
| **Model Config** | Per-agent LLM settings (model, temperature, tokens) |
| **Tool Scoping** | Restrict which MCP tools an agent can call |
| **Context Memory** | In-memory conversation history per workflow run |

## Usage

```python
from agentmesh import Agent

agent = Agent(
    name="Researcher",
    role="Research specialist",
    system_prompt="You are a thorough researcher...",
    mcp_servers=["web-search", "filesystem"],
    model="gemini-2.0-flash",
    temperature=0.4,
    max_tokens=4096,
    handoff_rules={
        "on_complete": "Analyst",
        "on_error": "ErrorHandler"
    }
)
```

## Agent Lifecycle

```
IDLE → THINKING → TOOL_CALLING → THINKING → COMPLETED
                                      ↓
                                    ERROR
```

1. **IDLE** — Waiting to be activated by the orchestrator
2. **THINKING** — LLM is generating a response
3. **TOOL_CALLING** — Agent is executing MCP tool calls
4. **COMPLETED** — Task finished, ready for handoff
5. **ERROR** — Something went wrong, triggers error handoff

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `str` | required | Unique identifier |
| `role` | `str` | required | Human-readable role |
| `system_prompt` | `str` | required | Behavior instructions |
| `mcp_servers` | `list[str]` | `[]` | Connected MCP servers |
| `model` | `str` | `"gemini-2.0-flash"` | LLM model name |
| `temperature` | `float` | `0.7` | Response creativity (0-2) |
| `max_tokens` | `int` | `4096` | Max output tokens |
| `handoff_rules` | `dict` | `{}` | Conditional routing map |

## Related Docs

- [IMPLEMENTATION.md](../docs/IMPLEMENTATION.md) — Full backend code
- [WORKFLOWS.md](../docs/WORKFLOWS.md) — Agent workflow examples
