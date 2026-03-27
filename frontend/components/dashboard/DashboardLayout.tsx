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
  const showPipelinesDrawer = usePipelineStore((s) => s.showPipelinesDrawer);
  const savedPipelines = usePipelineStore((s) => s.savedPipelines);
  const loadPipeline = usePipelineStore((s) => s.loadPipeline);
  const deleteSavedPipeline = usePipelineStore((s) => s.deleteSavedPipeline);
  const togglePipelinesDrawer = usePipelineStore((s) => s.togglePipelinesDrawer);

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

      {showPipelinesDrawer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
          }}
          onClick={togglePipelinesDrawer}
        >
          <div
            style={{
              width: 320,
              height: "100%",
              background: "var(--bg-secondary)",
              borderRight: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              padding: 20,
              gap: 12,
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.04em", margin: 0 }}>
              My Pipelines
            </h2>
            {savedPipelines.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>No saved pipelines yet</p>
            ) : (
              savedPipelines.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-tertiary)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{p.updated_at?.slice(0, 10)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => loadPipeline(p.id)}
                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", cursor: "pointer" }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteSavedPipeline(p.id)}
                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--status-error)", background: "transparent", color: "var(--status-error)", cursor: "pointer" }}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
