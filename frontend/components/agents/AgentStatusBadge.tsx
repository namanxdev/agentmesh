import type { AgentStatus } from "@/types/events";

const COLORS: Record<AgentStatus, string> = {
  idle:      "var(--status-idle)",
  active:    "var(--status-active)",
  thinking:  "var(--status-thinking)",
  completed: "var(--accent-primary)",
  error:     "var(--status-error)",
};

const LABELS: Record<AgentStatus, string> = {
  idle: "Idle", active: "Active", thinking: "Thinking", completed: "Done", error: "Error",
};

const PULSING = new Set<AgentStatus>(["active", "thinking", "error"]);

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const color = COLORS[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: "var(--radius-full)",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          animation: PULSING.has(status) ? "pulse 2s infinite" : "none",
        }}
      />
      {LABELS[status]}
    </span>
  );
}
