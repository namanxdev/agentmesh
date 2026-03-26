"use client";

import { useEventStore } from "@/stores/eventStore";
import { AgentCard } from "@/components/agents/AgentCard";

interface AgentSidebarProps {
  agentNames: string[];
}

export function AgentSidebar({ agentNames }: AgentSidebarProps) {
  const totalTokens = useEventStore((s) => s.totalTokens);

  return (
    <aside
      className="dashboard-panel"
      style={{
        gridArea: "agents",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <p className="dashboard-kicker" style={{ margin: 0 }}>
          Run participants
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 8 }}>
          <h2
            style={{
              color: "var(--text-primary)",
              fontSize: 22,
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              margin: 0,
            }}
          >
            Active agents
          </h2>
          <span
            className="dashboard-chip text-[11px] uppercase tracking-[0.22em]"
            style={{ color: "var(--accent-secondary)", fontFamily: "var(--font-mono)" }}
          >
            {agentNames.length} loaded
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        {agentNames.map((name, index) => (
          <AgentCard key={name} name={name} index={index} />
        ))}
      </div>

      {totalTokens > 0 ? (
        <div
          style={{
            padding: "14px 20px 18px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span className="dashboard-kicker">Token total</span>
          <span
            style={{
              color: "var(--accent-primary)",
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
            role="status"
            aria-live="polite"
            aria-label={`Total tokens: ${totalTokens.toLocaleString()}`}
          >
            {totalTokens.toLocaleString()}
          </span>
        </div>
      ) : null}
    </aside>
  );
}
