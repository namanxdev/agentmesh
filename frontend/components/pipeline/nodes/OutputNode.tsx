"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  BaseNode,
  NODE_COLORS,
  NODE_CONTENT_STYLES,
  getAccentChipStyle,
  getHandleStyle,
} from "./BaseNode";
import type { PipelineNode, OutputNodeConfig } from "@/types/pipeline";

export const OutputNode = memo(function OutputNode({
  id,
  data,
  selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as OutputNodeConfig;
  const color = NODE_COLORS.output;

  return (
    <BaseNode
      id={id}
      kind="output"
      label={data.label}
      selected={!!selected}
      hideDefaultHandles
    >
      <div className="pipeline-node__stack" style={NODE_CONTENT_STYLES.stack}>
        <div className="pipeline-node__chips" style={NODE_CONTENT_STYLES.chips}>
          <span
            className="pipeline-node__chip pipeline-node__chip--accent"
            style={getAccentChipStyle(color)}
          >
            {config.output_format}
          </span>
          <span className="pipeline-node__chip" style={NODE_CONTENT_STYLES.chip}>
            delivery
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
              Format
            </span>
            <span
              className="pipeline-node__metric-value"
              style={NODE_CONTENT_STYLES.metricValue}
            >
              {config.output_format.toUpperCase()}
            </span>
          </div>
          <div className="pipeline-node__metric" style={NODE_CONTENT_STYLES.metric}>
            <span
              className="pipeline-node__metric-label"
              style={NODE_CONTENT_STYLES.metricLabel}
            >
              Mode
            </span>
            <span
              className="pipeline-node__metric-value"
              style={NODE_CONTENT_STYLES.metricValue}
            >
              Final sink
            </span>
          </div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="pipeline-node__handle"
        style={getHandleStyle(color)}
      />
    </BaseNode>
  );
});
