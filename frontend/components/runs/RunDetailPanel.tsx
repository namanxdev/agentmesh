"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { useEventStore, type AgentRuntimeState } from "@/stores/eventStore";

export interface RunRow {
  id: string;
  workflow_id: string;
  pipeline_id: string | null;
  pipeline_name: string | null;
  status: "running" | "completed" | "error";
  total_tokens: number | null;
  duration_seconds: number | null;
  error: string | null;
  created_at: string;
}

interface CopyButtonProps {
  text: string;
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silent fail
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center w-6 h-6 rounded text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

const AGENT_STATUS_COLORS: Record<string, string> = {
  idle: "text-neutral-400",
  active: "text-indigo-400",
  thinking: "text-amber-400",
  completed: "text-green-400",
  error: "text-red-400",
};

const AGENT_STATUS_DOT: Record<string, string> = {
  idle: "bg-neutral-500",
  active: "bg-indigo-400 animate-pulse",
  thinking: "bg-amber-400 animate-pulse",
  completed: "bg-green-400",
  error: "bg-red-400",
};

interface LiveAgentRowProps {
  name: string;
  state: AgentRuntimeState;
}

function LiveAgentRow({ name, state }: LiveAgentRowProps) {
  const dotClass = AGENT_STATUS_DOT[state.status] ?? "bg-neutral-500";
  const textClass = AGENT_STATUS_COLORS[state.status] ?? "text-neutral-400";
  const tokens = state.token_input + state.token_output;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/50 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
        <span className="text-xs font-mono text-neutral-300 truncate">{name}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0 ml-4">
        {tokens > 0 && (
          <span className="text-[10px] font-mono text-neutral-500">
            {tokens.toLocaleString()} tok
          </span>
        )}
        <span className={`text-[10px] font-mono uppercase tracking-wider font-medium ${textClass}`}>
          {state.status}
        </span>
      </div>
    </div>
  );
}

interface RunDetailPanelProps {
  run: RunRow;
}

export function RunDetailPanel({ run }: RunDetailPanelProps) {
  const workflowId = useEventStore((s) => s.workflowId);
  const agentStates = useEventStore((s) => s.agentStates);
  const isLive = workflowId === run.workflow_id && run.status === "running";
  const agentEntries = Object.entries(agentStates);

  return (
    <div className="px-4 pb-4 pt-3 bg-neutral-950 border-t border-neutral-800/70 flex flex-col gap-4">
      {/* IDs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Full Workflow ID */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Workflow ID
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-neutral-300 break-all leading-relaxed">
              {run.workflow_id}
            </span>
            <CopyButton text={run.workflow_id} />
          </div>
        </div>

        {/* Pipeline ID */}
        {run.pipeline_id && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              Pipeline ID
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-neutral-300 break-all leading-relaxed">
                {run.pipeline_id}
              </span>
              <CopyButton text={run.pipeline_id} />
            </div>
          </div>
        )}
      </div>

      {/* Error block */}
      {run.status === "error" && run.error && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-red-500/70">
            Error
          </span>
          <pre className="text-xs font-mono text-red-300 bg-red-500/8 border border-red-500/20 rounded-md px-3 py-2.5 whitespace-pre-wrap break-all leading-relaxed">
            {run.error}
          </pre>
        </div>
      )}

      {/* Live agents */}
      {isLive && agentEntries.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400/80">
              Live Agents
            </span>
          </div>
          <div className="rounded-md border border-indigo-500/15 bg-indigo-500/5 px-3 py-1">
            {agentEntries.map(([name, state]) => (
              <LiveAgentRow key={name} name={name} state={state} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
