"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock, Hash, Play } from "lucide-react";
import { usePipelineStore } from "@/stores/pipelineStore";

interface PipelineRun {
  id: string;
  workflow_id: string;
  status: "running" | "completed" | "error";
  total_tokens: number | null;
  duration_seconds: number | null;
  created_at: string;
}

const statusStyle: Record<PipelineRun["status"], { dot: string; label: string }> = {
  completed: { dot: "bg-emerald-500", label: "text-emerald-400" },
  running: { dot: "animate-pulse bg-indigo-400", label: "text-indigo-300" },
  error: { dot: "bg-red-400", label: "text-red-400" },
};

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Activity }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 py-4 first:pl-0 sm:border-l sm:border-neutral-800 sm:first:border-l-0 sm:first:pl-0">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em]">{label}</span>
      </div>
      <span className="font-mono text-2xl font-semibold tracking-tight text-neutral-100 tabular-nums">{value}</span>
      <span className="text-xs text-neutral-600">{detail}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnalyticsView() {
  const currentPipelineId = usePipelineStore((s) => s.currentPipelineId);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentPipelineId) {
      setRuns([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    async function fetchRuns() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/pipelines/${currentPipelineId}/runs`);
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const data = await response.json();
        if (mounted) setRuns(data.runs ?? []);
      } catch {
        if (mounted) setError("Failed to load run history");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchRuns();
    return () => {
      mounted = false;
    };
  }, [currentPipelineId]);

  const completed = runs.filter((run) => run.status === "completed");
  const avgDuration = completed.length
    ? completed.reduce((sum, run) => sum + (run.duration_seconds ?? 0), 0) / completed.length
    : null;
  const avgTokens = completed.length
    ? Math.round(completed.reduce((sum, run) => sum + (run.total_tokens ?? 0), 0) / completed.length)
    : null;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="app-page flex flex-col gap-8">
        <div className="border-b border-neutral-800 pb-6">
          <p className="app-eyebrow">Pipeline telemetry</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-100">Run analytics</h1>
          <p className="mt-1 text-sm text-neutral-500">A concise view of the active pipeline&apos;s execution record.</p>
        </div>

        {!currentPipelineId ? (
          <div className="flex max-w-xl items-start gap-3 border-l-2 border-neutral-700 py-1 pl-4">
            <Play className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
            <div>
              <p className="text-sm font-medium text-neutral-300">No pipeline selected</p>
              <p className="mt-1 text-sm leading-6 text-neutral-500">Open a saved pipeline in the editor to inspect its run history and performance.</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 divide-x divide-y divide-neutral-800 border-y border-neutral-800 sm:grid-cols-4 sm:divide-y-0">
              {["runs", "completed", "duration", "tokens"].map((item) => (
                <div key={item} className="h-28 animate-pulse bg-neutral-900/30" />
              ))}
            </div>
            <div className="h-56 animate-pulse border border-neutral-800 bg-neutral-900/20" />
          </div>
        ) : error ? (
          <div className="flex max-w-xl items-start gap-3 border-l-2 border-red-400 py-1 pl-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-300">Analytics unavailable</p>
              <p className="mt-1 font-mono text-xs text-neutral-500">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 divide-x divide-y divide-neutral-800 border-y border-neutral-800 sm:grid-cols-4 sm:divide-y-0">
              <Metric icon={Activity} label="Runs" value={runs.length.toString()} detail="Recorded executions" />
              <Metric icon={CheckCircle2} label="Completed" value={completed.length.toString()} detail="Successful executions" />
              <Metric icon={Clock} label="Avg duration" value={avgDuration === null ? "–" : `${avgDuration.toFixed(1)}s`} detail="Completed runs only" />
              <Metric icon={Hash} label="Avg tokens" value={avgTokens === null ? "–" : avgTokens.toLocaleString()} detail="Completed runs only" />
            </div>

            <section className="overflow-hidden border border-neutral-800 bg-neutral-950">
              <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                <span className="app-eyebrow">Execution timeline</span>
                <span className="font-mono text-[10px] text-neutral-600">{runs.length} records</span>
              </div>

              {runs.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                  <Activity className="mb-3 h-5 w-5 text-neutral-700" />
                  <p className="text-sm font-medium text-neutral-400">No runs recorded</p>
                  <p className="mt-1 text-xs text-neutral-600">Run this pipeline to populate its execution telemetry.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/80">
                  <div className="hidden grid-cols-[1fr_110px_92px_108px] gap-4 bg-neutral-900/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-600 md:grid">
                    <span>Workflow</span><span>Status</span><span>Duration</span><span className="text-right">Recorded</span>
                  </div>
                  {runs.map((run) => {
                    const state = statusStyle[run.status];
                    return (
                      <div key={run.id} className="grid gap-3 px-4 py-3.5 md:grid-cols-[1fr_110px_92px_108px] md:items-center">
                        <span className="truncate font-mono text-xs text-neutral-300" title={run.workflow_id}>{run.workflow_id}</span>
                        <span className={`flex items-center gap-2 font-mono text-[11px] ${state.label}`}><span className={`h-1.5 w-1.5 rounded-full ${state.dot}`} />{run.status}</span>
                        <span className="font-mono text-xs tabular-nums text-neutral-500">{run.duration_seconds === null ? "–" : `${run.duration_seconds.toFixed(1)}s`}</span>
                        <span className="font-mono text-xs tabular-nums text-neutral-600 md:text-right">{formatDate(run.created_at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
