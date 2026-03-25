"use client";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import { AgentFlowNode, type AgentNodeData, type AgentFlowNodeType } from "./AgentFlowNode";
import { AnimatedEdge } from "./AnimatedEdge";
import { useEventStore } from "@/stores/eventStore";
import { useUIStore } from "@/stores/uiStore";
import { getAgentColor } from "@/types/agents";

const nodeTypes = { agentNode: AgentFlowNode };
const edgeTypes = { animated: AnimatedEdge };

interface FlowCanvasProps {
  agentNames: string[];
  edges: Array<{ from: string; to: string }>;
}

export function FlowCanvas({ agentNames, edges }: FlowCanvasProps) {
  const agentStates = useEventStore((s) => s.agentStates);
  const selectedAgent = useUIStore((s) => s.selectedAgent);
  const selectAgent = useUIStore((s) => s.selectAgent);

  // Layout agents left-to-right with equal spacing
  const nodes: AgentFlowNodeType[] = useMemo(() => {
    const totalCols = Math.min(agentNames.length, 4);
    return agentNames.map((name, i) => ({
      id: name,
      type: "agentNode",
      position: {
        x: (i % totalCols) * 200,
        y: Math.floor(i / totalCols) * 130,
      },
      data: {
        label: name,
        role: "",
        status: agentStates[name]?.status ?? "idle",
        colorIndex: i,
      },
      selected: selectedAgent === name,
    }));
  }, [agentNames, agentStates, selectedAgent]);

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map(({ from, to }, i) => ({
        id: `${from}-${to}-${i}`,
        source: from,
        target: to,
        type: "animated",
        data: { active: agentStates[from]?.status === "active" },
      })),
    [edges, agentStates]
  );

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      selectAgent(node.id === selectedAgent ? null : node.id);
    },
    [selectedAgent, selectAgent]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "var(--bg-primary)" }}
      >
        <Background
          color="hsl(225, 12%, 20%)"
          gap={28}
          size={1}
          style={{ background: "var(--bg-primary)" }}
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
          nodeColor={(node) =>
            getAgentColor((node.data as AgentNodeData).colorIndex)
          }
        />
      </ReactFlow>
    </div>
  );
}
