"use client";

import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import { usePipelineStore } from "@/stores/pipelineStore";
import { NODE_ICONS } from "./nodes/BaseNode";
import type {
  InputNodeConfig,
  LLMAgentConfig,
  MemoryNodeConfig,
  NodeKind,
  OutputNodeConfig,
  ParallelNodeConfig,
  RouterNodeConfig,
  TextNodeConfig,
  ToolNodeConfig,
  TransformNodeConfig,
} from "@/types/pipeline";

const FIELD_CLASS =
  "h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-2.5 text-xs text-neutral-200 outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-neutral-600 hover:border-neutral-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50";
const TEXTAREA_CLASS = `${FIELD_CLASS} h-auto min-h-24 resize-y py-2 leading-5`;
const SEGMENT_CLASS =
  "flex h-8 flex-1 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500";

function Field({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[11px] font-medium text-neutral-500">{label}</label>
        {value ? <span className="font-mono text-[10px] text-neutral-500">{value}</span> : null}
      </div>
      {children}
      {hint ? <div className="text-[10px] leading-4 text-neutral-600">{hint}</div> : null}
    </div>
  );
}

function InputForm({ id, config }: { id: string; config: InputNodeConfig }) {
  const update = usePipelineStore((state) => state.updateNodeConfig);
  return (
    <>
      <Field label="Name">
        <input className={FIELD_CLASS} value={config.name} onChange={(event) => update(id, { name: event.target.value })} placeholder="Pipeline name" />
      </Field>
      <Field label="Description / initial task">
        <textarea className={TEXTAREA_CLASS} value={config.description} onChange={(event) => update(id, { description: event.target.value })} placeholder="Describe the pipeline task..." />
      </Field>
    </>
  );
}

type AgentMcpServer = { id: string; name: string; server_type: string };

function LLMAgentForm({ id, config }: { id: string; config: LLMAgentConfig }) {
  const update = usePipelineStore((state) => state.updateNodeConfig);
  const [mcpServers, setMcpServers] = useState<AgentMcpServer[]>([]);
  const [mcpLoading, setMcpLoading] = useState(true);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const attachedServers = config.mcp_servers ?? [];

  const fetchMcpServers = useCallback(async () => {
    setMcpLoading(true);
    setMcpError(null);
    try {
      const response = await fetch("/api/mcp/user-servers");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? `Could not load MCP servers (${response.status})`);
      }
      const payload = await response.json();
      setMcpServers(payload.servers ?? []);
    } catch (error) {
      setMcpServers([]);
      setMcpError(error instanceof Error ? error.message : "Could not load MCP servers");
    } finally {
      setMcpLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMcpServers();
  }, [fetchMcpServers]);

  const toggleServer = (name: string) => {
    update(id, {
      mcp_servers: attachedServers.includes(name)
        ? attachedServers.filter((server) => server !== name)
        : [...attachedServers, name],
    });
  };

  const orphanedServers = attachedServers.filter(
    (name) => !mcpServers.some((server) => server.name === name)
  );

  return (
    <>
      <Field label="Agent name">
        <input className={FIELD_CLASS} value={config.name} onChange={(event) => update(id, { name: event.target.value })} placeholder="Agent name" />
      </Field>
      <Field label="Model">
        <select className={FIELD_CLASS} value={config.model} onChange={(event) => update(id, { model: event.target.value })}>
          {LLM_PROVIDERS.map((provider) => (
            <optgroup key={provider.provider} label={provider.label}>
              {provider.models.map((model) => <option key={model} value={model}>{model}</option>)}
            </optgroup>
          ))}
        </select>
      </Field>
      <Field label="Temperature" value={config.temperature.toFixed(1)}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          className="h-5 w-full cursor-pointer accent-indigo-500"
          value={config.temperature}
          onChange={(event) => update(id, { temperature: Number(event.target.value) })}
        />
      </Field>
      <Field label="System prompt">
        <textarea className={`${TEXTAREA_CLASS} min-h-32 font-mono text-[11px]`} value={config.system_prompt} onChange={(event) => update(id, { system_prompt: event.target.value })} placeholder="You are a helpful assistant..." />
      </Field>
      <Field label="MCP servers" hint="Attached servers expose their tools to this agent during execution.">
        {mcpLoading ? (
          <div className="space-y-2" aria-label="Loading MCP servers">
            <div className="h-8 animate-pulse rounded-md bg-neutral-800" />
            <div className="h-8 animate-pulse rounded-md bg-neutral-800" />
          </div>
        ) : mcpError ? (
          <div className="rounded-md border border-red-500/30 bg-neutral-950 p-2.5">
            <p className="text-[11px] leading-4 text-red-400">{mcpError}</p>
            <button type="button" onClick={() => void fetchMcpServers()} className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-md border border-neutral-700 px-2 text-[11px] text-neutral-300 hover:bg-neutral-800">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : mcpServers.length === 0 && orphanedServers.length === 0 ? (
          <p className="text-[11px] leading-4 text-neutral-500">
            No MCP servers registered. <Link href="/settings" className="text-indigo-400 hover:text-indigo-300">Add one in Settings.</Link>
          </p>
        ) : (
          <div className="divide-y divide-neutral-800 rounded-md border border-neutral-800 bg-neutral-950">
            {mcpServers.map((server) => (
              <label key={server.name} className="flex min-h-9 cursor-pointer items-center gap-2 px-2.5 hover:bg-neutral-900">
                <input type="checkbox" checked={attachedServers.includes(server.name)} onChange={() => toggleServer(server.name)} className="accent-indigo-500" />
                <span className="min-w-0 flex-1 truncate text-xs text-neutral-300">{server.name}</span>
                <span className="font-mono text-[9px] text-neutral-600">{server.server_type}</span>
              </label>
            ))}
            {orphanedServers.map((name) => (
              <label key={name} className="flex min-h-9 cursor-pointer items-center gap-2 px-2.5 hover:bg-neutral-900">
                <input type="checkbox" checked onChange={() => toggleServer(name)} className="accent-indigo-500" />
                <span className="min-w-0 flex-1 truncate text-xs text-neutral-300">{name}</span>
                <span className="text-[9px] text-amber-400">Missing from registry</span>
              </label>
            ))}
          </div>
        )}
      </Field>
    </>
  );
}

function OutputForm({ id, config }: { id: string; config: OutputNodeConfig }) {
  const update = usePipelineStore((state) => state.updateNodeConfig);
  const formats: OutputNodeConfig["output_format"][] = ["text", "json", "markdown"];
  return (
    <Field label="Output format">
      <div className="flex gap-1.5">
        {formats.map((format) => {
          const active = config.output_format === format;
          return (
            <button
              type="button"
              key={format}
              onClick={() => update(id, { output_format: format })}
              className={`${SEGMENT_CLASS} ${active ? "border-indigo-500 bg-indigo-500/10 text-indigo-300" : "border-neutral-700 bg-neutral-950 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"}`}
            >
              {format}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

type McpServerOption = { id: string; name: string };

function ToolForm({ id, config }: { id: string; config: ToolNodeConfig }) {
  const update = usePipelineStore((state) => state.updateNodeConfig);
  const [mcpServers, setMcpServers] = useState<McpServerOption[]>([]);
  const [mcpLoading, setMcpLoading] = useState(true);
  const [mcpError, setMcpError] = useState<string | null>(null);

  const fetchMcpServers = useCallback(async () => {
    setMcpLoading(true);
    setMcpError(null);
    try {
      const response = await fetch("/api/mcp/user-servers");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? `Could not load MCP servers (${response.status})`);
      }
      const payload = await response.json();
      setMcpServers(payload.servers ?? []);
    } catch (error) {
      setMcpServers([]);
      setMcpError(error instanceof Error ? error.message : "Could not load MCP servers");
    } finally {
      setMcpLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMcpServers();
  }, [fetchMcpServers]);

  const serverMissing = Boolean(config.server && !mcpServers.some((server) => server.name === config.server));

  return (
    <>
      <Field
        label="Server"
        hint={mcpError ? <span className="text-red-400">{mcpError}</span> : serverMissing ? <span className="text-amber-400">This server is not in your saved registry.</span> : !mcpLoading && mcpServers.length === 0 ? "No saved servers. Add one in Settings, or enter a registered server name." : undefined}
      >
        <div className="flex gap-1.5">
          {mcpServers.length > 0 ? (
            <select className={FIELD_CLASS} value={config.server} onChange={(event) => update(id, { server: event.target.value })}>
              <option value="">Select server</option>
              {mcpServers.map((server) => <option key={server.id} value={server.name}>{server.name}</option>)}
            </select>
          ) : (
            <input className={FIELD_CLASS} value={config.server} onChange={(event) => update(id, { server: event.target.value })} placeholder={mcpLoading ? "Loading servers..." : "mcp-server-name"} />
          )}
          <button type="button" onClick={() => void fetchMcpServers()} disabled={mcpLoading} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-950 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-50" title="Refresh MCP servers">
            <RefreshCw className={`h-3.5 w-3.5${mcpLoading ? " animate-spin" : ""}`} />
          </button>
        </div>
      </Field>
      <Field label="Tool name">
        <input className={FIELD_CLASS} value={config.tool_name} onChange={(event) => update(id, { tool_name: event.target.value })} placeholder="tool_function_name" />
      </Field>
      <Field label="Parameters (JSON)">
        <textarea className={`${TEXTAREA_CLASS} font-mono text-[11px]`} value={config.parameters} onChange={(event) => update(id, { parameters: event.target.value })} placeholder="{}" />
      </Field>
    </>
  );
}

function TextForm({ id, config }: { id: string; config: TextNodeConfig }) {
  const update = usePipelineStore((state) => state.updateNodeConfig);
  const variables = config.variables ?? [];
  return (
    <>
      <Field label="Template content">
        <textarea className={`${TEXTAREA_CLASS} min-h-28 font-mono text-[11px]`} value={config.content} onChange={(event) => update(id, { content: event.target.value })} placeholder="Use {{variable}} for dynamic handles..." />
      </Field>
      {variables.length > 0 ? (
        <Field label="Detected variables">
          <div className="flex flex-wrap gap-1.5">
            {variables.map((variable) => <Badge key={variable}>{`{{${variable}}}`}</Badge>)}
          </div>
        </Field>
      ) : null}
    </>
  );
}

function RouterForm({ id, config }: { id: string; config: RouterNodeConfig }) {
  const update = usePipelineStore((state) => state.updateNodeConfig);
  const conditions = config.conditions ?? [];

  const updateCondition = (index: number, field: "key" | "target", value: string) => {
    update(id, { conditions: conditions.map((condition, conditionIndex) => conditionIndex === index ? { ...condition, [field]: value } : condition) });
  };

  return (
    <>
      <Field label="Routing key">
        <input className={FIELD_CLASS} value={config.routing_key} onChange={(event) => update(id, { routing_key: event.target.value })} placeholder="route" />
      </Field>
      <Field label="Conditions">
        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <div key={index} className="rounded-md border border-neutral-800 bg-neutral-950 p-2">
              <div className="flex gap-1.5">
                <input className={FIELD_CLASS} value={condition.key} onChange={(event) => updateCondition(index, "key", event.target.value)} placeholder="condition" />
                <button type="button" onClick={() => update(id, { conditions: conditions.filter((_, conditionIndex) => conditionIndex !== index) })} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-800 hover:text-red-400" title="Remove condition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <input className={`${FIELD_CLASS} mt-1.5`} value={condition.target} onChange={(event) => updateCondition(index, "target", event.target.value)} placeholder="Target agent name" />
            </div>
          ))}
          <button type="button" onClick={() => update(id, { conditions: [...conditions, { key: "", target: "" }] })} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-neutral-700 text-xs text-neutral-400 transition-colors hover:border-indigo-500 hover:text-indigo-300">
            <Plus className="h-3.5 w-3.5" /> Add condition
          </button>
        </div>
      </Field>
    </>
  );
}

function MemoryForm({ id, config }: { id: string; config: MemoryNodeConfig }) {
  const update = usePipelineStore((state) => state.updateNodeConfig);
  return (
    <>
      <Field label="Memory type">
        <div className="flex gap-1.5">
          {(["context", "vector"] as const).map((type) => {
            const active = config.memory_type === type;
            return (
              <button type="button" key={type} onClick={() => update(id, { memory_type: type })} className={`${SEGMENT_CLASS} ${active ? "border-indigo-500 bg-indigo-500/10 text-indigo-300" : "border-neutral-700 bg-neutral-950 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"}`}>
                {type}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Key">
        <input className={FIELD_CLASS} value={config.key} onChange={(event) => update(id, { key: event.target.value })} placeholder="memory_key" />
      </Field>
    </>
  );
}

function TransformForm({ id, config }: { id: string; config: TransformNodeConfig }) {
  const update = usePipelineStore((state) => state.updateNodeConfig);
  return (
    <>
      <Field label="Transform type">
        <select className={FIELD_CLASS} value={config.transform_type} onChange={(event) => update(id, { transform_type: event.target.value as TransformNodeConfig["transform_type"] })}>
          <option value="json_parse">json_parse</option>
          <option value="extract">extract</option>
          <option value="format">format</option>
        </select>
      </Field>
      <Field label="Expression">
        <input className={`${FIELD_CLASS} font-mono text-[11px]`} value={config.expression} onChange={(event) => update(id, { expression: event.target.value })} placeholder="$.data.result" />
      </Field>
    </>
  );
}

function ParallelForm({ config }: { id: string; config: ParallelNodeConfig }) {
  void config;
  return (
    <Field label="Execution">
      <div className="rounded-md border border-neutral-800 bg-neutral-950 p-3 text-xs leading-5 text-neutral-400">
        Parallel nodes fan out to multiple downstream branches. Wire each output handle to the agents that should run concurrently.
      </div>
    </Field>
  );
}

type InspectorFormProps = { id: string; config: unknown };

const FORM_MAP: Record<NodeKind, ComponentType<InspectorFormProps>> = {
  input: InputForm as ComponentType<InspectorFormProps>,
  output: OutputForm as ComponentType<InspectorFormProps>,
  llm_agent: LLMAgentForm as ComponentType<InspectorFormProps>,
  tool: ToolForm as ComponentType<InspectorFormProps>,
  text: TextForm as ComponentType<InspectorFormProps>,
  router: RouterForm as ComponentType<InspectorFormProps>,
  memory: MemoryForm as ComponentType<InspectorFormProps>,
  transform: TransformForm as ComponentType<InspectorFormProps>,
  parallel: ParallelForm as ComponentType<InspectorFormProps>,
};

export function NodeConfigInspector() {
  const nodes = usePipelineStore((state) => state.nodes);
  const edges = usePipelineStore((state) => state.edges);
  const selectedNodeId = usePipelineStore((state) => state.selectedNodeId);
  const selectedNode = selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) : null;

  if (!selectedNode?.data) {
    return (
      <div className="flex h-full flex-col bg-neutral-900">
        <div className="border-b border-neutral-800 p-4">
          <h3 className="text-sm font-semibold text-neutral-100">Nothing selected</h3>
          <p className="mt-1 text-xs leading-5 text-neutral-500">Choose a node on the canvas to edit its runtime configuration.</p>
        </div>
        <div className="grid grid-cols-2 border-b border-neutral-800">
          <div className="border-r border-neutral-800 p-3">
            <div className="font-mono text-lg tabular-nums text-neutral-300">{nodes.length}</div>
            <div className="mt-0.5 text-[10px] text-neutral-500">Nodes</div>
          </div>
          <div className="p-3">
            <div className="font-mono text-lg tabular-nums text-neutral-300">{edges.length}</div>
            <div className="mt-0.5 text-[10px] text-neutral-500">Connections</div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {[
              ["01", "Select", "Pick a node from the canvas"],
              ["02", "Configure", "Set its model, prompt, or tool"],
              ["03", "Connect", "Wire handles into an execution path"],
            ].map(([number, title, copy]) => (
              <div key={number} className="flex gap-3">
                <span className="font-mono text-[9px] text-neutral-600">{number}</span>
                <div>
                  <div className="text-xs font-medium text-neutral-300">{title}</div>
                  <div className="mt-0.5 text-[10px] leading-4 text-neutral-500">{copy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { id, data } = selectedNode;
  const FormComponent = FORM_MAP[data.kind];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-neutral-900">
      <div className="flex items-center gap-2.5 border-b border-neutral-800 px-3 py-3">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 px-1 font-mono text-[9px] font-semibold text-indigo-400">
          {NODE_ICONS[data.kind]}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-neutral-200">{data.label}</span>
        <Badge>{data.kind.replace("_", " ")}</Badge>
      </div>
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-3.5">
        <FormComponent id={id} config={data.config} />
      </div>
    </div>
  );
}
