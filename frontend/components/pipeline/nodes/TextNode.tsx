"use client";

import { memo, useCallback, useRef, type ChangeEvent } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
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
  const { updateNode } = useReactFlow();
  const mirrorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const variables = config.variables ?? [];

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const content = e.target.value;
      const newVars = extractVariables(content);

      if (mirrorRef.current && textareaRef.current) {
        mirrorRef.current.textContent = content + " ";
        const newHeight = Math.max(116, mirrorRef.current.scrollHeight);
        const newWidth = Math.min(
          560,
          Math.max(260, mirrorRef.current.scrollWidth + 28)
        );

        updateNode(id, {
          style: { height: newHeight + 116, width: newWidth },
        });
      }

      updateNodeConfig(id, { content, variables: newVars });
    },
    [id, updateNode, updateNodeConfig]
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

        <div style={{ position: "relative" }}>
          <textarea
            ref={textareaRef}
            value={config.content}
            onChange={handleChange}
            placeholder="Write prompt text with {{variables}}..."
            className="pipeline-node__textarea nodrag"
            style={getTextareaStyle(color)}
          />

          <div
            ref={mirrorRef}
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              visibility: "hidden",
              pointerEvents: "none",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              padding: "14px 16px",
              lineHeight: 1.7,
              minWidth: 260,
              maxWidth: 560,
            }}
          />
        </div>
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
