"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { type NodeProps } from "@xyflow/react";
import {
  BaseNode,
  NODE_COLORS,
  NODE_CONTENT_STYLES,
  getAccentChipStyle,
  getHandleStyle,
} from "./BaseNode";
import type { PipelineNode } from "@/types/pipeline";

export const ParallelNode = memo(function ParallelNode({
  id,
  data,
  selected,
}: NodeProps<PipelineNode>) {
  const color = NODE_COLORS.parallel;

  return (
    <BaseNode
      id={id}
      kind="parallel"
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
            Fan-out
          </span>
        </div>

        <div className="pipeline-node__preview" style={NODE_CONTENT_STYLES.preview}>
          <span
            className="pipeline-node__metric-label"
            style={NODE_CONTENT_STYLES.metricLabel}
          >
            Execution mode
          </span>
          <p
            className="pipeline-node__preview-copy"
            style={NODE_CONTENT_STYLES.previewCopy}
          >
            Branches run concurrently. Results are merged before the workflow continues.
          </p>
        </div>
      </div>

      {/* Single target handle — receives from the upstream agent */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        className="pipeline-node__handle"
        style={getHandleStyle(color, { left: "50%", transform: "translateX(-50%)" })}
      />

      {/* Two source handles — fan-out to parallel branches */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-left"
        className="pipeline-node__handle"
        style={getHandleStyle(color, { left: "30%" })}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-right"
        className="pipeline-node__handle"
        style={getHandleStyle(color, { left: "70%" })}
      />
    </BaseNode>
  );
});
