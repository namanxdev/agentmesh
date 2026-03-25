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
      style={{
        gridArea: "agents",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Agents ({agentNames.length})
        </h2>
      </div>

      {/* Agent list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {agentNames.map((name, i) => (
          <AgentCard key={name} name={name} index={i} />
        ))}
      </div>

      {/* Token total footer */}
      {totalTokens > 0 && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "var(--text-tertiary)",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Total Tokens
          </span>
          <span
            style={{
              color: "var(--accent-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 600,
            }}
            role="status"
            aria-live="polite"
            aria-label={`Total tokens: ${totalTokens.toLocaleString()}`}
          >
            {totalTokens.toLocaleString()}
          </span>
        </div>
      )}
    </aside>
  );
}
