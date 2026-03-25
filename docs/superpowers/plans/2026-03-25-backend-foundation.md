# Backend Foundation Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the AgentMesh backend foundation — Python package config, LLM provider abstraction (Gemini + Groq), and real-time WebSocket event bus.

**Architecture:** Three independent modules: `llm/` provides a provider-agnostic interface for LLM inference with tool calling; `events/` provides a WebSocket broadcast bus with event buffering and typed Pydantic event models. Both are consumed by the agent and orchestrator layers (built in separate parallel plans).

**Tech Stack:** Python 3.11+, FastAPI, Pydantic v2, google-generativeai, groq, asyncio, pytest, pytest-asyncio

---

## File Map

| File | Responsibility |
|------|----------------|
| `pyproject.toml` | Package metadata, all dependencies, dev tools, pytest config |
| `.env.example` | Environment variable template (API keys) |
| `backend/__init__.py` | Package version |
| `backend/llm/__init__.py` | Re-exports |
| `backend/llm/base.py` | `BaseLLMProvider` ABC + `LLMResponse` Pydantic model |
| `backend/llm/gemini.py` | `GeminiProvider` — Gemini 2.0 Flash integration |
| `backend/llm/groq.py` | `GroqProvider` — Groq Llama 3.3 integration |
| `backend/events/__init__.py` | Re-exports |
| `backend/events/models.py` | All event Pydantic models (one class per event type) |
| `backend/events/bus.py` | `EventBus` — async WebSocket broadcaster with buffer |
| `backend/events/stream.py` | SSE fallback async generator |
| `tests/__init__.py` | Empty |
| `tests/backend/__init__.py` | Empty |
| `tests/backend/test_llm.py` | LLM provider tests (mocked API calls) |
| `tests/backend/test_events.py` | EventBus + event model tests |

---

### Task 1: Project Setup

**Files:**
- Create: `pyproject.toml`
- Create: `.env.example`
- Create: `backend/__init__.py`
- Create: `tests/__init__.py`
- Create: `tests/backend/__init__.py`

- [ ] **Step 1: Create `pyproject.toml`**

```toml
[project]
name = "agentmesh"
version = "0.1.0"
description = "MCP-Native Multi-Agent Orchestrator with Live Mission Control"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.29.0",
    "pydantic>=2.0.0",
    "websockets>=12.0",
    "langgraph>=0.2.0",
    "fastmcp>=1.0.0",
    "google-generativeai>=0.5.0",
    "groq>=0.5.0",
    "python-dotenv>=1.0.0",
    "httpx>=0.27.0",
    "anyio>=4.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-mock>=3.14.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 2: Create `.env.example`**

```bash
# LLM API Keys (free tier)
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Optional: GitHub MCP (for code review demo)
GITHUB_TOKEN=your_github_personal_access_token_here

# Server
PORT=8000
HOST=0.0.0.0
```

- [ ] **Step 3: Create package init files**

`backend/__init__.py`:
```python
"""AgentMesh — MCP-Native Multi-Agent Orchestrator."""
__version__ = "0.1.0"
```

`tests/__init__.py` — empty file
`tests/backend/__init__.py` — empty file

- [ ] **Step 4: Install dependencies**

```bash
cd E:/Projects/AgentMesh
python -m venv .venv
source .venv/Scripts/activate
pip install -e ".[dev]"
```

Expected: All packages install without errors.

- [ ] **Step 5: Verify import works**

```bash
python -c "import backend; print(backend.__version__)"
```

Expected: `0.1.0`

- [ ] **Step 6: Init git and commit**

```bash
git init
git add pyproject.toml .env.example backend/__init__.py tests/__init__.py tests/backend/__init__.py
git commit -m "feat: initialize agentmesh python package"
```

---

### Task 2: LLM Base Interface

**Files:**
- Create: `backend/llm/base.py`
- Create: `backend/llm/__init__.py`
- Create: `tests/backend/test_llm.py`

- [ ] **Step 1: Write failing tests**

`tests/backend/test_llm.py`:
```python
import pytest
from backend.llm.base import LLMResponse, BaseLLMProvider


def test_llm_response_no_tool_calls():
    resp = LLMResponse(text="Hello", usage={"input": 10, "output": 5})
    assert resp.has_tool_calls is False


def test_llm_response_with_tool_calls():
    resp = LLMResponse(
        text="",
        tool_calls=[{"name": "read_file", "args": {"path": "test.py"}}],
        usage={"input": 20, "output": 10},
    )
    assert resp.has_tool_calls is True


def test_base_provider_is_abstract():
    with pytest.raises(TypeError):
        BaseLLMProvider()
```

- [ ] **Step 2: Run — verify they fail**

```bash
pytest tests/backend/test_llm.py -v
```
Expected: `ImportError: cannot import name 'LLMResponse'`

- [ ] **Step 3: Implement `backend/llm/base.py`**

```python
from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class LLMResponse(BaseModel):
    """Response from any LLM provider."""
    text: str = ""
    tool_calls: list[dict] = Field(default_factory=list)
    has_tool_calls: bool = False
    usage: dict = Field(default_factory=lambda: {"input": 0, "output": 0})

    @model_validator(mode="after")
    def _set_has_tool_calls(self) -> "LLMResponse":
        self.has_tool_calls = len(self.tool_calls) > 0
        return self


class BaseLLMProvider(ABC):
    """Abstract base for all LLM providers."""

    @abstractmethod
    async def generate(
        self,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        pass
```

`backend/llm/__init__.py`:
```python
from .base import BaseLLMProvider, LLMResponse
__all__ = ["BaseLLMProvider", "LLMResponse"]
```

- [ ] **Step 4: Run — verify passing**

```bash
pytest tests/backend/test_llm.py -v
```
Expected: 3 PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/llm/ tests/backend/test_llm.py
git commit -m "feat: add LLM base interface"
```

---

### Task 3: Gemini Provider

**Files:**
- Create: `backend/llm/gemini.py`

- [ ] **Step 1: Write failing test** — append to `tests/backend/test_llm.py`

```python
from unittest.mock import AsyncMock, MagicMock, patch
from backend.llm.gemini import GeminiProvider


@pytest.mark.asyncio
async def test_gemini_generate_text():
    mock_part = MagicMock()
    mock_part.function_call = MagicMock(name="")
    mock_part.text = "Looks good."
    mock_response = MagicMock()
    mock_response.parts = [mock_part]
    mock_response.usage_metadata.prompt_token_count = 100
    mock_response.usage_metadata.candidates_token_count = 50

    with patch("google.generativeai.GenerativeModel") as MockModel:
        instance = MagicMock()
        instance.generate_content_async = AsyncMock(return_value=mock_response)
        MockModel.return_value = instance

        provider = GeminiProvider(api_key="test")
        result = await provider.generate(
            messages=[{"role": "user", "content": "Review this"}],
            model="gemini-2.0-flash",
        )

    assert result.text == "Looks good."
    assert result.has_tool_calls is False
    assert result.usage["input"] == 100
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_llm.py::test_gemini_generate_text -v
```
Expected: `ImportError: cannot import name 'GeminiProvider'`

- [ ] **Step 3: Implement `backend/llm/gemini.py`**

```python
from typing import Optional
import google.generativeai as genai
from .base import BaseLLMProvider, LLMResponse


class GeminiProvider(BaseLLMProvider):
    """Gemini LLM provider (Gemini 2.0 Flash)."""

    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)

    async def generate(
        self,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        model: str = "gemini-2.0-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        gen_model = genai.GenerativeModel(model)
        response = await gen_model.generate_content_async(
            contents=self._format_messages(messages),
            tools=self._format_tools(tools) if tools else None,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        return self._parse_response(response)

    def _format_messages(self, messages: list[dict]) -> list[dict]:
        result = []
        for msg in messages:
            role = "user" if msg["role"] in ("user", "tool") else "model"
            result.append({"role": role, "parts": [{"text": str(msg.get("content", ""))}]})
        return result

    def _format_tools(self, tools: list[dict]) -> list:
        declarations = [
            genai.protos.FunctionDeclaration(
                name=t["function"]["name"],
                description=t["function"].get("description", ""),
                parameters=t["function"].get("parameters", {}),
            )
            for t in tools
        ]
        return [genai.protos.Tool(function_declarations=declarations)]

    def _parse_response(self, response) -> LLMResponse:
        text, tool_calls = "", []
        for part in response.parts:
            fc = part.function_call
            if fc and fc.name:
                tool_calls.append({"name": fc.name, "args": dict(fc.args)})
            elif hasattr(part, "text"):
                text += part.text
        return LLMResponse(
            text=text,
            tool_calls=tool_calls,
            usage={
                "input": response.usage_metadata.prompt_token_count,
                "output": response.usage_metadata.candidates_token_count,
            },
        )
```

- [ ] **Step 4: Run all LLM tests**

```bash
pytest tests/backend/test_llm.py -v
```
Expected: All PASSED

- [ ] **Step 5: Update `backend/llm/__init__.py`** to export all providers

```python
from .base import BaseLLMProvider, LLMResponse
from .gemini import GeminiProvider
from .groq import GroqProvider
__all__ = ["BaseLLMProvider", "LLMResponse", "GeminiProvider", "GroqProvider"]
```

- [ ] **Step 6: Commit**

```bash
git add backend/llm/gemini.py backend/llm/__init__.py tests/backend/test_llm.py
git commit -m "feat: add Gemini LLM provider"
```

---

### Task 4: Groq Provider

**Files:**
- Create: `backend/llm/groq.py`

- [ ] **Step 1: Write failing test** — append to `tests/backend/test_llm.py`

```python
from backend.llm.groq import GroqProvider


@pytest.mark.asyncio
async def test_groq_generate_text():
    mock_choice = MagicMock()
    mock_choice.message.content = "Security scan complete."
    mock_choice.message.tool_calls = None
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_response.usage.prompt_tokens = 80
    mock_response.usage.completion_tokens = 40

    with patch("groq.AsyncGroq") as MockGroq:
        instance = MagicMock()
        instance.chat.completions.create = AsyncMock(return_value=mock_response)
        MockGroq.return_value = instance

        provider = GroqProvider(api_key="test")
        result = await provider.generate(
            messages=[{"role": "user", "content": "Scan for vulnerabilities"}],
        )

    assert result.text == "Security scan complete."
    assert result.has_tool_calls is False
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_llm.py::test_groq_generate_text -v
```
Expected: `ImportError`

- [ ] **Step 3: Implement `backend/llm/groq.py`**

```python
import json
from typing import Optional
from groq import AsyncGroq
from .base import BaseLLMProvider, LLMResponse


class GroqProvider(BaseLLMProvider):
    """Groq LLM provider (Llama 3.3 70B)."""

    def __init__(self, api_key: str):
        self.client = AsyncGroq(api_key=api_key)

    async def generate(
        self,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        kwargs: dict = dict(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = await self.client.chat.completions.create(**kwargs)
        return self._parse_response(response)

    def _parse_response(self, response) -> LLMResponse:
        msg = response.choices[0].message
        tool_calls = []
        if msg.tool_calls:
            for tc in msg.tool_calls:
                tool_calls.append({
                    "name": tc.function.name,
                    "args": json.loads(tc.function.arguments),
                })
        return LLMResponse(
            text=msg.content or "",
            tool_calls=tool_calls,
            usage={
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens,
            },
        )
```

- [ ] **Step 4: Run all LLM tests**

```bash
pytest tests/backend/test_llm.py -v
```
Expected: All PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/llm/groq.py tests/backend/test_llm.py
git commit -m "feat: add Groq LLM provider"
```

---

### Task 5: Event Models

**Files:**
- Create: `backend/events/models.py`
- Create: `tests/backend/test_events.py`

- [ ] **Step 1: Write failing tests**

`tests/backend/test_events.py`:
```python
import pytest
from backend.events.models import (
    AgentActivatedEvent, AgentCompletedEvent, ToolCalledEvent,
    TokenUsageEvent, WorkflowStartedEvent, WorkflowCompletedEvent,
)


def test_agent_activated_event_fields():
    e = AgentActivatedEvent(workflow_id="wf_1", agentName="Reviewer", role="Code Reviewer")
    assert e.type == "agent.activated"
    assert e.id.startswith("evt_")
    assert e.timestamp > 0


def test_tool_called_event_fields():
    e = ToolCalledEvent(
        workflow_id="wf_1", agentName="Fetcher",
        server="github", tool="read_file", args={"path": "src/main.py"}
    )
    assert e.type == "tool.called"
    assert e.server == "github"


def test_workflow_completed_event_fields():
    e = WorkflowCompletedEvent(
        workflow_id="wf_1", result={"summary": "Done"}, totalTokens=1500, duration=34.2
    )
    assert e.type == "workflow.completed"
    assert e.totalTokens == 1500


def test_event_serializes_to_dict():
    e = AgentActivatedEvent(workflow_id="wf_1", agentName="A", role="R")
    d = e.model_dump()
    assert d["type"] == "agent.activated"
    assert "id" in d
    assert "timestamp" in d
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_events.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Implement `backend/events/models.py`**

```python
import time
import uuid
from typing import Any
from pydantic import BaseModel, Field


def _id() -> str:
    return f"evt_{uuid.uuid4().hex[:8]}"


def _ts() -> float:
    return time.time()


class BaseEvent(BaseModel):
    id: str = Field(default_factory=_id)
    type: str
    timestamp: float = Field(default_factory=_ts)
    workflow_id: str


class WorkflowStartedEvent(BaseEvent):
    type: str = "workflow.started"
    agents: list[str]
    task: str


class WorkflowCompletedEvent(BaseEvent):
    type: str = "workflow.completed"
    result: Any
    totalTokens: int
    duration: float


class WorkflowErrorEvent(BaseEvent):
    type: str = "workflow.error"
    error: str
    failedAgent: str


class AgentActivatedEvent(BaseEvent):
    type: str = "agent.activated"
    agentName: str
    role: str
    taskDescription: str = ""


class AgentThinkingEvent(BaseEvent):
    type: str = "agent.thinking"
    agentName: str
    partialResponse: str


class AgentCompletedEvent(BaseEvent):
    type: str = "agent.completed"
    agentName: str
    output: str
    tokenUsage: dict = Field(default_factory=dict)


class AgentHandoffEvent(BaseEvent):
    type: str = "agent.handoff"
    fromAgent: str
    toAgent: str
    reason: str = ""


class ToolCalledEvent(BaseEvent):
    type: str = "tool.called"
    agentName: str
    server: str
    tool: str
    args: dict = Field(default_factory=dict)


class ToolResultEvent(BaseEvent):
    type: str = "tool.result"
    agentName: str
    server: str
    tool: str
    result: Any
    duration_ms: float = 0.0


class ToolErrorEvent(BaseEvent):
    type: str = "tool.error"
    agentName: str
    server: str
    tool: str
    error: str


class TokenUsageEvent(BaseEvent):
    type: str = "token.usage"
    agentName: str
    input: int
    output: int
    total: int
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/backend/test_events.py -v
```
Expected: 4 PASSED (bus tests not yet written)

- [ ] **Step 5: Commit**

```bash
git add backend/events/models.py tests/backend/test_events.py
git commit -m "feat: add Pydantic event models for all AgentMesh event types"
```

---

### Task 6: Event Bus + SSE Stream

**Files:**
- Create: `backend/events/bus.py`
- Create: `backend/events/stream.py`
- Create: `backend/events/__init__.py`

- [ ] **Step 1: Write failing tests** — append to `tests/backend/test_events.py`

```python
from unittest.mock import AsyncMock, MagicMock
from backend.events.bus import EventBus
from backend.events.models import AgentActivatedEvent


@pytest.mark.asyncio
async def test_bus_broadcasts_to_subscribers():
    bus = EventBus()
    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()

    await bus.subscribe(ws)
    event = AgentActivatedEvent(workflow_id="wf_1", agentName="Fetcher", role="Fetcher")
    await bus.emit(event.model_dump())

    # Called once for buffered replay (0 events) + once for emit
    assert ws.send_json.call_count == 1
    sent = ws.send_json.call_args[0][0]
    assert sent["type"] == "agent.activated"


@pytest.mark.asyncio
async def test_bus_buffers_events():
    bus = EventBus()
    for i in range(5):
        await bus.emit({"type": "test", "workflow_id": "wf_1", "i": i})
    assert len(bus._event_buffer) == 5


@pytest.mark.asyncio
async def test_bus_replays_buffer_on_subscribe():
    bus = EventBus()
    await bus.emit({"type": "workflow.started", "workflow_id": "wf_1"})

    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()
    await bus.subscribe(ws)

    # Should get the 1 buffered event
    assert ws.send_json.call_count == 1


@pytest.mark.asyncio
async def test_bus_removes_disconnected_ws():
    bus = EventBus()
    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock(side_effect=Exception("gone"))
    await bus.subscribe(ws)
    await bus.emit({"type": "test", "workflow_id": "wf_1"})
    assert ws not in bus._subscribers
```

- [ ] **Step 2: Run — verify failure**

```bash
pytest tests/backend/test_events.py -k "test_bus" -v
```
Expected: `ImportError: cannot import name 'EventBus'`

- [ ] **Step 3: Implement `backend/events/bus.py`**

```python
import uuid
import time
from fastapi import WebSocket


class EventBus:
    """Async WebSocket event bus with replay buffer."""

    def __init__(self, buffer_size: int = 100):
        self._subscribers: list[WebSocket] = []
        self._event_buffer: list[dict] = []
        self._buffer_size = buffer_size

    async def subscribe(self, ws: WebSocket):
        """Accept connection and replay buffered events."""
        await ws.accept()
        self._subscribers.append(ws)
        for event in self._event_buffer:
            await ws.send_json(event)

    def unsubscribe(self, ws: WebSocket):
        if ws in self._subscribers:
            self._subscribers.remove(ws)

    async def emit(self, event: dict):
        """Broadcast to all subscribers; buffer for late-joiners."""
        event.setdefault("id", f"evt_{uuid.uuid4().hex[:8]}")
        event.setdefault("timestamp", time.time())

        self._event_buffer.append(event)
        if len(self._event_buffer) > self._buffer_size:
            self._event_buffer.pop(0)

        disconnected = []
        for ws in self._subscribers:
            try:
                await ws.send_json(event)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self._subscribers.remove(ws)
```

- [ ] **Step 4: Implement `backend/events/stream.py`**

```python
"""SSE fallback for environments without WebSocket support."""
import asyncio
import json
from typing import AsyncIterator
from .bus import EventBus


async def event_stream(
    bus: EventBus, workflow_id: str | None = None
) -> AsyncIterator[str]:
    """Yield SSE-formatted strings from the event bus buffer.

    Tracks a buffer index so no events are skipped, even when workflow_id
    filtering creates gaps in the buffer.
    """
    # Replay buffered events first
    next_index = 0
    for event in bus._event_buffer:
        next_index += 1
        if workflow_id and event.get("workflow_id") != workflow_id:
            continue
        yield f"data: {json.dumps(event)}\n\n"

    # Poll for new events by index — never re-scans old events
    while True:
        await asyncio.sleep(0.1)
        current_len = len(bus._event_buffer)
        while next_index < current_len:
            event = bus._event_buffer[next_index]
            next_index += 1
            if workflow_id and event.get("workflow_id") != workflow_id:
                continue
            yield f"data: {json.dumps(event)}\n\n"
```

- [ ] **Step 5: Create `backend/events/__init__.py`**

```python
from .bus import EventBus
from .models import (
    BaseEvent, WorkflowStartedEvent, WorkflowCompletedEvent,
    WorkflowErrorEvent, AgentActivatedEvent, AgentThinkingEvent,
    AgentCompletedEvent, AgentHandoffEvent, ToolCalledEvent,
    ToolResultEvent, ToolErrorEvent, TokenUsageEvent,
)

__all__ = [
    "EventBus", "BaseEvent", "WorkflowStartedEvent", "WorkflowCompletedEvent",
    "WorkflowErrorEvent", "AgentActivatedEvent", "AgentThinkingEvent",
    "AgentCompletedEvent", "AgentHandoffEvent", "ToolCalledEvent",
    "ToolResultEvent", "ToolErrorEvent", "TokenUsageEvent",
]
```

- [ ] **Step 6: Run all event tests**

```bash
pytest tests/backend/test_events.py -v
```
Expected: All PASSED

- [ ] **Step 7: Commit**

```bash
git add backend/events/ tests/backend/test_events.py
git commit -m "feat: add EventBus with WebSocket broadcasting, buffer, and SSE fallback"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
pytest tests/ -v
```
Expected: All tests PASSED, no errors.

- [ ] **Step 2: Verify imports chain cleanly**

```bash
python -c "from backend.llm import GeminiProvider, GroqProvider; from backend.events import EventBus; print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: backend foundation layer complete (llm + events)"
```
