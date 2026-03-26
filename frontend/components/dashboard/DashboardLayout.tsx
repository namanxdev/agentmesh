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
  // Start WebSocket and pipe events into store
  useAgentMeshEvents(true);

  const mode = usePipelineStore((s) => s.mode);
  const nodes = usePipelineStore((s) => s.nodes);

  // Derive agent names from LLM agent nodes for sidebar in run mode
  const agentNames = nodes
    .filter((n) => n.data.kind === "llm_agent")
    .map((n) => (n.data.config as { name?: string }).name ?? n.data.label);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr 340px",
        gridTemplateRows: "64px 1fr 260px",
        gridTemplateAreas:
          '"header  header    header"' +
          '"agents  graph     inspector"' +
          '"agents  timeline  inspector"',
        gap: 10,
        height: "100vh",
        padding: 10,
        background: "var(--bg-primary)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <PipelineHeader />

      {/* Left panel: palette in build mode, agent list in run mode */}
      {mode === "build" ? (
        <NodePalette />
      ) : (
        <AgentSidebar agentNames={agentNames} />
      )}

      {/* Canvas: unified for both modes */}
      <div style={{ gridArea: "graph", minHeight: 0, minWidth: 0 }}>
        <PipelineCanvas mode={mode} />
      </div>

      {/* Right panel: config forms in build mode, tool inspector in run mode */}
      {mode === "build" ? <NodeConfigInspector /> : <ToolCallInspector />}

      <MessageStream />
    </div>
  );
}
