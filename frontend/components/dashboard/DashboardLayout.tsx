"use client";
import { useAgentMeshEvents } from "@/hooks/useAgentMeshEvents";
import { usePipelineStore } from "@/stores/pipelineStore";
import { AgentSidebar } from "./AgentSidebar";
import { ToolCallInspector } from "./ToolCallInspector";
import { MessageStream } from "./MessageStream";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { NodePalette } from "@/components/pipeline/NodePalette";
import { NodeConfigInspector } from "@/components/pipeline/NodeConfigInspector";

export function DashboardLayout() {
  useAgentMeshEvents(true);

  const mode = usePipelineStore((s) => s.mode);
  const nodes = usePipelineStore((s) => s.nodes);

  // Derive agent names from LLM agent nodes for sidebar in run mode
  const agentNames = nodes
    .filter((n) => n.data.kind === "llm_agent")
    .map((n) => (n.data.config as { name?: string }).name ?? n.data.label);

  return (
    <div
      className="dashboard-shell"
      style={{
        display: "grid",
        gridTemplateColumns: "296px minmax(0, 1fr) 360px",
        gridTemplateRows: "84px minmax(0, 1fr) 280px",
        gridTemplateAreas:
          '"header  header    header"' +
          '"agents  graph     inspector"' +
          '"agents  timeline  inspector"',
        gap: 14,
        height: "100vh",
        padding: 14,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 18% 16%, rgba(240,106,55,0.12), transparent 20%), radial-gradient(circle at 82% 10%, rgba(215,255,112,0.08), transparent 16%)",
        }}
      />
      <PipelineHeader />

      {mode === "build" ? <NodePalette /> : <AgentSidebar agentNames={agentNames} />}

      <div style={{ gridArea: "graph", minHeight: 0, minWidth: 0 }}>
        <PipelineCanvas mode={mode} />
      </div>

      {mode === "build" ? <NodeConfigInspector /> : <ToolCallInspector />}

      <MessageStream />
    </div>
  );
}
