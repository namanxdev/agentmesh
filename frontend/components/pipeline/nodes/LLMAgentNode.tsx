"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import {
  BaseNode,
  NODE_COLORS,
  NODE_CONTENT_STYLES,
  getAccentChipStyle,
  getStatusDotStyle,
} from "./BaseNode";
import type { PipelineNode, LLMAgentConfig } from "@/types/pipeline";

const STATUS_COLORS: Record<string, string> = {
  idle: "var(--text-tertiary)",
  active: "hsl(185, 100%, 50%)",
  thinking: "hsl(38, 92%, 50%)",
  completed: "hsl(142, 71%, 45%)",
  error: "#ef4444",
};

function compactModelName(model: string) {
  return model.split("-").slice(0, 3).join("-");
}

export const LLMAgentNode = memo(function LLMAgentNode({
  id,
  data,
  selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as LLMAgentConfig;
  const color = NODE_COLORS.llm_agent;
  const status = data.status;
  const statusColor = status ? STATUS_COLORS[status] ?? "var(--accent-primary)" : "var(--accent-primary)";
  const isActive = status === "active" || status === "thinking";

  return (
    <BaseNode id={id} kind="llm_agent" label={data.label} selected={!!selected}>
      <div className="pipeline-node__stack" style={NODE_CONTENT_STYLES.stack}>
        <div className="pipeline-node__chips" style={NODE_CONTENT_STYLES.chips}>
          {status ? (
            <span className="pipeline-node__chip" style={NODE_CONTENT_STYLES.chip}>
              <span
                className={`pipeline-node__status-dot${isActive ? " is-live" : ""}`}
                style={getStatusDotStyle(statusColor, isActive)}
              />
              <span style={{ color: statusColor, textTransform: "capitalize" }}>
                {status}
              </span>
            </span>
          ) : null}
          <span
            className="pipeline-node__chip pipeline-node__chip--accent"
            style={getAccentChipStyle(color)}
          >
            {compactModelName(config.model)}
          </span>
          <span className="pipeline-node__chip" style={NODE_CONTENT_STYLES.chip}>
            temp {config.temperature.toFixed(1)}
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
              Model
            </span>
            <span
              className="pipeline-node__metric-value"
              style={NODE_CONTENT_STYLES.metricValue}
            >
              {compactModelName(config.model)}
            </span>
          </div>
          <div className="pipeline-node__metric" style={NODE_CONTENT_STYLES.metric}>
            <span
              className="pipeline-node__metric-label"
              style={NODE_CONTENT_STYLES.metricLabel}
            >
              Focus
            </span>
            <span
              className="pipeline-node__metric-value"
              style={NODE_CONTENT_STYLES.metricValue}
            >
              {config.temperature < 0.35
                ? "Tight"
                : config.temperature < 0.7
                  ? "Balanced"
                  : "Exploratory"}
            </span>
          </div>
        </div>

        <div className="pipeline-node__preview" style={NODE_CONTENT_STYLES.preview}>
          <span
            className="pipeline-node__metric-label"
            style={NODE_CONTENT_STYLES.metricLabel}
          >
            System brief
          </span>
          <p
            className="pipeline-node__preview-copy"
            style={NODE_CONTENT_STYLES.previewCopy}
          >
            {config.system_prompt || "No system brief yet. Add guidance to define tone, constraints, and objectives."}
          </p>
        </div>
      </div>
    </BaseNode>
  );
});
