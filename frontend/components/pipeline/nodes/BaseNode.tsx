"use client";

import { memo, type CSSProperties, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { X } from "lucide-react";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { NodeKind } from "@/types/pipeline";

// Identity accent colors — used only for the tiny kind dot. Not for borders,
// gradients, chips, or icon backgrounds.
export const NODE_COLORS: Record<NodeKind, string> = {
  input: "#4ADE80",
  output: "#F472B6",
  llm_agent: "#D7FF70",
  tool: "#E85D2A",
  text: "#60A5FA",
  router: "#FB923C",
  memory: "#2DD4BF",
  transform: "#A78BFA",
  parallel: "#FF70A6",
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
  input: { kicker: "Entry", description: "Seed the workflow with initial payload." },
  output: { kicker: "Result", description: "Collect the final response format." },
  llm_agent: { kicker: "Reasoning", description: "Run planning and synthesis." },
  tool: { kicker: "Action", description: "Call an external tool or server." },
  text: { kicker: "Template", description: "Compose prompt fragments." },
  router: { kicker: "Branch", description: "Split execution based on rules." },
  memory: { kicker: "Context", description: "Store or recall shared state." },
  transform: { kicker: "Transform", description: "Shape and normalize data." },
  parallel: { kicker: "Fan-out", description: "Run agents simultaneously." },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function withAlpha(color: string, alpha: number) {
  if (color.startsWith("#") && color.length === 7) {
    const value = Math.max(0, Math.min(255, Math.round(alpha * 255)))
      .toString(16)
      .padStart(2, "0");
    return `${color}${value}`;
  }
  return color;
}

export function getHandleStyle(
  accentColor: string,
  extra?: CSSProperties
): CSSProperties {
  return {
    background: "rgb(10,10,10)",
    width: 10,
    height: 10,
    border: `2px solid ${withAlpha(accentColor, 0.72)}`,
    borderRadius: "50%",
    boxShadow: "0 0 0 2px rgb(8,8,8)",
    ...extra,
  };
}

export function getHandleLabelStyle(accentColor: string): CSSProperties {
  return {
    position: "absolute",
    top: -8,
    left: 16,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    background: "rgba(10,10,10,0.95)",
    padding: "2px 6px",
    color: "rgb(163,163,163)",          // neutral-400
    fontFamily: "var(--font-mono)",
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    border: `1px solid ${withAlpha(accentColor, 0.18)}`,
  };
}

export function getTextareaStyle(): CSSProperties {
  return {
    width: "100%",
    minHeight: 60,
    resize: "none",
    overflow: "hidden",
    border: "1px solid rgb(38,38,38)",
    borderRadius: 4,
    background: "rgba(0,0,0,0.3)",
    padding: "6px 8px",
    color: "rgb(212,212,212)",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    lineHeight: 1.4,
    outline: "none",
    boxSizing: "border-box",
  };
}

// ─── Legacy style exports kept for compatibility ─────────────────────────────
// These are still imported by individual node files; they now render in the
// new neutral palette rather than the old colorful one.

export const NODE_CONTENT_STYLES = {
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
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
    border: "1px solid rgb(38,38,38)",
    borderRadius: 4,
    background: "rgb(15,15,15)",
    padding: "3px 6px",
    color: "rgb(115,115,115)",
    fontFamily: "var(--font-mono)",
    fontSize: 9.5,
    fontWeight: 500,
    letterSpacing: "0.03em",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 6,
  } satisfies CSSProperties,
  metric: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "7px 8px",
    border: "1px solid rgb(38,38,38)",
    borderRadius: 4,
    background: "rgb(13,13,13)",
  } satisfies CSSProperties,
  metricLabel: {
    color: "rgb(82,82,82)",
    fontFamily: "var(--font-mono)",
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  } satisfies CSSProperties,
  metricValue: {
    overflow: "hidden",
    color: "rgb(163,163,163)",
    fontSize: 10.5,
    fontWeight: 600,
    lineHeight: 1.2,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
  preview: {
    padding: "8px 9px",
    border: "1px solid rgb(38,38,38)",
    borderRadius: 4,
    background: "rgb(8,8,8)",
  } satisfies CSSProperties,
  previewCopy: {
    margin: "0",
    color: "rgb(115,115,115)",
    fontSize: 9.5,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  } satisfies CSSProperties,
  routeList: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  } satisfies CSSProperties,
  route: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 6px",
    border: "1px solid rgb(38,38,38)",
    borderRadius: 3,
    background: "rgba(255,255,255,0.02)",
  } satisfies CSSProperties,
} as const;

/** Accent chip: same neutral chip with an accent-color text — replaces the
 *  old tinted-background colorful pill. The accent color is now text-only. */
export function getAccentChipStyle(accentColor: string): CSSProperties {
  return {
    ...NODE_CONTENT_STYLES.chip,
    color: withAlpha(accentColor, 0.9),
    borderColor: withAlpha(accentColor, 0.22),
    background: withAlpha(accentColor, 0.055),
  };
}

export function getRouteIndexStyle(accentColor: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
    borderRadius: 999,
    background: withAlpha(accentColor, 0.1),
    color: accentColor,
    fontFamily: "var(--font-mono)",
    fontSize: 8,
    fontWeight: 700,
    flexShrink: 0,
  };
}

export function getStatusDotStyle(
  accentColor: string,
  isLive: boolean
): CSSProperties {
  return {
    width: 5,
    height: 5,
    borderRadius: 999,
    background: accentColor,
    flexShrink: 0,
    boxShadow: isLive ? `0 0 0 3px ${withAlpha(accentColor, 0.15)}` : "none",
  };
}

// ─── BaseNode ────────────────────────────────────────────────────────────────

interface BaseNodeProps {
  id: string;
  kind: NodeKind;
  label: string;
  selected: boolean;
  /** Run-state border override. Overrides the selection border when set. */
  runBorderColor?: string;
  /** Whether to pulse the border (active/thinking). */
  runPulse?: boolean;
  children?: ReactNode;
  hideDefaultHandles?: boolean;
}

export const BaseNode = memo(function BaseNode({
  id,
  kind,
  label,
  selected,
  runBorderColor,
  runPulse = false,
  children,
  hideDefaultHandles = false,
}: BaseNodeProps) {
  const deleteNode = usePipelineStore((s) => s.deleteNode);
  const selectNode = usePipelineStore((s) => s.selectNode);
  const accentColor = NODE_COLORS[kind];

  // Border precedence: run state > selection > rest
  let borderColor: string;
  if (runBorderColor) {
    borderColor = runBorderColor;
  } else if (selected) {
    borderColor = "rgb(99,102,241)"; // indigo-500
  } else {
    borderColor = "rgb(38,38,38)";   // neutral-800
  }

  return (
    <div
      onClick={() => selectNode(id)}
      className={`group pipeline-node${selected ? " is-selected" : ""}${runPulse ? " run-pulse" : ""}`}
      data-kind={kind}
      style={
        {
          "--node-accent": accentColor,
          position: "relative",
          width: 214,
          maxWidth: 240,
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          background: "rgb(11,11,11)",
          color: "var(--text-primary)",
          cursor: "pointer",
          boxShadow: selected
            ? "0 0 0 2px rgba(99,102,241,0.14), 0 16px 40px rgba(0,0,0,0.4)"
            : "0 10px 28px rgba(0,0,0,0.28)",
          transition: "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
        } as CSSProperties
      }
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "0 12px auto",
          height: 2,
          borderRadius: "0 0 2px 2px",
          background: accentColor,
          opacity: selected ? 0.9 : 0.55,
        }}
      />
      {/* Node header */}
      <div
        className="pipeline-node__top"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 9px 9px 10px",
          borderBottom: children ? "1px solid rgb(23,23,23)" : "none",
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
          {/* Tiny kind dot — the other minimal accent cue */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 5,
              border: `1px solid ${withAlpha(accentColor, 0.22)}`,
              background: withAlpha(accentColor, 0.06),
              color: accentColor,
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {NODE_ICONS[kind]}
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: 600,
                color: "rgb(229,229,229)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {label}
            </div>
            <div
              style={{
                marginTop: 1,
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "rgb(82,82,82)",
              }}
            >
              {NODE_META[kind].kicker}
            </div>
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
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 4,
            background: "transparent",
            color: "rgb(115,115,115)",
            fontSize: 0,
            cursor: "pointer",
            border: "none",
            flexShrink: 0,
          }}
        >
          <X style={{ width: 12, height: 12 }} />
          ✕
        </button>
      </div>

      {children ? (
        <div
          className="pipeline-node__body"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "9px 10px 10px",
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
