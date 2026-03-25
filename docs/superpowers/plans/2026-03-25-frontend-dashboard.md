# Frontend Dashboard & Real-Time — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Mission Control dashboard — interactive agent workflow graph, real-time event stream, tool call inspector, and WebSocket integration with the backend.

**Architecture:** Zustand stores hold WebSocket event state. A `useWebSocket` hook manages the WS connection. `useAgentMeshEvents` feeds events into the store. The dashboard is a single full-viewport CSS Grid layout composed of server and client components.

**Tech Stack:** Next.js 16 App Router, React 19, @xyflow/react (React Flow v12), Zustand, Framer Motion, TypeScript

**Important:** `lib/demoWorkflows.ts`, `types/events.ts`, and `types/agents.ts` are created by the companion plan (`2026-03-25-frontend-landing.md`). These plans run in parallel. If those files don't exist yet, create stubs matching the interface below:

```ts
// lib/demoWorkflows.ts minimal stub
export const DEMO_WORKFLOWS = {
  "github-code-review": {
    name: "github-code-review",
    agents: ["Fetcher", "Reviewer", "SecurityScanner", "Summarizer"],
    edges: [
      { from: "Fetcher", to: "Reviewer" },
      { from: "Reviewer", to: "SecurityScanner" },
      { from: "SecurityScanner", to: "Summarizer" },
    ],
  },
};

// types/agents.ts — getAgentColor helper
export const AGENT_COLORS = ["hsl(185,100%,50%)","hsl(270,85%,65%)","hsl(142,71%,45%)","hsl(330,80%,60%)","hsl(38,92%,50%)","hsl(200,90%,55%)","hsl(15,85%,55%)","hsl(160,60%,45%)"] as const;
export function getAgentColor(i: number) { return AGENT_COLORS[i % AGENT_COLORS.length]; }

// types/events.ts — AgentStatus + AgentMeshEvent
export type AgentStatus = "idle" | "active" | "thinking" | "completed" | "error";
// ... (all event interfaces from API.md)
```

---

## File Structure

**Create:**
- `frontend/stores/eventStore.ts` — Zustand store: events[], agentStates, workflowStatus, totalTokens
- `frontend/stores/uiStore.ts` — Zustand store: selectedAgent, connectionStatus, inspectorTab
- `frontend/hooks/useWebSocket.ts` — WebSocket connection manager with auto-reconnect
- `frontend/hooks/useAgentMeshEvents.ts` — feeds WS messages into eventStore
- `frontend/components/agents/AgentStatusBadge.tsx` — small colored status badge
- `frontend/components/agents/AgentCard.tsx` — clickable agent list item
- `frontend/components/graph/AgentFlowNode.tsx` — custom React Flow node component
- `frontend/components/graph/AnimatedEdge.tsx` — animated React Flow edge
- `frontend/components/graph/FlowCanvas.tsx` — full React Flow canvas wrapper
- `frontend/components/dashboard/DashboardHeader.tsx` — top bar: name, status, timer, WS indicator
- `frontend/components/dashboard/AgentSidebar.tsx` — left column: agent list + token totals
- `frontend/components/dashboard/AgentGraph.tsx` — center: wraps FlowCanvas
- `frontend/components/dashboard/MessageStream.tsx` — bottom center: auto-scrolling event log
- `frontend/components/dashboard/ToolCallInspector.tsx` — right panel: tabbed tools/agent/tokens
- `frontend/components/dashboard/DashboardLayout.tsx` — CSS Grid container, mounts WS hook
- `frontend/app/dashboard/page.tsx` — server component wiring layout with demo workflow

---

### Task 1: Install @xyflow/react + create Zustand stores

**Files:**
- Create: `frontend/stores/eventStore.ts`
- Create: `frontend/stores/uiStore.ts`

- [ ] **Step 1: Install @xyflow/react**

```bash
cd frontend && npm install @xyflow/react
```
Expected: @xyflow/react added. If zustand is already installed (from companion plan), npm will skip it.

- [ ] **Step 2: Create stores/eventStore.ts**

```ts
import { create } from "zustand";
import type { AgentMeshEvent, AgentStatus } from "@/types/events";

export interface AgentRuntimeState {
  status: AgentStatus;
  current_task?: string;
  token_input: number;
  token_output: number;
  last_updated: number;
}

interface EventStore {
  events: AgentMeshEvent[];
  agentStates: Record<string, AgentRuntimeState>;
  workflowId: string | null;
  workflowStatus: "idle" | "running" | "completed" | "error";
  totalTokens: number;

  addEvent: (event: AgentMeshEvent) => void;
  setWorkflowId: (id: string | null) => void;
  reset: () => void;
}

const INITIAL: Pick<EventStore, "events" | "agentStates" | "workflowId" | "workflowStatus" | "totalTokens"> = {
  events: [],
  agentStates: {},
  workflowId: null,
  workflowStatus: "idle",
  totalTokens: 0,
};

export const useEventStore = create<EventStore>((set) => ({
  ...INITIAL,

  addEvent: (event) =>
    set((state) => {
      const next: Partial<EventStore> = {
        events: [...state.events, event],
      };

      if (event.type === "workflow.started") {
        next.workflowStatus = "running";
        next.workflowId = event.workflow_id;
      } else if (event.type === "workflow.completed") {
        next.workflowStatus = "completed";
        next.totalTokens = event.totalTokens;
      } else if (event.type === "workflow.error") {
        next.workflowStatus = "error";
      } else if (event.type === "agent.activated") {
        next.agentStates = {
          ...state.agentStates,
          [event.agentName]: {
            status: "active",
            current_task: event.taskDescription,
            token_input: state.agentStates[event.agentName]?.token_input ?? 0,
            token_output: state.agentStates[event.agentName]?.token_output ?? 0,
            last_updated: Date.now(),
          },
        };
      } else if (event.type === "agent.thinking") {
        const existing = state.agentStates[event.agentName];
        if (existing) {
          next.agentStates = {
            ...state.agentStates,
            [event.agentName]: { ...existing, status: "thinking", last_updated: Date.now() },
          };
        }
      } else if (event.type === "agent.completed") {
        const existing = state.agentStates[event.agentName];
        if (existing) {
          next.agentStates = {
            ...state.agentStates,
            [event.agentName]: {
              ...existing,
              status: "completed",
              current_task: undefined,
              last_updated: Date.now(),
            },
          };
        }
      } else if (event.type === "token.usage") {
        const existing = state.agentStates[event.agentName] ?? {
          status: "idle" as AgentStatus,
          token_input: 0,
          token_output: 0,
          last_updated: Date.now(),
        };
        const updated = { ...existing, token_input: event.input, token_output: event.output };
        const newStates = { ...state.agentStates, [event.agentName]: updated };
        next.agentStates = newStates;
        next.totalTokens = Object.values(newStates).reduce(
          (sum, a) => sum + a.token_input + a.token_output,
          0
        );
      }

      return next as EventStore;
    }),

  setWorkflowId: (id) => set({ workflowId: id }),

  reset: () => set(INITIAL),
}));
```

- [ ] **Step 3: Create stores/uiStore.ts**

```ts
import { create } from "zustand";

export type InspectorTab = "tools" | "agent" | "tokens";
export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

interface UIStore {
  selectedAgent: string | null;
  inspectorTab: InspectorTab;
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  activeWorkflowName: string | null;

  selectAgent: (name: string | null) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setActiveWorkflow: (name: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedAgent: null,
  inspectorTab: "tools",
  connectionStatus: "idle",
  isConnected: false,
  activeWorkflowName: null,

  selectAgent: (name) => set({ selectedAgent: name }),
  setInspectorTab: (tab) => set({ inspectorTab: tab }),
  setConnectionStatus: (status) =>
    set({ connectionStatus: status, isConnected: status === "connected" }),
  setActiveWorkflow: (name) => set({ activeWorkflowName: name }),
}));
```

- [ ] **Step 4: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add eventStore and uiStore Zustand stores"
```

---

### Task 2: Create WebSocket hooks

**Files:**
- Create: `frontend/hooks/useWebSocket.ts`
- Create: `frontend/hooks/useAgentMeshEvents.ts`

- [ ] **Step 1: Create hooks/useWebSocket.ts**

```ts
"use client";
import { useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export interface UseWebSocketOptions {
  onMessage: (data: unknown) => void;
  enabled?: boolean;
}

export function useWebSocket({ onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest callback without re-running effect
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const setStatus = useUIStore((s) => s.setConnectionStatus);
  const setStatusRef = useRef(setStatus);
  setStatusRef.current = setStatus;

  // connectRef allows the closure inside ws.onclose to call connect without stale ref
  const connectRef = useRef<() => void>(null!);

  connectRef.current = () => {
    if (!enabled) return;
    setStatusRef.current("connecting");

    const ws = new WebSocket(`${WS_BASE}/ws/events`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectCountRef.current = 0;
      setStatusRef.current("connected");
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data as string);
        if ((data as { type?: string }).type === "pong") return;
        onMessageRef.current(data);
      } catch {
        // ignore malformed JSON
      }
    };

    ws.onclose = () => {
      setStatusRef.current("disconnected");
      if (!enabled) return;
      if (reconnectCountRef.current >= 5) {
        setStatusRef.current("error");
        return;
      }
      const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30_000);
      reconnectCountRef.current += 1;
      setStatusRef.current("reconnecting");
      reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay);
    };

    ws.onerror = () => setStatusRef.current("error");
  };

  const send = useCallback((command: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    connectRef.current();

    const pingId = setInterval(() => send({ command: "ping" }), 30_000);

    return () => {
      clearInterval(pingId);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, send]);

  return { send };
}
```

- [ ] **Step 2: Create hooks/useAgentMeshEvents.ts**

```ts
"use client";
import { useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import { useEventStore } from "@/stores/eventStore";
import type { AgentMeshEvent } from "@/types/events";

function isAgentMeshEvent(data: unknown): data is AgentMeshEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    "id" in data &&
    "timestamp" in data &&
    "workflow_id" in data
  );
}

export function useAgentMeshEvents(enabled = true) {
  const addEvent = useEventStore((s) => s.addEvent);

  const handleMessage = useCallback(
    (data: unknown) => {
      if (isAgentMeshEvent(data)) addEvent(data);
    },
    [addEvent]
  );

  const { send } = useWebSocket({ onMessage: handleMessage, enabled });
  return { send };
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add useWebSocket and useAgentMeshEvents hooks"
```

---

### Task 3: Create agent components

**Files:**
- Create: `frontend/components/agents/AgentStatusBadge.tsx`
- Create: `frontend/components/agents/AgentCard.tsx`

- [ ] **Step 1: Create components/agents/AgentStatusBadge.tsx**

```tsx
import type { AgentStatus } from "@/types/events";

const COLORS: Record<AgentStatus, string> = {
  idle:      "var(--status-idle)",
  active:    "var(--status-active)",
  thinking:  "var(--status-thinking)",
  completed: "var(--accent-primary)",
  error:     "var(--status-error)",
};

const LABELS: Record<AgentStatus, string> = {
  idle: "Idle", active: "Active", thinking: "Thinking", completed: "Done", error: "Error",
};

const PULSING = new Set<AgentStatus>(["active", "thinking", "error"]);

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const color = COLORS[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: "var(--radius-full)",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          animation: PULSING.has(status) ? "pulse 2s infinite" : "none",
        }}
      />
      {LABELS[status]}
    </span>
  );
}
```

- [ ] **Step 2: Create components/agents/AgentCard.tsx**

```tsx
"use client";
import { useEventStore } from "@/stores/eventStore";
import { useUIStore } from "@/stores/uiStore";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { getAgentColor } from "@/types/agents";

interface AgentCardProps {
  name: string;
  index: number;
}

export function AgentCard({ name, index }: AgentCardProps) {
  const state = useEventStore((s) => s.agentStates[name]);
  const { selectedAgent, selectAgent } = useUIStore((s) => ({
    selectedAgent: s.selectedAgent,
    selectAgent: s.selectAgent,
  }));

  const status = state?.status ?? "idle";
  const isSelected = selectedAgent === name;
  const agentColor = getAgentColor(index);
  const tokens = state ? state.token_input + state.token_output : 0;

  return (
    <button
      onClick={() => selectAgent(isSelected ? null : name)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        border: isSelected ? `1px solid ${agentColor}` : "1px solid transparent",
        background: isSelected ? `color-mix(in srgb, ${agentColor} 10%, transparent)` : "transparent",
        cursor: "pointer",
        marginBottom: 4,
        transition: "all 0.2s ease",
        display: "block",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-tertiary)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: agentColor, flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: 13,
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>
        </div>
        <AgentStatusBadge status={status} />
      </div>

      {state?.current_task && (
        <p
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            marginTop: 4,
            marginBottom: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            paddingLeft: 16,
          }}
        >
          {state.current_task}
        </p>
      )}

      {tokens > 0 && (
        <p
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            marginTop: 2,
            marginBottom: 0,
            paddingLeft: 16,
          }}
        >
          {tokens.toLocaleString()} tokens
        </p>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add AgentStatusBadge and AgentCard components"
```

---

### Task 4: Create React Flow graph components

**Files:**
- Create: `frontend/components/graph/AgentFlowNode.tsx`
- Create: `frontend/components/graph/AnimatedEdge.tsx`
- Create: `frontend/components/graph/FlowCanvas.tsx`

- [ ] **Step 1: Create components/graph/AgentFlowNode.tsx**

```tsx
"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getAgentColor } from "@/types/agents";
import type { AgentStatus } from "@/types/events";

export interface AgentNodeData {
  label: string;
  role: string;
  status: AgentStatus;
  colorIndex: number;
  [key: string]: unknown;
}

const STATUS_BG: Record<AgentStatus, string> = {
  idle:      "hsl(220 15% 45% / 0.08)",
  active:    "hsl(142 71% 45% / 0.12)",
  thinking:  "hsl(45 100% 60% / 0.12)",
  completed: "hsl(185 100% 50% / 0.10)",
  error:     "hsl(0 84% 60% / 0.12)",
};

const STATUS_BORDER: Record<AgentStatus, string> = {
  idle:      "var(--status-idle)",
  active:    "var(--status-active)",
  thinking:  "var(--status-thinking)",
  completed: "var(--accent-primary)",
  error:     "var(--status-error)",
};

const PULSING = new Set<AgentStatus>(["active", "thinking"]);

export const AgentFlowNode = memo(function AgentFlowNode({
  data,
  selected,
}: NodeProps<AgentNodeData>) {
  const accentColor = getAgentColor(data.colorIndex);
  const statusBorder = STATUS_BORDER[data.status] ?? STATUS_BORDER.idle;
  const bg = STATUS_BG[data.status] ?? STATUS_BG.idle;

  return (
    <div
      style={{
        background: bg,
        border: `2px solid ${selected ? accentColor : statusBorder}`,
        borderRadius: 12,
        padding: "10px 16px",
        minWidth: 140,
        position: "relative",
        transition: "all 0.3s ease",
        boxShadow: selected ? `0 0 20px ${accentColor}40` : "none",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: accentColor, border: "none", width: 10, height: 10 }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: statusBorder,
            flexShrink: 0,
            animation: PULSING.has(data.status) ? "pulse 2s infinite" : "none",
          }}
        />
        <span
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          {data.label}
        </span>
      </div>

      {data.role && (
        <div
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontFamily: "var(--font-body)",
            paddingLeft: 13,
          }}
        >
          {data.role}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: accentColor, border: "none", width: 10, height: 10 }}
      />
    </div>
  );
});
```

- [ ] **Step 2: Create components/graph/AnimatedEdge.tsx**

```tsx
"use client";
import { memo } from "react";
import { getBezierPath, type EdgeProps } from "@xyflow/react";

export const AnimatedEdge = memo(function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isActive = Boolean(data?.active);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isActive ? "var(--accent-primary)" : "var(--border-default)",
          strokeWidth: isActive ? 2 : 1.5,
          fill: "none",
          transition: "stroke 0.4s ease, stroke-width 0.4s ease",
        }}
      />
      {isActive && (
        <circle r={5} fill="var(--accent-primary)" opacity={0.9}>
          <animateMotion dur="1.2s" repeatCount="indefinite">
            <mpath href={`#${id}`} />
          </animateMotion>
        </circle>
      )}
    </>
  );
});
```

- [ ] **Step 3: Create components/graph/FlowCanvas.tsx**

Note: This file must import `@xyflow/react/dist/style.css` to apply React Flow's base styles.

```tsx
"use client";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import { AgentFlowNode, type AgentNodeData } from "./AgentFlowNode";
import { AnimatedEdge } from "./AnimatedEdge";
import { useEventStore } from "@/stores/eventStore";
import { useUIStore } from "@/stores/uiStore";
import { getAgentColor } from "@/types/agents";

const nodeTypes = { agentNode: AgentFlowNode };
const edgeTypes = { animated: AnimatedEdge };

interface FlowCanvasProps {
  agentNames: string[];
  edges: Array<{ from: string; to: string }>;
}

export function FlowCanvas({ agentNames, edges }: FlowCanvasProps) {
  const agentStates = useEventStore((s) => s.agentStates);
  const { selectedAgent, selectAgent } = useUIStore((s) => ({
    selectedAgent: s.selectedAgent,
    selectAgent: s.selectAgent,
  }));

  // Layout agents left-to-right with equal spacing
  const nodes: Node<AgentNodeData>[] = useMemo(() => {
    const totalCols = Math.min(agentNames.length, 4);
    return agentNames.map((name, i) => ({
      id: name,
      type: "agentNode",
      position: {
        x: (i % totalCols) * 200,
        y: Math.floor(i / totalCols) * 130,
      },
      data: {
        label: name,
        role: "",
        status: agentStates[name]?.status ?? "idle",
        colorIndex: i,
      },
      selected: selectedAgent === name,
    }));
  }, [agentNames, agentStates, selectedAgent]);

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map(({ from, to }, i) => ({
        id: `${from}-${to}-${i}`,
        source: from,
        target: to,
        type: "animated",
        data: { active: agentStates[from]?.status === "active" },
      })),
    [edges, agentStates]
  );

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      selectAgent(node.id === selectedAgent ? null : node.id);
    },
    [selectedAgent, selectAgent]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "var(--bg-primary)" }}
      >
        <Background
          color="hsl(225, 12%, 20%)"
          gap={28}
          size={1}
          style={{ background: "var(--bg-primary)" }}
        />
        <Controls
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
          }}
        />
        <MiniMap
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
          }}
          nodeColor={(node) =>
            getAgentColor((node.data as AgentNodeData).colorIndex)
          }
        />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add React Flow graph components (AgentFlowNode, AnimatedEdge, FlowCanvas)"
```

---

### Task 5: Create DashboardHeader and AgentSidebar

**Files:**
- Create: `frontend/components/dashboard/DashboardHeader.tsx`
- Create: `frontend/components/dashboard/AgentSidebar.tsx`

- [ ] **Step 1: Create components/dashboard/DashboardHeader.tsx**

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useEventStore } from "@/stores/eventStore";
import { useUIStore } from "@/stores/uiStore";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

const WORKFLOW_STATUS_COLOR = {
  idle:      "var(--status-idle)",
  running:   "var(--status-active)",
  completed: "var(--accent-primary)",
  error:     "var(--status-error)",
};

export function DashboardHeader() {
  const workflowStatus = useEventStore((s) => s.workflowStatus);
  const { connectionStatus, activeWorkflowName } = useUIStore((s) => ({
    connectionStatus: s.connectionStatus,
    activeWorkflowName: s.activeWorkflowName,
  }));

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (workflowStatus !== "running") {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 1000);
    return () => clearInterval(id);
  }, [workflowStatus]);

  const wsColor =
    connectionStatus === "connected"
      ? "var(--status-active)"
      : connectionStatus === "reconnecting"
      ? "var(--status-warning)"
      : "var(--status-error)";

  const wsLabel =
    connectionStatus === "connected"
      ? "WS Connected"
      : connectionStatus === "reconnecting"
      ? "Reconnecting…"
      : connectionStatus === "connecting"
      ? "Connecting…"
      : "Disconnected";

  return (
    <header
      style={{
        gridArea: "header",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        flexShrink: 0,
      }}
    >
      {/* Left — logo + workflow name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/"
          style={{
            color: "var(--accent-primary)",
            textDecoration: "none",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "var(--accent-primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 900,
              color: "var(--bg-primary)",
            }}
          >
            A
          </span>
          AgentMesh
        </Link>
        {activeWorkflowName && (
          <>
            <span style={{ color: "var(--border-default)", fontSize: 18 }}>/</span>
            <span
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
              }}
            >
              {activeWorkflowName}
            </span>
          </>
        )}
      </div>

      {/* Center — workflow status + elapsed timer */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: WORKFLOW_STATUS_COLOR[workflowStatus],
              animation: workflowStatus === "running" ? "pulse 2s infinite" : "none",
              display: "inline-block",
            }}
          />
          <span
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {workflowStatus}
          </span>
        </div>
        {workflowStatus === "running" && (
          <span
            style={{
              color: "var(--accent-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              minWidth: 48,
            }}
          >
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      {/* Right — WebSocket indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: wsColor,
            display: "inline-block",
          }}
        />
        <span
          style={{
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        >
          {wsLabel}
        </span>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create components/dashboard/AgentSidebar.tsx**

```tsx
"use client";
import { useEventStore } from "@/stores/eventStore";
import { AgentCard } from "@/components/agents/AgentCard";

interface AgentSidebarProps {
  agentNames: string[];
}

export function AgentSidebar({ agentNames }: AgentSidebarProps) {
  const totalTokens = useEventStore((s) => s.totalTokens);

  return (
    <aside
      style={{
        gridArea: "agents",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Agents ({agentNames.length})
        </h2>
      </div>

      {/* Agent list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {agentNames.map((name, i) => (
          <AgentCard key={name} name={name} index={i} />
        ))}
      </div>

      {/* Token total footer */}
      {totalTokens > 0 && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "var(--text-tertiary)",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Total Tokens
          </span>
          <span
            style={{
              color: "var(--accent-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 600,
            }}
            role="status"
            aria-live="polite"
            aria-label={`Total tokens: ${totalTokens.toLocaleString()}`}
          >
            {totalTokens.toLocaleString()}
          </span>
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add DashboardHeader and AgentSidebar"
```

---

### Task 6: Create MessageStream and ToolCallInspector

**Files:**
- Create: `frontend/components/dashboard/MessageStream.tsx`
- Create: `frontend/components/dashboard/ToolCallInspector.tsx`

- [ ] **Step 1: Create components/dashboard/MessageStream.tsx**

```tsx
"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEventStore } from "@/stores/eventStore";
import { getAgentColor } from "@/types/agents";
import type { AgentMeshEvent } from "@/types/events";

interface EventDisplay {
  label: string;
  agentIndex?: number;
  color: string;
}

function describeEvent(
  event: AgentMeshEvent,
  agentNames: string[]
): EventDisplay {
  const idx = (name: string) => agentNames.indexOf(name);

  switch (event.type) {
    case "workflow.started":
      return { label: `Workflow started — ${event.agents.join(" → ")}`, color: "var(--accent-primary)" };
    case "workflow.completed":
      return { label: `Workflow completed (${event.totalTokens.toLocaleString()} tokens, ${event.duration.toFixed(1)}s)`, color: "var(--status-active)" };
    case "workflow.error":
      return { label: `Error in ${event.failedAgent}: ${event.error}`, color: "var(--status-error)" };
    case "agent.activated":
      return { label: `${event.agentName} activated`, agentIndex: idx(event.agentName), color: "var(--status-active)" };
    case "agent.thinking":
      return { label: `${event.agentName} thinking…`, agentIndex: idx(event.agentName), color: "var(--status-thinking)" };
    case "agent.completed":
      return { label: `${event.agentName} completed`, agentIndex: idx(event.agentName), color: "var(--accent-primary)" };
    case "agent.handoff":
      return { label: `${event.from} → ${event.to}  (${event.reason})`, agentIndex: idx(event.from), color: "var(--accent-secondary)" };
    case "tool.called":
      return { label: `${event.agentName}: ${event.server}.${event.tool}`, agentIndex: idx(event.agentName), color: "var(--status-warning)" };
    case "tool.result":
      return { label: `${event.server}.${event.tool} ✓ ${event.duration_ms}ms`, agentIndex: idx(event.agentName), color: "var(--text-secondary)" };
    case "tool.error":
      return { label: `Tool error: ${event.tool} — ${event.error}`, color: "var(--status-error)" };
    case "token.usage":
      return { label: `${event.agentName}: +${event.total.toLocaleString()} tokens`, agentIndex: idx(event.agentName), color: "var(--text-tertiary)" };
    default:
      return { label: String(event.type), color: "var(--text-tertiary)" };
  }
}

function ts(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function MessageStream() {
  const events = useEventStore((s) => s.events);
  const agentStates = useEventStore((s) => s.agentStates);
  const agentNames = Object.keys(agentStates);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div
      style={{
        gridArea: "timeline",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: 0,
          }}
        >
          Event Stream ({events.length})
        </h2>
      </div>

      <div
        style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}
        role="log"
        aria-live="polite"
        aria-label="Agent activity log"
      >
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const { label, agentIndex, color } = describeEvent(event, agentNames);
            const agentColor = agentIndex !== undefined && agentIndex >= 0
              ? getAgentColor(agentIndex)
              : undefined;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "3px 6px",
                  borderRadius: 6,
                  alignItems: "flex-start",
                  marginBottom: 1,
                }}
              >
                <span
                  style={{
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    flexShrink: 0,
                    marginTop: 2,
                    minWidth: 60,
                  }}
                >
                  {ts(event.timestamp)}
                </span>
                {agentColor && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: agentColor,
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
                <span
                  style={{
                    color,
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}
                >
                  {label}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create components/dashboard/ToolCallInspector.tsx**

```tsx
"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEventStore } from "@/stores/eventStore";
import { useUIStore } from "@/stores/uiStore";
import type { ToolCalledEvent, ToolResultEvent, ToolErrorEvent } from "@/types/events";
import type { AgentRuntimeState } from "@/stores/eventStore";
import type { InspectorTab } from "@/stores/uiStore";

interface ToolCall {
  call: ToolCalledEvent;
  result?: ToolResultEvent;
  error?: ToolErrorEvent;
}

function buildToolCalls(
  events: ReturnType<typeof useEventStore.getState>["events"]
): ToolCall[] {
  const callMap = new Map<string, ToolCall>();
  for (const evt of events) {
    if (evt.type === "tool.called") {
      callMap.set(evt.id, { call: evt });
    } else if (evt.type === "tool.result" || evt.type === "tool.error") {
      // Match result/error to call by agentName+tool order
      for (const [key, tc] of callMap) {
        if (tc.call.agentName === evt.agentName && tc.call.tool === evt.tool && !tc.result && !tc.error) {
          if (evt.type === "tool.result") callMap.set(key, { ...tc, result: evt });
          else callMap.set(key, { ...tc, error: evt });
          break;
        }
      }
    }
  }
  return Array.from(callMap.values()).reverse();
}

const TABS: Array<{ key: InspectorTab; label: string }> = [
  { key: "tools", label: "Tool Calls" },
  { key: "agent", label: "Agent" },
  { key: "tokens", label: "Tokens" },
];

export function ToolCallInspector() {
  const events = useEventStore((s) => s.events);
  const agentStates = useEventStore((s) => s.agentStates);
  const totalTokens = useEventStore((s) => s.totalTokens);
  const { selectedAgent, inspectorTab, setInspectorTab } = useUIStore((s) => ({
    selectedAgent: s.selectedAgent,
    inspectorTab: s.inspectorTab,
    setInspectorTab: s.setInspectorTab,
  }));

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allCalls = buildToolCalls(events);
  const calls = selectedAgent
    ? allCalls.filter((tc) => tc.call.agentName === selectedAgent)
    : allCalls;

  return (
    <div
      style={{
        gridArea: "inspector",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setInspectorTab(key)}
            style={{
              flex: 1,
              padding: "13px 6px",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: inspectorTab === key ? "var(--accent-primary)" : "var(--text-tertiary)",
              borderBottom:
                inspectorTab === key
                  ? "2px solid var(--accent-primary)"
                  : "2px solid transparent",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {inspectorTab === "tools" && (
          <ToolsPanel calls={calls} expandedId={expandedId} setExpandedId={setExpandedId} />
        )}
        {inspectorTab === "agent" && (
          <AgentPanel selectedAgent={selectedAgent} agentStates={agentStates} />
        )}
        {inspectorTab === "tokens" && (
          <TokensPanel agentStates={agentStates} totalTokens={totalTokens} />
        )}
      </div>
    </div>
  );
}

function ToolsPanel({
  calls,
  expandedId,
  setExpandedId,
}: {
  calls: ToolCall[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  if (calls.length === 0) {
    return (
      <p
        style={{
          color: "var(--text-tertiary)",
          fontSize: 12,
          textAlign: "center",
          padding: "32px 16px",
          fontFamily: "var(--font-mono)",
          margin: 0,
        }}
      >
        No tool calls yet
      </p>
    );
  }
  return (
    <div>
      {calls.map((tc) => {
        const isExpanded = expandedId === tc.call.id;
        const statusLabel = tc.error ? "ERR" : tc.result ? `${tc.result.duration_ms}ms` : "…";
        const statusColor = tc.error
          ? "var(--status-error)"
          : tc.result
          ? "var(--accent-primary)"
          : "var(--status-warning)";

        return (
          <div
            key={tc.call.id}
            style={{
              marginBottom: 6,
              borderRadius: 8,
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : tc.call.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "var(--text-tertiary)" }}>{tc.call.server}.</span>
                {tc.call.tool}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
                  color: statusColor,
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                }}
              >
                {statusLabel}
              </span>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    overflow: "hidden",
                    borderTop: "1px solid var(--border-subtle)",
                    background: "var(--bg-primary)",
                  }}
                >
                  <div style={{ padding: "10px 12px" }}>
                    <p style={{ color: "var(--text-tertiary)", fontSize: 10, fontFamily: "var(--font-mono)", margin: "0 0 4px", textTransform: "uppercase" }}>args</p>
                    <pre
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        overflow: "auto",
                        maxHeight: 120,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {JSON.stringify(tc.call.args, null, 2)}
                    </pre>
                    {tc.result && (
                      <>
                        <p style={{ color: "var(--text-tertiary)", fontSize: 10, fontFamily: "var(--font-mono)", margin: "10px 0 4px", textTransform: "uppercase" }}>result</p>
                        <pre
                          style={{
                            color: "var(--accent-primary)",
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            overflow: "auto",
                            maxHeight: 120,
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {JSON.stringify(tc.result.result, null, 2)}
                        </pre>
                      </>
                    )}
                    {tc.error && (
                      <p style={{ color: "var(--status-error)", fontSize: 11, fontFamily: "var(--font-mono)", marginTop: 8 }}>
                        {tc.error.error}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function AgentPanel({
  selectedAgent,
  agentStates,
}: {
  selectedAgent: string | null;
  agentStates: Record<string, AgentRuntimeState>;
}) {
  if (!selectedAgent) {
    return (
      <p style={{ color: "var(--text-tertiary)", fontSize: 12, textAlign: "center", padding: "32px 16px", fontFamily: "var(--font-mono)", margin: 0 }}>
        Click an agent to inspect
      </p>
    );
  }
  const state = agentStates[selectedAgent];
  return (
    <div style={{ padding: 8 }}>
      <h3 style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, margin: "0 0 16px" }}>
        {selectedAgent}
      </h3>
      <dl style={{ margin: 0 }}>
        {[
          ["Status", state?.status ?? "idle"],
          ["Tokens In", state?.token_input.toLocaleString() ?? "0"],
          ["Tokens Out", state?.token_output.toLocaleString() ?? "0"],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <dt style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{label}</dt>
            <dd style={{ color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-mono)", margin: 0 }}>{value}</dd>
          </div>
        ))}
        {state?.current_task && (
          <div>
            <dt style={{ color: "var(--text-tertiary)", fontSize: 12, marginBottom: 4 }}>Current Task</dt>
            <dd style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
              {state.current_task}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function TokensPanel({
  agentStates,
  totalTokens,
}: {
  agentStates: Record<string, AgentRuntimeState>;
  totalTokens: number;
}) {
  const entries = Object.entries(agentStates);
  if (entries.length === 0) {
    return (
      <p style={{ color: "var(--text-tertiary)", fontSize: 12, textAlign: "center", padding: "32px 16px", fontFamily: "var(--font-mono)", margin: 0 }}>
        No token data
      </p>
    );
  }
  return (
    <div style={{ padding: 8 }}>
      {entries.map(([name, state]) => {
        const total = state.token_input + state.token_output;
        const pct = totalTokens > 0 ? (total / totalTokens) * 100 : 0;
        return (
          <div key={name} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{name}</span>
              <span style={{ color: "var(--accent-primary)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                {total.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 3, background: "var(--border-default)", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "var(--accent-primary)",
                  transition: "width 0.6s ease",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        );
      })}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>Total</span>
        <span
          style={{
            color: "var(--accent-primary)",
            fontFamily: "var(--font-mono)",
            fontSize: 15,
            fontWeight: 700,
          }}
          role="status"
          aria-live="polite"
        >
          {totalTokens.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add MessageStream and ToolCallInspector dashboard panels"
```

---

### Task 7: Compose DashboardLayout and page

**Files:**
- Create: `frontend/components/dashboard/AgentGraph.tsx`
- Create: `frontend/components/dashboard/DashboardLayout.tsx`
- Create: `frontend/app/dashboard/page.tsx`

- [ ] **Step 1: Create components/dashboard/AgentGraph.tsx**

```tsx
"use client";
import { FlowCanvas } from "@/components/graph/FlowCanvas";

interface AgentGraphProps {
  agentNames: string[];
  edges: Array<{ from: string; to: string }>;
}

export function AgentGraph({ agentNames, edges }: AgentGraphProps) {
  return (
    <div
      style={{
        gridArea: "graph",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 16,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Workflow Graph
        </span>
      </div>
      <FlowCanvas agentNames={agentNames} edges={edges} />
    </div>
  );
}
```

- [ ] **Step 2: Create components/dashboard/DashboardLayout.tsx**

```tsx
"use client";
import { useAgentMeshEvents } from "@/hooks/useAgentMeshEvents";
import { DashboardHeader } from "./DashboardHeader";
import { AgentSidebar } from "./AgentSidebar";
import { AgentGraph } from "./AgentGraph";
import { ToolCallInspector } from "./ToolCallInspector";
import { MessageStream } from "./MessageStream";

interface DashboardLayoutProps {
  agentNames: string[];
  edges: Array<{ from: string; to: string }>;
}

export function DashboardLayout({ agentNames, edges }: DashboardLayoutProps) {
  // Start WebSocket and pipe events into store
  useAgentMeshEvents(true);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr 340px",
        gridTemplateRows: "64px 1fr 260px",
        gridTemplateAreas:
          '"header  header    header"' +
          '"agents  graph     inspector"' +
          '"agents  timeline  inspector"',
        gap: 10,
        height: "100vh",
        padding: 10,
        background: "var(--bg-primary)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <DashboardHeader />
      <AgentSidebar agentNames={agentNames} />
      <AgentGraph agentNames={agentNames} edges={edges} />
      <ToolCallInspector />
      <MessageStream />
    </div>
  );
}
```

- [ ] **Step 3: Create app/dashboard/page.tsx**

```tsx
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DEMO_WORKFLOWS } from "@/lib/demoWorkflows";

// Default to github-code-review workflow for demo
const workflow = DEMO_WORKFLOWS["github-code-review"];

export const metadata = {
  title: "Mission Control — AgentMesh",
  description: "Real-time multi-agent workflow monitoring",
};

export default function DashboardPage() {
  return (
    <DashboardLayout
      agentNames={workflow.agents}
      edges={workflow.edges}
    />
  );
}
```

- [ ] **Step 4: Run dev server and visually verify the dashboard**

```bash
cd frontend && npm run dev
```

Open http://localhost:3000/dashboard. Verify:
- Full viewport dark grid layout with header, left sidebar, center graph, right inspector, bottom stream
- Header shows "AgentMesh" logo, "idle" workflow status, and WebSocket connection status
- Sidebar shows 4 agent names (Fetcher, Reviewer, SecurityScanner, Summarizer) all Idle
- Graph canvas shows 4 agent nodes connected with arrows, React Flow controls visible
- Inspector panel has 3 tabs: Tool Calls, Agent, Tokens
- Message stream is empty (no events yet)
- No console errors about missing modules

Expected: No TypeScript errors visible in browser console. Ctrl+C to stop.

- [ ] **Step 5: Verify TypeScript — no type errors**

```bash
cd frontend && npx tsc --noEmit
```
Expected: Exit code 0, no output.

- [ ] **Step 6: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: compose Mission Control dashboard with full grid layout and WebSocket integration"
```
