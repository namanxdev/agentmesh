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
      <div className="p-6 max-w-5xl mx-auto flex flex-col gap-4">
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
