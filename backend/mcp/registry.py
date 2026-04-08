import asyncio
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

    async def connect_all(self, timeout_seconds: float = 5.0):
        """Connect to all registered MCP servers without blocking forever."""
        for name, client in self._clients.items():
            try:
                await asyncio.wait_for(client.connect(), timeout=timeout_seconds)
            except asyncio.TimeoutError:
                await self._event_bus.emit({
                    "type": "mcp.connection_error",
                    "workflow_id": "",
                    "server": name,
                    "error": f"Connection timed out after {timeout_seconds:.1f}s",
                })
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
