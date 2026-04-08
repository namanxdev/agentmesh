"use client";

import { useEffect, useState } from "react";
import { usePipelineStore } from "@/stores/pipelineStore";

interface PipelineRun {
  id: string;
  workflow_id: string;
  status: "running" | "completed" | "error";
  total_tokens: number | null;
  duration_seconds: number | null;
  created_at: string;
}

const cardStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  padding: "20px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const statusColors: Record<string, string> = {
  completed: "var(--status-active)",
  running: "var(--status-warning)",
  error: "var(--status-error)",
};

export function AnalyticsView() {
  const currentPipelineId = usePipelineStore((s) => s.currentPipelineId);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentPipelineId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/pipelines/${currentPipelineId}/runs`)
      .then((r) => r.json())
      .then((d) => setRuns(d.runs ?? []))
      .catch(() => setError("Failed to load run history"))
      .finally(() => setLoading(false));
  }, [currentPipelineId]);

  const completed = runs.filter((r) => r.status === "completed");
  const avgDuration =
    completed.length > 0
      ? completed.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0) / completed.length
      : null;
  const avgTokens =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, r) => sum + (r.total_tokens ?? 0), 0) / completed.length
        )
      : null;

  return (
    <div
      style={{
        padding: "32px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <div>
        <p
          className="dashboard-kicker"
          style={{ margin: "0 0 8px", letterSpacing: "0.14em" }}
        >
          Pipeline analytics
        </p>
        <h1
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            margin: 0,
          }}
        >
          Run history
        </h1>
      </div>

      {!currentPipelineId ? (
        <div
          className="dashboard-panel"
          style={{
            padding: "48px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 36, opacity: 0.3 }}>◷</span>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Save your pipeline first to track run history
          </p>
        </div>
      ) : loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
          Loading…
        </p>
      ) : error ? (
        <p style={{ color: "var(--status-error)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
          {error}
        </p>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: "flex", gap: 14 }}>
            <div style={cardStyle}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                }}
              >
                Total runs
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 36,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {runs.length}
              </span>
            </div>
            <div style={cardStyle}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                }}
              >
                Completed
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 36,
                  fontWeight: 800,
                  color: "var(--status-active)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {completed.length}
              </span>
            </div>
            <div style={cardStyle}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                }}
              >
                Avg duration
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 36,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {avgDuration !== null ? `${avgDuration.toFixed(1)}s` : "—"}
              </span>
            </div>
            <div style={cardStyle}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                }}
              >
                Avg tokens
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 36,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {avgTokens !== null ? avgTokens.toLocaleString() : "—"}
              </span>
            </div>
          </div>

          {/* Run table */}
          {runs.length === 0 ? (
            <div
              className="dashboard-panel"
              style={{
                padding: "48px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 36, opacity: 0.3 }}>▷</span>
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
                No runs yet — run this pipeline to see history
              </p>
            </div>
          ) : (
            <div
              className="dashboard-panel"
              style={{ overflow: "hidden", flexShrink: 0 }}
            >
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 90px 90px 140px",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {["Workflow ID", "Status", "Duration", "Tokens", "Date"].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--text-muted)",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              <div style={{ overflowY: "auto", maxHeight: 360 }}>
                {runs.map((run) => (
                  <div
                    key={run.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 100px 90px 90px 140px",
                      gap: 12,
                      padding: "12px 20px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {run.workflow_id}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: statusColors[run.status] ?? "var(--text-muted)",
                        background: `${statusColors[run.status] ?? "transparent"}18`,
                        border: `1px solid ${statusColors[run.status] ?? "transparent"}44`,
                        borderRadius: 6,
                        padding: "2px 8px",
                        display: "inline-block",
                      }}
                    >
                      {run.status}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {run.duration_seconds != null
                        ? `${run.duration_seconds.toFixed(1)}s`
                        : "—"}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {run.total_tokens != null
                        ? run.total_tokens.toLocaleString()
                        : "—"}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {new Date(run.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
