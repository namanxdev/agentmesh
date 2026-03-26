"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import {
  BaseNode,
  NODE_COLORS,
  NODE_CONTENT_STYLES,
  getAccentChipStyle,
} from "./BaseNode";
import type { PipelineNode, ToolNodeConfig } from "@/types/pipeline";

function getParameterCount(parameters: string) {
  try {
    const parsed = JSON.parse(parameters);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.keys(parsed).length;
    }
  } catch {
    return null;
  }

  return null;
}

export const ToolNode = memo(function ToolNode({
  id,
  data,
  selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as ToolNodeConfig;
  const parameterCount = getParameterCount(config.parameters);
  const color = NODE_COLORS.tool;

  return (
    <BaseNode id={id} kind="tool" label={data.label} selected={!!selected}>
      <div className="pipeline-node__stack" style={NODE_CONTENT_STYLES.stack}>
        <div className="pipeline-node__chips" style={NODE_CONTENT_STYLES.chips}>
          <span
            className="pipeline-node__chip pipeline-node__chip--accent"
            style={getAccentChipStyle(color)}
          >
            {config.server || "local"}
          </span>
          <span className="pipeline-node__chip" style={NODE_CONTENT_STYLES.chip}>
            {config.tool_name || "unnamed"}
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
              Server
            </span>
            <span
              className="pipeline-node__metric-value"
              style={NODE_CONTENT_STYLES.metricValue}
            >
              {config.server || "Not assigned"}
            </span>
          </div>
          <div className="pipeline-node__metric" style={NODE_CONTENT_STYLES.metric}>
            <span
              className="pipeline-node__metric-label"
              style={NODE_CONTENT_STYLES.metricLabel}
            >
              Params
            </span>
            <span
              className="pipeline-node__metric-value"
              style={NODE_CONTENT_STYLES.metricValue}
            >
              {parameterCount === null ? "Raw JSON" : `${parameterCount} fields`}
            </span>
          </div>
        </div>
      </div>
    </BaseNode>
  );
});
