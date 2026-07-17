import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { AgentStatus } from "@/types/events";

const LABELS: Record<AgentStatus, string> = {
  idle: "Idle",
  active: "Active",
  thinking: "Thinking",
  completed: "Done",
  error: "Error",
};

const TONES: Record<AgentStatus, BadgeTone> = {
  idle: "neutral",
  active: "running",
  thinking: "pending",
  completed: "success",
  error: "error",
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const isLive = status === "active" || status === "thinking";
  return (
    <Badge tone={TONES[status]}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current${isLive ? " pipeline-live-dot" : ""}`} />
      {LABELS[status]}
    </Badge>
  );
}
