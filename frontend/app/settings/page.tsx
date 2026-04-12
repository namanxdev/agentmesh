"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ApiKeyCard } from "@/components/settings/ApiKeyCard";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { InputNodeConfig, LLMAgentConfig } from "@/types/pipeline";
import { 
  ArrowLeft, LogOut, Settings2, KeyRound, Server, Zap, 
  Activity, Trash2, Plus, LayoutTemplate, TerminalSquare 
} from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import RetroGrid from "@/components/ui/retro-grid";

const PROVIDERS = [
  {
    provider: "gemini" as const,
    label: "Google Gemini",
    description: "Used for Gemini 2.0 Flash and Gemini 2.0 Pro models. Get your key at Google AI Studio.",
    accentColor: "#3b82f6", // Blue
  },
  {
    provider: "groq" as const,
    label: "Groq",
    description: "Used for Llama 3.3 70B and other open-source models. Get your key at console.groq.com.",
    accentColor: "#f97316", // Orange
  },
  {
    provider: "openai" as const,
    label: "OpenAI",
    description: "Used for GPT-4o and GPT-4o-mini models. Get your key at platform.openai.com.",
    accentColor: "#10b981", // Emerald
  },
];

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gpt-4o",
  "gpt-4o-mini",
];

type MCPServerRow = {
  id: string;
  name: string;
  server_type: string;
  command_or_url: string;
  created_at: string | null;
};

const SERVER_TYPES = ["stdio", "sse", "http"] as const;

export default function SettingsPage() {
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // MCP servers state
  const [mcpServers, setMcpServers] = useState<MCPServerRow[]>([]);
  const [mcpLoading, setMcpLoading] = useState(true);
  const [mcpName, setMcpName] = useState("");
  const [mcpType, setMcpType] = useState<typeof SERVER_TYPES[number]>("stdio");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpAdding, setMcpAdding] = useState(false);
  const [mcpError, setMcpError] = useState("");

  // Pipeline settings from store
  const nodes = usePipelineStore((s) => s.nodes);
  const pipelineName = usePipelineStore((s) => s.pipelineName);
  const setPipelineName = usePipelineStore((s) => s.setPipelineName);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);
  const savePipeline = usePipelineStore((s) => s.savePipeline);
  const isSaving = usePipelineStore((s) => s.isSaving);
  const currentPipelineId = usePipelineStore((s) => s.currentPipelineId);

  const inputNode = nodes.find((n) => n.data?.kind === "input");
  const inputConfig = inputNode?.data?.config as InputNodeConfig | undefined;
  const description = inputConfig?.description ?? "";
  const llmNodes = nodes.filter((n) => n.data?.kind === "llm_agent");
  const firstLLMConfig = llmNodes[0]?.data?.config as LLMAgentConfig | undefined;
  const currentModel = firstLLMConfig?.model ?? MODELS[0];
  const currentTemp = firstLLMConfig?.temperature ?? 0.4;

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/keys");
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, string> = {};
      for (const k of data.keys as { provider: string; saved_at: string }[]) {
        map[k.provider] = k.saved_at;
      }
      setSavedKeys(map);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMcpServers = useCallback(async () => {
    try {
      const res = await fetch("/api/mcp/user-servers");
      if (!res.ok) return;
      const data = await res.json();
      setMcpServers(data.servers ?? []);
    } catch {
      // silent
    } finally {
      setMcpLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchMcpServers();
  }, [fetchKeys, fetchMcpServers]);

  const handleAddMcpServer = async () => {
    setMcpError("");
    if (!mcpName.trim() || !mcpUrl.trim()) {
      setMcpError("Name and command/URL are required.");
      return;
    }
    setMcpAdding(true);
    try {
      const res = await fetch("/api/mcp/user-servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mcpName.trim(),
          server_type: mcpType,
          command_or_url: mcpUrl.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMcpError(err.detail ?? "Failed to add server.");
        return;
      }
      setMcpName("");
      setMcpType("stdio");
      setMcpUrl("");
      await fetchMcpServers();
    } catch {
      setMcpError("Network error.");
    } finally {
      setMcpAdding(false);
    }
  };

  const handleDeleteMcpServer = async (id: string) => {
    try {
      await fetch(`/api/mcp/user-servers/${id}`, { method: "DELETE" });
      setMcpServers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // silent
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans selection:bg-indigo-500/30 selection:text-white relative overflow-x-hidden">
      
      {/* Background effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <RetroGrid className="opacity-[0.12]" />
         <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-500/10 blur-[150px] rounded-full translate-x-1/3 -translate-y-1/3" />
         <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-fuchsia-500/10 blur-[150px] rounded-full -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard"
              className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
            </Link>
            
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Settings2 className="w-4 h-4" />
               </div>
               <h1 className="text-lg font-bold text-white tracking-tight">System Configuration</h1>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-red-400 bg-white/[0.02] hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all font-mono uppercase tracking-widest"
          >
            <LogOut className="w-3 h-3 group-hover:scale-110 transition-transform" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-16 space-y-20">
        
        {/* PIPELINE SECTION */}
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] uppercase tracking-widest font-bold">
               <LayoutTemplate className="w-3 h-3" />
               Pipeline Status
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Canvas Configuration</h2>
          </div>

          <div className="relative p-6 md:p-8 rounded-[24px] bg-[#0c0a09]/80 border border-white/[0.06] shadow-2xl backdrop-blur-xl">
             <BorderBeam duration={12} size={300} colorFrom="#6366f1" colorTo="#ec4899" />
             
             {!currentPipelineId ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl border border-dashed border-white/10 flex items-center justify-center bg-white/[0.02]">
                    <LayoutTemplate className="w-6 h-6 text-neutral-500 opacity-50" />
                  </div>
                  <div>
                    <h3 className="text-neutral-300 font-medium text-base mb-1">No pipeline loaded</h3>
                    <p className="text-neutral-500 text-sm max-w-sm mx-auto">Open a pipeline in Mission Control to configure its root details here.</p>
                  </div>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Left Col */}
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest font-bold ml-1">Pipeline Name</label>
                        <input
                          type="text"
                          value={pipelineName}
                          onChange={(e) => setPipelineName(e.target.value)}
                          placeholder="Untitled pipeline"
                          className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-neutral-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest font-bold ml-1 flex justify-between">
                           Description / Task
                           {!inputNode && <span className="text-amber-500/70 lowercase tracking-normal font-sans">Requires Input Node</span>}
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => inputNode && updateNodeConfig(inputNode.id, { description: e.target.value })}
                          placeholder="Describe what this pipeline does…"
                          disabled={!inputNode}
                          className="w-full h-32 resize-none bg-black/40 border border-white/10 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-600"
                        />
                      </div>
                   </div>

                   {/* Right Col */}
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest font-bold ml-1 flex items-center justify-between">
                           Global LLM Setting
                           <span className="text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">{llmNodes.length} Agent{llmNodes.length !== 1 ? 's' : ''}</span>
                        </label>
                        <div className="relative">
                           <select
                             value={currentModel}
                             onChange={(e) => llmNodes.forEach((n) => updateNodeConfig(n.id, { model: e.target.value }))}
                             disabled={llmNodes.length === 0}
                             className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                           >
                             {MODELS.map((m) => <option key={m} value={m} className="bg-[#0a0a0a]">{m}</option>)}
                           </select>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">▼</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex text-[10px] text-neutral-500 font-mono uppercase tracking-widest font-bold ml-1 justify-between">
                           <span>Temperature Range</span>
                           <span className="text-white/80 bg-white/5 px-2 py-0.5 rounded-md">{currentTemp.toFixed(1)}</span>
                        </label>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-4">
                           <input
                             type="range"
                             min={0}
                             max={1}
                             step={0.1}
                             value={currentTemp}
                             onChange={(e) => llmNodes.forEach((n) => updateNodeConfig(n.id, { temperature: parseFloat(e.target.value) }))}
                             disabled={llmNodes.length === 0}
                             className="w-full accent-indigo-500 cursor-pointer disabled:opacity-50"
                           />
                           <div className="flex justify-between text-[10px] text-neutral-500 font-mono font-medium">
                             <span>PRECISE (0.0)</span>
                             <span>CREATIVE (1.0)</span>
                           </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                         <button
                           onClick={savePipeline}
                           disabled={isSaving}
                           className="group flex items-center justify-center gap-2 px-6 py-3 w-full md:w-auto rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                         >
                           {isSaving ? <Activity className="animate-spin w-4 h-4" /> : <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                           {isSaving ? "Saving Configuration…" : "Update Configuration"}
                         </button>
                      </div>
                   </div>
                </div>
             )}
          </div>
        </section>

        {/* API KEYS SECTION */}
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-fuchsia-400 font-mono text-[10px] uppercase tracking-widest font-bold">
               <KeyRound className="w-3 h-3" />
               Security Vault
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">API Provider Keys</h2>
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Keys are encrypted locally with AES-256 before storage. Each workflow leverages your own API keys natively for localized spending control. Keys are never logged.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-[120px] rounded-[20px] bg-white/[0.02] border border-white/[0.05] animate-pulse" />
              ))
            ) : (
              PROVIDERS.map((p) => (
                <ApiKeyCard
                  key={p.provider}
                  provider={p.provider}
                  label={p.label}
                  description={p.description}
                  accentColor={p.accentColor}
                  isSaved={p.provider in savedKeys}
                  savedAt={savedKeys[p.provider]}
                  onSaved={fetchKeys}
                />
              ))
            )}
          </div>
        </section>

        {/* MCP SERVERS SECTION */}
        <section className="space-y-6 pb-20">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] uppercase tracking-widest font-bold">
               <Server className="w-3 h-3" />
               Tool Registry
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Model Context Protocol</h2>
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Register localized MCP servers. Once added, tool nodes on your canvas can directly interface with these systems seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
             {/* List Servers */}
             {!mcpLoading && mcpServers.length > 0 ? (
               <div className="flex flex-col gap-3">
                 {mcpServers.map((srv) => (
                   <div
                     key={srv.id}
                     className="flex flex-col md:flex-row md:items-center gap-4 bg-[#0c0a09]/60 border border-white/10 rounded-2xl p-4 transition-all hover:bg-[#0c0a09] hover:border-white/20"
                   >
                     <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                           <TerminalSquare className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-white truncate">{srv.name}</span>
                             <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 text-neutral-400 border border-white/5">
                               {srv.server_type}
                             </span>
                           </div>
                           <span className="text-xs text-neutral-500 font-mono truncate mt-0.5">
                             {srv.command_or_url}
                           </span>
                        </div>
                     </div>
                     <button
                       onClick={() => handleDeleteMcpServer(srv.id)}
                       className="group/btn self-start md:self-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/40 transition-all"
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                       Unregister
                     </button>
                   </div>
                 ))}
               </div>
             ) : !mcpLoading && (
               <div className="flex flex-col items-center justify-center py-10 px-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <Server className="w-8 h-8 text-neutral-600 mb-3" />
                  <span className="text-sm font-medium text-neutral-300">No external servers registered</span>
               </div>
             )}

             {/* Add Server Form */}
             <div className="p-6 md:p-8 rounded-[24px] bg-[#0c0a09]/80 border border-white/10 shadow-xl backdrop-blur-md">
               <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2 font-mono">
                  <Plus className="w-4 h-4 text-emerald-400" /> Integrate New Server
               </h3>
               
               <div className="flex flex-col md:flex-row gap-4 mb-4">
                 <div className="flex-1 space-y-2">
                    <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest font-bold ml-1">Alias / Name</label>
                    <input
                      placeholder="e.g., github"
                      value={mcpName}
                      onChange={(e) => setMcpName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-neutral-600 font-mono"
                    />
                 </div>
                 
                 <div className="w-full md:w-32 space-y-2">
                    <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest font-bold ml-1">Protocol</label>
                    <div className="relative">
                       <select
                         value={mcpType}
                         onChange={(e) => setMcpType(e.target.value as typeof SERVER_TYPES[number])}
                         className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono uppercase pr-10"
                       >
                         {SERVER_TYPES.map((t) => <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>)}
                       </select>
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">▼</div>
                    </div>
                 </div>

                 <div className="flex-[2] space-y-2">
                    <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest font-bold ml-1">Execution Command / URI</label>
                    <input
                      placeholder="npx -y @modelcontextprotocol/server-github"
                      value={mcpUrl}
                      onChange={(e) => setMcpUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddMcpServer()}
                      className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-neutral-600 font-mono"
                    />
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                 <div className="text-xs text-red-400 font-mono font-medium">
                   {mcpError}
                 </div>
                 <button
                   onClick={handleAddMcpServer}
                   disabled={mcpAdding || !mcpName.trim() || !mcpUrl.trim()}
                   className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-[#000] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                 >
                   {mcpAdding ? <Activity className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                   {mcpAdding ? "Provisioning Server…" : "Register Protocol"}
                 </button>
               </div>
             </div>
          </div>
        </section>

      </main>
    </div>
  );
}
