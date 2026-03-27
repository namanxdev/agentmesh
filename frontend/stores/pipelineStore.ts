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
};

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
  loadTemplate: (def: { name: string; nodes: PipelineNode[]; edges: PipelineEdge[] }) => void;
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
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...patch } } }
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
    return {
      name: pipelineName,
      nodes: nodes.map((n) => ({
        id: n.id,
        kind: n.data.kind,
        config: n.data.config,
        position: n.position,
      })),
      edges: edges.map((e) => ({
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
      nodes: def.nodes,
      edges: def.edges,
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
        nodes: def.nodes ?? [],
        edges: def.edges ?? [],
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
