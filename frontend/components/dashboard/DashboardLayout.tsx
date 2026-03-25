"use client";
import { useAgentMeshEvents } from "@/hooks/useAgentMeshEvents";
import { DashboardHeader } from "./DashboardHeader";
import { AgentSidebar } from "./AgentSidebar";
import { AgentGraph } from "./AgentGraph";
import { ToolCallInspector } from "./ToolCallInspector";
import { MessageStream } from "./MessageStream";

interface DashboardLayoutProps {
  agentNames: string[];
  edges: Array<{ from: string; to: string }>;
}

export function DashboardLayout({ agentNames, edges }: DashboardLayoutProps) {
  // Start WebSocket and pipe events into store
  useAgentMeshEvents(true);

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
      <DashboardHeader />
      <AgentSidebar agentNames={agentNames} />
      <AgentGraph agentNames={agentNames} edges={edges} />
      <ToolCallInspector />
      <MessageStream />
    </div>
  );
}
