"use client";

import { memo, type CSSProperties, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { NodeKind } from "@/types/pipeline";

export const NODE_COLORS: Record<NodeKind, string> = {
  input: "#4ADE80", // Green 400
  output: "#F472B6", // Pink 400
  llm_agent: "#D7FF70", // Acid Green
  tool: "#E85D2A", // Burnt Orange
  text: "#60A5FA", // Blue 400
  router: "#FB923C", // Orange 400
  memory: "#2DD4BF", // Teal 400
  transform: "#A78BFA", // Violet 400
  parallel: "#FF70A6", // Neon pink
};

export const NODE_ICONS: Record<NodeKind, string> = {
  input: "IN",
  output: "OUT",
  llm_agent: "AI",
  tool: "MCP",
  text: "TXT",
  router: "IF",
  memory: "MEM",
  transform: "FX",
  parallel: "⇶",
};

export const NODE_META: Record<
  NodeKind,
  { kicker: string; description: string }
> = {
  input: {
    kicker: "Entry",
    description: "Seed the workflow with initial payload.",
  },
  output: {
    kicker: "Result",
    description: "Collect the final response format.",
  },
  llm_agent: {
    kicker: "Reasoning",
    description: "Run planning and synthesis.",
  },
  tool: {
    kicker: "Action",
    description: "Call an external tool or server.",
  },
  text: {
    kicker: "Template",
    description: "Compose prompt fragments.",
  },
  router: {
    kicker: "Branch",
    description: "Split execution based on rules.",
  },
  memory: {
    kicker: "Context",
    description: "Store or recall shared state.",
  },
  transform: {
    kicker: "Transform",
    description: "Shape and normalize data.",
  },
  parallel: {
    kicker: "Fan-out",
    description: "Run agents simultaneously.",
  },
};

function withAlpha(color: string, alpha: number) {
  if (color.startsWith("#") && color.length === 7) {
    const value = Math.max(0, Math.min(255, Math.round(alpha * 255)))
      .toString(16)
      .padStart(2, "0");
    return `${color}${value}`;
  }
  return color;
}

export const NODE_CONTENT_STYLES = {
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  } satisfies CSSProperties,
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
  } satisfies CSSProperties,
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 4,
    background: "rgba(255,255,255,0.02)",
    padding: "3px 6px",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  } satisfies CSSProperties,
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 4,
  } satisfies CSSProperties,
  metric: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "6px 8px",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 6,
    background: "rgba(255,255,255,0.02)",
  } satisfies CSSProperties,
  metricLabel: {
    color: "var(--text-tertiary)",
    fontFamily: "var(--font-mono)",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  } satisfies CSSProperties,
  metricValue: {
    overflow: "hidden",
    color: "var(--text-primary)",
    fontSize: 10,
    fontWeight: 600,
    lineHeight: 1.2,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
  preview: {
    padding: "8px",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 6,
    background: "rgba(0,0,0,0.2)",
  } satisfies CSSProperties,
  previewCopy: {
    margin: "0",
    color: "var(--text-secondary)",
    fontSize: 9,
    lineHeight: 1.4,
  } satisfies CSSProperties,
  routeList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  } satisfies CSSProperties,
  route: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 8px",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 6,
    background: "rgba(255,255,255,0.02)",
  } satisfies CSSProperties,
} as const;

export function getAccentChipStyle(accentColor: string): CSSProperties {
  return {
    ...NODE_CONTENT_STYLES.chip,
    border: `1px solid ${withAlpha(accentColor, 0.2)}`,
    background: withAlpha(accentColor, 0.08),
    color: accentColor,
  };
}

export function getRouteIndexStyle(accentColor: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    borderRadius: 999,
    background: withAlpha(accentColor, 0.15),
    color: accentColor,
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fontWeight: 700,
  };
}

export function getHandleStyle(
  accentColor: string,
  extra?: CSSProperties
): CSSProperties {
  return {
    background: accentColor,
    width: 10,
    height: 10,
    border: "2px solid #000",
    borderRadius: "50%",
    ...extra,
  };
}

export function getHandleLabelStyle(accentColor: string): CSSProperties {
  return {
    position: "absolute",
    top: -8,
    left: 18,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    background: "rgba(0,0,0, 0.8)",
    backdropFilter: "blur(4px)",
    padding: "2px 6px",
    color: accentColor,
    fontFamily: "var(--font-mono)",
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    border: "1px solid rgba(255,255,255,0.05)"
  };
}

export function getTextareaStyle(accentColor: string): CSSProperties {
  return {
    width: "100%",
    minHeight: 60,
    resize: "none",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 6,
    background: "rgba(0,0,0,0.3)",
    padding: "6px 8px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    lineHeight: 1.4,
    outline: "none",
    boxSizing: "border-box",
  };
}

export function getStatusDotStyle(
  accentColor: string,
  isLive: boolean
): CSSProperties {
  return {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: accentColor,
    color: accentColor,
    boxShadow: isLive
      ? `0 0 0 4px ${withAlpha(accentColor, 0.15)}`
      : "0 0 0 0 transparent",
  };
}

interface BaseNodeProps {
  id: string;
  kind: NodeKind;
  label: string;
  selected: boolean;
  children?: ReactNode;
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
  const meta = NODE_META[kind];
  const borderColor = withAlpha(accentColor, selected ? 0.6 : 0.15);

  return (
    <div
      onClick={() => selectNode(id)}
      className={`group pipeline-node${selected ? " is-selected" : ""}`}
      data-kind={kind}
      style={
        {
          "--node-accent": accentColor,
          position: "relative",
          minWidth: 140, // Reduced from 180
          maxWidth: 200, // Reduced from 240
          border: `1px solid ${borderColor}`,
          borderRadius: 12,
          background: `rgba(10, 10, 10, 0.85)`,
          backdropFilter: "blur(12px)",
          boxShadow: selected
            ? `0 0 0 1px ${accentColor}, 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`
            : "0 10px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
          color: "var(--text-primary)",
          cursor: "pointer",
          transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        } as CSSProperties
      }
    >
      {/* Top subtle accent line */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 12,
          right: 12,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: selected ? 0.8 : 0.3,
          transition: "opacity 200ms ease"
        }}
      />

      <div
        className="pipeline-node__top"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "8px 10px",
          borderBottom: children ? "1px solid rgba(255,255,255,0.03)" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 20,
              height: 20,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${withAlpha(accentColor, 0.2)}, ${withAlpha(accentColor, 0.05)})`,
              border: `1px solid ${withAlpha(accentColor, 0.3)}`,
              color: accentColor,
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              fontWeight: 800,
            }}
          >
            {NODE_ICONS[kind]}
          </span>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          title="Delete node"
          aria-label={`Delete ${label}`}
          className="opacity-60 hover:opacity-100 transition-all"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: 6,
            background: "rgba(255,255,255,0.05)",
            color: "var(--text-tertiary)",
            fontSize: 10,
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.08)",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
             e.currentTarget.style.background = "rgba(239,68,68,0.15)";
             e.currentTarget.style.color = "#ef4444";
             e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
          }}
          onMouseLeave={(e) => {
             e.currentTarget.style.background = "rgba(255,255,255,0.05)";
             e.currentTarget.style.color = "var(--text-tertiary)";
             e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          ✕
        </button>
      </div>

      {children ? (
        <div
          className="pipeline-node__body"
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "8px 10px",
          }}
        >
          {children}
        </div>
      ) : null}

      {!hideDefaultHandles && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            className="pipeline-node__handle"
            style={getHandleStyle(accentColor)}
          />
          <Handle
            type="source"
            position={Position.Right}
            className="pipeline-node__handle"
            style={getHandleStyle(accentColor)}
          />
        </>
      )}
    </div>
  );
});
