"""Demo workflow definitions: GitHub Code Review + Research Synthesis."""

from pathlib import Path

from backend.agents.base import AgentConfig

PROMPTS_DIR = Path(__file__).parent.parent / "agents" / "prompts"


def _load_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    return path.read_text(encoding="utf-8") if path.exists() else ""


# Agent configs
FETCHER = AgentConfig(
    name="Fetcher",
    role="Code Fetcher",
    system_prompt=_load_prompt("code_reviewer.txt") or "You are a code fetcher.",
    mcp_servers=["github"],
    model="gemini-2.0-flash",
    temperature=0.2,
    handoff_rules={"on_complete": "Reviewer"},
)

REVIEWER = AgentConfig(
    name="Reviewer",
    role="Senior Code Reviewer",
    system_prompt=_load_prompt("code_reviewer.txt"),
    mcp_servers=["github"],
    model="gemini-2.0-flash",
    temperature=0.3,
    handoff_rules={"on_complete": "SecurityScanner", "on_needs_more_context": "Fetcher"},
)

SECURITY_SCANNER = AgentConfig(
    name="SecurityScanner",
    role="Security Vulnerability Scanner",
    system_prompt="You are a security auditor. Scan for injection, auth issues, data exposure.",
    mcp_servers=[],
    model="llama-3.3-70b-versatile",
    temperature=0.1,
    handoff_rules={"on_complete": "Summarizer"},
)

SUMMARIZER = AgentConfig(
    name="Summarizer",
    role="Review Report Writer",
    system_prompt="You are a technical writer. Create a comprehensive code review report in Markdown.",
    mcp_servers=["filesystem"],
    model="gemini-2.0-flash",
    temperature=0.4,
    handoff_rules={"on_complete": "end"},
)

SEARCHER = AgentConfig(
    name="Searcher",
    role="Web Search Specialist",
    system_prompt=_load_prompt("researcher.txt"),
    mcp_servers=["web-search"],
    model="gemini-2.0-flash",
    temperature=0.4,
    handoff_rules={"on_complete": "Extractor"},
)

EXTRACTOR = AgentConfig(
    name="Extractor",
    role="Content Extraction Specialist",
    system_prompt="Extract key facts from web pages and summarize each source.",
    mcp_servers=["web-search"],
    model="gemini-2.0-flash",
    temperature=0.3,
    handoff_rules={"on_complete": "Analyst", "on_insufficient_data": "Searcher"},
)

ANALYST = AgentConfig(
    name="Analyst",
    role="Research Analyst",
    system_prompt=_load_prompt("analyst.txt"),
    mcp_servers=[],
    model="gemini-2.0-flash",
    temperature=0.5,
    handoff_rules={"on_complete": "Writer"},
)

WRITER = AgentConfig(
    name="Writer",
    role="Research Report Writer",
    system_prompt=_load_prompt("writer.txt"),
    mcp_servers=["filesystem"],
    model="gemini-2.0-flash",
    temperature=0.6,
    handoff_rules={"on_complete": "end"},
)

# Workflow definitions
DEMO_WORKFLOWS = {
    "all_agents": [
        FETCHER,
        REVIEWER,
        SECURITY_SCANNER,
        SUMMARIZER,
        SEARCHER,
        EXTRACTOR,
        ANALYST,
        WRITER,
    ],
    "definitions": {
        "github-code-review": {
            "description": "Automated multi-agent code review pipeline",
            "agents": ["Fetcher", "Reviewer", "SecurityScanner", "Summarizer"],
            "graph": {
                "start": "Fetcher",
                "Fetcher": {"on_complete": "Reviewer"},
                "Reviewer": {"on_complete": "SecurityScanner", "on_needs_more_context": "Fetcher"},
                "SecurityScanner": {"on_complete": "Summarizer"},
                "Summarizer": {"on_complete": "end"},
            },
        },
        "research-synthesis": {
            "description": "Web research and synthesis pipeline",
            "agents": ["Searcher", "Extractor", "Analyst", "Writer"],
            "graph": {
                "start": "Searcher",
                "Searcher": {"on_complete": "Extractor"},
                "Extractor": {"on_complete": "Analyst", "on_insufficient_data": "Searcher"},
                "Analyst": {"on_complete": "Writer"},
                "Writer": {"on_complete": "end"},
            },
        },
    },
}
