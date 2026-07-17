"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Server, Play, AlertCircle } from "lucide-react";

interface Pipeline {
  id: string;
  name: string;
}

interface MCPServer {
  id: string;
  name: string;
  server_type: string;
  command_or_url: string;
}

interface Run {
  id: string;
  created_at: string;
}

interface StatusData {
  pipelineCount: number | null;
  pipelineError: string | null;
  mcpServers: MCPServer[];
  mcpError: string | null;
  runsToday: number | null;
  runsError: string | null;
  loading: boolean;
}

function isToday(isoString: string): boolean {
  const d = new Date(isoString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function useStatusData(): StatusData {
  const [pipelineCount, setPipelineCount] = useState<number | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [runsToday, setRunsToday] = useState<number | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [pRes, mRes, rRes] = await Promise.allSettled([
        fetch("/api/pipelines").then(async (r) => {
          if (!r.ok) throw new Error(`Pipelines (${r.status})`);
          const d = await r.json();
          return (d.pipelines ?? []) as Pipeline[];
        }),
        fetch("/api/mcp/user-servers").then(async (r) => {
          if (!r.ok) throw new Error(`MCP (${r.status})`);
          const d = await r.json();
          return (d.servers ?? []) as MCPServer[];
        }),
        fetch("/api/runs?limit=20").then(async (r) => {
          if (!r.ok) throw new Error(`Runs (${r.status})`);
          const d = await r.json();
          return (d.runs ?? []) as Run[];
        }),
      ]);

      if (!mounted) return;

      if (pRes.status === "fulfilled") {
        setPipelineCount(pRes.value.length);
      } else {
        setPipelineError(pRes.reason instanceof Error ? pRes.reason.message : "Error");
      }

      if (mRes.status === "fulfilled") {
        setMcpServers(mRes.value);
      } else {
        setMcpError(mRes.reason instanceof Error ? mRes.reason.message : "Error");
      }

      if (rRes.status === "fulfilled") {
        setRunsToday(rRes.value.filter((r) => isToday(r.created_at)).length);
      } else {
        setRunsError(rRes.reason instanceof Error ? rRes.reason.message : "Error");
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { pipelineCount, pipelineError, mcpServers, mcpError, runsToday, runsError, loading };
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  error: string | null;
  loading: boolean;
  href: string;
  linkLabel: string;
  tooltip?: string;
}

function StatCard({ icon, label, value, error, loading, href, linkLabel, tooltip }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-800 bg-neutral-900/50 px-4 py-3 min-w-[130px]">
      <div className="flex items-center gap-1.5">
        <span className="text-neutral-500">{icon}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
          {label}
        </span>
      </div>

      {loading ? (
        <div className="h-6 w-10 rounded bg-neutral-800 animate-pulse" />
      ) : error ? (
        <div className="flex items-center gap-1.5 text-red-400" title={error}>
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span className="text-[10px] font-mono truncate">Error</span>
        </div>
      ) : (
        <span
          className="text-2xl font-bold font-mono tabular-nums text-neutral-100"
          title={tooltip}
        >
          {value ?? 0}
        </span>
      )}

      <Link
        href={href}
        className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors mt-auto font-mono"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

export function StatusRow() {
  const { pipelineCount, pipelineError, mcpServers, mcpError, runsToday, runsError, loading } =
    useStatusData();

  const mcpTooltip =
    mcpServers.length > 0
      ? mcpServers.map((s) => `${s.name} (${s.server_type})`).join("\n")
      : undefined;

  return (
    <div className="flex items-stretch gap-3 flex-wrap">
      <StatCard
        icon={<GitBranch className="w-3.5 h-3.5" />}
        label="Pipelines"
        value={pipelineCount}
        error={pipelineError}
        loading={loading}
        href="/dashboard/pipelines"
        linkLabel="Open editor"
      />
      <StatCard
        icon={<Server className="w-3.5 h-3.5" />}
        label="MCP servers"
        value={mcpServers.length}
        error={mcpError}
        loading={loading}
        href="/dashboard/mcp"
        linkLabel="View registry"
        tooltip={mcpTooltip}
      />
      <StatCard
        icon={<Play className="w-3.5 h-3.5" />}
        label="Runs today"
        value={runsToday}
        error={runsError}
        loading={loading}
        href="/dashboard/runs"
        linkLabel="View all runs"
      />
    </div>
  );
}
