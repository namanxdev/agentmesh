"use client";
import { useCallback, useRef } from "react";
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
import { pipelineNodeTypes } from "./nodes";
import { AnimatedEdge } from "@/components/graph/AnimatedEdge";
import type { DashboardMode, PipelineNode, PipelineEdge } from "@/types/pipeline";

const edgeTypes = { animated: AnimatedEdge };

interface PipelineCanvasProps {
  mode: DashboardMode;
}

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

  // In run mode, overlay live status onto LLM agent nodes
  const displayNodes =
    mode === "run"
      ? nodes.map((n) => {
          if (n.data.kind !== "llm_agent") return n;
          const agentState = agentStates[n.data.label];
          if (!agentState) return n;
          return {
            ...n,
            data: { ...n.data, status: agentState.status },
          };
        })
      : nodes;

  // In run mode, mark edges active when source agent is active/thinking
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

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const isEditable = mode === "build";

  return (
    <div
      className="dashboard-panel"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 24,
        overflow: "hidden",
        padding: 1,
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
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
        onInit={(instance) => { rfInstanceRef.current = instance; }}
        style={{ background: "var(--bg-primary)" }}
        connectionLineStyle={{ stroke: "var(--accent-primary)", strokeWidth: 1.5 }}
        defaultEdgeOptions={{ type: "animated", data: { active: false } }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--border-subtle)"
        />
        <Controls
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
          }}
        />
        <MiniMap
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
          }}
          maskColor="var(--bg-primary)"
          nodeColor={(n) => {
            const data = n.data as PipelineNode["data"] | undefined;
            const kind = data?.kind;
            return kind ? `var(--accent-primary)` : "#555";
          }}
        />
      </ReactFlow>
    </div>
  );
}
