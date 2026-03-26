"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BaseNode, NODE_COLORS } from "./BaseNode";
import type { PipelineNode, LLMAgentConfig } from "@/types/pipeline";

const STATUS_COLORS: Record<string, string> = {
  idle:      "var(--text-tertiary)",
  active:    "hsl(185, 100%, 50%)",
  thinking:  "hsl(38, 92%, 50%)",
  completed: "hsl(142, 71%, 45%)",
  error:     "#ef4444",
};

export const LLMAgentNode = memo(function LLMAgentNode({
  id, data, selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as LLMAgentConfig;
  const color = NODE_COLORS.llm_agent;
  const status = data.status;
  const statusColor = status ? STATUS_COLORS[status] ?? color : color;
  const isActive = status === "active" || status === "thinking";

  return (
    <BaseNode id={id} kind="llm_agent" label={data.label} selected={!!selected}>
      {/* Status dot (run mode) */}
      {status && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: statusColor,
            boxShadow: isActive ? `0 0 6px ${statusColor}` : "none",
            animation: isActive ? "nodePulse 1.2s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontSize: 10, color: statusColor, textTransform: "capitalize" }}>{status}</span>
        </div>
      )}
      {/* Model badge */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
        <span style={{
          background: `${color}22`, color, border: `1px solid ${color}44`,
          borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 600,
        }}>
          {config.model.split("-").slice(0, 2).join("-")}
        </span>
        <span style={{
          background: "var(--bg-tertiary)", color: "var(--text-secondary)",
          borderRadius: 4, padding: "1px 6px", fontSize: 10,
          border: "1px solid var(--border-subtle)",
        }}>
          t={config.temperature}
        </span>
      </div>
      {/* System prompt preview */}
      {config.system_prompt && (
        <div style={{
          color: "var(--text-tertiary)", fontSize: 10, lineHeight: 1.4,
          maxHeight: 36, overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {config.system_prompt}
        </div>
      )}
      <Handle type="target" position={Position.Left}
        style={{ background: color, width: 8, height: 8, border: "2px solid var(--bg-primary)" }} />
      <Handle type="source" position={Position.Right}
        style={{ background: color, width: 8, height: 8, border: "2px solid var(--bg-primary)" }} />
    </BaseNode>
  );
});
