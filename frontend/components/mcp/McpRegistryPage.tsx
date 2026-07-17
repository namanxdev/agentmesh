"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ExternalLink, RefreshCw, Server } from "lucide-react";
import { McpServer, McpServerRow } from "./McpServerRow";

interface UserServersResponse {
  servers: McpServer[];
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 last:border-b-0">
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-4 w-40 rounded bg-neutral-800 animate-pulse" />
        <div className="h-3 w-64 rounded bg-neutral-800 animate-pulse" />
      </div>
      <div className="h-4 w-16 rounded bg-neutral-800 animate-pulse" />
      <div className="h-7 w-28 rounded-md bg-neutral-800 animate-pulse" />
    </div>
  );
}

export function McpRegistryPage() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mcp/user-servers");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { detail?: string } | null)?.detail ??
            `Failed to load MCP servers (${res.status})`
        );
      }
      const data: UserServersResponse = await res.json();
      setServers(data.servers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load MCP servers");
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">
                MCP Registry
              </h1>
              {!loading && !error && (
                <span className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-xs text-neutral-500">
                  {servers.length} server{servers.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 pl-11">
              Registered MCP servers available for tool nodes in your pipelines.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchServers}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-800 text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Refresh server list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-400"
            >
              <ExternalLink className="w-3 h-3" />
              Add server
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden divide-y divide-neutral-800">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-red-400">Failed to load servers</p>
              <p className="text-xs text-neutral-500 font-mono">{error}</p>
            </div>
            <button
              onClick={fetchServers}
              className="mt-1 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              Retry
            </button>
          </div>
        ) : servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-800 py-16 text-center">
            <Server className="w-8 h-8 text-neutral-700" />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-neutral-400 font-medium">No MCP servers registered</p>
              <p className="text-xs text-neutral-600">
                Register a server in{" "}
                <Link href="/settings" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Settings
                </Link>{" "}
                to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden divide-y divide-neutral-800">
            {/* Table header */}
            <div className="flex items-center gap-3 px-4 py-2 bg-neutral-900/60">
              <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-neutral-600 font-mono">
                Server / endpoint
              </span>
              <span className="w-28 text-center text-[10px] font-medium uppercase tracking-widest text-neutral-600 font-mono">
                Health
              </span>
              {/* spacer for chevron col */}
              <span className="w-8" />
              {/* spacer for button col */}
              <span className="w-28" />
            </div>

            {servers.map((server) => (
              <McpServerRow key={server.id} server={server} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
