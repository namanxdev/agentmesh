"use client";

import { useEffect, useRef } from "react";
import { useEventStore } from "@/stores/eventStore";
import type { AgentMeshEvent } from "@/types/events";

const MAX_EVENTS = 15;

interface EventLine {
  text: string;
  ts: string;
  color: string;
}

function formatTs(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function describeEvent(event: AgentMeshEvent): EventLine {
  const ts = formatTs(event.timestamp);

  switch (event.type) {
    case "workflow.started":
      return {
        ts,
        text: `workflow.started  agents=[${event.agents.join(", ")}]`,
        color: "#818cf8", // indigo-400
      };
    case "workflow.completed":
      return {
        ts,
        text: `workflow.completed  tokens=${event.totalTokens.toLocaleString()}  dur=${event.duration.toFixed(1)}s`,
        color: "#4ade80", // green-400
      };
    case "workflow.error":
      return {
        ts,
        text: `workflow.error  agent=${event.failedAgent}  ${event.error}`,
        color: "#f87171", // red-400
      };
    case "agent.activated":
      return {
        ts,
        text: `${event.agentName}  activated  ${event.taskDescription ? `task="${event.taskDescription.slice(0, 60)}"` : ""}`,
        color: "#60a5fa", // blue-400
      };
    case "agent.thinking":
      return {
        ts,
        text: `${event.agentName}  thinking…`,
        color: "#fbbf24", // amber-400
      };
    case "agent.completed":
      return {
        ts,
        text: `${event.agentName}  completed`,
        color: "#34d399", // emerald-400
      };
    case "agent.handoff":
      return {
        ts,
        text: `handoff  ${event.fromAgent} → ${event.toAgent}  reason="${event.reason}"`,
        color: "#a78bfa", // violet-400
      };
    case "tool.called":
      return {
        ts,
        text: `${event.agentName}  tool.call  ${event.server}.${event.tool}`,
        color: "#fb923c", // orange-400
      };
    case "tool.result":
      return {
        ts,
        text: `${event.agentName}  tool.ok    ${event.server}.${event.tool}  ${event.duration_ms}ms`,
        color: "#6b7280", // neutral-500
      };
    case "tool.error":
      return {
        ts,
        text: `${event.agentName}  tool.err   ${event.tool}  ${event.error}`,
        color: "#f87171", // red-400
      };
    case "token.usage":
      return {
        ts,
        text: `${event.agentName}  tokens  in=${event.input}  out=${event.output}  total=${event.total.toLocaleString()}`,
        color: "#4b5563", // neutral-600
      };
    default:
      return { ts, text: "unknown event", color: "#4b5563" };
  }
}

export function LiveEventFeed() {
  const events = useEventStore((s) => s.events);
  const bottomRef = useRef<HTMLDivElement>(null);

  const recent = events.slice(-MAX_EVENTS);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 flex-shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          Live event feed
        </span>
        <span className="text-[10px] font-mono text-neutral-700 tabular-nums">
          {events.length} total
        </span>
      </div>

      {/* Log area */}
      <div
        className="overflow-y-auto custom-scrollbar"
        style={{ height: 220 }}
        role="log"
        aria-live="polite"
        aria-label="Live event log"
      >
        {recent.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[11px] font-mono text-neutral-700">
              Waiting for events…
            </span>
          </div>
        ) : (
          <div className="py-1">
            {recent.map((event) => {
              const line = describeEvent(event);
              return (
                <div
                  key={event.id}
                  className="grid px-3 py-[3px] hover:bg-neutral-900/60 transition-colors"
                  style={{ gridTemplateColumns: "54px 1fr" }}
                >
                  <span
                    className="text-[10px] font-mono text-neutral-700 select-none flex-shrink-0 tabular-nums pt-px"
                  >
                    {line.ts}
                  </span>
                  <span
                    className="text-[11px] font-mono leading-relaxed break-all"
                    style={{ color: line.color }}
                  >
                    {line.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
