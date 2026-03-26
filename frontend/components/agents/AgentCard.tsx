"use client";

import { useEventStore } from "@/stores/eventStore";
import { useUIStore } from "@/stores/uiStore";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { getAgentColor } from "@/types/agents";

interface AgentCardProps {
  name: string;
  index: number;
}

export function AgentCard({ name, index }: AgentCardProps) {
  const state = useEventStore((s) => s.agentStates[name]);
  const selectedAgent = useUIStore((s) => s.selectedAgent);
  const selectAgent = useUIStore((s) => s.selectAgent);

  const status = state?.status ?? "idle";
  const isSelected = selectedAgent === name;
  const agentColor = getAgentColor(index);
  const tokens = state ? state.token_input + state.token_output : 0;

  return (
    <button
      onClick={() => selectAgent(isSelected ? null : name)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "14px",
        borderRadius: 20,
        border: isSelected ? `1px solid ${agentColor}` : "1px solid rgba(255,255,255,0.06)",
        background: isSelected
          ? `color-mix(in srgb, ${agentColor} 12%, rgba(255,255,255,0.02))`
          : "rgba(255,255,255,0.03)",
        cursor: "pointer",
        marginBottom: 8,
        transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease",
        display: "block",
        boxShadow: isSelected ? `0 16px 34px color-mix(in srgb, ${agentColor} 10%, transparent)` : "none",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: agentColor,
              flexShrink: 0,
              boxShadow: `0 0 18px color-mix(in srgb, ${agentColor} 60%, transparent)`,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                color: "var(--text-primary)",
                fontSize: 15,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {name}
            </span>
            <span className="dashboard-kicker" style={{ display: "block", marginTop: 4 }}>
              agent node
            </span>
          </div>
        </div>
        <AgentStatusBadge status={status} />
      </div>

      {state?.current_task ? (
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 12,
            marginTop: 10,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          {state.current_task}
        </p>
      ) : null}

      {tokens > 0 ? (
        <p
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            marginTop: 8,
            marginBottom: 0,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
          }}
        >
          {tokens.toLocaleString()} tokens
        </p>
      ) : null}
    </button>
  );
}
