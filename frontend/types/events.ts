export type AgentStatus = "idle" | "active" | "thinking" | "completed" | "error";

export interface BaseEvent {
  id: string;
  type: string;
  timestamp: number;
  workflow_id: string;
}

export interface WorkflowStartedEvent extends BaseEvent {
  type: "workflow.started";
  agents: string[];
  task: string;
}

export interface WorkflowCompletedEvent extends BaseEvent {
  type: "workflow.completed";
  result: Record<string, unknown>;
  totalTokens: number;
  duration: number;
}

export interface WorkflowErrorEvent extends BaseEvent {
  type: "workflow.error";
  error: string;
  failedAgent: string;
}

export interface AgentActivatedEvent extends BaseEvent {
  type: "agent.activated";
  agentName: string;
  role: string;
  taskDescription: string;
}

export interface AgentThinkingEvent extends BaseEvent {
  type: "agent.thinking";
  agentName: string;
  partialResponse: string;
}

export interface AgentCompletedEvent extends BaseEvent {
  type: "agent.completed";
  agentName: string;
  output: string;
  tokenUsage: { input: number; output: number };
}

export interface AgentHandoffEvent extends BaseEvent {
  type: "agent.handoff";
  from: string;
  to: string;
  reason: string;
}

export interface ToolCalledEvent extends BaseEvent {
  type: "tool.called";
  agentName: string;
  server: string;
  tool: string;
  args: Record<string, unknown>;
}

export interface ToolResultEvent extends BaseEvent {
  type: "tool.result";
  agentName: string;
  server: string;
  tool: string;
  result: Record<string, unknown>;
  duration_ms: number;
}

export interface ToolErrorEvent extends BaseEvent {
  type: "tool.error";
  agentName: string;
  server: string;
  tool: string;
  error: string;
}

export interface TokenUsageEvent extends BaseEvent {
  type: "token.usage";
  agentName: string;
  input: number;
  output: number;
  total: number;
}

export type AgentMeshEvent =
  | WorkflowStartedEvent
  | WorkflowCompletedEvent
  | WorkflowErrorEvent
  | AgentActivatedEvent
  | AgentThinkingEvent
  | AgentCompletedEvent
  | AgentHandoffEvent
  | ToolCalledEvent
  | ToolResultEvent
  | ToolErrorEvent
  | TokenUsageEvent;
