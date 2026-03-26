"use client";

import { memo, type CSSProperties, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { NodeKind } from "@/types/pipeline";

export const NODE_COLORS: Record<NodeKind, string> = {
  input: "#72d5e6",
  output: "#d7ff70",
  llm_agent: "#f06a37",
  tool: "#f6c36d",
  text: "#73bdf6",
  router: "#ff8f6b",
  memory: "#6fd3b2",
  transform: "#ff9b71",
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
    gap: 12,
  } satisfies CSSProperties,
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  } satisfies CSSProperties,
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.03)",
    padding: "6px 10px",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  } satisfies CSSProperties,
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
  } satisfies CSSProperties,
  metric: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    padding: "11px 12px",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  } satisfies CSSProperties,
  metricLabel: {
    color: "var(--text-tertiary)",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  } satisfies CSSProperties,
  metricValue: {
    overflow: "hidden",
    color: "var(--text-primary)",
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.35,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
  preview: {
    padding: "13px 14px",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  } satisfies CSSProperties,
  previewCopy: {
    margin: "8px 0 0",
    color: "var(--text-secondary)",
    fontSize: 12,
    lineHeight: 1.6,
  } satisfies CSSProperties,
  routeList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  } satisfies CSSProperties,
  route: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "12px 13px",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
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
    width: 14,
    height: 14,
    border: "3px solid #120f0d",
    borderRadius: 999,
    boxShadow: `0 0 0 4px ${withAlpha(accentColor, 0.18)}, 0 0 18px ${withAlpha(accentColor, 0.26)}`,
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
    minHeight: 116,
    resize: "none",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)), rgba(18,14,12,0.85)",
    padding: "14px 16px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    lineHeight: 1.7,
    outline: `1px solid ${withAlpha(accentColor, 0)}`,
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
          minWidth: 258,
          maxWidth: 340,
          overflow: "hidden",
          border: `1px solid ${borderColor}`,
          borderRadius: 24,
          background: `radial-gradient(circle at top left, ${withAlpha(accentColor, 0.16)}, transparent 38%), linear-gradient(180deg, rgba(35, 28, 24, 0.96), rgba(18, 14, 12, 0.98))`,
          boxShadow: selected
            ? `0 34px 90px rgba(0,0,0,0.42), 0 0 0 1px ${withAlpha(accentColor, 0.38)}, 0 0 36px ${withAlpha(accentColor, 0.16)}, inset 0 1px 0 rgba(255,255,255,0.06)`
            : "0 22px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
          color: "var(--text-primary)",
          cursor: "pointer",
          transition: "transform 220ms var(--ease-out), box-shadow 220ms var(--ease-out), border-color 220ms var(--ease-out)",
        } as CSSProperties
      }
    >
      <div
        className="pipeline-node__orb"
        style={{
          position: "absolute",
          top: -64,
          right: -32,
          width: 128,
          height: 128,
          borderRadius: 999,
          background: `radial-gradient(circle, ${withAlpha(accentColor, 0.38)}, transparent 68%)`,
          filter: "blur(8px)",
          opacity: 0.42,
          pointerEvents: "none",
        }}
      />

      <div
        className="pipeline-node__top"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 16px 0",
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
              minWidth: 34,
              height: 34,
              padding: "0 8px",
              borderRadius: 999,
              border: `1px solid ${withAlpha(accentColor, 0.28)}`,
              background: withAlpha(accentColor, 0.14),
              color: accentColor,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {NODE_ICONS[kind]}
          </span>
          <div>
            <div
              className="pipeline-node__kicker"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: withAlpha(accentColor, 0.85),
              }}
            >
              {meta.kicker}
            </div>
            <div
              className="pipeline-node__serial"
              style={{
                marginTop: 3,
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              {id.slice(0, 6).toUpperCase()}
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
            width: 30,
            height: 30,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 999,
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            opacity: 0,
            transition: "opacity 160ms var(--ease-out), background 160ms var(--ease-out), color 160ms var(--ease-out), border-color 160ms var(--ease-out)",
          }}
        >
          X
        </button>
      </div>

      <div
        className="pipeline-node__heading"
        style={{ position: "relative", zIndex: 1, padding: "12px 16px 0" }}
      >
        <div
          className="pipeline-node__title"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: "var(--text-primary)",
          }}
        >
          {label}
        </div>
        <p
          className="pipeline-node__subtitle"
          style={{
            margin: "9px 0 0",
            color: "var(--text-secondary)",
            fontSize: 12,
            lineHeight: 1.55,
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
            gap: 12,
            padding: "15px 16px 16px",
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
