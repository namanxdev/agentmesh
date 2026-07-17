"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Connection,
  type ReactFlowInstance,
} from "@xyflow/react";
import { ArrowRight, Plus } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { usePipelineStore } from "@/stores/pipelineStore";
import { useEventStore } from "@/stores/eventStore";
import { pipelineNodeTypes, NODE_COLORS } from "./nodes";
import { AnimatedEdge } from "@/components/graph/AnimatedEdge";
import type { DashboardMode, PipelineNode, PipelineEdge } from "@/types/pipeline";

const edgeTypes = { animated: AnimatedEdge };

interface PipelineCanvasProps {
  mode: DashboardMode;
}

const REACT_FLOW_NODE_WRAPPER_STYLE: CSSProperties = {
  background: "transparent",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  overflow: "visible",
  padding: 0,
};

export function PipelineCanvas({ mode }: PipelineCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
  } = usePipelineStore();

  const agentStates = useEventStore((s) => s.agentStates);
  const rfInstanceRef = useRef<ReactFlowInstance<PipelineNode, PipelineEdge> | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const displayNodes: PipelineNode[] = nodes.map((node): PipelineNode => {
    const normalizedNode =
      mode === "run" && node.data?.kind === "llm_agent"
        ? (() => {
            const agentState = node.data?.label ? agentStates[node.data.label] : undefined;
            if (!agentState) {
              return node;
            }

            return {
              ...node,
              data: { ...node.data, status: agentState.status },
            };
          })()
        : node;

    return {
      ...normalizedNode,
      style: {
        ...REACT_FLOW_NODE_WRAPPER_STYLE,
        ...normalizedNode.style,
      },
    };
  });

  const displayEdges =
    mode === "run"
      ? edges.map((e) => {
          const sourceNode = nodes.find((n) => n.id === e.source);
          if (!sourceNode?.data?.label) return e;
          const agentState = agentStates[sourceNode.data.label];
          const isActive =
            agentState?.status === "active" ||
            agentState?.status === "thinking";
          return { ...e, type: "animated", data: { active: isActive } };
        })
      : edges;

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);

      const kind = event.dataTransfer.getData("application/pipeline-node-kind");
      if (!kind || !rfInstanceRef.current) return;

      const position = rfInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(kind as Parameters<typeof addNode>[0], position);
    },
    [addNode]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!isDragOver) {
        setIsDragOver(true);
      }
      event.dataTransfer.dropEffect = "copy";
    },
    [isDragOver]
  );

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    const nextTarget =
      event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsDragOver(false);
  }, []);

  const isEditable = mode === "build";

  return (
    <div
      className={`pipeline-canvas${isDragOver ? " is-drag-over" : ""}`}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 0,
        overflow: "hidden",
        padding: 0,
        position: "relative",
        background: "rgb(8, 8, 8)",
        boxShadow: isDragOver
          ? "0 0 0 1px rgba(99,102,241,0.3), inset 0 0 0 1px rgba(99,102,241,0.1)"
          : undefined,
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isEditable ? (
        <div
          className="pipeline-canvas__dropzone"
          style={{
            position: "absolute",
            inset: 16,
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 6,
            border: "1px dashed rgba(99,102,241,0.3)",
            borderRadius: 6,
            padding: "1.2rem 1.25rem",
            background: "rgba(10,10,10,0.4)",
            opacity: isDragOver ? 1 : 0,
            transform: isDragOver ? "scale(1)" : "scale(0.985)",
            pointerEvents: "none",
            transition:
              "opacity 180ms var(--ease-out), transform 180ms var(--ease-out), border-color 180ms var(--ease-out)",
          }}
        >
          <span
            className="pipeline-canvas__drop-kicker"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            Drop node
          </span>
          <div
            className="pipeline-canvas__drop-title"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.9rem",
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
              color: "var(--text-primary)",
            }}
          >
            Compose the next step
          </div>
          <p
            className="pipeline-canvas__drop-copy"
            style={{
              maxWidth: "20rem",
              margin: 0,
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              lineHeight: 1.5,
            }}
          >
            Release to place a workflow card on the build surface.
          </p>
        </div>
      ) : null}

      {isEditable && nodes.length === 0 && !isDragOver ? (
        <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center p-8">
          <div className="pointer-events-auto relative w-full max-w-[520px] overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/95 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm">
            <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent" />

            <div className="flex items-start justify-between gap-5 px-6 pb-5 pt-6">
              <div>
                <div className="mb-2 flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_0_3px_rgba(129,140,248,0.12)]" />
                  Empty graph
                </div>
                <h2 className="text-[20px] font-semibold tracking-[-0.035em] text-neutral-100">Compose your first run</h2>
                <p className="mt-1.5 max-w-[330px] text-[12px] leading-5 text-neutral-500">
                  Start with an input, add intelligence or tools, then route the result to an output.
                </p>
              </div>
              <div className="shrink-0 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 font-mono text-[9px] text-neutral-600">
                0 / 3 ready
              </div>
            </div>

            <div className="border-y border-neutral-800 bg-neutral-900/30 px-6 py-5">
              <div className="flex items-center">
                {[
                  { key: "01", code: "IN", label: "Input", copy: "Entry payload", color: "#4ADE80", kind: "input" as const },
                  { key: "02", code: "AI", label: "Agent / tool", copy: "Execution step", color: "#D7FF70", kind: null },
                  { key: "03", code: "OUT", label: "Output", copy: "Final result", color: "#F472B6", kind: null },
                ].map((step, index) => {
                  const content = (
                    <>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded border font-mono text-[8px] font-bold"
                          style={{ color: step.color, borderColor: `${step.color}38`, background: `${step.color}0d` }}
                        >
                          {step.code}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[10px] font-semibold text-neutral-300">{step.label}</span>
                          <span className="block truncate text-[9px] text-neutral-600">{step.copy}</span>
                        </span>
                      </div>
                      <span className="absolute right-2 top-1.5 font-mono text-[8px] text-neutral-700">{step.key}</span>
                    </>
                  );

                  return (
                    <div key={step.key} className="contents">
                      {step.kind ? (
                        <button
                          type="button"
                          onClick={() => addNode(step.kind, { x: 120, y: 180 })}
                          className="relative min-w-0 flex-1 rounded-lg border border-indigo-500/35 bg-indigo-500/[0.04] p-2.5 text-left transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/[0.08]"
                        >
                          {content}
                        </button>
                      ) : (
                        <div className="relative min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-950/70 p-2.5 opacity-60">
                          {content}
                        </div>
                      )}
                      {index < 2 ? (
                        <div className="flex w-8 shrink-0 items-center justify-center">
                          <div className="h-px w-full bg-neutral-800" />
                          <ArrowRight className="-ml-1 h-3 w-3 shrink-0 text-neutral-700" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <span className="font-mono text-[9px] leading-4 text-neutral-600">Click any component on the left<br />or drag it into position</span>
              <button
                type="button"
                onClick={() => addNode("input", { x: 120, y: 180 })}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-indigo-500 px-3.5 text-[11px] font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.18)] transition-colors hover:bg-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Place input node
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        nodeTypes={pipelineNodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={isEditable ? onNodesChange : undefined}
        onEdgesChange={isEditable ? onEdgesChange : undefined}
        onConnect={isEditable ? (onConnect as (connection: Connection) => void) : undefined}
        onNodeClick={(_, node) => isEditable && selectNode(node.id)}
        onPaneClick={() => isEditable && selectNode(null)}
        nodesDraggable={isEditable}
        nodesConnectable={isEditable}
        elementsSelectable={isEditable}
        deleteKeyCode={isEditable ? "Delete" : null}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        onInit={(instance) => {
          rfInstanceRef.current = instance;
        }}
        style={{ background: "transparent" }}
        connectionLineStyle={{ stroke: "var(--accent-primary)", strokeWidth: 1.5 }}
        defaultEdgeOptions={{ type: "animated", data: { active: false } }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={26}
          size={1.2}
          color="rgba(255, 255, 255, 0.12)"
        />
        <Controls
          style={{
            background: "rgb(10, 10, 10)",
            border: "1px solid rgb(38, 38, 38)",
            borderRadius: 8,
          }}
        />
        {nodes.length > 0 ? (
          <MiniMap
            style={{
              background: "rgb(10, 10, 10)",
              border: "1px solid rgb(38, 38, 38)",
            }}
            maskColor="var(--bg-primary)"
            nodeColor={(n) => {
              const data = n.data as PipelineNode["data"] | undefined;
              const kind = data?.kind;
              return kind ? NODE_COLORS[kind] : "#555";
            }}
          />
        ) : null}
      </ReactFlow>
    </div>
  );
}
