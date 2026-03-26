"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import {
  BaseNode,
  NODE_COLORS,
  NODE_CONTENT_STYLES,
  getAccentChipStyle,
} from "./BaseNode";
import type { PipelineNode, MemoryNodeConfig } from "@/types/pipeline";

export const MemoryNode = memo(function MemoryNode({
  id,
  data,
  selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as MemoryNodeConfig;
  const color = NODE_COLORS.memory;

  return (
    <BaseNode id={id} kind="memory" label={data.label} selected={!!selected}>
      <div className="pipeline-node__stack" style={NODE_CONTENT_STYLES.stack}>
        <div className="pipeline-node__chips" style={NODE_CONTENT_STYLES.chips}>
          <span
            className="pipeline-node__chip pipeline-node__chip--accent"
            style={getAccentChipStyle(color)}
          >
            {config.memory_type}
          </span>
          <span className="pipeline-node__chip" style={NODE_CONTENT_STYLES.chip}>
            {config.key}
          </span>
        </div>

        <div
          className="pipeline-node__metric-grid"
          style={NODE_CONTENT_STYLES.metricGrid}
        >
          <div className="pipeline-node__metric" style={NODE_CONTENT_STYLES.metric}>
            <span
              className="pipeline-node__metric-label"
              style={NODE_CONTENT_STYLES.metricLabel}
            >
              Store
            </span>
            <span
              className="pipeline-node__metric-value"
              style={NODE_CONTENT_STYLES.metricValue}
            >
              {config.memory_type === "vector" ? "Embedding index" : "Session context"}
            </span>
          </div>
          <div className="pipeline-node__metric" style={NODE_CONTENT_STYLES.metric}>
            <span
              className="pipeline-node__metric-label"
              style={NODE_CONTENT_STYLES.metricLabel}
            >
              Key
            </span>
            <span
              className="pipeline-node__metric-value"
              style={NODE_CONTENT_STYLES.metricValue}
            >
              {config.key}
            </span>
          </div>
        </div>
      </div>
    </BaseNode>
  );
});
