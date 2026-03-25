import pytest
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
