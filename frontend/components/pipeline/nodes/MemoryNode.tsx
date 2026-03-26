"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { BaseNode, NODE_COLORS } from "./BaseNode";
import type { PipelineNode, MemoryNodeConfig } from "@/types/pipeline";

export const MemoryNode = memo(function MemoryNode({
  id,
  data,
  selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as MemoryNodeConfig;
  const color = NODE_COLORS.memory;
  return (
    <BaseNode id={id} kind="memory" label={data.label} selected={!!selected}>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span
          style={{
            background: `${color}22`,
            color,
            border: `1px solid ${color}44`,
            borderRadius: 4,
            padding: "1px 6px",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {config.memory_type}
        </span>
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: 11,
            fontFamily: "monospace",
          }}
        >
          {config.key}
        </span>
      </div>
    </BaseNode>
  );
});
