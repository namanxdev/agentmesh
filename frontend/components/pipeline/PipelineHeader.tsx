"use client";
import { useState } from "react";
import { usePipelineStore } from "@/stores/pipelineStore";
import { useUIStore } from "@/stores/uiStore";

export function PipelineHeader() {
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
    } catch (e) {
      setError("Validation failed");
    }
  };

  const handleGo = async () => {
    if (!task.trim()) return;
    setError(null);
    try {
      await runPipeline(task.trim());
      setShowTaskInput(false);
      setTask("");
    } catch (e: any) {
      setError(e?.message ?? "Run failed");
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

  return (
    <div
      style={{
        gridArea: "header",
        background: "var(--bg-secondary)",
        borderRadius: 8,
        border: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 16px",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "var(--accent-primary)22",
            border: "1px solid var(--accent-primary)44",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          ⬡
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          AgentMesh
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "var(--border-default)" }} />

      {/* Pipeline name */}
      <input
        value={pipelineName}
        onChange={(e) => setPipelineName(e.target.value)}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-primary)",
          fontSize: 13,
          fontWeight: 600,
          minWidth: 140,
          maxWidth: 220,
        }}
        onFocus={(e) => (e.target.style.borderBottom = "1px solid var(--accent-primary)")}
        onBlur={(e) => (e.target.style.borderBottom = "none")}
      />

      {/* Mode badge */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          padding: "2px 8px",
          borderRadius: 4,
          background: mode === "build" ? "var(--accent-primary)22" : "hsl(142,71%,45%)22",
          color: mode === "build" ? "var(--accent-primary)" : "hsl(142,71%,45%)",
          border: `1px solid ${mode === "build" ? "var(--accent-primary)44" : "hsl(142,71%,45%)44"}`,
          textTransform: "uppercase",
        }}
      >
        {mode}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Error badge */}
      {error && (
        <span style={{ fontSize: 11, color: "#ef4444", background: "#ef444422", border: "1px solid #ef444444", borderRadius: 4, padding: "3px 8px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {error}
        </span>
      )}

      {/* Validation result badge */}
      {validationResult && !error && (
        <span style={{ fontSize: 11, color: validationResult.is_dag ? "hsl(142,71%,45%)" : "#ef4444", background: validationResult.is_dag ? "hsl(142,71%,45%)22" : "#ef444422", border: `1px solid ${validationResult.is_dag ? "hsl(142,71%,45%)44" : "#ef444444"}`, borderRadius: 4, padding: "3px 8px" }}>
          {validationResult.is_dag ? `✓ Valid DAG · ${validationResult.num_nodes}N ${validationResult.num_edges}E` : `✗ ${validationResult.errors[0] ?? "Invalid"}`}
        </span>
      )}

      {/* Task input (shown after validate passes) */}
      {showTaskInput && (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            autoFocus
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            placeholder="Enter initial task…"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--accent-primary)", borderRadius: 6, color: "var(--text-primary)", fontSize: 12, padding: "5px 10px", outline: "none", width: 200 }}
          />
          <button
            onClick={handleGo}
            disabled={!task.trim() || isRunning}
            style={{ padding: "5px 14px", borderRadius: 6, background: "var(--accent-primary)", border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: isRunning ? 0.6 : 1 }}
          >
            Go
          </button>
          <button onClick={() => setShowTaskInput(false)} style={{ padding: "5px 10px", borderRadius: 6, background: "var(--bg-tertiary)", border: "1px solid var(--border-default)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      )}

      {/* Mode toggle + action buttons */}
      {!showTaskInput && (
        <div style={{ display: "flex", gap: 6 }}>
          {mode === "run" && (
            <button
              onClick={() => { setMode("build"); setError(null); }}
              style={{ padding: "5px 14px", borderRadius: 6, background: "var(--bg-tertiary)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              ← Build
            </button>
          )}
          {mode === "build" && (
            <button
              onClick={handleValidate}
              disabled={isValidating}
              style={{ padding: "5px 14px", borderRadius: 6, background: "var(--bg-tertiary)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: isValidating ? 0.6 : 1 }}
            >
              {isValidating ? "Checking…" : "Validate"}
            </button>
          )}
          {mode === "build" && (
            <button
              onClick={handleRunClick}
              disabled={isValidating || isRunning}
              style={{ padding: "5px 18px", borderRadius: 6, background: "var(--accent-primary)", border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: (isValidating || isRunning) ? 0.6 : 1 }}
            >
              {isRunning ? "Running…" : "▶ Run"}
            </button>
          )}
        </div>
      )}

      {/* WebSocket status dot */}
      <div
        title={connectionStatus}
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: connectionStatus === "connected" ? "hsl(142,71%,45%)" : connectionStatus === "connecting" ? "hsl(38,92%,50%)" : "#666",
          boxShadow: connectionStatus === "connected" ? "0 0 5px hsl(142,71%,45%)" : "none",
          flexShrink: 0,
        }}
      />
    </div>
  );
}
