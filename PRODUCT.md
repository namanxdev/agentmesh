# PRODUCT.md

## Product Purpose
AgentMesh is a self-hosted platform for designing, executing, observing, and debugging production multi-agent AI systems. Build pipelines visually, connect any MCP server, and inspect every agent decision, tool call, and handoff from a single control plane. The runtime and its observability are the product; the visual editor is one feature.

## Users
Software engineers and ML engineers who run multi-agent workflows and need to answer: which agent is executing, why a run failed, which MCP server was called, what it cost, where the latency went. They live in VS Code, GitHub, and terminal tools all day.

## Register
product

## Brand & Tone
Quiet, precise, engineered. Internal-infrastructure software, like Chrome DevTools, Docker Desktop, Linear, Temporal Cloud, or the Anthropic Console. The UI recedes; workflow state, execution, and errors are the only things that should draw the eye. Confidence through density, alignment, and typography, never through decoration.

## Anti-references (never resemble)
- Flowise, Langflow, n8n, Dify, Zapier, Retool AI, generic "AI SaaS" templates.
- Glow shadows, gradient panels, glass cards, neon accents, oversized radii, colorful pills, dashboard-in-a-node designs.
- Anything a reviewer would call "generated" rather than "engineered".

## Strategic principles
1. Execution is the hero. A running pipeline (animated edges, live node state, streaming tokens/cost/latency) is the signature experience.
2. Observability over building. Every surface should help a user understand what happened, not admire the chrome.
3. No empty surface area. A page ships only when it shows real data from the backend.
4. One accent, state colors mean state. Indigo for primary action/selection; green/amber/red exclusively for run state.
