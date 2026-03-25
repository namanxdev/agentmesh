Project 1: AgentMesh (Flagship, ~60hrs)
MCP-Native Multi-Agent Orchestrator with Live Mission Control

An open-source Python framework + visual dashboard that lets you define specialized AI agents, connect them to any MCP server, and orchestrate collaborative workflows — with a real-time WebSocket "mission control" UI.

Tech Stack:

Backend: FastAPI + LangGraph + FastMCP client
LLM: Gemini API (free tier) + Groq (free tier)
Frontend: Next.js + shadcn/ui + WebSocket + Framer Motion
Deploy: Vercel + Render free tier
MVP Scope:

Agent definition layer (Python): roles, system prompts, MCP servers, handoff rules
MCP client integration: each agent connects to MCP servers (filesystem, GitHub, web search)
Real-time event bus: WebSocket stream emitting every agent action
Mission Control dashboard: real-time agent graph, message flow, tool calls, token usage
2 demo workflows: GitHub code review pipeline + research synthesis
Ships as pip install agentmesh + hosted demo
Cut from MVP: No auth, no persistent storage (in-memory), no custom agent builder UI, no paid APIs.