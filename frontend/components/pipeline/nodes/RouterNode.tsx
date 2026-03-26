"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BaseNode, NODE_COLORS } from "./BaseNode";
import type { PipelineNode, RouterNodeConfig } from "@/types/pipeline";

export const RouterNode = memo(function RouterNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = data.config as RouterNodeConfig;
  const color = NODE_COLORS.router;
  const conditions = config.conditions ?? [];

  return (
    <BaseNode id={id} kind="router" label={data.label} selected={!!selected} hideDefaultHandles>
      <div>
        {conditions.length === 0 ? (
          <div style={{ color: "var(--text-tertiary)", fontSize: 11, fontStyle: "italic" }}>
            No conditions yet
          </div>
        ) : (
          conditions.map((cond, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, marginBottom: 2,
            }}>
              <span style={{ color: "var(--text-tertiary)", minWidth: 50 }}>{cond.key}</span>
              <span style={{ color: "var(--border-default)" }}>→</span>
              <span style={{ color: color }}>{cond.target || "?"}</span>
            </div>
          ))
        )}
      </div>
      {/* Target handle on left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, width: 8, height: 8, border: "2px solid var(--bg-primary)" }}
      />
      {/* One source handle per condition */}
      {conditions.map((cond, i) => (
        <Handle
          key={cond.key}
          id={cond.key}
          type="source"
          position={Position.Right}
          style={{
            background: color,
            width: 8, height: 8,
            border: "2px solid var(--bg-primary)",
            top: `${((i + 0.5) / Math.max(conditions.length, 1)) * 100}%`,
          }}
        />
      ))}
    </BaseNode>
  );
});
