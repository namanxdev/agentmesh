"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  KeyRound,
  LayoutTemplate,
  LogOut,
  Monitor,
  Plus,
  Server,
  Settings2,
  TerminalSquare,
  Trash2,
  Zap,
} from "lucide-react";
import { ApiKeyCard } from "@/components/settings/ApiKeyCard";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { InputNodeConfig, LLMAgentConfig } from "@/types/pipeline";

const PROVIDERS = [
  { provider: "gemini" as const, label: "Google Gemini", description: "Gemini 2.0 Flash and Gemini 2.0 Pro models." },
  { provider: "groq" as const, label: "Groq", description: "Llama and other open-source models served by Groq." },
  { provider: "openai" as const, label: "OpenAI", description: "GPT-4o and GPT-4o mini models." },
];

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gpt-4o",
  "gpt-4o-mini",
];

const SERVER_TYPES = ["stdio", "sse", "http"] as const;

type MCPServerRow = {
  id: string;
  name: string;
  server_type: string;
  command_or_url: string;
};

function SectionHeading({ icon: Icon, eyebrow, title, description }: {
  icon: typeof Settings2;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-indigo-400" />
        <p className="app-eyebrow">{eyebrow}</p>
      </div>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-100">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-neutral-500">{description}</p>
    </div>
  );
}

const fieldClass = "w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-neutral-600 disabled:cursor-not-allowed disabled:opacity-50";
const labelClass = "font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500";

export default function SettingsPage() {
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [mcpServers, setMcpServers] = useState<MCPServerRow[]>([]);
  const [mcpLoading, setMcpLoading] = useState(true);
  const [mcpName, setMcpName] = useState("");
  const [mcpType, setMcpType] = useState<typeof SERVER_TYPES[number]>("stdio");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpAdding, setMcpAdding] = useState(false);
  const [mcpError, setMcpError] = useState("");

  const nodes = usePipelineStore((state) => state.nodes);
  const pipelineName = usePipelineStore((state) => state.pipelineName);
  const setPipelineName = usePipelineStore((state) => state.setPipelineName);
  const updateNodeConfig = usePipelineStore((state) => state.updateNodeConfig);
  const savePipeline = usePipelineStore((state) => state.savePipeline);
  const isSaving = usePipelineStore((state) => state.isSaving);
  const currentPipelineId = usePipelineStore((state) => state.currentPipelineId);

  const inputNode = nodes.find((node) => node.data?.kind === "input");
  const inputConfig = inputNode?.data?.config as InputNodeConfig | undefined;
  const description = inputConfig?.description ?? "";
  const llmNodes = nodes.filter((node) => node.data?.kind === "llm_agent");
  const firstLLMConfig = llmNodes[0]?.data?.config as LLMAgentConfig | undefined;
  const currentModel = firstLLMConfig?.model ?? MODELS[0];
  const currentTemp = firstLLMConfig?.temperature ?? 0.4;

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/keys");
      if (response.status === 401 || response.status === 403) {
        window.location.href = "/login";
        return;
      }
      if (!response.ok) throw new Error(`Failed to load API keys (${response.status})`);
      const data = await response.json();
      const next: Record<string, string> = {};
      for (const key of data.keys as { provider: string; saved_at: string }[]) next[key.provider] = key.saved_at;
      setSavedKeys(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Network error loading API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMcpServers = useCallback(async () => {
    try {
      const response = await fetch("/api/mcp/user-servers");
      if (response.status === 401 || response.status === 403) {
        window.location.href = "/login";
        return;
      }
      if (!response.ok) throw new Error(`Failed to load MCP servers (${response.status})`);
      const data = await response.json();
      setMcpServers(data.servers ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Network error loading MCP servers");
    } finally {
      setMcpLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKeys();
    void fetchMcpServers();
  }, [fetchKeys, fetchMcpServers]);

  async function handleAddMcpServer() {
    setMcpError("");
    if (!mcpName.trim() || !mcpUrl.trim()) {
      const message = "Name and command or URL are required.";
      setMcpError(message);
      return;
    }

    setMcpAdding(true);
    try {
      const response = await fetch("/api/mcp/user-servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mcpName.trim(), server_type: mcpType, command_or_url: mcpUrl.trim() }),
      });
      if (!response.ok) {
        const detail = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(detail.detail ?? "Failed to register the MCP server.");
      }
      toast.success(`MCP server \"${mcpName}\" registered`);
      setMcpName("");
      setMcpType("stdio");
      setMcpUrl("");
      await fetchMcpServers();
    } catch (error) {
      setMcpError(error instanceof Error ? error.message : "Network error registering MCP server.");
    } finally {
      setMcpAdding(false);
    }
  }

  async function handleDeleteMcpServer(id: string) {
    try {
      const response = await fetch(`/api/mcp/user-servers/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to unregister MCP server");
      toast.success("MCP server unregistered");
      setMcpServers((servers) => servers.filter((server) => server.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Network error deleting MCP server");
    }
  }

  return (
    <>
      <div className="flex min-h-screen items-center bg-neutral-950 px-8 text-neutral-100 md:hidden">
        <div className="max-w-sm border-l-2 border-indigo-500/70 py-1 pl-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 text-indigo-300"><Monitor className="h-4 w-4" /></div>
          <p className="app-eyebrow">Desktop workspace</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Settings needs a larger screen.</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">Manage credentials and MCP servers from a tablet or desktop workspace.</p>
          <Link href="/dashboard" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300"><ArrowLeft className="h-3.5 w-3.5" /> Back to overview</Link>
        </div>
      </div>
      <div className="hidden min-h-screen bg-neutral-950 text-neutral-100 md:block">
      <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-[1160px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-200" aria-label="Return to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="h-4 border-l border-neutral-800" />
            <div>
              <p className="app-eyebrow">Workspace</p>
              <p className="text-sm font-medium tracking-tight text-neutral-200">System settings</p>
            </div>
          </div>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="app-page flex flex-col gap-12 py-10 sm:py-14">
        <div className="border-b border-neutral-800 pb-7">
          <p className="app-eyebrow">Configuration</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-100">Keep the system deliberate.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Manage the active pipeline, provider credentials, and the MCP services available to tool nodes.</p>
        </div>

        <section className="flex flex-col gap-5">
          <SectionHeading icon={LayoutTemplate} eyebrow="Active pipeline" title="Execution defaults" description="Settings here apply to the pipeline currently open in the editor." />
          <div className="border border-neutral-800 bg-neutral-950">
            <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/35 px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">Pipeline configuration</span>
              <span className={`flex items-center gap-1.5 font-mono text-[10px] ${currentPipelineId ? "text-emerald-400" : "text-neutral-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${currentPipelineId ? "bg-emerald-500" : "bg-neutral-700"}`} />{currentPipelineId ? "Loaded" : "No pipeline loaded"}</span>
            </div>
            {!currentPipelineId ? (
              <div className="flex items-start gap-3 px-5 py-7">
                <LayoutTemplate className="mt-0.5 h-4 w-4 text-neutral-600" />
                <p className="max-w-lg text-sm leading-6 text-neutral-500">Open a pipeline from the editor before changing its name, instructions, model, or temperature.</p>
              </div>
            ) : (
              <div className="grid gap-x-8 gap-y-6 p-5 md:grid-cols-2 md:p-6">
                <div className="space-y-5">
                  <label className="block space-y-2"><span className={labelClass}>Pipeline name</span><input value={pipelineName} onChange={(event) => setPipelineName(event.target.value)} placeholder="Untitled pipeline" className={fieldClass} /></label>
                  <label className="block space-y-2"><span className="flex justify-between gap-3"><span className={labelClass}>Description / task</span>{!inputNode && <span className="text-[11px] text-amber-400">Requires an input node</span>}</span><textarea value={description} onChange={(event) => inputNode && updateNodeConfig(inputNode.id, { description: event.target.value })} placeholder="Describe what this pipeline does" disabled={!inputNode} className={`${fieldClass} min-h-32 resize-y`} /></label>
                </div>
                <div className="space-y-5">
                  <label className="block space-y-2"><span className="flex justify-between gap-3"><span className={labelClass}>Agent model</span><span className="font-mono text-[10px] text-neutral-600">{llmNodes.length} agents</span></span><select value={currentModel} onChange={(event) => llmNodes.forEach((node) => updateNodeConfig(node.id, { model: event.target.value }))} disabled={llmNodes.length === 0} className={fieldClass}>{MODELS.map((model) => <option key={model} value={model}>{model}</option>)}</select></label>
                  <label className="block space-y-3"><span className="flex justify-between gap-3"><span className={labelClass}>Temperature</span><span className="font-mono text-xs tabular-nums text-neutral-300">{currentTemp.toFixed(1)}</span></span><input type="range" min={0} max={1} step={0.1} value={currentTemp} onChange={(event) => llmNodes.forEach((node) => updateNodeConfig(node.id, { temperature: Number(event.target.value) }))} disabled={llmNodes.length === 0} className="w-full accent-indigo-500 disabled:cursor-not-allowed disabled:opacity-50" /><span className="flex justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-neutral-600"><span>Precise</span><span>Creative</span></span></label>
                  <div className="flex justify-end border-t border-neutral-800 pt-5"><button type="button" onClick={async () => { try { await savePipeline(); toast.success("Pipeline configuration saved"); } catch { toast.error("Failed to save pipeline configuration"); } }} disabled={isSaving} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"><Zap className="h-3.5 w-3.5" />{isSaving ? "Saving" : "Save configuration"}</button></div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <SectionHeading icon={KeyRound} eyebrow="Credentials" title="Provider API keys" description="Keys are encrypted before storage and are never included in execution logs." />
          <div className="grid gap-3">
            {loading ? [1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse border border-neutral-800 bg-neutral-900/30" />) : PROVIDERS.map((provider) => <ApiKeyCard key={provider.provider} {...provider} isSaved={provider.provider in savedKeys} savedAt={savedKeys[provider.provider]} onSaved={fetchKeys} />)}
          </div>
        </section>

        <section className="flex flex-col gap-5 pb-8">
          <SectionHeading icon={Server} eyebrow="Tool registry" title="MCP servers" description="Register the local and remote services that tool nodes can call from a pipeline." />
          <div className="overflow-hidden border border-neutral-800 bg-neutral-950">
            <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/35 px-4 py-3"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">Registered servers</span><span className="font-mono text-[10px] text-neutral-600">{mcpLoading ? "Loading" : `${mcpServers.length} total`}</span></div>
            {mcpLoading ? <div className="space-y-px p-4">{[1, 2].map((item) => <div key={item} className="h-12 animate-pulse bg-neutral-900/40" />)}</div> : mcpServers.length === 0 ? <div className="flex items-start gap-3 px-5 py-7"><Server className="mt-0.5 h-4 w-4 text-neutral-600" /><p className="text-sm text-neutral-500">No MCP servers are registered yet.</p></div> : <div className="divide-y divide-neutral-800">{mcpServers.map((server) => <div key={server.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 text-neutral-500"><TerminalSquare className="h-4 w-4" /></div><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate text-sm font-medium text-neutral-200">{server.name}</span><span className="rounded border border-neutral-700 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-neutral-500">{server.server_type}</span></div><p className="mt-0.5 truncate font-mono text-xs text-neutral-600" title={server.command_or_url}>{server.command_or_url}</p></div></div><button type="button" onClick={() => void handleDeleteMcpServer(server.id)} className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md px-2.5 py-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:self-auto"><Trash2 className="h-3.5 w-3.5" />Unregister</button></div>)}</div>}
          </div>

          <div className="border border-neutral-800 bg-neutral-950">
            <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3"><Plus className="h-3.5 w-3.5 text-indigo-400" /><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">Register server</span></div>
            <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_140px_minmax(0,2fr)_auto] md:items-end">
              <label className="block space-y-2"><span className={labelClass}>Name</span><input value={mcpName} onChange={(event) => setMcpName(event.target.value)} placeholder="github" className={fieldClass} /></label>
              <label className="block space-y-2"><span className={labelClass}>Transport</span><select value={mcpType} onChange={(event) => setMcpType(event.target.value as typeof SERVER_TYPES[number])} className={fieldClass}>{SERVER_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
              <label className="block space-y-2"><span className={labelClass}>Command or endpoint</span><input value={mcpUrl} onChange={(event) => setMcpUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleAddMcpServer(); }} placeholder="npx -y @modelcontextprotocol/server-github" className={`${fieldClass} font-mono`} /></label>
              <button type="button" onClick={() => void handleAddMcpServer()} disabled={mcpAdding || !mcpName.trim() || !mcpUrl.trim()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-indigo-500 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-3.5 w-3.5" />{mcpAdding ? "Registering" : "Register"}</button>
            </div>
            {mcpError && <p role="alert" className="border-t border-red-500/20 bg-red-500/5 px-5 py-3 font-mono text-xs text-red-400">{mcpError}</p>}
          </div>
        </section>
      </main>
      </div>
    </>
  );
}
