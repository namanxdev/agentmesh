"use client";
import { useEffect, useState } from "react";
import { useAgentMeshEvents } from "@/hooks/useAgentMeshEvents";
import { usePipelineStore } from "@/stores/pipelineStore";
import { AgentSidebar } from "./AgentSidebar";
import { ToolCallInspector } from "./ToolCallInspector";
import { MessageStream } from "./MessageStream";
import { AnalyticsView } from "./AnalyticsView";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { NodePalette } from "@/components/pipeline/NodePalette";
import { NodeConfigInspector } from "@/components/pipeline/NodeConfigInspector";

type AppTab = "build" | "analytics";

const chevronBtnStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: 10,
  background: "var(--bg-secondary)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  color: "var(--text-muted)",
  cursor: "pointer",
  width: 22,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  padding: 0,
  transition: "color 0.15s, border-color 0.15s",
};

export function DashboardLayout() {
  useAgentMeshEvents(true);

  const mode = usePipelineStore((s) => s.mode);
  const setMode = usePipelineStore((s) => s.setMode);
  const nodes = usePipelineStore((s) => s.nodes);
  const showPipelinesDrawer = usePipelineStore((s) => s.showPipelinesDrawer);
  const savedPipelines = usePipelineStore((s) => s.savedPipelines);
  const loadPipeline = usePipelineStore((s) => s.loadPipeline);
  const deleteSavedPipeline = usePipelineStore((s) => s.deleteSavedPipeline);
  const togglePipelinesDrawer = usePipelineStore((s) => s.togglePipelinesDrawer);

  // Tab + panel collapse state — ephemeral layout state, not persisted to store
  const [activeTab, setActiveTab] = useState<AppTab>("build");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);

  useEffect(() => {
    setMode("build");
  }, [setMode]);

  const agentNames = nodes
    .filter((n) => n.data?.kind === "llm_agent")
    .map((n) => (n.data?.config as { name?: string } | undefined)?.name ?? n.data?.label ?? n.id);

  // Grid template changes depending on active tab
  const isBuild = activeTab === "build";

  const colTemplate = isBuild
    ? `${leftCollapsed ? "44px" : "296px"} minmax(0, 1fr) ${rightCollapsed ? "44px" : "360px"}`
    : "minmax(0, 1fr)";

  const rowTemplate = isBuild
    ? `84px minmax(0, 1fr) ${bottomCollapsed ? "40px" : "280px"}`
    : "84px minmax(0, 1fr)";

  const gridAreas = isBuild
    ? '"header  header    header"' +
      '"agents  graph     inspector"' +
      '"agents  timeline  inspector"'
    : '"header"' +
      '"main"';

  return (
    <div
      className="dashboard-shell"
      style={{
        display: "grid",
        gridTemplateColumns: colTemplate,
        gridTemplateRows: rowTemplate,
        gridTemplateAreas: gridAreas,
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

      <PipelineHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {isBuild ? (
        <>
          {/* Left panel */}
          <div
            style={{
              gridArea: "agents",
              position: "relative",
              minHeight: 0,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {leftCollapsed ? (
              <div
                className="dashboard-panel"
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  paddingTop: 14,
                  gap: 10,
                  overflow: "hidden",
                }}
              >
                <button
                  className="panel-collapse-chevron"
                  onClick={() => setLeftCollapsed(false)}
                  title="Expand panel"
                >
                  ›
                </button>
                <span
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  {mode === "build" ? "Node palette" : "Agents"}
                </span>
              </div>
            ) : (
              <>
                {mode === "build" ? <NodePalette /> : <AgentSidebar agentNames={agentNames} />}
                <button
                  style={{
                    ...chevronBtnStyle,
                    top: "50%",
                    right: -1,
                    transform: "translateY(-50%)",
                    borderRadius: "0 8px 8px 0",
                  }}
                  onClick={() => setLeftCollapsed(true)}
                  title="Collapse panel"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-primary)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  ‹
                </button>
              </>
            )}
          </div>

          {/* Canvas */}
          <div style={{ gridArea: "graph", minHeight: 0, minWidth: 0 }}>
            <PipelineCanvas mode={mode} />
          </div>

          {/* Right panel */}
          <div
            style={{
              gridArea: "inspector",
              position: "relative",
              minHeight: 0,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {rightCollapsed ? (
              <div
                className="dashboard-panel"
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  paddingTop: 14,
                  gap: 10,
                  overflow: "hidden",
                }}
              >
                <button
                  className="panel-collapse-chevron"
                  onClick={() => setRightCollapsed(false)}
                  title="Expand panel"
                >
                  ‹
                </button>
                <span
                  style={{
                    writingMode: "vertical-rl",
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  {mode === "build" ? "Inspector" : "Tool calls"}
                </span>
              </div>
            ) : (
              <>
                {mode === "build" ? <NodeConfigInspector /> : <ToolCallInspector />}
                <button
                  style={{
                    ...chevronBtnStyle,
                    top: "50%",
                    left: -1,
                    transform: "translateY(-50%)",
                    borderRadius: "8px 0 0 8px",
                  }}
                  onClick={() => setRightCollapsed(true)}
                  title="Collapse panel"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-primary)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Bottom panel */}
          <div
            style={{
              gridArea: "timeline",
              position: "relative",
              minHeight: 0,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {bottomCollapsed ? (
              <div
                className="dashboard-panel"
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingLeft: 14,
                  gap: 10,
                  overflow: "hidden",
                }}
              >
                <button
                  className="panel-collapse-chevron"
                  onClick={() => setBottomCollapsed(false)}
                  title="Expand event stream"
                >
                  ↑
                </button>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--text-muted)",
                  }}
                >
                  Event stream
                </span>
              </div>
            ) : (
              <>
                <MessageStream />
                <button
                  style={{
                    ...chevronBtnStyle,
                    top: 10,
                    right: 10,
                    position: "absolute",
                    width: 28,
                    height: 22,
                    borderRadius: 6,
                    transform: "none",
                  }}
                  onClick={() => setBottomCollapsed(true)}
                  title="Collapse event stream"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-primary)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  ↓
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div style={{ gridArea: "main", minHeight: 0, overflow: "hidden" }}>
          <AnalyticsView />
        </div>
      )}

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
