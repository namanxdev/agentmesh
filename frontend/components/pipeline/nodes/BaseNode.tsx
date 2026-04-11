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
    description: "Seed the workflow with initial payload and context.",
  },
  output: {
    kicker: "Result",
    description: "Collect the final response in the desired format.",
  },
  llm_agent: {
    kicker: "Reasoning",
    description: "Run planning, synthesis, and decision-making steps.",
  },
  tool: {
    kicker: "Action",
    description: "Call an external tool or server-side capability.",
  },
  text: {
    kicker: "Template",
    description: "Compose prompt fragments with reusable variables.",
  },
  router: {
    kicker: "Branch",
    description: "Split execution based on rules and route outputs.",
  },
  memory: {
    kicker: "Context",
    description: "Store or recall shared state across workflow steps.",
  },
  transform: {
    kicker: "Transform",
    description: "Shape and normalize data before the next step.",
  },
  parallel: {
    kicker: "Fan-out",
    description: "Run multiple agents simultaneously then merge results.",
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
    gap: 8,
  } satisfies CSSProperties,
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  } satisfies CSSProperties,
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 4,
    background: "rgba(255,255,255,0.03)",
    padding: "4px 6px",
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
    gap: 6,
  } satisfies CSSProperties,
  metric: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "8px 10px",
    border: "1px solid rgba(255,255,255,0.08)",
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
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.2,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
  preview: {
    padding: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    background: "rgba(255,255,255,0.02)",
  } satisfies CSSProperties,
  previewCopy: {
    margin: "4px 0 0",
    color: "var(--text-secondary)",
    fontSize: 10,
    lineHeight: 1.5,
  } satisfies CSSProperties,
  routeList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  } satisfies CSSProperties,
  route: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    background: "rgba(255,255,255,0.02)",
  } satisfies CSSProperties,
} as const;

export function getAccentChipStyle(accentColor: string): CSSProperties {
  return {
    ...NODE_CONTENT_STYLES.chip,
    border: `1px solid ${withAlpha(accentColor, 0.28)}`,
    background: withAlpha(accentColor, 0.12),
    color: accentColor,
  };
}

export function getRouteIndexStyle(accentColor: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    borderRadius: 999,
    background: withAlpha(accentColor, 0.14),
    color: accentColor,
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
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
    border: "2px solid #0c0a09",
    borderRadius: 2,
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
    background: "rgba(18, 14, 12, 0.92)",
    padding: "3px 8px",
    color: accentColor,
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.08em",
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };
}

export function getTextareaStyle(accentColor: string): CSSProperties {
  return {
    width: "100%",
    minHeight: 80,
    resize: "none",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    background: "rgba(0,0,0,0.2)",
    padding: "8px 10px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    lineHeight: 1.5,
    outline: "none",
    boxSizing: "border-box",
  };
}

export function getStatusDotStyle(
  accentColor: string,
  isLive: boolean
): CSSProperties {
  return {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: accentColor,
    color: accentColor,
    boxShadow: isLive
      ? `0 0 0 6px ${withAlpha(accentColor, 0.14)}`
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
  const borderColor = withAlpha(accentColor, selected ? 0.52 : 0.28);

  return (
    <div
      onClick={() => selectNode(id)}
      className={`pipeline-node${selected ? " is-selected" : ""}`}
      data-kind={kind}
      style={
        {
          "--node-accent": accentColor,
          position: "relative",
          minWidth: 180,
          maxWidth: 240,
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          background: `rgba(12, 10, 9, 0.95)`,
          boxShadow: selected
            ? `0 0 0 1px ${accentColor}, 0 8px 30px rgba(0,0,0,0.5)`
            : "0 4px 12px rgba(0,0,0,0.3)",
          color: "var(--text-primary)",
          cursor: "pointer",
          transition: "box-shadow 150ms ease, border-color 150ms ease",
        } as CSSProperties
      }
    >
      <div
        className="pipeline-node__top"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 10px 0",
        }}
      >
        <div
          className="pipeline-node__eyebrow"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}
        >
          <span
            className="pipeline-node__icon"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 20,
              height: 20,
              padding: "0 4px",
              borderRadius: 4,
              border: `1px solid ${withAlpha(accentColor, 0.28)}`,
              background: withAlpha(accentColor, 0.14),
              color: accentColor,
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              fontWeight: 700,
            }}
          >
            {NODE_ICONS[kind]}
          </span>
          <div>
            <div
              className="pipeline-node__kicker"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: withAlpha(accentColor, 0.85),
              }}
            >
              {meta.kicker}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          className="node-delete-btn pipeline-node__delete"
          title="Delete node"
          aria-label={`Delete ${label}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 4,
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-tertiary)",
            fontSize: 10,
            cursor: "pointer",
            border: "none",
            opacity: 0,
          }}
        >
          X
        </button>
      </div>

      <div
        className="pipeline-node__heading"
        style={{ position: "relative", zIndex: 1, padding: "8px 10px 0" }}
      >
        <div
          className="pipeline-node__title"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 13,
            fontWeight: 800,
            color: "var(--text-primary)",
          }}
        >
          {label}
        </div>
        <p
          className="pipeline-node__subtitle"
          style={{
            margin: "4px 0 0",
            color: "var(--text-secondary)",
            fontSize: 10,
            lineHeight: 1.4,
          }}
        >
          {meta.description}
        </p>
      </div>

      {children ? (
        <div
          className="pipeline-node__body"
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "10px 10px 10px",
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
