"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Server, Activity, ArrowRight, AlertCircle } from "lucide-react";

interface Pipeline {
  id: string;
  name: string;
  updated_at: string | null;
  node_count?: number;
}

interface PipelinesResponse {
  pipelines: Pipeline[];
}

interface MCPServer {
  id: string;
  name: string;
  server_type: string;
}

interface MCPResponse {
  servers: MCPServer[];
}

function useOverviewData() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [mcpCount, setMcpCount] = useState<number | null>(null);
  const [pipelinesError, setPipelinesError] = useState<string | null>(null);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const [pRes, mRes] = await Promise.allSettled([
        fetch("/api/pipelines").then((r) => {
          if (!r.ok) throw new Error(`Pipelines fetch failed (${r.status})`);
          return r.json() as Promise<PipelinesResponse>;
        }),
        fetch("/api/mcp/user-servers").then((r) => {
          if (!r.ok) throw new Error(`MCP fetch failed (${r.status})`);
          return r.json() as Promise<MCPResponse>;
        }),
      ]);

      if (!mounted) return;

      if (pRes.status === "fulfilled") {
        setPipelines(pRes.value.pipelines ?? []);
      } else {
        setPipelinesError(pRes.reason instanceof Error ? pRes.reason.message : "Failed to load pipelines");
      }

      if (mRes.status === "fulfilled") {
        setMcpCount((mRes.value.servers ?? []).length);
      } else {
        setMcpError(mRes.reason instanceof Error ? mRes.reason.message : "Failed to load MCP servers");
      }

      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, []);

  return { pipelines, mcpCount, pipelinesError, mcpError, loading };
}

export function OverviewPage() {
  const { pipelines, mcpCount, pipelinesError, mcpError, loading } = useOverviewData();

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">Overview</h1>
          <p className="text-sm text-neutral-500 mt-1">Mission Control — your pipeline and infrastructure at a glance.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pipelines stat */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-neutral-400">
              <GitBranch className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-widest font-mono">Pipelines</span>
            </div>
            {loading ? (
              <div className="h-8 w-16 rounded-md bg-neutral-800 animate-pulse" />
            ) : pipelinesError ? (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs">{pipelinesError}</span>
              </div>
            ) : (
              <span className="text-4xl font-bold text-neutral-100 font-mono tabular-nums">
                {pipelines.length}
              </span>
            )}
            <Link
              href="/dashboard/pipelines"
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-auto"
            >
              Open editor <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* MCP servers stat */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-neutral-400">
              <Server className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-widest font-mono">MCP Servers</span>
            </div>
            {loading ? (
              <div className="h-8 w-16 rounded-md bg-neutral-800 animate-pulse" />
            ) : mcpError ? (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs">{mcpError}</span>
              </div>
            ) : (
              <span className="text-4xl font-bold text-neutral-100 font-mono tabular-nums">
                {mcpCount ?? 0}
              </span>
            )}
            <Link
              href="/dashboard/mcp"
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-auto"
            >
              View registry <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Recent pipelines */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-neutral-300 tracking-tight">Recent Pipelines</h2>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-md border border-neutral-800 bg-neutral-900 animate-pulse" />
              ))}
            </div>
          ) : pipelinesError ? (
            <div className="flex items-center gap-2 p-4 rounded-md border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {pipelinesError}
            </div>
          ) : pipelines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-neutral-800 text-center">
              <GitBranch className="w-8 h-8 text-neutral-700 mb-3" />
              <p className="text-sm text-neutral-400 font-medium">No pipelines yet</p>
              <p className="text-xs text-neutral-600 mt-1">
                Go to the{" "}
                <Link href="/dashboard/pipelines" className="text-indigo-400 hover:text-indigo-300">
                  pipeline editor
                </Link>{" "}
                to build your first workflow.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden">
              {pipelines.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GitBranch className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="text-sm text-neutral-200 font-medium truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {p.updated_at && (
                      <span className="text-xs text-neutral-500 font-mono hidden sm:block">
                        {new Date(p.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-neutral-800 bg-neutral-900">
                      <Activity className="w-3 h-3 text-neutral-500" />
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                        {p.node_count != null ? `${p.node_count} nodes` : "saved"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
