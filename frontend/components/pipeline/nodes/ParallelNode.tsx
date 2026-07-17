"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/Badge";
import { BaseNode, NodeBrief, NodeMetaRow, getHandleStyle } from "./BaseNode";
import type { PipelineNode } from "@/types/pipeline";

export const ParallelNode = memo(function ParallelNode({ id, data, selected }: NodeProps<PipelineNode>) {
  return (
    <BaseNode id={id} kind="parallel" label={data.label} selected={Boolean(selected)} hideDefaultHandles>
      <NodeMetaRow>
        <Badge>fan-out</Badge>
      </NodeMetaRow>
      <NodeBrief label="Execution mode">
        Branches run concurrently. Results merge before the workflow continues.
      </NodeBrief>
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        className="pipeline-node__handle"
        style={getHandleStyle({ left: "50%", top: 0, transform: "translate(-50%, -50%)" })}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-left"
        className="pipeline-node__handle"
        style={getHandleStyle({ left: "20%", top: "auto", bottom: 0, transform: "translate(-50%, 50%)" })}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-middle"
        className="pipeline-node__handle"
        style={getHandleStyle({ left: "50%", top: "auto", bottom: 0, transform: "translate(-50%, 50%)" })}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-right"
        className="pipeline-node__handle"
        style={getHandleStyle({ left: "80%", top: "auto", bottom: 0, transform: "translate(-50%, 50%)" })}
      />
    </BaseNode>
  );
});
