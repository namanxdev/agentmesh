import { type Node, type Edge } from "@xyflow/react";
import type { AgentStatus } from "./agents";

export type NodeKind =
  | "input"
  | "output"
  | "llm_agent"
  | "tool"
  | "text"
  | "router"
  | "memory"
  | "transform"
  | "parallel";

export type DashboardMode = "build" | "run";

// Per-kind config shapes
export type InputNodeConfig = { name: string; description: string };
export type OutputNodeConfig = { output_format: "text" | "json" | "markdown" };
export type LLMAgentConfig = {
  name: string;
  system_prompt: string;
  model: string;
  temperature: number;
};
export type ToolNodeConfig = { tool_name: string; server: string; parameters: string };
export type TextNodeConfig = { content: string; variables?: string[] };
export type RouterNodeConfig = {
  routing_key: string;
  conditions: Array<{ key: string; target: string }>;
};
export type MemoryNodeConfig = { memory_type: "context" | "vector"; key: string };
export type TransformNodeConfig = {
  transform_type: "json_parse" | "extract" | "format";
  expression: string;
};
export type ParallelNodeConfig = Record<string, never>;

export type NodeConfig =
  | InputNodeConfig
  | OutputNodeConfig
  | LLMAgentConfig
  | ToolNodeConfig
  | TextNodeConfig
  | RouterNodeConfig
  | MemoryNodeConfig
  | TransformNodeConfig
  | ParallelNodeConfig;

export interface PipelineNodeData extends Record<string, unknown> {
  kind: NodeKind;
  label: string;
  config: NodeConfig;
  status?: AgentStatus;
}

export type PipelineNode = Node<PipelineNodeData>;
export type PipelineEdge = Edge;

export interface PipelineNodeDefinition {
  id: string;
  kind: NodeKind;
  config: NodeConfig;
  position: { x: number; y: number };
}

export interface PipelineDefinition {
  name: string;
  nodes: PipelineNodeDefinition[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
}

export interface ValidateResponse {
  num_nodes: number;
  num_edges: number;
  is_dag: boolean;
  errors: string[];
}

export interface RunResponse {
  workflow_id: string;
  status: string;
  agents: string[];
  started_at: number;
  websocket_url: string;
}
