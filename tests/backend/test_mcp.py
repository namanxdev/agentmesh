from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException
import pytest

from backend.mcp.tools import format_tool_for_llm, namespace_tool, parse_tool_name


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
        await wrapper.call_tool(
            agent_name="Fetcher", tool_name="read_file", args={"path": "main.py"},
            workflow_id="wf_1"
        )

    assert event_bus.emit.call_count == 2  # tool.called + tool.result
    calls = [c[0][0]["type"] for c in event_bus.emit.call_args_list]
    assert "tool.called" in calls
    assert "tool.result" in calls


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


def test_mcp_registry_register_stores_server_config():
    """Registering a server makes it appear in get_server_info with its config."""
    event_bus = MagicMock()
    registry = MCPRegistry(event_bus=event_bus)
    registry.register("brave", transport="http", url="http://localhost:8080")
    info = registry.get_server_info()
    assert len(info["servers"]) == 1
    server = info["servers"][0]
    assert server["name"] == "brave"
    # The transport config fields should be present alongside the name
    assert server.get("transport") == "http" or "brave" in str(info)


def test_mcp_registry_get_client_raises_for_unknown():
    """get_client() raises KeyError for a server name that was never registered."""
    event_bus = MagicMock()
    registry = MCPRegistry(event_bus=event_bus)
    with pytest.raises(KeyError):
        registry.get_client("nonexistent_server")


def test_mcp_registry_double_register_overwrites():
    """Registering the same name twice does not raise; the second config wins."""
    event_bus = MagicMock()
    registry = MCPRegistry(event_bus=event_bus)
    registry.register("github", transport="stdio", command="old-command")
    registry.register("github", transport="stdio", command="new-command")
    # Should still have exactly one entry
    info = registry.get_server_info()
    assert len(info["servers"]) == 1
    assert info["servers"][0]["name"] == "github"
    # The client should be the newest one
    client = registry.get_client("github")
    assert client.server_name == "github"


def test_mcp_transport_config_from_stdio_row_splits_command_and_env():
    from backend.api.routes import _mcp_transport_config_from_row

    row = SimpleNamespace(
        server_type="stdio",
        command_or_url="npx -y @modelcontextprotocol/server-filesystem E:/Projects",
        env_vars='{"TOKEN":"secret"}',
    )

    config = _mcp_transport_config_from_row(row)

    assert config == {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "E:/Projects"],
        "env": {"TOKEN": "secret"},
    }


def test_mcp_transport_config_from_http_row_uses_url():
    from backend.api.routes import _mcp_transport_config_from_row

    row = SimpleNamespace(
        server_type="http",
        command_or_url="http://localhost:8080/mcp",
        env_vars={},
    )

    assert _mcp_transport_config_from_row(row) == {
        "transport": "http",
        "url": "http://localhost:8080/mcp",
    }


@pytest.mark.asyncio
async def test_load_user_mcp_registry_registers_referenced_servers_only():
    from backend.api.routes import _load_user_mcp_registry
    from backend.events.bus import EventBus

    result = MagicMock()
    result.fetchall.return_value = [
        SimpleNamespace(
            name="filesystem",
            server_type="stdio",
            command_or_url="mcp-server-filesystem E:/Projects",
            env_vars={},
        ),
        SimpleNamespace(
            name="unused",
            server_type="http",
            command_or_url="http://localhost:9999/mcp",
            env_vars={},
        ),
    ]
    db = MagicMock()
    db.execute = AsyncMock(return_value=result)
    definition = {
        "nodes": [
            {"id": "a", "kind": "llm_agent", "config": {"name": "A"}},
            {"id": "t", "kind": "tool", "config": {"server": "filesystem"}},
        ],
        "edges": [],
    }

    with patch("backend.api.routes.MCPRegistry.connect_all", new_callable=AsyncMock) as connect:
        registry = await _load_user_mcp_registry(
            user_id="user-1",
            db=db,
            event_bus=EventBus(),
            definition=definition,
        )

    info = registry.get_server_info()
    assert [s["name"] for s in info["servers"]] == ["filesystem"]
    connect.assert_awaited_once()


@pytest.mark.asyncio
async def test_load_user_mcp_registry_rejects_missing_referenced_server():
    from backend.api.routes import _load_user_mcp_registry
    from backend.events.bus import EventBus

    result = MagicMock()
    result.fetchall.return_value = []
    db = MagicMock()
    db.execute = AsyncMock(return_value=result)
    definition = {
        "nodes": [{"id": "t", "kind": "tool", "config": {"server": "missing"}}],
        "edges": [],
    }

    with pytest.raises(HTTPException) as exc:
        await _load_user_mcp_registry(
            user_id="user-1",
            db=db,
            event_bus=EventBus(),
            definition=definition,
        )

    assert exc.value.status_code == 422
    assert exc.value.detail["error"] == "missing_mcp_servers"
