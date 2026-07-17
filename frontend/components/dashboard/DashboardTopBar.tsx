"use client";

import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/uiStore";
import { usePipelineStore } from "@/stores/pipelineStore";

const SECTION_LABELS: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/pipelines": "Pipelines",
  "/dashboard/runs": "Runs",
  "/dashboard/mcp": "MCP Registry",
  "/dashboard/analytics": "Analytics",
};

function getSectionLabel(pathname: string): string {
  // Exact match first
  if (SECTION_LABELS[pathname]) return SECTION_LABELS[pathname];
  // Prefix match (for nested routes)
  const match = Object.keys(SECTION_LABELS)
    .filter((k) => k !== "/dashboard")
    .find((k) => pathname.startsWith(k + "/"));
  return match ? SECTION_LABELS[match] : "Dashboard";
}

export function DashboardTopBar() {
  const pathname = usePathname();
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const isRunning = usePipelineStore((s) => s.isRunning);
  const mode = usePipelineStore((s) => s.mode);

  const sectionLabel = getSectionLabel(pathname);

  const connectionColor =
    connectionStatus === "connected"
      ? "bg-emerald-500"
      : connectionStatus === "connecting" || connectionStatus === "reconnecting"
        ? "bg-amber-500"
        : connectionStatus === "idle"
          ? "bg-neutral-600"
          : "bg-red-500";

  const connectionLabel =
    connectionStatus === "connected"
      ? "Connected"
      : connectionStatus === "connecting"
        ? "Connecting"
        : connectionStatus === "reconnecting"
          ? "Reconnecting"
          : connectionStatus === "idle"
            ? "Idle"
            : "Disconnected";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-600 sm:inline">Workspace</span>
        <span className="hidden text-neutral-700 sm:inline">/</span>
        <span className="truncate text-sm font-medium tracking-tight text-neutral-200">{sectionLabel}</span>
      </div>

      {/* Right: status indicators */}
      <div className="flex items-center gap-4">
        {/* Run state */}
        {mode === "run" && (
          <div className="flex items-center gap-1.5 border-l border-emerald-500/40 pl-2.5">
            <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${isRunning ? "animate-pulse" : ""}`} />
            <span className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-emerald-400">
              {isRunning ? "Running" : "Live"}
            </span>
          </div>
        )}

        {/* WebSocket status */}
        <div
          className="flex items-center gap-1.5"
          title={`WebSocket: ${connectionLabel}`}
        >
          <span className={`h-2 w-2 rounded-full ${connectionColor} ${connectionStatus === "connecting" || connectionStatus === "reconnecting" ? "animate-pulse" : ""}`} />
          <span className="hidden font-mono text-[11px] text-neutral-500 sm:block">
            {connectionLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
