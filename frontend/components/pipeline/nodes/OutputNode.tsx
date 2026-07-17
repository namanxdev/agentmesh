"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/Badge";
import { BaseNode, NodeBrief, NodeMetaRow, getHandleStyle } from "./BaseNode";
import type { OutputNodeConfig, PipelineNode } from "@/types/pipeline";

export const OutputNode = memo(function OutputNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = data.config as OutputNodeConfig;

  return (
    <BaseNode id={id} kind="output" label={data.label} selected={Boolean(selected)} hideDefaultHandles>
      <NodeMetaRow>
        <Badge>{config.output_format}</Badge>
        <Badge>delivery</Badge>
      </NodeMetaRow>
      <NodeBrief label="Output format">
        Return the final workflow result as {config.output_format}.
      </NodeBrief>
      <Handle
        type="target"
        position={Position.Left}
        className="pipeline-node__handle"
        style={getHandleStyle()}
      />
    </BaseNode>
  );
});
