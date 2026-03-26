"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  BaseNode,
  NODE_COLORS,
  NODE_CONTENT_STYLES,
  getAccentChipStyle,
  getHandleStyle,
  getRouteIndexStyle,
} from "./BaseNode";
import type { PipelineNode, RouterNodeConfig } from "@/types/pipeline";

export const RouterNode = memo(function RouterNode({
  id,
  data,
  selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as RouterNodeConfig;
  const color = NODE_COLORS.router;
  const conditions = config.conditions ?? [];

  return (
    <BaseNode
      id={id}
      kind="router"
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
            key {config.routing_key}
          </span>
          <span className="pipeline-node__chip" style={NODE_CONTENT_STYLES.chip}>
            {conditions.length} branch{conditions.length === 1 ? "" : "es"}
          </span>
        </div>

        {conditions.length === 0 ? (
          <div className="pipeline-node__preview" style={NODE_CONTENT_STYLES.preview}>
            <span
              className="pipeline-node__metric-label"
              style={NODE_CONTENT_STYLES.metricLabel}
            >
              Routing map
            </span>
            <p
              className="pipeline-node__preview-copy"
              style={NODE_CONTENT_STYLES.previewCopy}
            >
              Add conditions to fan out the workflow into explicit branches.
            </p>
          </div>
        ) : (
          <div className="pipeline-node__route-list" style={NODE_CONTENT_STYLES.routeList}>
            {conditions.map((cond, i) => (
              <div
                key={i}
                className="pipeline-node__route"
                style={NODE_CONTENT_STYLES.route}
              >
                <span
                  className="pipeline-node__route-index"
                  style={getRouteIndexStyle(color)}
                >
                  {i + 1}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    className="pipeline-node__metric-label"
                    style={NODE_CONTENT_STYLES.metricLabel}
                  >
                    {cond.key}
                  </div>
                  <div
                    className="pipeline-node__metric-value"
                    style={NODE_CONTENT_STYLES.metricValue}
                  >
                    {cond.target || "Unmapped branch"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="pipeline-node__handle"
        style={getHandleStyle(color)}
      />

      {conditions.map((cond, i) => (
        <Handle
          key={cond.key}
          id={cond.key}
          type="source"
          position={Position.Right}
          className="pipeline-node__handle"
          style={getHandleStyle(color, {
            top: `${((i + 0.5) / Math.max(conditions.length, 1)) * 100}%`,
          })}
        />
      ))}
    </BaseNode>
  );
});
