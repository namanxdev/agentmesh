import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as rfAddEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type XYPosition,
} from "@xyflow/react";
import {
  NodeKind,
  DashboardMode,
  PipelineNode,
  PipelineEdge,
  NodeConfig,
  ValidateResponse,
  PipelineDefinition,
  PipelineNodeDefinition,
} from "@/types/pipeline";
import { type AgentStatus } from "@/types/agents";

// Default configs per kind
const DEFAULT_CONFIGS: Record<NodeKind, NodeConfig> = {
  input: { name: "Input", description: "" },
  output: { output_format: "text" },
  llm_agent: { name: "Agent", system_prompt: "", model: "gemini-2.0-flash", temperature: 0.7 },
  tool: { tool_name: "", server: "", parameters: "{}" },
  text: { content: "", variables: [] },
  router: { routing_key: "route", conditions: [] },
  memory: { memory_type: "context", key: "memory" },
  transform: { transform_type: "json_parse", expression: "" },
  parallel: {},
};

const DEFAULT_LABELS: Record<NodeKind, string> = {
  input: "Input",
  output: "Output",
  llm_agent: "LLM Agent",
  tool: "Tool",
  text: "Text",
  router: "Router",
  memory: "Memory",
  transform: "Transform",
  parallel: "Parallel",
};

type LoadablePipelineNode =
  | PipelineNode
  | PipelineNodeDefinition
  | ({ id: string; type?: string; data?: Partial<PipelineNode["data"]>; position?: XYPosition });

type LoadablePipelineEdge =
  | PipelineEdge
  | PipelineDefinition["edges"][number]
  | {
      id: string;
      source: string;
      target: string;
      source_handle?: string;
      target_handle?: string;
    };

const FALLBACK_POSITION: XYPosition = { x: 0, y: 0 };

function isNodeKind(kind: unknown): kind is NodeKind {
  return typeof kind === "string" && kind in DEFAULT_LABELS;
}

function getNodeLabel(kind: NodeKind, config: Partial<NodeConfig> | undefined, fallback?: unknown) {
  if (typeof fallback === "string" && fallback.trim()) {
    return fallback;
  }

  const name = config && "name" in config ? config.name : undefined;
  return typeof name === "string" && name.trim() ? name : DEFAULT_LABELS[kind];
}

function normalizePipelineNode(node: LoadablePipelineNode): PipelineNode | null {
  const reactFlowData = "data" in node ? node.data : undefined;
  const reactFlowKind = reactFlowData?.kind;
  const definitionKind = "kind" in node ? node.kind : undefined;
  const fallbackKind = "type" in node && isNodeKind(node.type) ? node.type : undefined;
  const kind = [reactFlowKind, definitionKind, fallbackKind].find(isNodeKind);

  if (!kind) {
    return null;
  }

  const configSource =
    reactFlowData?.config ??
    ("config" in node ? node.config : undefined) ??
    {};
  const config = { ...DEFAULT_CONFIGS[kind], ...configSource } as NodeConfig;

  return {
    id: node.id,
    type: kind,
    position: node.position ?? FALLBACK_POSITION,
    data: {
      ...reactFlowData,
      kind,
      config,
      label: getNodeLabel(kind, config, reactFlowData?.label),
    },
  };
}

function normalizePipelineNodes(nodes: LoadablePipelineNode[]): PipelineNode[] {
  return nodes
    .map(normalizePipelineNode)
    .filter((node): node is PipelineNode => node !== null);
}

function normalizePipelineEdges(edges: LoadablePipelineEdge[]): PipelineEdge[] {
  return edges.map((edge) => {
    const sourceHandle = "sourceHandle" in edge
      ? edge.sourceHandle
      : "source_handle" in edge
        ? edge.source_handle
        : undefined;
    const targetHandle = "targetHandle" in edge
      ? edge.targetHandle
      : "target_handle" in edge
        ? edge.target_handle
        : undefined;

    return {
      ...edge,
      sourceHandle,
      targetHandle,
    };
  });
}

interface PipelineStore {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  mode: DashboardMode;
  pipelineName: string;
  selectedNodeId: string | null;
  isValidating: boolean;
  validationResult: ValidateResponse | null;
  isRunning: boolean;
  currentPipelineId: string | null;
  savedPipelines: Array<{ id: string; name: string; updated_at: string }>;
  isSaving: boolean;
  showPipelinesDrawer: boolean;

  setMode: (mode: DashboardMode) => void;
  setPipelineName: (name: string) => void;
  onNodesChange: (changes: NodeChange<PipelineNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (kind: NodeKind, position: XYPosition) => void;
  updateNodeConfig: (nodeId: string, patch: Partial<NodeConfig>) => void;
  updateNodeStatus: (nodeId: string, status: AgentStatus) => void;
  selectNode: (id: string | null) => void;
  deleteNode: (id: string) => void;
  serializePipeline: () => PipelineDefinition;
  validatePipeline: () => Promise<ValidateResponse>;
  runPipeline: (task: string) => Promise<void>;
  reset: () => void;
  savePipeline: () => Promise<void>;
  loadPipeline: (id: string) => Promise<void>;
  listPipelines: () => Promise<void>;
  deleteSavedPipeline: (id: string) => Promise<void>;
  loadTemplate: (def: PipelineDefinition) => void;
  togglePipelinesDrawer: () => void;
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  nodes: [],
  edges: [],
  mode: "build",
  pipelineName: "My Pipeline",
  selectedNodeId: null,
  isValidating: false,
  validationResult: null,
  isRunning: false,
  currentPipelineId: null,
  savedPipelines: [],
  isSaving: false,
  showPipelinesDrawer: false,

  setMode: (mode) => set({ mode }),
  setPipelineName: (name) => set({ pipelineName: name }),

  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  onConnect: (connection) =>
    set((state) => ({
      edges: rfAddEdge(
        { ...connection, id: `e-${connection.source}-${connection.target}-${Date.now()}` },
        state.edges
      ),
    })),

  addNode: (kind, position) => {
    const id = crypto.randomUUID();
    const newNode: PipelineNode = {
      id,
      type: kind,
      position,
      data: {
        kind,
        label: DEFAULT_LABELS[kind],
        config: { ...DEFAULT_CONFIGS[kind] },
      },
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },

  updateNodeConfig: (nodeId, patch) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...patch } as NodeConfig } }
          : n
      ),
    }));
  },

  updateNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status } } : n
      ),
    }));
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  serializePipeline: () => {
    const { nodes, edges, pipelineName } = get();
    const normalizedNodes = normalizePipelineNodes(nodes);
    const normalizedEdges = normalizePipelineEdges(edges);

    return {
      name: pipelineName,
      nodes: normalizedNodes.map((n) => ({
        id: n.id,
        kind: n.data.kind,
        config: n.data.config,
        position: n.position,
      })),
      edges: normalizedEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
      })),
    };
  },

  validatePipeline: async () => {
    set({ isValidating: true });
    const definition = get().serializePipeline();
    const res = await fetch("/api/pipelines/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(definition),
    });
    if (!res.ok) {
      set({ isValidating: false });
      throw new Error(`Validation failed: ${res.statusText}`);
    }
    const result: ValidateResponse = await res.json();
    set({ validationResult: result, isValidating: false });
    return result;
  },

  runPipeline: async (task) => {
    const { serializePipeline } = get();
    set({ isRunning: true });
    const definition = serializePipeline();
    const res = await fetch("/api/pipelines/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline: definition, task, initial_state: {} }),
    });
    if (!res.ok) {
      set({ isRunning: false });
      let errorMsg = `Run failed: ${res.statusText}`;
      try {
        const body = await res.json();
        const detail = body?.detail;
        if (detail?.error === "no_keys") {
          errorMsg = "no_keys";
        } else if (typeof detail === "string") {
          errorMsg = detail;
        } else if (detail?.message) {
          errorMsg = detail.message;
        }
      } catch { /* use default */ }
      throw new Error(errorMsg);
    }
    set({ mode: "run", isRunning: false });
  },

  reset: () =>
    set({
      nodes: [],
      edges: [],
      mode: "build",
      pipelineName: "My Pipeline",
      selectedNodeId: null,
      isValidating: false,
      validationResult: null,
      isRunning: false,
    }),

  togglePipelinesDrawer: () => set((s) => ({ showPipelinesDrawer: !s.showPipelinesDrawer })),

  loadTemplate: (def) =>
    set({
      nodes: normalizePipelineNodes(def.nodes ?? []),
      edges: normalizePipelineEdges(def.edges ?? []),
      pipelineName: def.name,
      currentPipelineId: null,
      mode: "build",
    }),

  savePipeline: async () => {
    const state = get();
    set({ isSaving: true });
    try {
      const pipeline = state.serializePipeline();
      const body = {
        pipeline_id: state.currentPipelineId,
        name: state.pipelineName,
        definition: pipeline,
      };
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      set({ currentPipelineId: data.id, isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },

  listPipelines: async () => {
    try {
      const res = await fetch("/api/pipelines");
      if (!res.ok) return;
      const data = await res.json();
      set({ savedPipelines: data.pipelines ?? [] });
    } catch {}
  },

  loadPipeline: async (id: string) => {
    try {
      const res = await fetch(`/api/pipelines/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const def = data.definition;
      set({
        nodes: normalizePipelineNodes(def.nodes ?? []),
        edges: normalizePipelineEdges(def.edges ?? []),
        pipelineName: data.name ?? def.name ?? "Pipeline",
        currentPipelineId: id,
        showPipelinesDrawer: false,
        mode: "build",
      });
    } catch {}
  },

  deleteSavedPipeline: async (id: string) => {
    try {
      await fetch(`/api/pipelines/${id}`, { method: "DELETE" });
      set((s) => ({ savedPipelines: s.savedPipelines.filter((p) => p.id !== id) }));
    } catch {}
  },
}));
