"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import {
  BaseNode,
  NODE_COLORS,
  NODE_CONTENT_STYLES,
  getAccentChipStyle,
} from "./BaseNode";
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
      <div className="pipeline-node__stack" style={NODE_CONTENT_STYLES.stack}>
        <div className="pipeline-node__chips" style={NODE_CONTENT_STYLES.chips}>
          <span
            className="pipeline-node__chip pipeline-node__chip--accent"
            style={getAccentChipStyle(color)}
          >
            {config.transform_type}
          </span>
          <span className="pipeline-node__chip" style={NODE_CONTENT_STYLES.chip}>
            shape
          </span>
        </div>

        <div className="pipeline-node__preview" style={NODE_CONTENT_STYLES.preview}>
          <span
            className="pipeline-node__metric-label"
            style={NODE_CONTENT_STYLES.metricLabel}
          >
            Expression
          </span>
          <p
            className="pipeline-node__preview-copy"
            style={NODE_CONTENT_STYLES.previewCopy}
          >
            {config.expression || "Add a transform expression to parse, extract, or format the incoming payload."}
          </p>
        </div>
      </div>
    </BaseNode>
  );
});
