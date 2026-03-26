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
import type { PipelineNode, InputNodeConfig } from "@/types/pipeline";

export const InputNode = memo(function InputNode({
  id,
  data,
  selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as InputNodeConfig;
  const color = NODE_COLORS.input;

  return (
    <BaseNode
      id={id}
      kind="input"
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
            payload
          </span>
          <span className="pipeline-node__chip" style={NODE_CONTENT_STYLES.chip}>
            {config.name || "input"}
          </span>
        </div>

        <div className="pipeline-node__preview" style={NODE_CONTENT_STYLES.preview}>
          <span
            className="pipeline-node__metric-label"
            style={NODE_CONTENT_STYLES.metricLabel}
          >
            Input brief
          </span>
          <p
            className="pipeline-node__preview-copy"
            style={NODE_CONTENT_STYLES.previewCopy}
          >
            {config.description || "Describe the incoming task, source, or user payload that initiates this workflow."}
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="pipeline-node__handle"
        style={getHandleStyle(color)}
      />
    </BaseNode>
  );
});
