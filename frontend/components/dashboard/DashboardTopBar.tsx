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
    <header className="flex items-center justify-between px-4 h-11 border-b border-neutral-800 bg-neutral-950 shrink-0">
      {/* Left: section name */}
      <span className="text-sm font-semibold text-neutral-200 tracking-tight">
        {sectionLabel}
      </span>

      {/* Right: status indicators */}
      <div className="flex items-center gap-3">
        {/* Run state */}
        {mode === "run" && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.03]">
            <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${isRunning ? "animate-pulse" : ""}`} />
            <span className="text-[10px] uppercase font-mono font-medium tracking-widest text-emerald-500/80">
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
          <span className="text-[11px] text-neutral-500 hidden sm:block font-mono">
            {connectionLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
