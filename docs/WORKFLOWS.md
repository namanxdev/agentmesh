# 🔁 AgentMesh — Workflow Documentation

> Demo workflow configurations, execution patterns, and customization guide.

---

## Table of Contents

- [Workflow Concepts](#workflow-concepts)
- [Demo 1: GitHub Code Review Pipeline](#demo-1-github-code-review-pipeline)
- [Demo 2: Research Synthesis](#demo-2-research-synthesis)
- [Creating Custom Workflows](#creating-custom-workflows)
- [Workflow Configuration Reference](#workflow-configuration-reference)

---

## Workflow Concepts

A **workflow** in AgentMesh is a directed graph of agents, where:
- **Nodes** = Agents (each with their own LLM + MCP servers)
- **Edges** = Handoff rules (conditional transitions between agents)
- **State** = Shared data passed between all agents

```
          ┌─────────────┐
  start → │  Agent A    │
          └──────┬──────┘
                 │
         ┌───────┼───────┐
         │ on_complete   │ on_error
         ▼               ▼
  ┌─────────────┐ ┌─────────────┐
  │  Agent B    │ │  Agent D    │
  └──────┬──────┘ └─────────────┘
         │
         ▼
  ┌─────────────┐
  │  Agent C    │ → end
  └─────────────┘
```

---

## Demo 1: GitHub Code Review Pipeline

### Overview

| Property | Value |
|----------|-------|
| **Name** | `github-code-review` |
| **Purpose** | Automated multi-agent code review for GitHub PRs |
| **Agents** | 4 (Fetcher → Reviewer → SecurityScanner → Summarizer) |
| **MCP Servers** | GitHub, Filesystem |
| **LLMs** | Gemini 2.0 Flash (review), Groq Llama 3.3 (security scan) |
| **Duration** | ~30-60 seconds |

### Agent Definitions

#### Agent 1: Code Fetcher

```python
fetcher = Agent(
    name="Fetcher",
    role="Code Fetcher",
    system_prompt="""You are a code retrieval specialist. Your job is to:
    1. Connect to the specified GitHub repository
    2. Identify the files changed in the target branch/PR
    3. Read the content of each changed file
    4. Organize the code into a structured format for review
    
    Output a JSON object with:
    - files: list of {path, content, language, lines_changed}
    - summary: brief description of what the changes do""",
    mcp_servers=["github"],
    model="gemini-2.0-flash",
    temperature=0.2,
    handoff_rules={"on_complete": "Reviewer"}
)
```

#### Agent 2: Code Reviewer

```python
reviewer = Agent(
    name="Reviewer",
    role="Senior Code Reviewer",
    system_prompt="""You are an expert senior code reviewer. Analyze each file for:
    
    1. **Code Quality**: naming, structure, DRY violations, complexity
    2. **Best Practices**: design patterns, error handling, edge cases
    3. **Performance**: algorithmic efficiency, unnecessary computations
    4. **Readability**: comments, documentation, clear intent
    
    For each issue found, provide:
    - file_path: which file
    - line_numbers: affected lines
    - severity: "critical" | "warning" | "suggestion"
    - category: which of the 4 categories above
    - description: clear explanation of the issue
    - suggestion: how to fix it with a code example""",
    mcp_servers=["github"],
    model="gemini-2.0-flash",
    temperature=0.3,
    handoff_rules={
        "on_complete": "SecurityScanner",
        "on_needs_more_context": "Fetcher"
    }
)
```

#### Agent 3: Security Scanner

```python
security_scanner = Agent(
    name="SecurityScanner",
    role="Security Vulnerability Scanner",
    system_prompt="""You are a security-focused code auditor. Scan for:
    
    1. **Injection**: SQL injection, command injection, XSS
    2. **Auth Issues**: hardcoded credentials, weak auth, IDOR
    3. **Data Exposure**: sensitive data in logs, unencrypted storage
    4. **Dependencies**: known vulnerable packages (if detectable)
    5. **Input Validation**: missing sanitization, type confusion
    
    Rate each finding: CRITICAL / HIGH / MEDIUM / LOW
    Provide CWE references where applicable.""",
    mcp_servers=[],
    model="llama-3.3-70b-versatile",  # Groq for speed
    temperature=0.1,
    handoff_rules={"on_complete": "Summarizer"}
)
```

#### Agent 4: Report Summarizer

```python
summarizer = Agent(
    name="Summarizer",
    role="Review Report Writer",
    system_prompt="""You are a technical writer. Create a comprehensive code review report:
    
    ## Structure:
    1. **Executive Summary** (2-3 sentences)
    2. **Severity Breakdown** (counts by severity)
    3. **Critical Issues** (must-fix before merge)
    4. **Warnings** (should address)
    5. **Suggestions** (nice to have)
    6. **Security Findings** (if any)
    7. **Overall Recommendation**: APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION
    
    Format as clean Markdown. Save the report using the filesystem MCP.""",
    mcp_servers=["filesystem"],
    model="gemini-2.0-flash",
    temperature=0.4,
    handoff_rules={"on_complete": "end"}
)
```

### Workflow Configuration

```yaml
# configs/github_review.yaml
name: github-code-review
description: Automated multi-agent code review pipeline

agents:
  - name: Fetcher
    role: Code Fetcher
    model: gemini-2.0-flash
    temperature: 0.2
    mcp_servers: [github]
    
  - name: Reviewer
    role: Senior Code Reviewer
    model: gemini-2.0-flash
    temperature: 0.3
    mcp_servers: [github]
    
  - name: SecurityScanner
    role: Security Vulnerability Scanner
    model: llama-3.3-70b-versatile
    temperature: 0.1
    mcp_servers: []
    
  - name: Summarizer
    role: Review Report Writer
    model: gemini-2.0-flash
    temperature: 0.4
    mcp_servers: [filesystem]

graph:
  start: Fetcher
  Fetcher:
    on_complete: Reviewer
  Reviewer:
    on_complete: SecurityScanner
    on_needs_more_context: Fetcher
  SecurityScanner:
    on_complete: Summarizer
  Summarizer:
    on_complete: end

mcp_servers:
  github:
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "${GITHUB_TOKEN}"
  
  filesystem:
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "./output"]

settings:
  max_iterations: 15
  timeout_seconds: 120
  max_tokens_total: 50000
```

### Usage

```python
from agentmesh import Workflow

# From YAML config
workflow = Workflow.from_yaml("configs/github_review.yaml")

# Execute
result = await workflow.run(
    task="Review PR #42 on repository user/my-project"
)

print(result.report)  # Markdown review report
```

---

## Demo 2: Research Synthesis

### Overview

| Property | Value |
|----------|-------|
| **Name** | `research-synthesis` |
| **Purpose** | Multi-source research + synthesis report generation |
| **Agents** | 4 (Searcher → Extractor → Analyst → Writer) |
| **MCP Servers** | Web Search, Filesystem |
| **LLMs** | Gemini 2.0 Flash (all agents) |
| **Duration** | ~45-90 seconds |

### Agent Definitions

#### Agent 1: Web Searcher

```python
searcher = Agent(
    name="Searcher",
    role="Web Search Specialist",
    system_prompt="""You are a research search specialist. Given a research question:
    1. Decompose it into 3-5 focused search queries
    2. Execute each search using the web-search MCP tool
    3. Collect the top 5-8 most relevant URLs
    4. Provide a brief relevance score (1-10) for each source
    
    Output: list of {url, title, relevance_score, snippet}""",
    mcp_servers=["web-search"],
    model="gemini-2.0-flash",
    temperature=0.4,
    handoff_rules={"on_complete": "Extractor"}
)
```

#### Agent 2: Content Extractor

```python
extractor = Agent(
    name="Extractor",
    role="Content Extraction Specialist",
    system_prompt="""You are a content extraction specialist. For each URL provided:
    1. Fetch the page content using the web-search MCP fetch tool
    2. Extract key facts, data points, and quotes
    3. Note the publication date and author if available
    4. Summarize each source in 2-3 paragraphs
    
    Output: list of {url, title, author, date, key_facts: [], summary}""",
    mcp_servers=["web-search"],
    model="gemini-2.0-flash",
    temperature=0.3,
    handoff_rules={
        "on_complete": "Analyst",
        "on_insufficient_data": "Searcher"
    }
)
```

#### Agent 3: Research Analyst

```python
analyst = Agent(
    name="Analyst",
    role="Research Analyst",
    system_prompt="""You are a research analyst. Given extracted content from multiple sources:
    1. Identify common themes and patterns
    2. Note contradictions or disagreements between sources
    3. Assess source credibility and bias
    4. Synthesize findings into coherent insights
    5. Identify knowledge gaps that need further research
    
    Output: structured analysis with themes, insights, conflicts, and gaps""",
    mcp_servers=[],
    model="gemini-2.0-flash",
    temperature=0.5,
    handoff_rules={"on_complete": "Writer"}
)
```

#### Agent 4: Report Writer

```python
writer = Agent(
    name="Writer",
    role="Research Report Writer",
    system_prompt="""You are a professional research writer. Create a comprehensive report:
    
    ## Structure:
    1. **Executive Summary** (3-5 sentences)
    2. **Background & Context**
    3. **Key Findings** (organized by theme)
    4. **Analysis & Insights**
    5. **Contradicting Viewpoints** (if any)
    6. **Conclusions**
    7. **Sources** (numbered citations)
    
    Write in a clear, professional tone. Use Markdown formatting.
    Save the report to disk using the filesystem MCP.""",
    mcp_servers=["filesystem"],
    model="gemini-2.0-flash",
    temperature=0.6,
    handoff_rules={"on_complete": "end"}
)
```

### Workflow Configuration

```yaml
# configs/research.yaml
name: research-synthesis
description: Web research and synthesis pipeline

agents:
  - name: Searcher
    role: Web Search Specialist
    model: gemini-2.0-flash
    temperature: 0.4
    mcp_servers: [web-search]
    
  - name: Extractor
    role: Content Extraction Specialist
    model: gemini-2.0-flash
    temperature: 0.3
    mcp_servers: [web-search]
    
  - name: Analyst
    role: Research Analyst
    model: gemini-2.0-flash
    temperature: 0.5
    mcp_servers: []
    
  - name: Writer
    role: Research Report Writer
    model: gemini-2.0-flash
    temperature: 0.6
    mcp_servers: [filesystem]

graph:
  start: Searcher
  Searcher:
    on_complete: Extractor
  Extractor:
    on_complete: Analyst
    on_insufficient_data: Searcher
  Analyst:
    on_complete: Writer
  Writer:
    on_complete: end

mcp_servers:
  web-search:
    transport: sse
    url: "http://localhost:3001/sse"
  
  filesystem:
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "./output"]

settings:
  max_iterations: 20
  timeout_seconds: 180
  max_tokens_total: 80000
```

---

## Creating Custom Workflows

### Step 1: Define Agent Configs

```python
from agentmesh import Agent

my_agent = Agent(
    name="MyAgent",
    role="Description of what this agent does",
    system_prompt="Detailed instructions...",
    mcp_servers=["server-name"],
    model="gemini-2.0-flash",       # or "llama-3.3-70b-versatile" for Groq
    temperature=0.5,
    max_tokens=4096,
    handoff_rules={
        "on_complete": "NextAgent",  # Default next agent
        "on_error": "ErrorHandler",  # On failure
        "on_custom": "OtherAgent"    # Custom routing key
    }
)
```

### Step 2: Build the Graph

```python
from agentmesh import Workflow

workflow = Workflow(
    name="my-workflow",
    agents=[agent_a, agent_b, agent_c],
    graph={
        "start": "agent_a",
        "agent_a": {"on_complete": "agent_b"},
        "agent_b": {
            "on_complete": "agent_c",
            "on_retry": "agent_a"   # Loop back if needed
        },
        "agent_c": {"on_complete": "end"}
    }
)
```

### Step 3: Configure MCP Servers

```python
from agentmesh.mcp import MCPRegistry

mcp = MCPRegistry()
mcp.register("my-server", transport="stdio", command="my-mcp-server")
mcp.register("my-api", transport="sse", url="http://localhost:3001/sse")

workflow.set_mcp_registry(mcp)
```

### Step 4: Execute

```python
result = await workflow.run(
    task="Your task description here",
    initial_state={"key": "value"}  # Optional initial shared state
)

print(result.output)
print(result.token_usage)
```

---

## Workflow Configuration Reference

### YAML Schema

```yaml
name: string                    # Unique workflow identifier
description: string             # Human-readable description

agents:                         # Agent definitions
  - name: string               # Unique agent name
    role: string               # Agent's role description
    system_prompt: string      # (optional, can use prompt file)
    prompt_file: string        # Path to .txt prompt file
    model: string              # LLM model name
    temperature: float         # 0.0 - 2.0
    max_tokens: integer        # Max output tokens
    mcp_servers: [string]      # List of MCP server names

graph:                          # Execution graph
  start: string                # Entry point agent name
  <agent_name>:                # Transitions from this agent
    on_complete: string        # Next agent on success
    on_error: string           # Next agent on failure
    on_<custom>: string        # Custom routing keys

mcp_servers:                    # MCP server configurations
  <server_name>:
    transport: stdio | sse     # MCP transport type
    command: string            # (stdio) Command to run
    args: [string]             # (stdio) Command arguments
    env:                       # (stdio) Environment variables
      KEY: "value"
    url: string                # (sse) Server URL

settings:                       # Workflow-level settings
  max_iterations: integer      # Max total agent activations (default: 20)
  timeout_seconds: integer     # Total timeout (default: 120)
  max_tokens_total: integer    # Budget across all agents (default: 50000)
  parallel_execution: boolean  # Allow parallel agent execution (default: false)
```
