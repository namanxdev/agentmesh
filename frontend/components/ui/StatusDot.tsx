import type { AgentStatus } from "@/types/agents";

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle:      "var(--status-idle)",
  active:    "var(--status-active)",
  thinking:  "var(--status-thinking)",
  completed: "var(--accent-primary)",
  error:     "var(--status-error)",
};

const PULSING: Set<AgentStatus> = new Set(["active", "thinking", "error"]);

interface StatusDotProps {
  status: AgentStatus;
  size?: number;
}

export function StatusDot({ status, size = 8 }: StatusDotProps) {
  return (
    <span
      role="img"
      aria-label={status}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: STATUS_COLORS[status],
        animation: PULSING.has(status) ? "pulse 2s infinite" : "none",
        flexShrink: 0,
      }}
    />
  );
}
