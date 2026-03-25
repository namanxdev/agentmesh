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
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        border: isSelected ? `1px solid ${agentColor}` : "1px solid transparent",
        background: isSelected ? `color-mix(in srgb, ${agentColor} 10%, transparent)` : "transparent",
        cursor: "pointer",
        marginBottom: 4,
        transition: "all 0.2s ease",
        display: "block",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-tertiary)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: agentColor, flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: 13,
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>
        </div>
        <AgentStatusBadge status={status} />
      </div>

      {state?.current_task && (
        <p
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            marginTop: 4,
            marginBottom: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            paddingLeft: 16,
          }}
        >
          {state.current_task}
        </p>
      )}

      {tokens > 0 && (
        <p
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            marginTop: 2,
            marginBottom: 0,
            paddingLeft: 16,
          }}
        >
          {tokens.toLocaleString()} tokens
        </p>
      )}
    </button>
  );
}
