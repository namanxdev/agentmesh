"use client";
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { NodeKind } from "@/types/pipeline";

export const NODE_COLORS: Record<NodeKind, string> = {
  input:     "hsl(185, 100%, 50%)",
  output:    "hsl(142, 71%, 45%)",
  llm_agent: "hsl(270, 85%, 65%)",
  tool:      "hsl(38, 92%, 50%)",
  text:      "hsl(200, 90%, 55%)",
  router:    "hsl(330, 80%, 60%)",
  memory:    "hsl(160, 60%, 45%)",
  transform: "hsl(15, 85%, 55%)",
};

export const NODE_ICONS: Record<NodeKind, string> = {
  input:     "→",
  output:    "✓",
  llm_agent: "🤖",
  tool:      "⚡",
  text:      "T",
  router:    "⑂",
  memory:    "◈",
  transform: "⇄",
};

interface BaseNodeProps {
  id: string;
  kind: NodeKind;
  label: string;
  selected: boolean;
  children?: React.ReactNode;
  hideDefaultHandles?: boolean;
}

export const BaseNode = memo(function BaseNode({
  id,
  kind,
  label,
  selected,
  children,
  hideDefaultHandles = false,
}: BaseNodeProps) {
  const deleteNode = usePipelineStore((s) => s.deleteNode);
  const selectNode = usePipelineStore((s) => s.selectNode);
  const accentColor = NODE_COLORS[kind];

  return (
    <div
      onClick={() => selectNode(id)}
      style={{
        background: "var(--bg-secondary)",
        borderTop: `1.5px solid ${selected ? accentColor : "var(--border-default)"}`,
        borderRight: `1.5px solid ${selected ? accentColor : "var(--border-default)"}`,
        borderBottom: `1.5px solid ${selected ? accentColor : "var(--border-default)"}`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 8,
        minWidth: 180,
        boxShadow: selected
          ? `0 0 0 2px ${accentColor}33, 0 4px 20px rgba(0,0,0,0.4)`
          : "0 2px 8px rgba(0,0,0,0.3)",
        transition: "box-shadow 0.15s, border-color 0.15s",
        fontSize: 12,
        color: "var(--text-primary)",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderBottom: "1px solid var(--border-subtle)",
          background: `${accentColor}18`,
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: `${accentColor}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            flexShrink: 0,
            color: accentColor,
            fontWeight: 700,
          }}
        >
          {NODE_ICONS[kind]}
        </span>
        <span
          style={{
            flex: 1,
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.03em",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          className="node-delete-btn"
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            background: "transparent",
            border: "none",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            lineHeight: 1,
            padding: 0,
            opacity: 0,
            transition: "opacity 0.15s, color 0.15s",
          }}
          title="Delete node"
        >
          ×
        </button>
      </div>

      {/* Body */}
      {children && (
        <div style={{ padding: "8px 10px" }}>{children}</div>
      )}

      {/* Default handles */}
      {!hideDefaultHandles && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            style={{
              background: accentColor,
              width: 8,
              height: 8,
              border: "2px solid var(--bg-primary)",
            }}
          />
          <Handle
            type="source"
            position={Position.Right}
            style={{
              background: accentColor,
              width: 8,
              height: 8,
              border: "2px solid var(--bg-primary)",
            }}
          />
        </>
      )}
    </div>
  );
});
