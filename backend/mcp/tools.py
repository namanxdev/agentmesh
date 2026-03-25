"""Tool naming helpers for MCP server/tool namespacing."""


def namespace_tool(server_name: str, tool_name: str) -> str:
    """Returns 'server__tool' namespaced name."""
    return f"{server_name}__{tool_name}"


def parse_tool_name(namespaced: str) -> tuple[str, str]:
    """Splits 'server__tool' into (server, tool). Raises ValueError if invalid."""
    if "__" not in namespaced:
        raise ValueError(f"Invalid namespaced tool: '{namespaced}'. Expected 'server__tool'.")
    server, tool = namespaced.split("__", 1)
    return server, tool


def format_tool_for_llm(
    server_name: str,
    tool_name: str,
    description: str,
    input_schema: dict,
) -> dict:
    """Return an OpenAI-compatible tool definition for LLM function calling."""
    return {
        "type": "function",
        "function": {
            "name": namespace_tool(server_name, tool_name),
            "description": description,
            "parameters": input_schema,
        },
    }
