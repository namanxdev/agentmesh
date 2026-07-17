"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/Badge";
import { BaseNode, NodeBrief, NodeMetaRow } from "./BaseNode";
import type { PipelineNode, TransformNodeConfig } from "@/types/pipeline";

export const TransformNode = memo(function TransformNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = data.config as TransformNodeConfig;

  return (
    <BaseNode id={id} kind="transform" label={data.label} selected={Boolean(selected)}>
      <NodeMetaRow>
        <Badge>{config.transform_type}</Badge>
        <Badge>shape</Badge>
      </NodeMetaRow>
      <NodeBrief label="Expression">
        {config.expression || "Add an expression to parse, extract, or format the incoming payload."}
      </NodeBrief>
    </BaseNode>
  );
});
