import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch
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
