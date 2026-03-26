"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { BaseNode, NODE_COLORS } from "./BaseNode";
import type { PipelineNode, TransformNodeConfig } from "@/types/pipeline";

export const TransformNode = memo(function TransformNode({
  id,
  data,
  selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as TransformNodeConfig;
  const color = NODE_COLORS.transform;
  return (
    <BaseNode id={id} kind="transform" label={data.label} selected={!!selected}>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        <span
          style={{
            background: `${color}22`,
            color,
            border: `1px solid ${color}44`,
            borderRadius: 4,
            padding: "1px 6px",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {config.transform_type}
        </span>
        {config.expression && (
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              color: "var(--text-secondary)",
              background: "var(--bg-tertiary)",
              borderRadius: 4,
              padding: "1px 6px",
              border: "1px solid var(--border-subtle)",
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {config.expression}
          </span>
        )}
      </div>
    </BaseNode>
  );
});
