"use client";

import { useCallback, useEffect, useState } from "react";
import { RunsTable } from "./RunsTable";
import type { RunRow } from "./RunDetailPanel";

export function RunsPage() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/runs?limit=50");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Failed to load runs (${res.status})`);
      }
      const data = await res.json();
      setRuns(data.runs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRuns();
  }, [fetchRuns]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="app-page flex flex-col gap-6">
        <div className="border-b border-neutral-800 pb-5">
          <p className="app-eyebrow">Execution archive</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-100">Run history</h1>
          <p className="mt-1 text-sm text-neutral-500">Inspect completed workflows, live work, and failures without leaving the control plane.</p>
        </div>
        <RunsTable
          runs={runs}
          loading={loading}
          error={error}
          onRetry={fetchRuns}
        />
      </div>
    </div>
  );
}
