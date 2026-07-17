"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/Badge";
import { BaseNode, NodeBrief, NodeMetaRow, getHandleStyle } from "./BaseNode";
import type { InputNodeConfig, PipelineNode } from "@/types/pipeline";

export const InputNode = memo(function InputNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = data.config as InputNodeConfig;

  return (
    <BaseNode id={id} kind="input" label={data.label} selected={Boolean(selected)} hideDefaultHandles>
      <NodeMetaRow>
        <Badge>payload</Badge>
        <Badge>{config.name || "input"}</Badge>
      </NodeMetaRow>
      <NodeBrief label="Input brief">
        {config.description || "Describe the incoming task, source, or user payload that initiates this workflow."}
      </NodeBrief>
      <Handle
        type="source"
        position={Position.Right}
        className="pipeline-node__handle"
        style={getHandleStyle()}
      />
    </BaseNode>
  );
});
