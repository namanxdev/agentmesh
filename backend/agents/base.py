import re
from enum import Enum

from pydantic import BaseModel, Field

from backend.events.bus import EventBus
from backend.llm.base import BaseLLMProvider, LLMResponse
from backend.mcp.client import MCPClientWrapper
from backend.observability import tcc as _tcc_obs


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
    model: str = "gemini-2.5-flash"
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

        # Start TCC run — one per agent invocation; session_id groups the workflow.
        tcc_run = _tcc_obs.start_run(workflow_id)
        try:
            tcc_run.prompt(task)
            run_metadata = {
                "tcc.agent": self.config.name,
                "role": self.config.role,
                "model": self.config.model,
                "workflowId": workflow_id,
            }
            user_id = _tcc_obs.current_user_id.get()
            if user_id:
                run_metadata["tcc.userId"] = user_id
            tcc_run.metadata(run_metadata)

            messages = self._build_messages(task, state)
            tools = self._get_all_tool_definitions()
            total_usage = {"input": 0, "output": 0}

            self.status = AgentStatus.THINKING

            # --- Initial LLM call ---
            tcc_step = _tcc_obs.start_step(tcc_run)
            try:
                tcc_step.prompt(_tcc_obs.messages_to_prompt(messages))
                response: LLMResponse = await self._llm.generate(
                    messages=messages,
                    tools=tools or None,
                    model=self.config.model,
                    temperature=self.config.temperature,
                    max_tokens=self.config.max_tokens,
                )
                tcc_step.response(response.text or "")
                tcc_step.model(requested=self.config.model, used=self.config.model)
                usage = response.usage
                tcc_step.tokens(
                    prompt_uncached=usage.get("input", 0),
                    completion=usage.get("output", 0),
                )
                tcc_step.end()
            except Exception as exc:
                tcc_step.error(status_message=str(exc))
                raise

            total_usage["input"] += response.usage.get("input", 0)
            total_usage["output"] += response.usage.get("output", 0)

            # --- Tool-call loop ---
            while response.has_tool_calls:
                self.status = AgentStatus.TOOL_CALLING
                tool_result_messages = []
                for tc in response.tool_calls:
                    namespaced = tc["name"]
                    server_name, tool_name = namespaced.split("__", 1)
                    mcp_client = self._mcp_clients.get(server_name)

                    tcc_tc = _tcc_obs.start_tool_call(tcc_run, namespaced)
                    try:
                        tcc_tc.args(tc.get("args", {}))
                        if mcp_client is None:
                            result_content = [f"Error: MCP server '{server_name}' not connected."]
                            tcc_tc.result(str(result_content))
                            tcc_tc.end()
                        else:
                            result_content = await mcp_client.call_tool(
                                agent_name=self.config.name,
                                tool_name=tool_name,
                                args=tc.get("args", {}),
                                workflow_id=workflow_id,
                            )
                            tcc_tc.result(str(result_content))
                            tcc_tc.end()
                    except Exception as exc:
                        tcc_tc.error(str(exc))
                        raise

                    tool_result_messages.append(
                        {
                            "role": "tool",
                            "content": str(result_content),
                            "tool_name": namespaced,
                        }
                    )

                messages = (
                    messages + [{"role": "assistant", "content": ""}] + tool_result_messages
                )
                self.status = AgentStatus.THINKING

                tcc_step = _tcc_obs.start_step(tcc_run)
                try:
                    tcc_step.prompt(_tcc_obs.messages_to_prompt(messages))
                    response = await self._llm.generate(
                        messages=messages,
                        tools=tools or None,
                        model=self.config.model,
                        temperature=self.config.temperature,
                        max_tokens=self.config.max_tokens,
                    )
                    tcc_step.response(response.text or "")
                    tcc_step.model(requested=self.config.model, used=self.config.model)
                    usage = response.usage
                    tcc_step.tokens(
                        prompt_uncached=usage.get("input", 0),
                        completion=usage.get("output", 0),
                    )
                    tcc_step.end()
                except Exception as exc:
                    tcc_step.error(status_message=str(exc))
                    raise

                total_usage["input"] += response.usage.get("input", 0)
                total_usage["output"] += response.usage.get("output", 0)

            self.status = AgentStatus.COMPLETED
            routing_key = self._determine_routing_key(response.text)

            tcc_run.response(response.text or "")
            tcc_run.end()

        except Exception as exc:
            try:
                tcc_run.error(status_message=str(exc))
            except Exception:
                pass
            self.status = AgentStatus.ERROR
            raise

        await self._event_bus.emit(
            {
                "type": "agent.completed",
                "workflow_id": workflow_id,
                "agentName": self.config.name,
                "output": response.text,
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
