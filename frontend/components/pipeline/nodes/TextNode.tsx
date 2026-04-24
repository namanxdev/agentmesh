"use client";

import { memo, useCallback, useRef, type ChangeEvent } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  BaseNode,
  NODE_COLORS,
  NODE_CONTENT_STYLES,
  getAccentChipStyle,
  getHandleLabelStyle,
  getHandleStyle,
  getTextareaStyle,
} from "./BaseNode";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { PipelineNode, TextNodeConfig } from "@/types/pipeline";

const VARIABLE_REGEX = /\{\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}\}/g;

function extractVariables(content: string): string[] {
  const matches = [...content.matchAll(VARIABLE_REGEX)];
  return [...new Set(matches.map((m) => m[1]))];
}

export const TextNode = memo(function TextNode({
  id,
  data,
  selected,
}: NodeProps<PipelineNode>) {
  const config = data.config as TextNodeConfig;
  const color = NODE_COLORS.text;
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const variables = config.variables ?? [];

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const content = e.target.value;
      const newVars = extractVariables(content);

      // Auto-resize: update the DOM element's height directly — no React
      // state or React Flow node mutations, so the controlled value is never
      // stomped by a competing re-render.
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.max(80, el.scrollHeight)}px`;

      updateNodeConfig(id, { content, variables: newVars });
    },
    [id, updateNodeConfig]
  );

  const handleSpacing = 32;
  const topOffset = 136;

  return (
    <BaseNode
      id={id}
      kind="text"
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
            template
          </span>
          <span className="pipeline-node__chip" style={NODE_CONTENT_STYLES.chip}>
            {variables.length} var{variables.length === 1 ? "" : "s"}
          </span>
        </div>

        {variables.length > 0 ? (
          <div className="pipeline-node__chips" style={NODE_CONTENT_STYLES.chips}>
            {variables.map((v) => (
              <span
                key={v}
                className="pipeline-node__chip"
                style={{
                  ...NODE_CONTENT_STYLES.chip,
                  borderColor: `${color}44`,
                  color,
                }}
              >
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          value={config.content}
          onChange={handleChange}
          placeholder="Write prompt text with {{variables}}..."
          className="pipeline-node__textarea nodrag"
          style={getTextareaStyle()}
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="pipeline-node__handle"
        style={getHandleStyle(color)}
      />

      {variables.map((varName, i) => (
        <Handle
          key={varName}
          id={varName}
          type="target"
          position={Position.Left}
          className="pipeline-node__handle"
          style={getHandleStyle(color, { top: topOffset + i * handleSpacing })}
          title={`{{${varName}}}`}
        >
          <span
            className="pipeline-node__handle-label"
            style={getHandleLabelStyle(color)}
          >
            {`{{${varName}}}`}
          </span>
        </Handle>
      ))}
    </BaseNode>
  );
});
