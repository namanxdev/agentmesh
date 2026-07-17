"use client";

import { memo, type CSSProperties, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { X } from "lucide-react";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { NodeKind } from "@/types/pipeline";

const STRUCTURAL_ACCENT = "#6366f1";

// Kept as a compatibility export for palette/inspector consumers. Node kind is
// communicated by label and icon; color is reserved for selection and state.
export const NODE_COLORS: Record<NodeKind, string> = {
  input: STRUCTURAL_ACCENT,
  output: STRUCTURAL_ACCENT,
  llm_agent: STRUCTURAL_ACCENT,
  tool: STRUCTURAL_ACCENT,
  text: STRUCTURAL_ACCENT,
  router: STRUCTURAL_ACCENT,
  memory: STRUCTURAL_ACCENT,
  transform: STRUCTURAL_ACCENT,
  parallel: STRUCTURAL_ACCENT,
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
  parallel: "PAR",
};

export const NODE_META: Record<NodeKind, { label: string; description: string }> = {
  input: { label: "Input", description: "Seed the workflow with an initial payload." },
  output: { label: "Output", description: "Collect the final response format." },
  llm_agent: { label: "Agent", description: "Run planning and synthesis." },
  tool: { label: "Tool", description: "Call an external tool or MCP server." },
  text: { label: "Text", description: "Compose prompt fragments." },
  router: { label: "Router", description: "Split execution based on rules." },
  memory: { label: "Memory", description: "Store or recall shared state." },
  transform: { label: "Transform", description: "Shape and normalize data." },
  parallel: { label: "Parallel", description: "Run branches simultaneously." },
};

export function getHandleStyle(extra?: CSSProperties): CSSProperties {
  return {
    width: 10,
    height: 10,
    border: "2px solid var(--ui-canvas)",
    borderRadius: "50%",
    background: "var(--ui-accent)",
    boxShadow: "none",
    top: 48,
    ...extra,
  };
}

export function getHandleLabelStyle(): CSSProperties {
  return {
    position: "absolute",
    top: -7,
    left: 14,
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid var(--ui-border-strong)",
    borderRadius: "var(--ui-radius-md)",
    background: "var(--ui-panel)",
    padding: "2px 5px",
    color: "var(--ui-text-secondary)",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };
}

export function getTextareaStyle(): CSSProperties {
  return {
    width: "100%",
    minHeight: 72,
    resize: "none",
    overflow: "hidden",
    border: "1px solid var(--ui-border-strong)",
    borderRadius: "var(--ui-radius-md)",
    background: "var(--ui-panel)",
    padding: "7px 8px",
    color: "var(--ui-text-secondary)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    lineHeight: 1.5,
    outline: "none",
    boxSizing: "border-box",
  };
}

export function NodeMetaRow({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-wrap gap-1.5">{children}</div>;
}

export function NodeBrief({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium text-neutral-500">{label}</div>
      <div className="mt-1 line-clamp-3 text-xs leading-[1.45] text-neutral-400">{children}</div>
    </div>
  );
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
  const deleteNode = usePipelineStore((state) => state.deleteNode);
  const selectNode = usePipelineStore((state) => state.selectNode);

  return (
    <div
      onClick={() => selectNode(id)}
      className={`pipeline-node group${selected ? " is-selected" : ""}`}
      data-kind={kind}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 px-1 font-mono text-[9px] font-semibold text-indigo-400">
          {NODE_ICONS[kind]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-neutral-100">{label}</div>
          <div className="mt-0.5 text-[10px] text-neutral-500">{NODE_META[kind].label}</div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            deleteNode(id);
          }}
          title="Delete node"
          aria-label={`Delete ${label}`}
          className="nodrag flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 opacity-0 transition-[background-color,color,opacity] duration-150 ease-out hover:bg-neutral-700 hover:text-red-400 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {children ? <div className="mt-2 flex flex-col gap-2">{children}</div> : null}

      {!hideDefaultHandles ? (
        <>
          <Handle
            type="target"
            position={Position.Left}
            className="pipeline-node__handle"
            style={getHandleStyle()}
          />
          <Handle
            type="source"
            position={Position.Right}
            className="pipeline-node__handle"
            style={getHandleStyle()}
          />
        </>
      ) : null}
    </div>
  );
});
