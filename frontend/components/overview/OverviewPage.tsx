"use client";

import { ActiveRunStrip } from "./ActiveRunStrip";
import { LiveEventFeed } from "./LiveEventFeed";
import { RecentRunsTable } from "./RecentRunsTable";
import { StatusRow } from "./StatusRow";

export function OverviewPage() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 max-w-5xl mx-auto flex flex-col gap-5">

        {/* Page header */}
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-neutral-200 tracking-tight">
              Mission Control
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5 font-mono">
              AgentMesh orchestrator — live execution view
            </p>
          </div>
        </div>

        {/* 1. Active run hero */}
        <section className="flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
            Active run
          </span>
          <ActiveRunStrip />
        </section>

        {/* 2. Live event feed */}
        <section className="flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
            Event stream
          </span>
          <LiveEventFeed />
        </section>

        {/* 3. Recent runs */}
        <section className="flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
            Recent runs
          </span>
          <RecentRunsTable />
        </section>

        {/* 4. Status row */}
        <section className="flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
            System status
          </span>
          <StatusRow />
        </section>

      </div>
    </div>
  );
}
