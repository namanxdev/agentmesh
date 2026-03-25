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
