"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BaseNode, NODE_COLORS } from "./BaseNode";
import type { PipelineNode, InputNodeConfig } from "@/types/pipeline";

export const InputNode = memo(function InputNode({
  id, data, selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as InputNodeConfig;
  const color = NODE_COLORS.input;
  return (
    <BaseNode id={id} kind="input" label={data.label} selected={!!selected} hideDefaultHandles>
      <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>
        {config.description || <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>No description</span>}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, width: 8, height: 8, border: "2px solid var(--bg-primary)" }}
      />
    </BaseNode>
  );
});
