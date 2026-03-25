# 🛰️ Mission Control Dashboard

> Real-time visual dashboard for monitoring multi-agent workflows.

---

## Overview

Mission Control is a Next.js-powered dashboard that gives you a live, interactive view of everything happening in your agent workflows. It connects via WebSocket to stream events in real-time.

## Dashboard Panels

### 1. Agent Graph View
- Interactive node-graph visualization (React Flow)
- Animated beam edges showing active message flow (Magic UI `AnimatedBeam`)
- Nodes glow and pulse based on agent status
- Click any node to see agent details in the Inspector panel

### 2. Live Message Stream
- Auto-scrolling feed of every inter-agent event (Magic UI `AnimatedList`)
- Color-coded by agent identity
- Expandable event details with JSON payloads
- Filter by event type, agent, or severity

### 3. Tool Call Inspector
- Real-time log of every MCP tool invocation
- Request/response pairs with timing
- Syntax-highlighted JSON payloads (Aceternity `CodeBlock`)
- Tabbed interface (HeroUI `Tabs`)

### 4. Token Usage Monitor
- Animated counting per agent (Magic UI `NumberTicker`)
- Progress bars by agent (HeroUI `Progress`)
- Running total across the workflow
- Cost estimation display

### 5. Workflow Timeline
- Gantt-chart-style execution timeline
- Visual duration per agent step
- Parallel execution visualization

## UI Libraries Used

| Component | Library |
|-----------|---------|
| Agent graph nodes & edges | React Flow + Magic UI AnimatedBeam |
| Active agent glow | Magic UI BorderBeam |
| Token counters | Magic UI NumberTicker |
| Background pattern | Magic UI DotPattern |
| Message stream | Magic UI AnimatedList |
| Status indicators | Custom StatusDot |
| Inspector tabs | HeroUI Tabs |
| Control buttons | HeroUI Button + Magic UI ShimmerButton |
| Panels | Custom GlassPanel |
| Toasts/notifications | shadcn/ui Sonner |

## Design Principles

- **Dark theme** — command center aesthetic for long monitoring sessions
- **Real-time** — every event streams live via WebSocket
- **Information-dense** — bento grid layout shows everything at once
- **Purposeful animation** — motion communicates state changes

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  HEADER BAR (workflow name · status · timer · controls)  │
├────────────┬─────────────────────────┬───────────────────┤
│  AGENT     │     GRAPH VIEW          │   INSPECTOR       │
│  LIST      │  (React Flow canvas)    │   PANEL           │
│  (sidebar) │                         │   (tabbed detail) │
├────────────┴─────────────────────────┤                   │
│  MESSAGE STREAM / TIMELINE           │                   │
└──────────────────────────────────────┴───────────────────┘
```

## Related Docs

- [DESIGN.md](../docs/DESIGN.md) — Full design system
- [COMPONENTS.md](../docs/COMPONENTS.md) — Component code & library mappings
- [API.md](../docs/API.md) — WebSocket event protocol
