"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { BaseNode, NodeBrief, NodeMetaRow } from "./BaseNode";
import type { LLMAgentConfig, PipelineNode } from "@/types/pipeline";

function getStatusTone(status: PipelineNode["data"]["status"]): BadgeTone {
  if (status === "active") return "running";
  if (status === "thinking") return "pending";
  if (status === "completed") return "success";
  if (status === "error") return "error";
  return "neutral";
}

export const LLMAgentNode = memo(function LLMAgentNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = data.config as LLMAgentConfig;
  const status = data.status;
  const serverCount = config.mcp_servers?.length ?? 0;

  return (
    <BaseNode id={id} kind="llm_agent" label={data.label} selected={Boolean(selected)}>
      <NodeMetaRow>
        {status && status !== "idle" ? (
          <Badge tone={getStatusTone(status)}>
            <span className={`h-1.5 w-1.5 rounded-full bg-current${status === "active" ? " pipeline-live-dot" : ""}`} />
            {status}
          </Badge>
        ) : null}
        <Badge title={config.model}>{config.model}</Badge>
        <Badge>temp {config.temperature.toFixed(1)}</Badge>
        {serverCount > 0 ? <Badge>{serverCount} MCP</Badge> : null}
      </NodeMetaRow>
      <NodeBrief label="System brief">
        {config.system_prompt || "No system brief yet. Add guidance to define tone, constraints, and objectives."}
      </NodeBrief>
    </BaseNode>
  );
});
