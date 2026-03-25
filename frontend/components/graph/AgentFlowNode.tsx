"use client";
import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { getAgentColor } from "@/types/agents";
import type { AgentStatus } from "@/types/events";

export interface AgentNodeData extends Record<string, unknown> {
  label: string;
  role: string;
  status: AgentStatus;
  colorIndex: number;
}

export type AgentFlowNodeType = Node<AgentNodeData, "agentNode">;

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
}: NodeProps<AgentFlowNodeType>) {
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
