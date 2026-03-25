export type WorkflowStatus = "idle" | "running" | "completed" | "error";

export interface WorkflowDefinition {
  name: string;
  description: string;
  agents: string[];
  estimated_duration: string;
}

export interface WorkflowProgress {
  completed_agents: string[];
  active_agent: string | null;
  remaining_agents: string[];
}

export interface WorkflowRun {
  workflow_id: string;
  status: WorkflowStatus;
  workflow_name?: string;
  current_agent?: string;
  progress?: WorkflowProgress;
  token_usage?: Record<string, { input: number; output: number }>;
  elapsed_seconds?: number;
  result?: Record<string, unknown>;
  total_tokens?: number;
  duration_seconds?: number;
  completed_at?: string;
  started_at?: string;
}
