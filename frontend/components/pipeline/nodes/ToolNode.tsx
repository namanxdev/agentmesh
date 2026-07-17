"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/Badge";
import { BaseNode, NodeBrief, NodeMetaRow } from "./BaseNode";
import type { PipelineNode, ToolNodeConfig } from "@/types/pipeline";

function getParameterCount(parameters: string) {
  try {
    const parsed = JSON.parse(parameters);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? Object.keys(parsed).length
      : null;
  } catch {
    return null;
  }
}

export const ToolNode = memo(function ToolNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = data.config as ToolNodeConfig;
  const parameterCount = getParameterCount(config.parameters);

  return (
    <BaseNode id={id} kind="tool" label={data.label} selected={Boolean(selected)}>
      <NodeMetaRow>
        <Badge>{config.server || "local"}</Badge>
        <Badge>{config.tool_name || "unnamed"}</Badge>
      </NodeMetaRow>
      <NodeBrief label="Parameters">
        {parameterCount === null ? "Raw JSON parameters" : `${parameterCount} configured field${parameterCount === 1 ? "" : "s"}`}.
      </NodeBrief>
    </BaseNode>
  );
});
