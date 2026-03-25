from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class AgentStatus(str, Enum):
    IDLE = "idle"
    ACTIVE = "active"
    THINKING = "thinking"
    TOOL_CALLING = "tool_calling"
    COMPLETED = "completed"
    ERROR = "error"


class AgentConfig(BaseModel):
    name: str
    role: str
    system_prompt: str
    mcp_servers: list[str] = Field(default_factory=list)
    handoff_rules: dict[str, str] = Field(default_factory=dict)
    model: str = "gemini-2.0-flash"
    temperature: float = 0.7
    max_tokens: int = 4096


class AgentResult(BaseModel):
    output: str
    routing_key: str = "on_complete"
    token_usage: dict = Field(default_factory=lambda: {"input": 0, "output": 0})
    state_updates: Optional[dict] = None
