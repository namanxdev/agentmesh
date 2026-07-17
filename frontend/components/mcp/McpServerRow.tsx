"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Wrench } from "lucide-react";

export interface McpServer {
  id: string;
  name: string;
  server_type: "stdio" | "sse" | "http";
  command_or_url: string;
}

type HealthState =
  | { status: "untested" }
  | { status: "testing" }
  | { status: "healthy"; latency_ms: number; tools: { name: string; description: string }[] }
  | { status: "failed"; error: string };

interface TestResponse {
  ok: boolean;
  latency_ms: number | null;
  tools: { name: string; description: string }[];
  error?: string;
}

function stripServerPrefix(toolName: string, serverName: string): string {
  // Tool names come back namespaced like `servername__tool_name`
  // Strip the prefix derived from the server name (lowercased, spaces→underscores)
  const prefix = serverName.toLowerCase().replace(/\s+/g, "_") + "__";
  if (toolName.startsWith(prefix)) {
    return toolName.slice(prefix.length);
  }
  // Fallback: strip anything up to the first double-underscore
  const idx = toolName.indexOf("__");
  if (idx !== -1) {
    return toolName.slice(idx + 2);
  }
  return toolName;
}

const TRANSPORT_BADGE_CLASSES: Record<string, string> = {
  stdio: "border-neutral-700 text-neutral-400",
  sse: "border-indigo-500/30 text-indigo-400",
  http: "border-sky-500/30 text-sky-400",
};

function TransportBadge({ type }: { type: string }) {
  const cls = TRANSPORT_BADGE_CLASSES[type] ?? "border-neutral-700 text-neutral-400";
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest ${cls}`}
    >
      {type}
    </span>
  );
}

function HealthDot({ state }: { state: HealthState }) {
  if (state.status === "untested") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-neutral-500">
        <span className="inline-block h-2 w-2 rounded-full bg-neutral-700" />
        Not tested
      </span>
    );
  }
  if (state.status === "testing") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-neutral-400">
        <span className="inline-block h-2 w-2 rounded-full bg-neutral-500 animate-pulse" />
        Testing&hellip;
      </span>
    );
  }
  if (state.status === "healthy") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-400">
        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
        {Math.round(state.latency_ms)}ms
      </span>
    );
  }
  // failed
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-400">
      <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
      Failed
    </span>
  );
}

export function McpServerRow({ server }: { server: McpServer }) {
  const [health, setHealth] = useState<HealthState>({ status: "untested" });
  const [toolsExpanded, setToolsExpanded] = useState(false);

  async function handleTest() {
    setHealth({ status: "testing" });
    setToolsExpanded(false);
    try {
      const res = await fetch(`/api/mcp/user-servers/${server.id}/test`, { method: "POST" });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const data: TestResponse = await res.json();
      if (data.ok) {
        setHealth({
          status: "healthy",
          latency_ms: data.latency_ms ?? 0,
          tools: data.tools ?? [],
        });
        if ((data.tools ?? []).length > 0) setToolsExpanded(true);
      } else {
        setHealth({ status: "failed", error: data.error ?? "Connection failed" });
      }
    } catch (err) {
      setHealth({
        status: "failed",
        error: err instanceof Error ? err.message : "Connection failed",
      });
    }
  }

  const isTesting = health.status === "testing";
  const hasTools = health.status === "healthy" && health.tools.length > 0;

  return (
    <div className="flex flex-col">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-900/50 transition-colors">
        {/* Name + transport */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-neutral-200 truncate">{server.name}</span>
            <TransportBadge type={server.server_type} />
          </div>
          <span
            className="truncate font-mono text-xs text-neutral-500"
            title={server.command_or_url}
          >
            {server.command_or_url}
          </span>
        </div>

        {/* Health indicator */}
        <div className="shrink-0 w-28 flex justify-center">
          <HealthDot state={health} />
        </div>

        {/* Tools toggle (only when healthy + has tools) */}
        <div className="shrink-0 w-8">
          {hasTools && (
            <button
              onClick={() => setToolsExpanded((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
              title={toolsExpanded ? "Collapse tools" : "Show tools"}
            >
              {toolsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Test button */}
        <button
          onClick={handleTest}
          disabled={isTesting}
          className="shrink-0 flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isTesting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Wrench className="w-3 h-3" />
          )}
          {isTesting ? "Testing" : "Test connection"}
        </button>
      </div>

      {/* Error block */}
      {health.status === "failed" && (
        <div className="mx-4 mb-3 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2">
          <pre className="font-mono text-xs text-red-400 whitespace-pre-wrap break-all">
            {health.error}
          </pre>
        </div>
      )}

      {/* Tools list */}
      {health.status === "healthy" && toolsExpanded && health.tools.length > 0 && (
        <div className="mx-4 mb-3 flex flex-col gap-0.5 rounded-md border border-neutral-800 bg-neutral-950 overflow-hidden">
          {health.tools.map((tool) => {
            const displayName = stripServerPrefix(tool.name, server.name);
            return (
              <div
                key={tool.name}
                className="flex items-baseline gap-3 px-3 py-2 border-b border-neutral-800 last:border-b-0"
              >
                <span className="shrink-0 font-mono text-xs text-indigo-400">{displayName}</span>
                <span className="min-w-0 truncate text-xs text-neutral-500" title={tool.description}>
                  {tool.description}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
