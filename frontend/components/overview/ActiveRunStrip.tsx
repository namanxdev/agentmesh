"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEventStore } from "@/stores/eventStore";
import { getAgentColor } from "@/types/agents";
import type { AgentStatus } from "@/types/events";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function statusLabel(status: AgentStatus): string {
  switch (status) {
    case "active":
      return "active";
    case "thinking":
      return "thinking";
    case "completed":
      return "done";
    case "error":
      return "error";
    default:
      return "idle";
  }
}

function statusColor(status: AgentStatus): string {
  switch (status) {
    case "active":
      return "text-indigo-400";
    case "thinking":
      return "text-amber-400";
    case "completed":
      return "text-green-400";
    case "error":
      return "text-red-400";
    default:
      return "text-neutral-500";
  }
}

function statusDot(status: AgentStatus): string {
  switch (status) {
    case "active":
      return "bg-indigo-400";
    case "thinking":
      return "bg-amber-400";
    case "completed":
      return "bg-green-400";
    case "error":
      return "bg-red-400";
    default:
      return "bg-neutral-600";
  }
}

interface AgentUnitProps {
  name: string;
  status: AgentStatus;
  tokenInput: number;
  tokenOutput: number;
  agentIndex: number;
  isActive: boolean;
}

function AgentUnit({ name, status, tokenInput, tokenOutput, agentIndex, isActive }: AgentUnitProps) {
  const accentColor = getAgentColor(agentIndex);
  const total = tokenInput + tokenOutput;

  return (
    <div
      className="relative flex flex-col gap-1.5 rounded-md border px-3 py-2.5 min-w-[120px]"
      style={{
        borderColor: isActive ? accentColor + "60" : "rgba(255,255,255,0.08)",
        backgroundColor: isActive ? accentColor + "0d" : "rgba(255,255,255,0.02)",
        animation: isActive ? "agentPulse 2s ease-in-out infinite" : undefined,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusDot(status)}`}
        />
        <span
          className="text-xs font-medium text-neutral-200 truncate max-w-[100px]"
          title={name}
        >
          {name}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-mono uppercase tracking-wide ${statusColor(status)}`}>
          {statusLabel(status)}
        </span>
        {total > 0 && (
          <span className="text-[10px] font-mono text-neutral-500 tabular-nums">
            {total.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

export function ActiveRunStrip() {
  const workflowStatus = useEventStore((s) => s.workflowStatus);
  const workflowId = useEventStore((s) => s.workflowId);
  const agentStates = useEventStore((s) => s.agentStates);
  const totalTokens = useEventStore((s) => s.totalTokens);
  const events = useEventStore((s) => s.events);

  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track start time from workflow.started event
  useEffect(() => {
    const startEvent = events.find((e) => e.type === "workflow.started");
    if (startEvent) {
      startTimeRef.current = startEvent.timestamp * 1000;
    }
  }, [events]);

  // Tick elapsed only while running
  useEffect(() => {
    if (workflowStatus === "running") {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Keep last elapsed value on completed/error
      if (workflowStatus === "idle") {
        setElapsed(0);
        startTimeRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workflowStatus]);

  const agentEntries = Object.entries(agentStates);
  const hasAgents = agentEntries.length > 0;

  const completedEvent = events.find((e) => e.type === "workflow.completed");
  const finalDuration =
    completedEvent && completedEvent.type === "workflow.completed"
      ? completedEvent.duration
      : null;

  // Find the currently active/thinking agent for emphasis
  const activeAgentName =
    agentEntries.find(([, s]) => s.status === "active" || s.status === "thinking")?.[0] ?? null;

  if (workflowStatus === "idle" && !hasAgents) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3">
        <span className="text-xs text-neutral-600 font-mono">No active run</span>
        <Link
          href="/dashboard/pipelines"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
        >
          Open pipeline editor
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          {workflowStatus === "running" && (
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          )}
          {workflowStatus === "completed" && (
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
          )}
          {workflowStatus === "error" && (
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
          )}
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-widest font-mono">
            {workflowStatus === "running"
              ? "Running"
              : workflowStatus === "completed"
              ? "Completed"
              : workflowStatus === "error"
              ? "Error"
              : "Idle"}
          </span>
          {workflowId && (
            <span className="text-[10px] text-neutral-600 font-mono truncate max-w-[180px]" title={workflowId}>
              {workflowId.slice(0, 8)}…
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-500">
          {(workflowStatus === "running" || elapsed > 0) && (
            <span className="tabular-nums">
              {formatDuration(finalDuration != null ? Math.round(finalDuration) : elapsed)}
            </span>
          )}
          {totalTokens > 0 && (
            <span className="tabular-nums text-neutral-400">
              {totalTokens.toLocaleString()} tok
            </span>
          )}
        </div>
      </div>

      {/* Agent execution units */}
      {hasAgents && (
        <div className="flex items-start gap-2 flex-wrap">
          {agentEntries.map(([name, state], idx) => (
            <AgentUnit
              key={name}
              name={name}
              status={state.status}
              tokenInput={state.token_input}
              tokenOutput={state.token_output}
              agentIndex={idx}
              isActive={name === activeAgentName}
            />
          ))}
        </div>
      )}

      {/* Inline CSS for the pulse animation */}
      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}
