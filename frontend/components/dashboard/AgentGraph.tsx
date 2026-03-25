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
