"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/Badge";
import { BaseNode, NodeBrief, NodeMetaRow } from "./BaseNode";
import type { MemoryNodeConfig, PipelineNode } from "@/types/pipeline";

export const MemoryNode = memo(function MemoryNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = data.config as MemoryNodeConfig;

  return (
    <BaseNode id={id} kind="memory" label={data.label} selected={Boolean(selected)}>
      <NodeMetaRow>
        <Badge>{config.memory_type}</Badge>
        <Badge>{config.key}</Badge>
      </NodeMetaRow>
      <NodeBrief label="Storage">
        {config.memory_type === "vector" ? "Embedding index" : "Session context"} under {config.key}.
      </NodeBrief>
    </BaseNode>
  );
});
