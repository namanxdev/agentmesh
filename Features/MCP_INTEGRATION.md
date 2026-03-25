# 🔌 MCP Integration

> Connect agents to any MCP-compliant server — filesystem, GitHub, web search, and beyond.

---

## Overview

AgentMesh agents act as MCP clients, connecting to external MCP servers to gain tool capabilities. Each agent auto-discovers the tools available from its connected servers.

## Supported Transports

| Transport | Protocol | Use Case |
|-----------|----------|----------|
| **stdio** | Standard I/O | Local MCP servers (processes) |
| **SSE** | Server-Sent Events | Remote MCP servers (HTTP) |

## Built-in Server Support

| Server | Package | Tools Examples |
|--------|---------|---------------|
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | `read_file`, `write_file`, `list_dir` |
| **GitHub** | `@modelcontextprotocol/server-github` | `search_repos`, `read_file`, `create_issue` |
| **Web Search** | Custom SSE server | `web_search`, `fetch_url` |
| **Database** | `@modelcontextprotocol/server-sqlite` | `query`, `list_tables` |
| **Custom** | Any MCP server | Depends on implementation |

## Configuration

```python
from agentmesh.mcp import MCPRegistry

mcp = MCPRegistry()

# stdio transport (local process)
mcp.register(
    "github",
    transport="stdio",
    command="npx",
    args=["-y", "@modelcontextprotocol/server-github"],
    env={"GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"}
)

# SSE transport (remote server)
mcp.register(
    "web-search",
    transport="sse",
    url="http://localhost:3001/sse"
)
```

## Tool Discovery

When an agent connects to an MCP server, it automatically discovers all available tools:

```python
agent = Agent(name="Coder", mcp_servers=["github", "filesystem"])
await agent.initialize(mcp_registry)

# Agent now has access to these tools:
# - github__search_repositories
# - github__read_file
# - github__create_issue
# - filesystem__read_file
# - filesystem__write_file
# - filesystem__list_directory
```

## Tool Call Flow

```
Agent LLM Response
    → includes tool_call: github__read_file({path: "src/main.py"})
    → MCPClientWrapper routes to "github" server
    → Executes read_file tool via MCP protocol
    → Returns result to agent
    → Agent continues with tool result in context
    → Every step emits WebSocket events
```

## Features

- **Auto-discovery** of tools from connected MCP servers
- **Namespaced tools** — `server__tool_name` prevents collisions
- **Connection pooling** for concurrent tool calls
- **Health checks** with graceful degradation
- **Event emission** for every tool call (visible in Mission Control)

## Related Docs

- [API.md](../docs/API.md) — MCP server API endpoints
- [IMPLEMENTATION.md](../docs/IMPLEMENTATION.md) — MCPClientWrapper code
