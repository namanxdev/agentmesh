"""
Lightweight pipeline-node agents that run without an LLM.

MemoryAgent  — stores/retrieves data in shared workflow state.
TransformAgent — applies a deterministic transformation to shared state.

Both implement the same process() interface as Agent so they can be stored
in AgentRegistry and driven by WorkflowOrchestrator without any changes to
the orchestrator itself.
"""

from __future__ import annotations

import json
import logging

from backend.agents.base import AgentConfig, AgentResult, AgentStatus
from backend.events.bus import EventBus

logger = logging.getLogger(__name__)


class _BaseNodeAgent:
    """Minimal shared scaffold that makes node agents look like Agent to the registry."""

    def __init__(self, name: str, role: str, event_bus: EventBus):
        self.config = AgentConfig(
            name=name,
            role=role,
            system_prompt="",  # not used
            mcp_servers=[],
            handoff_rules={},
        )
        self._event_bus = event_bus
        self.status: AgentStatus = AgentStatus.IDLE
        # AgentRegistry.list_all() / routes.py read this attribute:
        self._mcp_clients: dict = {}

    def register_mcp_client(self, server_name: str, client: object) -> None:  # noqa: ARG002
        pass  # node agents don't use MCP tools

    def get_tool_definitions(self) -> list:
        return []

    async def _emit_activated(self, description: str, workflow_id: str) -> None:
        self.status = AgentStatus.ACTIVE
        await self._event_bus.emit(
            {
                "type": "agent.activated",
                "workflow_id": workflow_id,
                "agentName": self.config.name,
                "role": self.config.role,
                "taskDescription": description,
            }
        )

    async def _emit_completed(self, output: str, workflow_id: str) -> None:
        self.status = AgentStatus.COMPLETED
        await self._event_bus.emit(
            {
                "type": "agent.completed",
                "workflow_id": workflow_id,
                "agentName": self.config.name,
                "output": output,
                "tokenUsage": {"input": 0, "output": 0},
            }
        )


# ---------------------------------------------------------------------------
# MemoryAgent
# ---------------------------------------------------------------------------


class MemoryAgent(_BaseNodeAgent):
    """
    Stores or retrieves data from shared workflow state.

    memory_type:
        "context"  — snapshot the current shared_data under `key`; downstream
                     agents will see this key in their state context.
        "store"    — alias for "context".
        "retrieve" — surfacing what is already in state[key] as the node output
                     (useful to make an LLM agent downstream focus on that key).
    """

    def __init__(
        self,
        name: str,
        key: str,
        memory_type: str,
        event_bus: EventBus,
    ):
        super().__init__(name=name, role="memory", event_bus=event_bus)
        self._key = key
        self._memory_type = memory_type

    async def process(
        self,
        task: str,
        state: dict,
        workflow_id: str = "",
    ) -> AgentResult:
        description = f"Memory ({self._memory_type}): key={self._key!r}"
        await self._emit_activated(description, workflow_id)

        if self._memory_type in ("context", "store"):
            # Snapshot everything currently in shared_data under the key.
            # Serialise to a string so LLM agents can read it naturally.
            snapshot = json.dumps(state, ensure_ascii=False, default=str)
            updates = {self._key: snapshot}
            output = f"[Memory stored → {self._key}]"
        else:
            # retrieve — surface the value, no state changes
            stored = state.get(self._key)
            updates = {}
            if stored is None:
                output = f"[Memory key '{self._key}' not found in state]"
            else:
                output = stored if isinstance(stored, str) else json.dumps(stored, default=str)

        await self._emit_completed(output, workflow_id)
        return AgentResult(
            output=output,
            routing_key="on_complete",
            token_usage={"input": 0, "output": 0},
            state_updates=updates if updates else None,
        )


# ---------------------------------------------------------------------------
# TransformAgent
# ---------------------------------------------------------------------------


class TransformAgent(_BaseNodeAgent):
    """
    Applies a deterministic transformation to shared workflow state.

    transform_type / expression:
        "json_parse"  / field_name  — parse state[field_name] as JSON and
                                       store the result back under the same key.
        "extract"     / dot.path    — walk a dot-notation path through state
                                       and store the extracted value as "extracted".
        "format"      / template    — evaluate a Python str.format_map(state)
                                       template and store the result as "formatted".
    """

    def __init__(
        self,
        name: str,
        transform_type: str,
        expression: str,
        event_bus: EventBus,
    ):
        super().__init__(name=name, role="transform", event_bus=event_bus)
        self._transform_type = transform_type
        self._expression = expression

    async def process(
        self,
        task: str,
        state: dict,
        workflow_id: str = "",
    ) -> AgentResult:
        description = f"Transform ({self._transform_type}): {self._expression!r}"
        await self._emit_activated(description, workflow_id)

        output: str
        updates: dict | None

        if self._transform_type == "json_parse":
            field = self._expression or "last_output"
            raw = state.get(field, "")
            try:
                parsed = json.loads(raw)
                updates = {field: parsed}
                output = json.dumps(parsed, indent=2, ensure_ascii=False)
            except (json.JSONDecodeError, TypeError) as exc:
                logger.warning("TransformAgent json_parse failed for field %r: %s", field, exc)
                updates = None
                output = f"[json_parse: could not parse field '{field}': {exc}]"

        elif self._transform_type == "extract":
            # Walk a dot-notation path: "a.b.c" → state["a"]["b"]["c"]
            keys = self._expression.split(".") if self._expression else []
            value: object = state
            try:
                for k in keys:
                    if isinstance(value, dict):
                        value = value[k]
                    elif isinstance(value, list | tuple):
                        value = value[int(k)]
                    else:
                        raise KeyError(k)
                output = value if isinstance(value, str) else json.dumps(value, default=str)
                updates = {"extracted": value}
            except (KeyError, IndexError, ValueError) as exc:
                logger.warning(
                    "TransformAgent extract failed for path %r: %s", self._expression, exc
                )
                output = f"[extract: path '{self._expression}' not found: {exc}]"
                updates = None

        elif self._transform_type == "format":
            try:
                # Use format_map with a defaultdict so missing keys become empty strings.
                from collections import defaultdict

                safe_state: dict = defaultdict(str, {k: str(v) for k, v in state.items()})
                output = self._expression.format_map(safe_state)
                updates = {"formatted": output}
            except Exception as exc:  # noqa: BLE001
                logger.warning("TransformAgent format failed: %s", exc)
                output = self._expression
                updates = {"formatted": output}

        else:
            logger.warning("TransformAgent: unknown transform_type %r", self._transform_type)
            output = f"[transform: unknown type '{self._transform_type}']"
            updates = None

        await self._emit_completed(output, workflow_id)
        return AgentResult(
            output=output,
            routing_key="on_complete",
            token_usage={"input": 0, "output": 0},
            state_updates=updates,
        )
