"use client";

import { useEffect, useState } from "react";
import { usePipelineStore } from "@/stores/pipelineStore";
import { BentoGrid, BentoCard } from "@/components/bento-grid";
import { Play, CheckCircle2, Clock, Hash, AlertTriangle, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface PipelineRun {
  id: string;
  workflow_id: string;
  status: "running" | "completed" | "error";
  total_tokens: number | null;
  duration_seconds: number | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  completed: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  running: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  error: "text-rose-500 bg-rose-500/10 border-rose-500/20",
};

export function AnalyticsView() {
  const currentPipelineId = usePipelineStore((s) => s.currentPipelineId);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentPipelineId) return;
    let isMounted = true;
    const fetchRuns = async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/pipelines/${currentPipelineId}/runs`);
        const d = await r.json();
        if (isMounted) setRuns(d.runs ?? []);
      } catch {
        if (isMounted) setError("Failed to load run history");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRuns();
    return () => { isMounted = false; };
  }, [currentPipelineId]);

  const completed = runs.filter((r) => r.status === "completed");
  const avgDuration =
    completed.length > 0
      ? completed.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0) / completed.length
      : null;
  const avgTokens =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, r) => sum + (r.total_tokens ?? 0), 0) / completed.length
        )
      : null;

  return (
    <div className="flex flex-col h-full w-full p-6 md:p-10 gap-8 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 w-fit">
            <Activity className="w-3 h-3 text-indigo-400" />
            <p className="text-[10px] sm:text-xs uppercase tracking-widest font-mono text-indigo-300 font-semibold">
              Pipeline Analytics
            </p>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-2 font-display">
          Run History
        </h1>
      </div>

      {!currentPipelineId ? (
        <div className="flex flex-col items-center justify-center p-12 mt-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl text-center">
          <Play className="w-16 h-16 text-neutral-600 mb-6 font-light stroke-[1]" />
          <h2 className="text-xl font-medium text-neutral-300 mb-2">No Active Pipeline</h2>
          <p className="text-sm text-neutral-500 max-w-sm">
            Save your pipeline first in the build canvas to track workflow run history.
          </p>
        </div>
      ) : loading ? (
        /* Skeleton shimmer matching BentoCard layout */
        <div className="flex flex-col gap-8 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="relative h-32 rounded-[24px] border border-white/10 bg-white/[0.03] overflow-hidden"
              >
                <div
                  className="absolute inset-0 -translate-x-full"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
                    animation: `shimmer 1.6s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="h-64 rounded-[32px] border border-white/10 bg-white/[0.02] relative overflow-hidden">
            <div
              className="absolute inset-0 -translate-x-full"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                animation: "shimmer 1.6s ease-in-out 0.4s infinite",
              }}
            />
          </div>
          <style>{`
            @keyframes shimmer {
              to { transform: translateX(200%); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-8 w-full max-w-[1920px]">
          {/* KPI Bento Grid */}
          <BentoGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <BentoCard className="col-span-1 border border-white/10 bg-white/[0.03] backdrop-blur-md rounded-[24px]">
              <div className="flex flex-col h-full z-10 w-full justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-[10px] md:text-xs uppercase font-mono tracking-widest text-neutral-400">Total Runs</span>
                </div>
                <AnimatedCounter target={runs.length} className="text-4xl md:text-5xl font-bold text-white tracking-tight font-mono" />
              </div>
            </BentoCard>

            <BentoCard className="col-span-1 border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md rounded-[24px]">
              <div className="flex flex-col h-full z-10 w-full justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
                  <span className="text-[10px] md:text-xs uppercase font-mono tracking-widest text-emerald-500/80">Completed</span>
                </div>
                <AnimatedCounter target={completed.length} className="text-4xl md:text-5xl font-bold text-emerald-400 tracking-tight font-mono" />
              </div>
            </BentoCard>

            <BentoCard className="col-span-1 border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md rounded-[24px]">
              <div className="flex flex-col h-full z-10 w-full justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-3.5 h-3.5 text-indigo-400/70" />
                  <span className="text-[10px] md:text-xs uppercase font-mono tracking-widest text-indigo-400/80">Avg Duration</span>
                </div>
                {avgDuration !== null ? (
                  <div className="flex items-end gap-1">
                    <AnimatedCounter
                      target={Math.round(avgDuration * 10) / 10}
                      duration={1.2}
                      className="text-4xl md:text-5xl font-bold text-white tracking-tight font-mono"
                    />
                    <span className="text-xl text-neutral-500 mb-1 font-mono">s</span>
                  </div>
                ) : (
                  <span className="text-4xl md:text-5xl font-bold text-white tracking-tight font-mono">—</span>
                )}
              </div>
            </BentoCard>

            <BentoCard className="col-span-1 border border-fuchsia-500/20 bg-fuchsia-500/5 backdrop-blur-md rounded-[24px]">
              <div className="flex flex-col h-full z-10 w-full justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="w-3.5 h-3.5 text-fuchsia-400/70" />
                  <span className="text-[10px] md:text-xs uppercase font-mono tracking-widest text-fuchsia-400/80">Avg Tokens</span>
                </div>
                {avgTokens !== null ? (
                  <AnimatedCounter target={avgTokens} className="text-4xl md:text-5xl font-bold text-white tracking-tight font-mono" />
                ) : (
                  <span className="text-4xl md:text-5xl font-bold text-white tracking-tight font-mono">—</span>
                )}
              </div>
            </BentoCard>
          </BentoGrid>

          {/* Runs Table Section */}
          <div className="flex-1 min-h-[300px]">
            {runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 rounded-[32px] border border-white/5 bg-white/[0.02] text-center w-full">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                   <Play className="w-8 h-8 text-neutral-500" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-200 mb-2">No runs yet</h3>
                <p className="text-neutral-500 text-sm">Return to the canvas and run this pipeline to see history.</p>
              </div>
            ) : (
              <div className="flex flex-col w-full rounded-[32px] border border-white/10 bg-[#0a0a0a]/60 backdrop-blur-xl overflow-hidden shadow-2xl">
                {/* Desktop Native Table Header */}
                <div className="hidden lg:grid grid-cols-12 gap-4 p-5 bg-white/[0.02] border-b border-white/10 text-[10px] font-mono tracking-widest uppercase text-neutral-500">
                  <span className="col-span-4">Workflow ID</span>
                  <span className="col-span-2">Status</span>
                  <span className="col-span-2">Duration</span>
                  <span className="col-span-2">Tokens</span>
                  <span className="col-span-2 text-right">Date</span>
                </div>

                {/* Runs List (Responsive) */}
                <div className="flex flex-col divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {runs.map((run, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={run.id} 
                      className="grid grid-cols-2 gap-y-4 lg:grid-cols-12 lg:gap-4 p-5 lg:items-center hover:bg-white/[0.02] transition-colors"
                    >
                      {/* ID */}
                      <div className="col-span-2 lg:col-span-4 flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-0">
                        <span className="lg:hidden text-[10px] font-mono uppercase tracking-widest text-neutral-500">Workflow ID</span>
                        <span className="font-mono text-sm text-neutral-300 truncate pr-4">
                          {run.workflow_id}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-1 lg:col-span-2 flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-0">
                        <span className="lg:hidden text-[10px] font-mono uppercase tracking-widest text-neutral-500">Status</span>
                        <div className="flex">
                           <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${statusColors[run.status] || "text-neutral-500 bg-neutral-500/10 border-neutral-500/20"}`}>
                             {run.status}
                           </span>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="col-span-1 lg:col-span-2 flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-0">
                        <span className="lg:hidden text-[10px] font-mono uppercase tracking-widest text-neutral-500">Duration</span>
                        <span className="font-mono text-sm text-neutral-300">
                          {run.duration_seconds != null ? `${run.duration_seconds.toFixed(1)}s` : "—"}
                        </span>
                      </div>

                      {/* Tokens */}
                      <div className="col-span-1 lg:col-span-2 flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-0">
                         <span className="lg:hidden text-[10px] font-mono uppercase tracking-widest text-neutral-500">Tokens</span>
                         <span className="font-mono text-sm text-neutral-300">
                          {run.total_tokens != null ? run.total_tokens.toLocaleString() : "—"}
                         </span>
                      </div>

                      {/* Date */}
                      <div className="col-span-1 lg:col-span-2 flex flex-col lg:flex-row lg:items-center lg:justify-end gap-1 lg:gap-0">
                         <span className="lg:hidden text-[10px] font-mono uppercase tracking-widest text-neutral-500">Date</span>
                         <span className="font-mono text-xs text-neutral-400 tabular-nums">
                          {new Date(run.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                         </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
