# Backend MCP + Agent Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the MCP client integration layer and Agent definition layer — the two core abstractions that give agents their capabilities and identity.

**Architecture:** `mcp/` wraps FastMCP clients with event emission and tool namespacing (`server__tool`); `agents/` builds the runtime `Agent` class on top of LLM + MCP interfaces, plus an `AgentRegistry` and system prompt files for the 4 demo agents.

**Assumptions:** `backend/llm/base.py` (LLMResponse, BaseLLMProvider) and `backend/events/bus.py` (EventBus) exist per the foundation plan. This plan imports from those modules but does not modify them.

**Tech Stack:** Python 3.11+, FastMCP, Pydantic v2, pytest, pytest-asyncio, pytest-mock

---

## File Map

| File | Responsibility |
|------|----------------|
| `backend/mcp/__init__.py` | Re-exports |
| `backend/mcp/client.py` | `MCPClientWrapper` — wraps FastMCP, emits tool events |
| `backend/mcp/registry.py` | `MCPRegistry` — holds server configs, connects all |
| `backend/mcp/tools.py` | Tool formatting helpers (`server__tool` namespacing) |
| `backend/agents/__init__.py` | Re-exports |
| `backend/agents/base.py` | `AgentStatus`, `AgentConfig`, `AgentResult`, `Agent` class |
| `backend/agents/registry.py` | `AgentRegistry` — central store of agent instances |
| `backend/agents/prompts/code_reviewer.txt` | System prompt for CodeReviewer agent |
| `backend/agents/prompts/researcher.txt` | System prompt for Researcher agent |
| `backend/agents/prompts/analyst.txt` | System prompt for Analyst agent |
| `backend/agents/prompts/writer.txt` | System prompt for Writer agent |
| `tests/backend/test_mcp.py` | MCPClientWrapper + MCPRegistry tests (mocked FastMCP) |
| `tests/backend/test_agents.py` | Agent + AgentRegistry tests (mocked LLM + MCP) |

---

### Task 1: MCP Tool Formatting Helpers

**Files:**
- Create: `backend/mcp/__init__.py`
- Create: `backend/mcp/tools.py`
- Create: `tests/backend/test_mcp.py`

- [ ] **Step 1: Write failing tests**

`tests/backend/test_mcp.py`:
```python
import pytest
from backend.mcp.tools import namespace_tool, format_tool_for_llm, parse_tool_name


def test_namespace_tool():
    assert namespace_tool("github", "read_file") == "github__read_file"


def test_parse_tool_name():
    server, tool = parse_tool_name("github__read_file")
    assert server == "github"
    assert tool == "read_file"


def test_parse_tool_name_invalid():
    with pytest.raises(ValueError, match="Invalid namespaced tool"):
        parse_tool_name("read_file")


def test_format_tool_for_llm():
    tool_def = format_tool_for_llm(
        server_name="github",
        tool_name="read_file",
        description="Read a file from a GitHub repo",
        input_schema={"type": "object", "properties": {"path": {"type": "string"}}},
    )
    assert tool_def["type"] == "function"
    assert tool_def["function"]["name"] == "github__read_file"
    assert "path" in tool_def["function"]["parameters"]["properties"]
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_mcp.py -v
```
Expected: `ImportError: cannot import name 'namespace_tool'`

- [ ] **Step 3: Implement `backend/mcp/tools.py`**

```python
"""Tool naming helpers for MCP server/tool namespacing."""


def namespace_tool(server_name: str, tool_name: str) -> str:
    """Returns 'server__tool' namespaced name."""
    return f"{server_name}__{tool_name}"


def parse_tool_name(namespaced: str) -> tuple[str, str]:
    """Splits 'server__tool' into (server, tool). Raises ValueError if invalid."""
    if "__" not in namespaced:
        raise ValueError(f"Invalid namespaced tool: '{namespaced}'. Expected 'server__tool'.")
    server, tool = namespaced.split("__", 1)
    return server, tool


def format_tool_for_llm(
    server_name: str,
    tool_name: str,
    description: str,
    input_schema: dict,
) -> dict:
    """Return an OpenAI-compatible tool definition for LLM function calling."""
    return {
        "type": "function",
        "function": {
            "name": namespace_tool(server_name, tool_name),
            "description": description,
            "parameters": input_schema,
        },
    }
```

Create `backend/mcp/__init__.py` — stub with only tools exports for now (client/registry don't exist yet):
```python
from .tools import namespace_tool, format_tool_for_llm, parse_tool_name
__all__ = ["namespace_tool", "format_tool_for_llm", "parse_tool_name"]
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/backend/test_mcp.py -v
```
Expected: 4 PASSED (client/registry tests will be added next)

- [ ] **Step 5: Commit**

```bash
git add backend/mcp/tools.py backend/mcp/__init__.py tests/backend/test_mcp.py
git commit -m "feat: add MCP tool namespacing helpers"
```

---

### Task 2: MCP Client Wrapper

**Files:**
- Create: `backend/mcp/client.py`

- [ ] **Step 1: Write failing tests** — append to `tests/backend/test_mcp.py`

```python
import time
from unittest.mock import AsyncMock, MagicMock, patch
from backend.mcp.client import MCPClientWrapper


@pytest.mark.asyncio
async def test_mcp_client_connect_discovers_tools():
    """connect() calls list_tools and stores tool definitions."""
    mock_tool = MagicMock()
    mock_tool.name = "read_file"
    mock_tool.description = "Read a file"
    mock_tool.inputSchema = {"type": "object", "properties": {"path": {"type": "string"}}}
    mock_tools_response = MagicMock()
    mock_tools_response.tools = [mock_tool]

    mock_client = MagicMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.list_tools = AsyncMock(return_value=mock_tools_response)

    event_bus = MagicMock()
    event_bus.emit = AsyncMock()

    with patch("fastmcp.Client", return_value=mock_client):
        wrapper = MCPClientWrapper(
            server_name="github",
            transport_config={"transport": "stdio", "command": "mcp-server-github"},
            event_bus=event_bus,
        )
        await wrapper.connect()

    assert len(wrapper.get_tool_definitions()) == 1
    assert wrapper.get_tool_definitions()[0]["function"]["name"] == "github__read_file"


@pytest.mark.asyncio
async def test_mcp_client_call_tool_emits_events():
    """call_tool emits tool.called and tool.result events."""
    mock_result = MagicMock()
    mock_result.content = [MagicMock(text='{"ok": true}')]

    mock_client = MagicMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.call_tool = AsyncMock(return_value=mock_result)

    event_bus = MagicMock()
    event_bus.emit = AsyncMock()

    with patch("fastmcp.Client", return_value=mock_client):
        wrapper = MCPClientWrapper(
            server_name="github",
            transport_config={"transport": "stdio", "command": "mcp-server-github"},
            event_bus=event_bus,
        )
        wrapper._client = mock_client
        result = await wrapper.call_tool(
            agent_name="Fetcher", tool_name="read_file", args={"path": "main.py"},
            workflow_id="wf_1"
        )

    assert event_bus.emit.call_count == 2  # tool.called + tool.result
    calls = [c[0][0]["type"] for c in event_bus.emit.call_args_list]
    assert "tool.called" in calls
    assert "tool.result" in calls
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_mcp.py -k "test_mcp_client" -v
```
Expected: `ImportError: cannot import name 'MCPClientWrapper'`

- [ ] **Step 3: Implement `backend/mcp/client.py`**

```python
import time
from typing import Optional
from fastmcp import Client
from backend.events.bus import EventBus
from .tools import namespace_tool, format_tool_for_llm


class MCPClientWrapper:
    """Wraps a FastMCP client with event emission and tool namespacing."""

    def __init__(self, server_name: str, transport_config: dict, event_bus: EventBus):
        self.server_name = server_name
        self._transport_config = transport_config
        self._event_bus = event_bus
        self._client: Optional[Client] = None
        self._tool_definitions: list[dict] = []
        self._connected = False

    async def connect(self):
        """Connect to MCP server and discover tools."""
        self._client = Client(self._transport_config)
        async with self._client as client:
            tools_response = await client.list_tools()
            self._tool_definitions = [
                format_tool_for_llm(
                    server_name=self.server_name,
                    tool_name=tool.name,
                    description=tool.description or "",
                    input_schema=tool.inputSchema or {},
                )
                for tool in tools_response.tools
            ]
        self._connected = True

    async def call_tool(
        self,
        agent_name: str,
        tool_name: str,
        args: dict,
        workflow_id: str = "",
    ) -> list:
        """Execute tool on MCP server; emit tool.called + tool.result events."""
        start = time.time()
        await self._event_bus.emit({
            "type": "tool.called",
            "workflow_id": workflow_id,
            "agentName": agent_name,
            "server": self.server_name,
            "tool": tool_name,
            "args": args,
        })

        try:
            async with Client(self._transport_config) as client:
                result = await client.call_tool(tool_name, args)
        except Exception as exc:
            await self._event_bus.emit({
                "type": "tool.error",
                "workflow_id": workflow_id,
                "agentName": agent_name,
                "server": self.server_name,
                "tool": tool_name,
                "error": str(exc),
            })
            raise

        duration_ms = (time.time() - start) * 1000
        content = [c.text if hasattr(c, "text") else str(c) for c in result.content]

        await self._event_bus.emit({
            "type": "tool.result",
            "workflow_id": workflow_id,
            "agentName": agent_name,
            "server": self.server_name,
            "tool": tool_name,
            "result": content,
            "duration_ms": duration_ms,
        })

        return content

    def get_tool_definitions(self) -> list[dict]:
        """Return OpenAI-compatible tool defs for LLM function calling."""
        return self._tool_definitions

    @property
    def is_connected(self) -> bool:
        return self._connected
```

- [ ] **Step 4: Run MCP client tests**

```bash
pytest tests/backend/test_mcp.py -v
```
Expected: All PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/mcp/client.py tests/backend/test_mcp.py
git commit -m "feat: add MCPClientWrapper with tool discovery and event emission"
```

---

### Task 3: MCP Registry

**Files:**
- Create: `backend/mcp/registry.py`

- [ ] **Step 1: Write failing tests** — append to `tests/backend/test_mcp.py`

```python
from backend.mcp.registry import MCPRegistry


@pytest.mark.asyncio
async def test_mcp_registry_register_and_get():
    event_bus = MagicMock()
    event_bus.emit = AsyncMock()
    registry = MCPRegistry(event_bus=event_bus)

    registry.register("github", transport="stdio", command="mcp-server-github")
    client = registry.get_client("github")
    assert client is not None
    assert client.server_name == "github"


def test_mcp_registry_get_unknown_raises():
    event_bus = MagicMock()
    registry = MCPRegistry(event_bus=event_bus)
    with pytest.raises(KeyError):
        registry.get_client("nonexistent")


def test_mcp_registry_get_server_info():
    event_bus = MagicMock()
    registry = MCPRegistry(event_bus=event_bus)
    registry.register("github", transport="stdio", command="mcp-server-github")
    info = registry.get_server_info()
    assert len(info["servers"]) == 1
    assert info["servers"][0]["name"] == "github"
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_mcp.py -k "test_mcp_registry" -v
```
Expected: `ImportError`

- [ ] **Step 3: Implement `backend/mcp/registry.py`**

```python
from backend.events.bus import EventBus
from .client import MCPClientWrapper


class MCPRegistry:
    """Registry of MCP server configurations and connected clients."""

    def __init__(self, event_bus: EventBus):
        self._event_bus = event_bus
        self._clients: dict[str, MCPClientWrapper] = {}
        self._configs: dict[str, dict] = {}

    def register(self, name: str, **transport_config):
        """Register an MCP server by name and transport config."""
        self._configs[name] = transport_config
        self._clients[name] = MCPClientWrapper(
            server_name=name,
            transport_config=transport_config,
            event_bus=self._event_bus,
        )

    def get_client(self, name: str) -> MCPClientWrapper:
        """Get a registered MCP client by server name."""
        if name not in self._clients:
            raise KeyError(f"MCP server '{name}' not registered.")
        return self._clients[name]

    async def connect_all(self):
        """Connect to all registered MCP servers (graceful on failure)."""
        for name, client in self._clients.items():
            try:
                await client.connect()
            except Exception as exc:
                await self._event_bus.emit({
                    "type": "mcp.connection_error",
                    "workflow_id": "",
                    "server": name,
                    "error": str(exc),
                })

    def get_server_info(self) -> dict:
        """Return status info for all registered servers (for REST API)."""
        return {
            "servers": [
                {
                    "name": name,
                    "connected": self._clients[name].is_connected,
                    "tools": self._clients[name].get_tool_definitions(),
                    **config,
                }
                for name, config in self._configs.items()
            ]
        }
```

- [ ] **Step 4: Update `backend/mcp/__init__.py`** to export all public classes now that client + registry exist

```python
from .client import MCPClientWrapper
from .registry import MCPRegistry
from .tools import namespace_tool, format_tool_for_llm, parse_tool_name
__all__ = ["MCPClientWrapper", "MCPRegistry", "namespace_tool", "format_tool_for_llm", "parse_tool_name"]
```

- [ ] **Step 5: Run all MCP tests**

```bash
pytest tests/backend/test_mcp.py -v
```
Expected: All PASSED

- [ ] **Step 6: Commit**

```bash
git add backend/mcp/registry.py backend/mcp/__init__.py tests/backend/test_mcp.py
git commit -m "feat: add MCPRegistry with server registration and connect_all"
```

---

### Task 4: Agent Models

**Files:**
- Create: `backend/agents/base.py` (models only first)
- Create: `tests/backend/test_agents.py`

- [ ] **Step 1: Write failing tests**

`tests/backend/test_agents.py`:
```python
import pytest
from backend.agents.base import AgentConfig, AgentStatus, AgentResult


def test_agent_config_defaults():
    config = AgentConfig(
        name="Reviewer",
        role="Code Reviewer",
        system_prompt="You are a code reviewer.",
    )
    assert config.model == "gemini-2.0-flash"
    assert config.temperature == 0.7
    assert config.max_tokens == 4096
    assert config.mcp_servers == []


def test_agent_config_with_handoff_rules():
    config = AgentConfig(
        name="Fetcher",
        role="Fetcher",
        system_prompt="Fetch code.",
        handoff_rules={"on_complete": "Reviewer", "on_error": "end"},
    )
    assert config.handoff_rules["on_complete"] == "Reviewer"


def test_agent_status_enum():
    assert AgentStatus.IDLE == "idle"
    assert AgentStatus.ACTIVE == "active"
    assert AgentStatus.ERROR == "error"


def test_agent_result_fields():
    result = AgentResult(
        output="Review complete.",
        routing_key="on_complete",
        token_usage={"input": 100, "output": 50},
    )
    assert result.routing_key == "on_complete"
    assert result.output == "Review complete."
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_agents.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Implement models in `backend/agents/base.py`**

```python
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field


class AgentStatus(str, Enum):
    IDLE = "idle"
    ACTIVE = "active"
    THINKING = "thinking"
    TOOL_CALLING = "tool_calling"
    COMPLETED = "completed"
    ERROR = "error"


class AgentConfig(BaseModel):
    """Declarative configuration for one agent."""
    name: str = Field(..., description="Unique agent identifier")
    role: str = Field(..., description="Human-readable role description")
    system_prompt: str = Field(..., description="LLM system prompt")
    mcp_servers: list[str] = Field(default_factory=list)
    handoff_rules: dict[str, str] = Field(default_factory=dict)
    model: str = Field(default="gemini-2.0-flash")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, gt=0)


class AgentResult(BaseModel):
    """Output from a completed agent task."""
    output: str
    routing_key: str = "on_complete"
    token_usage: dict = Field(default_factory=lambda: {"input": 0, "output": 0})
    state_updates: Optional[dict] = None
```

Create `backend/agents/__init__.py` — stub without `Agent` (added in Task 5):
```python
from .base import AgentConfig, AgentStatus, AgentResult
__all__ = ["AgentConfig", "AgentStatus", "AgentResult"]
```

- [ ] **Step 4: Run model tests**

```bash
pytest tests/backend/test_agents.py -v
```
Expected: 4 PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/agents/base.py backend/agents/__init__.py tests/backend/test_agents.py
git commit -m "feat: add AgentConfig, AgentStatus, AgentResult models"
```

---

### Task 5: Agent Runtime

**Files:**
- Modify: `backend/agents/base.py` (add `Agent` class)

- [ ] **Step 1: Write failing tests** — append to `tests/backend/test_agents.py`

```python
from unittest.mock import AsyncMock, MagicMock
from backend.agents.base import Agent, AgentConfig, AgentStatus
from backend.llm.base import LLMResponse


@pytest.mark.asyncio
async def test_agent_process_returns_result():
    """Agent.process calls LLM and returns AgentResult."""
    config = AgentConfig(
        name="Reviewer",
        role="Code Reviewer",
        system_prompt="Review code.",
        handoff_rules={"on_complete": "SecurityScanner"},
    )
    mock_llm = MagicMock()
    mock_llm.generate = AsyncMock(return_value=LLMResponse(
        text="Code looks fine.",
        usage={"input": 100, "output": 50},
    ))

    mock_event_bus = MagicMock()
    mock_event_bus.emit = AsyncMock()

    agent = Agent(config=config, llm_provider=mock_llm, event_bus=mock_event_bus)
    result = await agent.process(task="Review PR #1", state={}, workflow_id="wf_1")

    assert result.output == "Code looks fine."
    assert result.routing_key == "on_complete"
    assert result.token_usage["input"] == 100


@pytest.mark.asyncio
async def test_agent_process_emits_activated_and_completed_events():
    config = AgentConfig(
        name="Fetcher", role="Fetcher", system_prompt="Fetch code."
    )
    mock_llm = MagicMock()
    mock_llm.generate = AsyncMock(return_value=LLMResponse(
        text="Done.", usage={"input": 10, "output": 5}
    ))
    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    agent = Agent(config=config, llm_provider=mock_llm, event_bus=mock_bus)
    await agent.process(task="Fetch files", state={}, workflow_id="wf_1")

    event_types = [c[0][0]["type"] for c in mock_bus.emit.call_args_list]
    assert "agent.activated" in event_types
    assert "agent.completed" in event_types
    assert "token.usage" in event_types


@pytest.mark.asyncio
async def test_agent_process_handles_tool_calls():
    """Agent calls MCP tool and re-calls LLM with result."""
    config = AgentConfig(
        name="Fetcher", role="Fetcher", system_prompt="Fetch.",
        mcp_servers=["github"]
    )
    # First LLM call returns tool call; second returns final text
    mock_llm = MagicMock()
    mock_llm.generate = AsyncMock(side_effect=[
        LLMResponse(
            text="",
            tool_calls=[{"name": "github__read_file", "args": {"path": "main.py"}}],
            usage={"input": 50, "output": 10},
        ),
        LLMResponse(text="Fetched successfully.", usage={"input": 80, "output": 20}),
    ])

    mock_mcp = MagicMock()
    mock_mcp.call_tool = AsyncMock(return_value=["file content here"])

    mock_bus = MagicMock()
    mock_bus.emit = AsyncMock()

    agent = Agent(config=config, llm_provider=mock_llm, event_bus=mock_bus)
    agent._mcp_clients["github"] = mock_mcp

    result = await agent.process(task="Fetch main.py", state={}, workflow_id="wf_1")

    assert result.output == "Fetched successfully."
    mock_mcp.call_tool.assert_called_once()
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_agents.py -k "test_agent_process" -v
```
Expected: `ImportError` or `AttributeError` (Agent not yet defined)

- [ ] **Step 3: Add `Agent` class to `backend/agents/base.py`**

Append to existing `backend/agents/base.py`:

```python
from backend.llm.base import BaseLLMProvider, LLMResponse
from backend.events.bus import EventBus
from backend.mcp.client import MCPClientWrapper
import time


class Agent:
    """Runtime agent: LLM + MCP tools + event emission."""

    def __init__(
        self,
        config: AgentConfig,
        llm_provider: BaseLLMProvider,
        event_bus: EventBus,
    ):
        self.config = config
        self._llm = llm_provider
        self._event_bus = event_bus
        self._mcp_clients: dict[str, MCPClientWrapper] = {}
        self.status: AgentStatus = AgentStatus.IDLE
        self._message_history: list[dict] = []

    def register_mcp_client(self, server_name: str, client: MCPClientWrapper):
        """Attach an MCP client for a given server name."""
        self._mcp_clients[server_name] = client

    def _get_all_tool_definitions(self) -> list[dict]:
        tools = []
        for client in self._mcp_clients.values():
            tools.extend(client.get_tool_definitions())
        return tools

    def _build_messages(self, task: str, state: dict) -> list[dict]:
        messages = [{"role": "system", "content": self.config.system_prompt}]
        messages.extend(self._message_history)
        context = f"Task: {task}\n\nShared state: {state}" if state else f"Task: {task}"
        messages.append({"role": "user", "content": context})
        return messages

    def _determine_routing_key(self, response_text: str) -> str:
        """Default to on_complete; subclasses can override for smarter routing."""
        return "on_complete"

    async def process(self, task: str, state: dict, workflow_id: str = "") -> AgentResult:
        """Run one agent turn: think → optional tool calls → produce output."""
        self.status = AgentStatus.ACTIVE
        await self._event_bus.emit({
            "type": "agent.activated",
            "workflow_id": workflow_id,
            "agentName": self.config.name,
            "role": self.config.role,
            "taskDescription": task[:200],
        })

        messages = self._build_messages(task, state)
        tools = self._get_all_tool_definitions()
        total_usage = {"input": 0, "output": 0}

        self.status = AgentStatus.THINKING
        response: LLMResponse = await self._llm.generate(
            messages=messages,
            tools=tools or None,
            model=self.config.model,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
        )
        total_usage["input"] += response.usage.get("input", 0)
        total_usage["output"] += response.usage.get("output", 0)

        # Tool-call loop
        while response.has_tool_calls:
            self.status = AgentStatus.TOOL_CALLING
            tool_result_messages = []
            for tc in response.tool_calls:
                namespaced = tc["name"]
                server_name, tool_name = namespaced.split("__", 1)
                mcp_client = self._mcp_clients.get(server_name)
                if mcp_client is None:
                    result_content = [f"Error: MCP server '{server_name}' not connected."]
                else:
                    result_content = await mcp_client.call_tool(
                        agent_name=self.config.name,
                        tool_name=tool_name,
                        args=tc.get("args", {}),
                        workflow_id=workflow_id,
                    )
                tool_result_messages.append({
                    "role": "tool",
                    "content": str(result_content),
                    "tool_name": namespaced,
                })

            messages = messages + [{"role": "assistant", "content": ""}] + tool_result_messages
            self.status = AgentStatus.THINKING
            response = await self._llm.generate(
                messages=messages,
                tools=tools or None,
                model=self.config.model,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
            )
            total_usage["input"] += response.usage.get("input", 0)
            total_usage["output"] += response.usage.get("output", 0)

        self.status = AgentStatus.COMPLETED
        routing_key = self._determine_routing_key(response.text)

        await self._event_bus.emit({
            "type": "agent.completed",
            "workflow_id": workflow_id,
            "agentName": self.config.name,
            "output": response.text[:500],
            "tokenUsage": total_usage,
        })
        await self._event_bus.emit({
            "type": "token.usage",
            "workflow_id": workflow_id,
            "agentName": self.config.name,
            "input": total_usage["input"],
            "output": total_usage["output"],
            "total": total_usage["input"] + total_usage["output"],
        })

        return AgentResult(
            output=response.text,
            routing_key=routing_key,
            token_usage=total_usage,
        )
```

- [ ] **Step 4: Update `backend/agents/__init__.py`** now that `Agent` is defined

```python
from .base import AgentConfig, AgentStatus, AgentResult, Agent
from .registry import AgentRegistry
__all__ = ["AgentConfig", "AgentStatus", "AgentResult", "Agent", "AgentRegistry"]
```

- [ ] **Step 5: Run all agent tests**

```bash
pytest tests/backend/test_agents.py -v
```
Expected: All PASSED

- [ ] **Step 6: Commit**

```bash
git add backend/agents/base.py backend/agents/__init__.py tests/backend/test_agents.py
git commit -m "feat: add Agent runtime with LLM + MCP tool-call loop and event emission"
```

---

### Task 6: Agent Registry

**Files:**
- Create: `backend/agents/registry.py`

- [ ] **Step 1: Write failing tests** — append to `tests/backend/test_agents.py`

```python
from backend.agents.registry import AgentRegistry
from backend.agents.base import AgentConfig, Agent, AgentStatus


def test_agent_registry_register_and_get():
    mock_llm = MagicMock()
    mock_bus = MagicMock()
    registry = AgentRegistry(llm_provider=mock_llm, event_bus=mock_bus)

    config = AgentConfig(name="Fetcher", role="Fetcher", system_prompt="Fetch.")
    agent = registry.register(config)
    assert isinstance(agent, Agent)
    assert registry.get("Fetcher") is agent


def test_agent_registry_get_unknown_raises():
    registry = AgentRegistry(llm_provider=MagicMock(), event_bus=MagicMock())
    with pytest.raises(KeyError):
        registry.get("Unknown")


def test_agent_registry_status_map():
    mock_llm = MagicMock()
    mock_bus = MagicMock()
    registry = AgentRegistry(llm_provider=mock_llm, event_bus=mock_bus)
    registry.register(AgentConfig(name="A", role="A", system_prompt="A"))
    registry.register(AgentConfig(name="B", role="B", system_prompt="B"))

    status_map = registry.get_status_map()
    assert status_map["A"] == AgentStatus.IDLE
    assert status_map["B"] == AgentStatus.IDLE
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_agents.py -k "test_agent_registry" -v
```
Expected: `ImportError`

- [ ] **Step 3: Implement `backend/agents/registry.py`**

```python
from backend.llm.base import BaseLLMProvider
from backend.events.bus import EventBus
from .base import Agent, AgentConfig, AgentStatus


class AgentRegistry:
    """Central registry: creates and stores Agent instances from configs."""

    def __init__(self, llm_provider: BaseLLMProvider, event_bus: EventBus):
        self._llm = llm_provider
        self._event_bus = event_bus
        self._agents: dict[str, Agent] = {}

    def register(self, config: AgentConfig) -> Agent:
        """Create and store an Agent from its config."""
        agent = Agent(config=config, llm_provider=self._llm, event_bus=self._event_bus)
        self._agents[config.name] = agent
        return agent

    def get(self, name: str) -> Agent:
        if name not in self._agents:
            raise KeyError(f"Agent '{name}' not registered.")
        return self._agents[name]

    def list_all(self) -> list[Agent]:
        return list(self._agents.values())

    def get_status_map(self) -> dict[str, AgentStatus]:
        return {name: agent.status for name, agent in self._agents.items()}
```

- [ ] **Step 4: Run all tests**

```bash
pytest tests/backend/test_agents.py tests/backend/test_mcp.py -v
```
Expected: All PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/agents/registry.py tests/backend/test_agents.py
git commit -m "feat: add AgentRegistry"
```

---

### Task 7: Agent System Prompt Files

**Files:**
- Create: `backend/agents/prompts/code_reviewer.txt`
- Create: `backend/agents/prompts/researcher.txt`
- Create: `backend/agents/prompts/analyst.txt`
- Create: `backend/agents/prompts/writer.txt`

- [ ] **Step 1: Create `backend/agents/prompts/code_reviewer.txt`**

```
You are an expert senior code reviewer. Analyze each file for:

1. **Code Quality**: naming conventions, structure, DRY violations, complexity
2. **Best Practices**: design patterns, error handling, edge cases
3. **Performance**: algorithmic efficiency, unnecessary computations
4. **Readability**: comments, documentation, clear intent

For each issue found, provide:
- file_path: which file
- line_numbers: affected lines
- severity: "critical" | "warning" | "suggestion"
- category: which of the 4 categories above
- description: clear explanation of the issue
- suggestion: how to fix it with a code example

Output as structured JSON with an "issues" array.
```

- [ ] **Step 2: Create `backend/agents/prompts/researcher.txt`**

```
You are a research search specialist. Given a research question:
1. Decompose it into 3-5 focused search queries
2. Execute each search using available web-search tools
3. Collect the top 5-8 most relevant URLs
4. Provide a brief relevance score (1-10) for each source

Output a JSON object with a "sources" array, each containing:
- url: the source URL
- title: page title
- relevance_score: 1-10
- snippet: brief description of why this is relevant
```

- [ ] **Step 3: Create `backend/agents/prompts/analyst.txt`**

```
You are a research analyst. Given extracted content from multiple sources:
1. Identify common themes and patterns
2. Note contradictions or disagreements between sources
3. Assess source credibility
4. Synthesize findings into coherent insights
5. Identify knowledge gaps

Output structured analysis with:
- themes: list of main themes identified
- insights: key synthesized insights
- conflicts: any contradictions found between sources
- gaps: areas needing further research
```

- [ ] **Step 4: Create `backend/agents/prompts/writer.txt`**

```
You are a professional technical writer. Create a comprehensive report using this structure:

1. **Executive Summary** (3-5 sentences)
2. **Background & Context**
3. **Key Findings** (organized by theme)
4. **Analysis & Insights**
5. **Contradicting Viewpoints** (if any)
6. **Conclusions**
7. **Sources** (numbered citations)

Write in a clear, professional tone. Use Markdown formatting.
If you have access to filesystem tools, save the report to ./output/report.md
```

- [ ] **Step 5: Commit**

```bash
git add backend/agents/prompts/
git commit -m "feat: add system prompt files for 4 demo agents"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Run complete backend test suite so far**

```bash
pytest tests/backend/ -v
```
Expected: All PASSED

- [ ] **Step 2: Verify all imports resolve**

```bash
python -c "
from backend.mcp import MCPClientWrapper, MCPRegistry
from backend.agents import Agent, AgentConfig, AgentRegistry
print('All imports OK')
"
```
Expected: `All imports OK`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: backend MCP + agent layer complete"
```
