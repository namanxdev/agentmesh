"""Static pipeline templates shipped with AgentMesh."""

PIPELINE_TEMPLATES = [
    {
        "id": "research-synthesis",
        "name": "Research Synthesis",
        "description": "Multi-agent research pipeline: search → extract → analyze → write",
        "definition": {
            "name": "Research Synthesis",
            "nodes": [
                {
                    "id": "input-1",
                    "kind": "input",
                    "config": {
                        "name": "Research Pipeline",
                        "description": "Enter your research topic or question",
                    },
                    "position": {"x": 0, "y": 200},
                },
                {
                    "id": "agent-searcher",
                    "kind": "llm_agent",
                    "config": {
                        "name": "Searcher",
                        "system_prompt": (
                            "You are a research search specialist. Search for relevant"
                            " information on the given topic and provide a comprehensive"
                            " list of key facts and sources."
                        ),
                        "model": "gemini-2.0-flash",
                        "temperature": 0.4,
                        "mcp_servers": [],
                    },
                    "position": {"x": 100, "y": 200},
                },
                {
                    "id": "agent-extractor",
                    "kind": "llm_agent",
                    "config": {
                        "name": "Extractor",
                        "system_prompt": (
                            "You extract and organize key facts from research."
                            " Synthesize information into clear, structured insights."
                        ),
                        "model": "gemini-2.0-flash",
                        "temperature": 0.4,
                        "mcp_servers": [],
                    },
                    "position": {"x": 400, "y": 200},
                },
                {
                    "id": "agent-analyst",
                    "kind": "llm_agent",
                    "config": {
                        "name": "Analyst",
                        "system_prompt": (
                            "You analyze research data. Identify themes, patterns,"
                            " and provide actionable insights."
                        ),
                        "model": "gemini-2.0-flash",
                        "temperature": 0.4,
                        "mcp_servers": [],
                    },
                    "position": {"x": 700, "y": 200},
                },
                {
                    "id": "agent-writer",
                    "kind": "llm_agent",
                    "config": {
                        "name": "Writer",
                        "system_prompt": (
                            "You write clear, well-structured reports in Markdown format."
                            " Create a comprehensive research report from the analysis provided."
                        ),
                        "model": "gemini-2.0-flash",
                        "temperature": 0.4,
                        "mcp_servers": [],
                    },
                    "position": {"x": 1000, "y": 200},
                },
                {
                    "id": "output-1",
                    "kind": "output",
                    "config": {"output_format": "markdown"},
                    "position": {"x": 1300, "y": 200},
                },
            ],
            "edges": [
                {"id": "e-input-searcher", "source": "input-1", "target": "agent-searcher"},
                {"id": "e-searcher-extractor", "source": "agent-searcher", "target": "agent-extractor"},
                {"id": "e-extractor-analyst", "source": "agent-extractor", "target": "agent-analyst"},
                {"id": "e-analyst-writer", "source": "agent-analyst", "target": "agent-writer"},
                {"id": "e-writer-output", "source": "agent-writer", "target": "output-1"},
            ],
        },
    },
    {
        "id": "github-code-review",
        "name": "GitHub Code Review",
        "description": "Automated code review: fetch → review → security scan → summarize",
        "definition": {
            "name": "GitHub Code Review",
            "nodes": [
                {
                    "id": "input-1",
                    "kind": "input",
                    "config": {
                        "name": "Research Pipeline",
                        "description": "Enter your research topic or question",
                    },
                    "position": {"x": 0, "y": 200},
                },
                {
                    "id": "agent-fetcher",
                    "kind": "llm_agent",
                    "config": {
                        "name": "Fetcher",
                        "system_prompt": (
                            "You fetch and examine code files for review."
                            " Identify the key files and code sections that need review."
                        ),
                        "model": "gemini-2.0-flash",
                        "temperature": 0.4,
                        "mcp_servers": [],
                    },
                    "position": {"x": 100, "y": 200},
                },
                {
                    "id": "agent-reviewer",
                    "kind": "llm_agent",
                    "config": {
                        "name": "Reviewer",
                        "system_prompt": (
                            "You are a senior code reviewer. Analyze code for quality,"
                            " best practices, performance, and readability."
                            " Output as [ROUTE: on_needs_more_context] if you need more context."
                        ),
                        "model": "gemini-2.0-flash",
                        "temperature": 0.4,
                        "mcp_servers": [],
                    },
                    "position": {"x": 400, "y": 200},
                },
                {
                    "id": "agent-security-scanner",
                    "kind": "llm_agent",
                    "config": {
                        "name": "SecurityScanner",
                        "system_prompt": (
                            "You are a security auditor. Scan for injection vulnerabilities,"
                            " auth issues, and data exposure risks."
                        ),
                        "model": "gemini-2.0-flash",
                        "temperature": 0.4,
                        "mcp_servers": [],
                    },
                    "position": {"x": 700, "y": 200},
                },
                {
                    "id": "agent-summarizer",
                    "kind": "llm_agent",
                    "config": {
                        "name": "Summarizer",
                        "system_prompt": (
                            "You create comprehensive code review reports in Markdown format"
                            " summarizing all findings."
                        ),
                        "model": "gemini-2.0-flash",
                        "temperature": 0.4,
                        "mcp_servers": [],
                    },
                    "position": {"x": 1000, "y": 200},
                },
                {
                    "id": "output-1",
                    "kind": "output",
                    "config": {"output_format": "markdown"},
                    "position": {"x": 1300, "y": 200},
                },
            ],
            "edges": [
                {"id": "e-input-fetcher", "source": "input-1", "target": "agent-fetcher"},
                {"id": "e-fetcher-reviewer", "source": "agent-fetcher", "target": "agent-reviewer"},
                {"id": "e-reviewer-scanner", "source": "agent-reviewer", "target": "agent-security-scanner"},
                {"id": "e-scanner-summarizer", "source": "agent-security-scanner", "target": "agent-summarizer"},
                {"id": "e-summarizer-output", "source": "agent-summarizer", "target": "output-1"},
            ],
        },
    },
]
