"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import type { PipelineNode, ToolNodeConfig } from "@/types/pipeline";

export const ToolNode = memo(function ToolNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = data.config as ToolNodeConfig;
  return (
    <BaseNode id={id} kind="tool" label={data.label} selected={!!selected}>
      <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-secondary)" }}>
        {config.server && <span style={{ color: "var(--text-tertiary)" }}>{config.server}.</span>}
        <span style={{ color: "var(--text-primary)" }}>{config.tool_name || "unnamed"}</span>
      </div>
    </BaseNode>
  );
});
