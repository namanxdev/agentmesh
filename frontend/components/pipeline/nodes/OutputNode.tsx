"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BaseNode, NODE_COLORS } from "./BaseNode";
import type { PipelineNode, OutputNodeConfig } from "@/types/pipeline";

export const OutputNode = memo(function OutputNode({
  id, data, selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as OutputNodeConfig;
  const color = NODE_COLORS.output;
  return (
    <BaseNode id={id} kind="output" label={data.label} selected={!!selected} hideDefaultHandles>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          background: `${color}22`,
          color,
          border: `1px solid ${color}44`,
          borderRadius: 4,
          padding: "1px 6px",
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          {config.output_format}
        </span>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, width: 8, height: 8, border: "2px solid var(--bg-primary)" }}
      />
    </BaseNode>
  );
});
