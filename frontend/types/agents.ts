export type AgentStatus = "idle" | "active" | "thinking" | "completed" | "error";

export interface TokenUsage {
  input: number;
  output: number;
}

export interface Agent {
  name: string;
  role: string;
  status: AgentStatus;
  model: string;
  mcp_servers: string[];
  available_tools: string[];
  current_task?: string;
  token_usage_total: TokenUsage;
}

export const AGENT_COLORS = [
  "hsl(185, 100%, 50%)",
  "hsl(270, 85%, 65%)",
  "hsl(142, 71%, 45%)",
  "hsl(330, 80%, 60%)",
  "hsl(38, 92%, 50%)",
  "hsl(200, 90%, 55%)",
  "hsl(15, 85%, 55%)",
  "hsl(160, 60%, 45%)",
] as const;

export function getAgentColor(index: number): string {
  return AGENT_COLORS[index % AGENT_COLORS.length];
}
