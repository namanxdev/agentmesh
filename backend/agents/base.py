import re
from enum import Enum

from pydantic import BaseModel, Field

from backend.events.bus import EventBus
from backend.llm.base import BaseLLMProvider, LLMResponse
from backend.mcp.client import MCPClientWrapper


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
    state_updates: dict | None = None


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
        match = re.search(r"\[ROUTE:\s*([a-zA-Z_][a-zA-Z0-9_]*)\]", response_text)
        if match:
            key = match.group(1)
            if key in self.config.handoff_rules:
                return key
        return "on_complete"

    async def process(self, task: str, state: dict, workflow_id: str = "") -> AgentResult:
        """Run one agent turn: think -> optional tool calls -> produce output."""
        self.status = AgentStatus.ACTIVE
        await self._event_bus.emit(
            {
                "type": "agent.activated",
                "workflow_id": workflow_id,
                "agentName": self.config.name,
                "role": self.config.role,
                "taskDescription": task[:200],
            }
        )

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
                tool_result_messages.append(
                    {
                        "role": "tool",
                        "content": str(result_content),
                        "tool_name": namespaced,
                    }
                )

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

        await self._event_bus.emit(
            {
                "type": "agent.completed",
                "workflow_id": workflow_id,
                "agentName": self.config.name,
                "output": response.text[:2000],
                "tokenUsage": total_usage,
            }
        )
        await self._event_bus.emit(
            {
                "type": "token.usage",
                "workflow_id": workflow_id,
                "agentName": self.config.name,
                "input": total_usage["input"],
                "output": total_usage["output"],
                "total": total_usage["input"] + total_usage["output"],
            }
        )

        return AgentResult(
            output=response.text,
            routing_key=routing_key,
            token_usage=total_usage,
        )
