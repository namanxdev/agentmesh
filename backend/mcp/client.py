import time
import fastmcp
from typing import Optional
from backend.events.bus import EventBus
from .tools import namespace_tool, format_tool_for_llm


class MCPClientWrapper:
    """Wraps a FastMCP client with event emission and tool namespacing."""

    def __init__(self, server_name: str, transport_config: dict, event_bus: EventBus):
        self.server_name = server_name
        self._transport_config = transport_config
        self._event_bus = event_bus
        self._client = None
        self._tool_definitions: list[dict] = []
        self._connected = False

    async def connect(self):
        """Connect to MCP server and discover tools."""
        self._client = fastmcp.Client(self._transport_config)
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
            async with fastmcp.Client(self._transport_config) as client:
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
