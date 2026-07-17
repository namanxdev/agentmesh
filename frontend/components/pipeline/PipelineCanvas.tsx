"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Plus } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { AnimatedEdge } from "@/components/graph/AnimatedEdge";
import { useEventStore } from "@/stores/eventStore";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { DashboardMode, PipelineEdge, PipelineNode } from "@/types/pipeline";
import { pipelineNodeTypes } from "./nodes";

const edgeTypes = { pipeline: AnimatedEdge };
const SNAP_SIZE = 8;

const REACT_FLOW_NODE_WRAPPER_STYLE: CSSProperties = {
  background: "transparent",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  overflow: "visible",
  padding: 0,
};

interface PipelineCanvasProps {
  mode: DashboardMode;
}

function getRuntimeAgentName(node: PipelineNode | undefined) {
  if (!node || node.data.kind !== "llm_agent") return undefined;
  const configuredName = (node.data.config as { name?: string }).name?.trim();
  return configuredName || node.data.label;
}

export function PipelineCanvas({ mode }: PipelineCanvasProps) {
  const nodes = usePipelineStore((state) => state.nodes);
  const edges = usePipelineStore((state) => state.edges);
  const selectedNodeId = usePipelineStore((state) => state.selectedNodeId);
  const onNodesChange = usePipelineStore((state) => state.onNodesChange);
  const onEdgesChange = usePipelineStore((state) => state.onEdgesChange);
  const onConnect = usePipelineStore((state) => state.onConnect);
  const addNode = usePipelineStore((state) => state.addNode);
  const selectNode = usePipelineStore((state) => state.selectNode);
  const agentStates = useEventStore((state) => state.agentStates);
  const reactFlowInstance = useRef<ReactFlowInstance<PipelineNode, PipelineEdge> | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const isEditable = mode === "build";

  const displayNodes = useMemo<PipelineNode[]>(
    () => nodes.map((node) => {
      const runtimeName = mode === "run" ? getRuntimeAgentName(node) : undefined;
      const agentState = runtimeName ? agentStates[runtimeName] : undefined;

      return {
        ...node,
        data: agentState ? { ...node.data, status: agentState.status } : node.data,
        style: { ...REACT_FLOW_NODE_WRAPPER_STYLE, ...node.style },
      };
    }),
    [agentStates, mode, nodes]
  );

  const displayEdges = useMemo<PipelineEdge[]>(() => {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));

    return edges.map((edge) => {
      const sourceNode = nodeById.get(edge.source);
      const runtimeName = mode === "run" ? getRuntimeAgentName(sourceNode) : undefined;
      const sourceState = runtimeName ? agentStates[runtimeName] : undefined;
      const isActive = sourceState?.status === "active" || sourceState?.status === "thinking";

      return {
        ...edge,
        type: "pipeline",
        animated: isActive,
        data: { ...(edge.data ?? {}), active: isActive },
      };
    });
  }, [agentStates, edges, mode, nodes]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);

      const kind = event.dataTransfer.getData("application/pipeline-node-kind");
      if (!kind || !reactFlowInstance.current) return;

      const rawPosition = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const position = {
        x: Math.round(rawPosition.x / SNAP_SIZE) * SNAP_SIZE,
        y: Math.round(rawPosition.y / SNAP_SIZE) * SNAP_SIZE,
      };

      addNode(kind as Parameters<typeof addNode>[0], position);
    },
    [addNode]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) setIsDragOver(false);
  }, []);

  return (
    <div
      className={`pipeline-canvas${isDragOver ? " is-drag-over" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isEditable ? (
        <div className="pipeline-canvas__dropzone" aria-hidden={!isDragOver}>
          <div className="rounded-lg border border-indigo-500 bg-neutral-900 px-4 py-3 shadow-sm">
            <div className="text-xs font-semibold text-neutral-100">Drop to add this component</div>
            <div className="mt-1 text-[11px] text-neutral-500">It will snap to the nearest 8px grid point.</div>
          </div>
        </div>
      ) : null}

      {isEditable && nodes.length === 0 && !isDragOver ? (
        <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center p-8">
          <div className="pointer-events-auto w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-5 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-indigo-400">
              <Plus className="h-4 w-4" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-neutral-100">Start this pipeline</h2>
            <p className="mt-1.5 text-xs leading-5 text-neutral-500">
              Add an input node, then connect the agents, tools, and output this workflow needs.
            </p>
            <button
              type="button"
              onClick={() => addNode("input", { x: 120, y: 176 })}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-indigo-500 px-3 text-xs font-semibold text-white transition-colors duration-150 ease-out hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
            >
              <Plus className="h-3.5 w-3.5" />
              Add input node
            </button>
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
        fitViewOptions={{ padding: 0.18 }}
        snapToGrid
        snapGrid={[SNAP_SIZE, SNAP_SIZE]}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        connectionLineStyle={{ stroke: "var(--ui-accent)", strokeWidth: 1.5 }}
        defaultEdgeOptions={{ type: "pipeline", animated: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(38, 38, 38, 0.4)"
        />
        <Controls className="pipeline-flow-controls" />
        {nodes.length > 0 ? (
          <MiniMap
            className="pipeline-minimap"
            maskColor="rgba(10, 10, 10, 0.72)"
            nodeColor={(node) => {
              const data = node.data as PipelineNode["data"] | undefined;
              if (data?.status === "error") return "#ef4444";
              if (data?.status === "active" || data?.status === "thinking") return "#10b981";
              if (node.id === selectedNodeId || node.selected) return "#6366f1";
              return "#404040";
            }}
          />
        ) : null}
      </ReactFlow>
    </div>
  );
}
