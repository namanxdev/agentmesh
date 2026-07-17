"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/Badge";
import { BaseNode, NodeBrief, NodeMetaRow, getHandleStyle } from "./BaseNode";
import type { PipelineNode, RouterNodeConfig } from "@/types/pipeline";

export const RouterNode = memo(function RouterNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = data.config as RouterNodeConfig;
  const conditions = config.conditions ?? [];
  const routingSummary = conditions.length
    ? conditions.map((condition) => condition.key || "Unnamed condition").join(", ")
    : "Add conditions to route the workflow into explicit branches.";

  return (
    <BaseNode id={id} kind="router" label={data.label} selected={Boolean(selected)} hideDefaultHandles>
      <NodeMetaRow>
        <Badge>key {config.routing_key}</Badge>
        <Badge>{conditions.length} branch{conditions.length === 1 ? "" : "es"}</Badge>
      </NodeMetaRow>
      <NodeBrief label="Routing map">{routingSummary}</NodeBrief>
      <Handle
        type="target"
        position={Position.Left}
        className="pipeline-node__handle"
        style={getHandleStyle()}
      />
      {conditions.map((condition, index) => (
        <Handle
          key={`${condition.key}-${index}`}
          id={condition.key}
          type="source"
          position={Position.Right}
          className="pipeline-node__handle"
          style={getHandleStyle({
            top: `${((index + 0.5) / Math.max(conditions.length, 1)) * 100}%`,
          })}
        />
      ))}
    </BaseNode>
  );
});
