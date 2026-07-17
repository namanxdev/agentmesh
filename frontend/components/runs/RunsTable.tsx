"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, AlertCircle, RefreshCw, Play } from "lucide-react";
import { RunDetailPanel, type RunRow } from "./RunDetailPanel";

// --- Relative time helper ---

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function absoluteTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// --- Status components ---

const STATUS_DOT: Record<RunRow["status"], string> = {
  completed: "bg-green-400",
  error: "bg-red-400",
  running: "bg-indigo-400 animate-pulse",
};

const STATUS_LABEL: Record<RunRow["status"], string> = {
  completed: "text-green-400",
  error: "text-red-400",
  running: "text-indigo-300",
};

interface StatusDotProps {
  status: RunRow["status"];
}

function StatusCell({ status }: StatusDotProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
      <span className={`text-xs font-mono font-medium ${STATUS_LABEL[status]}`}>
        {status}
      </span>
    </div>
  );
}

// --- Filter chips ---

type StatusFilter = "all" | "completed" | "error" | "running";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "error", label: "Error" },
  { value: "running", label: "Running" },
];

interface FilterChipsProps {
  active: StatusFilter;
  onChange: (v: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
}

function FilterChips({ active, onChange, counts }: FilterChipsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {FILTER_OPTIONS.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              isActive
                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                : "bg-transparent border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
            }`}
          >
            {label}
            <span
              className={`tabular-nums ${
                isActive ? "text-indigo-400" : "text-neutral-600"
              }`}
            >
              {counts[value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// --- Table header ---

function TableHeader() {
  return (
    <div className="hidden md:grid md:grid-cols-[24px_1fr_120px_80px_80px_90px_80px] gap-3 px-4 py-2 border-b border-neutral-800 bg-neutral-900/60">
      <span />
      {["Status", "Pipeline", "Workflow ID", "Tokens", "Duration", "When"].map((h) => (
        <span
          key={h}
          className="text-[10px] font-mono uppercase tracking-widest text-neutral-500"
        >
          {h}
        </span>
      ))}
    </div>
  );
}

// --- Skeleton rows ---

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800/60 last:border-0"
        >
          <div className="w-4 h-4 rounded bg-neutral-800 animate-pulse shrink-0" />
          <div className="flex-1 h-3.5 rounded bg-neutral-800 animate-pulse" />
          <div className="w-20 h-3.5 rounded bg-neutral-800 animate-pulse" />
          <div className="w-16 h-3.5 rounded bg-neutral-800 animate-pulse" />
          <div className="w-12 h-3.5 rounded bg-neutral-800 animate-pulse" />
        </div>
      ))}
    </>
  );
}

// --- Single run row ---

interface RunRowProps {
  run: RunRow;
  isExpanded: boolean;
  onToggle: () => void;
}

function RunTableRow({ run, isExpanded, onToggle }: RunRowProps) {
  const wfShort = run.workflow_id.length > 16
    ? `${run.workflow_id.slice(0, 8)}…${run.workflow_id.slice(-6)}`
    : run.workflow_id;

  return (
    <>
      {/* Main row — desktop grid */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
        className={`group grid md:grid-cols-[24px_1fr_120px_80px_80px_90px_80px] gap-3 px-4 py-3 border-b border-neutral-800/60 last:border-0 cursor-pointer transition-colors hover:bg-neutral-900/60 focus-visible:outline-none focus-visible:bg-neutral-900/60 ${
          isExpanded ? "bg-neutral-900/40" : ""
        }`}
      >
        {/* Expand chevron */}
        <div className="flex items-center justify-center">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-500 shrink-0" />
          )}
        </div>

        {/* Status */}
        <StatusCell status={run.status} />

        {/* Pipeline name */}
        <span
          className="text-xs font-medium text-neutral-300 truncate"
          title={run.pipeline_name ?? undefined}
        >
          {run.pipeline_name ?? (
            <span className="text-neutral-600">—</span>
          )}
        </span>

        {/* Workflow ID short */}
        <span className="text-xs font-mono text-neutral-500 truncate" title={run.workflow_id}>
          {wfShort}
        </span>

        {/* Tokens */}
        <span className="text-xs font-mono text-neutral-400 tabular-nums">
          {run.total_tokens != null ? run.total_tokens.toLocaleString() : (
            <span className="text-neutral-700">—</span>
          )}
        </span>

        {/* Duration */}
        <span className="text-xs font-mono text-neutral-400 tabular-nums">
          {run.duration_seconds != null ? `${run.duration_seconds.toFixed(1)}s` : (
            <span className="text-neutral-700">—</span>
          )}
        </span>

        {/* Created at */}
        <span
          className="text-xs font-mono text-neutral-500 tabular-nums"
          title={absoluteTime(run.created_at)}
        >
          {relativeTime(run.created_at)}
        </span>
      </div>

      {/* Expanded detail panel */}
      {isExpanded && <RunDetailPanel run={run} />}
    </>
  );
}

// --- Main table ---

interface RunsTableProps {
  runs: RunRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function RunsTable({ runs, loading, error, onRetry }: RunsTableProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const counts: Record<StatusFilter, number> = {
    all: runs.length,
    completed: runs.filter((r) => r.status === "completed").length,
    error: runs.filter((r) => r.status === "error").length,
    running: runs.filter((r) => r.status === "running").length,
  };

  const filtered =
    activeFilter === "all"
      ? runs
      : runs.filter((r) => r.status === activeFilter);

  // --- Header bar ---
  const headerBar = (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-neutral-800 bg-neutral-900/40">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-sm font-semibold text-neutral-100 tracking-tight shrink-0">Runs</h1>
        {!loading && !error && (
          <span className="text-[10px] font-mono text-neutral-500 tabular-nums">
            {runs.length} total
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!loading && !error && (
          <FilterChips
            active={activeFilter}
            onChange={setActiveFilter}
            counts={counts}
          />
        )}
        <button
          onClick={onRetry}
          disabled={loading}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-neutral-800 text-neutral-500 hover:text-neutral-200 hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Refresh runs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );

  // --- Body states ---
  let body: React.ReactNode;

  if (loading && runs.length === 0) {
    body = <SkeletonRows />;
  } else if (error) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400/60" />
        <p className="text-sm text-neutral-300 font-medium">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-700 text-xs font-medium text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    );
  } else if (runs.length === 0) {
    body = (
      <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
        <Play className="w-6 h-6 text-neutral-700 mb-1" />
        <p className="text-sm text-neutral-500">
          No runs yet —{" "}
          <Link
            href="/dashboard/pipelines"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            run a pipeline
          </Link>{" "}
          to see it here.
        </p>
      </div>
    );
  } else if (filtered.length === 0) {
    body = (
      <div className="flex items-center justify-center py-12 px-6">
        <p className="text-sm text-neutral-500">
          No {activeFilter} runs.
        </p>
      </div>
    );
  } else {
    body = filtered.map((run) => (
      <RunTableRow
        key={run.id}
        run={run}
        isExpanded={expandedId === run.id}
        onToggle={() => handleToggle(run.id)}
      />
    ));
  }

  return (
    <div className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden shadow-sm">
      {headerBar}
      {/* Column headers — only shown when there's data */}
      {!loading && !error && filtered.length > 0 && <TableHeader />}
      <div className="flex flex-col divide-y divide-neutral-800/50">
        {body}
      </div>
    </div>
  );
}
