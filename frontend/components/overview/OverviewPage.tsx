"use client";

import Link from "next/link";
import { ArrowUpRight, GitBranch } from "lucide-react";
import { ActiveRunStrip } from "./ActiveRunStrip";
import { LiveEventFeed } from "./LiveEventFeed";
import { RecentRunsTable } from "./RecentRunsTable";
import { StatusRow } from "./StatusRow";

export function OverviewPage() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="app-page flex flex-col gap-8">
        <div className="flex items-end justify-between gap-5 border-b border-neutral-800 pb-6">
          <div>
            <p className="app-eyebrow">Control plane</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-100">Observe execution</h1>
            <p className="mt-1 max-w-xl text-sm text-neutral-500">
              The current workflow, its event stream, and the operating state of your local agent system.
            </p>
          </div>
          <Link
            href="/dashboard/pipelines"
            className="hidden shrink-0 items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:text-neutral-100 sm:flex"
          >
            <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
            Open pipeline
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500" />
          </Link>
        </div>

        <section className="flex flex-col gap-2.5">
          <span className="app-eyebrow">Active run</span>
          <ActiveRunStrip />
        </section>

        <section className="flex flex-col gap-2.5">
          <span className="app-eyebrow">Event stream</span>
          <LiveEventFeed />
        </section>

        <section className="flex flex-col gap-2.5">
          <span className="app-eyebrow">Recent runs</span>
          <RecentRunsTable />
        </section>

        <section className="flex flex-col gap-2.5 pb-3">
          <span className="app-eyebrow">System status</span>
          <StatusRow />
        </section>
      </div>
    </div>
  );
}
