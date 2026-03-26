"use client";
import { memo, useCallback, useRef } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { BaseNode, NODE_COLORS } from "./BaseNode";
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
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const content = e.target.value;
      const newVars = extractVariables(content);

      // Auto-resize via mirror div
      if (mirrorRef.current && textareaRef.current) {
        mirrorRef.current.textContent = content + "\u200b";
        const newHeight = Math.max(80, mirrorRef.current.scrollHeight);
        const newWidth = Math.min(
          600,
          Math.max(200, mirrorRef.current.scrollWidth + 24)
        );
        updateNode(id, {
          style: { height: newHeight + 48, width: newWidth },
        });
      }

      updateNodeConfig(id, { content, variables: newVars });
    },
    [id, updateNodeConfig, updateNode]
  );

  const handleSpacing = 24;
  const topOffset = 48; // account for BaseNode header

  return (
    <BaseNode
      id={id}
      kind="text"
      label={data.label}
      selected={!!selected}
      hideDefaultHandles
    >
      {/* Variable pills preview */}
      {variables.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            marginBottom: 6,
          }}
        >
          {variables.map((v) => (
            <span
              key={v}
              style={{
                background: `${color}22`,
                color,
                border: `1px solid ${color}44`,
                borderRadius: 4,
                padding: "1px 5px",
                fontSize: 10,
                fontFamily: "monospace",
              }}
            >
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      )}

      {/* Textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          ref={textareaRef}
          value={config.content}
          onChange={handleChange}
          placeholder="Enter text with {{variables}}…"
          className="nodrag"
          style={{
            width: "100%",
            minHeight: 80,
            resize: "none",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 4,
            color: "var(--text-primary)",
            fontSize: 11,
            fontFamily: "monospace",
            padding: "6px 8px",
            outline: "none",
            boxSizing: "border-box",
            lineHeight: 1.5,
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "var(--accent-primary)")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = "var(--border-subtle)")
          }
        />
        {/* Hidden mirror for auto-resize measurement */}
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
            fontSize: 11,
            fontFamily: "monospace",
            padding: "6px 8px",
            lineHeight: 1.5,
            minWidth: 200,
            maxWidth: 600,
          }}
        />
      </div>

      {/* Source handle on right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: color,
          width: 8,
          height: 8,
          border: "2px solid var(--bg-primary)",
        }}
      />

      {/* Dynamic target handles per variable */}
      {variables.map((varName, i) => (
        <Handle
          key={varName}
          id={varName}
          type="target"
          position={Position.Left}
          style={{
            background: color,
            width: 8,
            height: 8,
            border: "2px solid var(--bg-primary)",
            top: topOffset + i * handleSpacing,
            left: -4,
          }}
          title={`{{${varName}}}`}
        >
          <span
            style={{
              position: "absolute",
              left: 12,
              top: -6,
              fontSize: 9,
              fontFamily: "monospace",
              color,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {`{{${varName}}}`}
          </span>
        </Handle>
      ))}
    </BaseNode>
  );
});
