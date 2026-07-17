"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEventStore } from "@/stores/eventStore";
import { AlertCircle } from "lucide-react";

interface Run {
  id: string;
  workflow_id: string;
  pipeline_id: string | null;
  pipeline_name: string | null;
  status: "running" | "completed" | "error";
  total_tokens: number;
  duration_seconds: number | null;
  error: string | null;
  created_at: string;
}

interface RunsResponse {
  runs: Run[];
}

function formatRelativeTime(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function StatusDot({ status }: { status: Run["status"] }) {
  if (status === "running") {
    return (
      <span
        className="inline-block h-2 w-2 rounded-full bg-neutral-400 animate-pulse flex-shrink-0"
        title="Running"
      />
    );
  }
  if (status === "completed") {
    return (
      <span
        className="inline-block h-2 w-2 rounded-full bg-green-400 flex-shrink-0"
        title="Completed"
      />
    );
  }
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-red-400 flex-shrink-0"
      title="Error"
    />
  );
}

export function RecentRunsTable() {
  const workflowStatus = useEventStore((s) => s.workflowStatus);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/runs?limit=20");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Failed to fetch runs (${res.status})`);
      }
      const data: RunsResponse = await res.json();
      setRuns(data.runs ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Poll every 5s only while running
  useEffect(() => {
    if (workflowStatus === "running") {
      pollingRef.current = setInterval(fetchRuns, 5000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      // One extra fetch when run finishes to capture final state
      if (workflowStatus === "completed" || workflowStatus === "error") {
        fetchRuns();
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [workflowStatus, fetchRuns]);

  return (
    <div className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 flex-shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          Recent runs
        </span>
        <Link
          href="/dashboard/runs"
          className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col divide-y divide-neutral-800/60">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 px-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-neutral-800 animate-pulse flex-shrink-0" />
              <div className="h-2.5 w-32 rounded bg-neutral-800 animate-pulse" />
              <div className="ml-auto h-2.5 w-16 rounded bg-neutral-800 animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 px-4 py-3 text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs font-mono">{error}</span>
        </div>
      ) : runs.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <span className="text-xs text-neutral-700 font-mono">No runs yet</span>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-800/40 overflow-y-auto custom-scrollbar" style={{ maxHeight: 260 }}>
          {runs.map((run) => (
            <Link
              key={run.id}
              href="/dashboard/runs"
              className="grid items-center gap-3 px-4 py-2.5 hover:bg-neutral-900/60 transition-colors"
              style={{ gridTemplateColumns: "12px 1fr auto auto auto" }}
            >
              <StatusDot status={run.status} />
              <span
                className="text-xs text-neutral-300 font-medium truncate"
                title={run.pipeline_name ?? run.id}
              >
                {run.pipeline_name ?? <span className="text-neutral-600">—</span>}
              </span>
              <span className="text-[10px] font-mono text-neutral-600 tabular-nums text-right">
                {run.total_tokens > 0 ? `${run.total_tokens.toLocaleString()} tok` : "—"}
              </span>
              <span className="text-[10px] font-mono text-neutral-600 tabular-nums text-right hidden sm:block">
                {formatDuration(run.duration_seconds)}
              </span>
              <span className="text-[10px] font-mono text-neutral-700 tabular-nums text-right">
                {formatRelativeTime(run.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
