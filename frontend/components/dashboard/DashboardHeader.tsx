"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useEventStore } from "@/stores/eventStore";
import { useUIStore } from "@/stores/uiStore";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

const WORKFLOW_STATUS_COLOR = {
  idle:      "var(--status-idle)",
  running:   "var(--status-active)",
  completed: "var(--accent-primary)",
  error:     "var(--status-error)",
};

export function DashboardHeader() {
  const workflowStatus = useEventStore((s) => s.workflowStatus);
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const activeWorkflowName = useUIStore((s) => s.activeWorkflowName);

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (workflowStatus !== "running") {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 1000);
    return () => clearInterval(id);
  }, [workflowStatus]);

  const wsColor =
    connectionStatus === "connected"
      ? "var(--status-active)"
      : connectionStatus === "reconnecting"
      ? "var(--status-warning)"
      : "var(--status-error)";

  const wsLabel =
    connectionStatus === "connected"
      ? "WS Connected"
      : connectionStatus === "reconnecting"
      ? "Reconnecting…"
      : connectionStatus === "connecting"
      ? "Connecting…"
      : "Disconnected";

  return (
    <header
      style={{
        gridArea: "header",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        flexShrink: 0,
      }}
    >
      {/* Left — logo + workflow name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/"
          style={{
            color: "var(--accent-primary)",
            textDecoration: "none",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "var(--accent-primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 900,
              color: "var(--bg-primary)",
            }}
          >
            A
          </span>
          AgentMesh
        </Link>
        {activeWorkflowName && (
          <>
            <span style={{ color: "var(--border-default)", fontSize: 18 }}>/</span>
            <span
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
              }}
            >
              {activeWorkflowName}
            </span>
          </>
        )}
      </div>

      {/* Center — workflow status + elapsed timer */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: WORKFLOW_STATUS_COLOR[workflowStatus],
              animation: workflowStatus === "running" ? "pulse 2s infinite" : "none",
              display: "inline-block",
            }}
          />
          <span
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {workflowStatus}
          </span>
        </div>
        {workflowStatus === "running" && (
          <span
            style={{
              color: "var(--accent-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              minWidth: 48,
            }}
          >
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      {/* Right — WebSocket indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: wsColor,
            display: "inline-block",
          }}
        />
        <span
          style={{
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        >
          {wsLabel}
        </span>
      </div>
    </header>
  );
}
