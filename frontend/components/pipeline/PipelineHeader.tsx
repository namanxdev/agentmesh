"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePipelineStore } from "@/stores/pipelineStore";
import { useUIStore } from "@/stores/uiStore";

const buttonBase: React.CSSProperties = {
  borderRadius: 999,
  padding: "10px 16px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "var(--font-display)",
  transition: "transform 0.2s ease, opacity 0.2s ease",
};

type AppTab = "build" | "analytics";

interface PipelineHeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function PipelineHeader({ activeTab, onTabChange }: PipelineHeaderProps) {
  const {
    mode,
    setMode,
    pipelineName,
    setPipelineName,
    isValidating,
    isRunning,
    validationResult,
    validatePipeline,
    runPipeline,
  } = usePipelineStore();

  const savePipeline = usePipelineStore((s) => s.savePipeline);
  const isSaving = usePipelineStore((s) => s.isSaving);
  const togglePipelinesDrawer = usePipelineStore((s) => s.togglePipelinesDrawer);
  const currentPipelineId = usePipelineStore((s) => s.currentPipelineId);
  const listPipelines = usePipelineStore((s) => s.listPipelines);

  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [task, setTask] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleRunClick = async () => {
    setError(null);
    try {
      const result = await validatePipeline();
      if (!result.is_dag) {
        setError(result.errors[0] ?? "Pipeline is not a valid DAG");
        return;
      }
      setShowTaskInput(true);
    } catch {
      setError("Validation failed");
    }
  };

  const [noKeys, setNoKeys] = useState<string | null>(null);

  const handleGo = async () => {
    if (!task.trim()) return;
    setError(null);
    setNoKeys(null);
    try {
      await runPipeline(task.trim());
      setShowTaskInput(false);
      setTask("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Run failed";
      if (msg.toLowerCase().includes("no_keys") || msg.toLowerCase().includes("no api key") || msg.toLowerCase().includes("missing api key") || msg.toLowerCase().includes("missing_provider") || msg.toLowerCase().includes("needs a")) {
        setNoKeys(msg === "no_keys" ? "No API keys — Add in Settings →" : msg);
      } else {
        setError(msg);
      }
    }
  };

  const handleValidate = async () => {
    setError(null);
    try {
      await validatePipeline();
    } catch {
      setError("Validation failed");
    }
  };

  const connectionColor =
    connectionStatus === "connected"
      ? "var(--status-active)"
      : connectionStatus === "connecting"
        ? "var(--status-warning)"
        : "var(--status-error)";

  return (
    <div
      className="dashboard-panel"
      style={{
        gridArea: "header",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        padding: "14px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        <div className="dashboard-chip" style={{ padding: "0.85rem 0.95rem" }}>
          <span className="grid grid-cols-2 gap-[3px]">
            <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-primary)]" />
            <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-secondary)]" />
            <span className="h-[5px] w-[5px] rounded-full bg-[var(--text-primary)]" />
            <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-primary)]" />
          </span>
          <span>
            <span className="dashboard-kicker" style={{ display: "block" }}>
              Mission control
            </span>
            <span
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              AgentMesh
            </span>
          </span>
        </div>

        <div style={{ minWidth: 0 }}>
          <p className="dashboard-kicker" style={{ margin: 0 }}>
            Pipeline
          </p>
          <input
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            placeholder="Untitled pipeline"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              minWidth: 220,
              maxWidth: 360,
              padding: 0,
              fontFamily: "var(--font-display)",
            }}
          />
        </div>

        <span
          className="dashboard-chip text-[11px] uppercase tracking-[0.24em]"
          style={{
            color: mode === "build" ? "var(--accent-primary)" : "var(--accent-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: mode === "build" ? "var(--accent-primary)" : "var(--accent-secondary)" }}
          />
          {mode === "build" ? "Build mode" : "Run mode"}
        </span>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 999,
          background: "rgba(255,255,255,0.03)",
          padding: 3,
          gap: 2,
        }}
      >
        {(["build", "analytics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              borderRadius: 999,
              padding: "7px 16px",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              letterSpacing: "0.04em",
              textTransform: "capitalize",
              cursor: "pointer",
              border: "none",
              background:
                activeTab === tab ? "rgba(240,106,55,0.18)" : "transparent",
              color:
                activeTab === tab ? "var(--accent-primary)" : "var(--text-muted)",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {tab === "build" ? "Build" : "Analytics"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <Link
          href="/settings"
          title="Settings"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid var(--border-subtle)",
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: 15,
            transition: "border-color 0.2s, color 0.2s",
          }}
        >
          ⚙
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid var(--border-subtle)",
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 15,
            transition: "border-color 0.2s, color 0.2s",
          }}
        >
          ↪
        </button>

        <span
          className="dashboard-chip text-[11px] uppercase tracking-[0.24em]"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: connectionColor }} />
          {connectionStatus}
        </span>

        {noKeys ? (
          <Link
            href="/settings"
            className="dashboard-chip text-[11px] uppercase tracking-[0.22em]"
            style={{
              color: "var(--status-warning)",
              fontFamily: "var(--font-mono)",
              textDecoration: "none",
              border: "1px solid var(--status-warning)44",
              background: "var(--status-warning)0f",
              maxWidth: 420,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={noKeys}
          >
            {noKeys} →
          </Link>
        ) : null}

        {error && !noKeys ? (
          <span
            className="dashboard-chip text-[11px] uppercase tracking-[0.22em]"
            style={{ color: "var(--status-error)", fontFamily: "var(--font-mono)" }}
          >
            {error}
          </span>
        ) : null}

        {validationResult && !error ? (
          <span
            className="dashboard-chip text-[11px] uppercase tracking-[0.22em]"
            style={{
              color: validationResult.is_dag ? "var(--accent-secondary)" : "var(--status-error)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {validationResult.is_dag
              ? `OK DAG | ${validationResult.num_nodes}N ${validationResult.num_edges}E`
              : `Invalid | ${validationResult.errors[0] ?? "Check graph"}`}
          </span>
        ) : null}

        {showTaskInput ? (
          <div className="dashboard-chip" style={{ padding: "0.4rem 0.45rem 0.4rem 0.9rem" }}>
            <input
              autoFocus
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGo()}
              placeholder="Enter initial task..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: 13,
                minWidth: 220,
                fontFamily: "var(--font-body)",
              }}
            />
            <button
              onClick={handleGo}
              disabled={!task.trim() || isRunning}
              style={{
                ...buttonBase,
                background: "var(--accent-primary)",
                color: "#120f0d",
                border: "none",
                opacity: !task.trim() || isRunning ? 0.55 : 1,
              }}
            >
              Go
            </button>
            <button
              onClick={() => setShowTaskInput(false)}
              style={{
                ...buttonBase,
                background: "rgba(255,255,255,0.05)",
                color: "var(--text-secondary)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {mode === "run" ? (
              <button
                onClick={() => {
                  setMode("build");
                  setError(null);
                }}
                style={{
                  ...buttonBase,
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--text-secondary)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Back to build
              </button>
            ) : null}

            <button
              onClick={savePipeline}
              disabled={isSaving || mode === "run"}
              style={{
                ...buttonBase,
                background: "rgba(255,255,255,0.05)",
                color: "var(--text-secondary)",
                border: "1px solid rgba(255,255,255,0.08)",
                opacity: isSaving || mode === "run" ? 0.55 : 1,
              }}
            >
              {isSaving ? "Saving\u2026" : currentPipelineId ? "Saved \u2713" : "Save"}
            </button>

            <button
              onClick={() => { listPipelines(); togglePipelinesDrawer(); }}
              style={{
                ...buttonBase,
                background: "rgba(255,255,255,0.05)",
                color: "var(--text-secondary)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              My Pipelines
            </button>

            {mode === "build" ? (
              <button
                onClick={handleValidate}
                disabled={isValidating}
                style={{
                  ...buttonBase,
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--text-secondary)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  opacity: isValidating ? 0.55 : 1,
                }}
              >
                {isValidating ? "Checking..." : "Validate"}
              </button>
            ) : null}

            {mode === "build" ? (
              <button
                onClick={handleRunClick}
                disabled={isValidating || isRunning}
                style={{
                  ...buttonBase,
                  background: "var(--accent-primary)",
                  color: "#120f0d",
                  border: "none",
                  opacity: isValidating || isRunning ? 0.55 : 1,
                }}
              >
                {isRunning ? "Running..." : "Run pipeline"}
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
