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
      mode === "run" && node.data.kind === "llm_agent"
        ? (() => {
            const agentState = agentStates[node.data.label];
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
          if (!sourceNode) return e;
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
      className={`dashboard-panel pipeline-canvas${isDragOver ? " is-drag-over" : ""}`}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 24,
        overflow: "hidden",
        padding: 1,
        position: "relative",
        background:
          "radial-gradient(circle at 16% 14%, rgba(240,106,55,0.09), transparent 22%), radial-gradient(circle at 82% 12%, rgba(215,255,112,0.06), transparent 18%), linear-gradient(180deg, rgba(24, 19, 16, 0.96), rgba(15, 12, 10, 0.98))",
        boxShadow: isDragOver
          ? "0 0 0 1px rgba(240,106,55,0.4), 0 34px 90px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(240,106,55,0.18)"
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
            inset: 22,
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 6,
            border: "1px dashed rgba(255,255,255,0.1)",
            borderRadius: 22,
            padding: "1.2rem 1.25rem",
            background:
              "linear-gradient(180deg, rgba(240,106,55,0.02), rgba(240,106,55,0.08)), rgba(17,14,12,0.3)",
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
            background: "rgba(24, 19, 16, 0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
          }}
        />
        <MiniMap
          style={{
            background: "rgba(24, 19, 16, 0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          maskColor="var(--bg-primary)"
          nodeColor={(n) => {
            const data = n.data as PipelineNode["data"] | undefined;
            const kind = data?.kind;
            return kind ? NODE_COLORS[kind] : "#555";
          }}
        />
      </ReactFlow>
    </div>
  );
}
