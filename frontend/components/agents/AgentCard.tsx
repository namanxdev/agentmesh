"use client";

import { AgentStatusBadge } from "./AgentStatusBadge";
import { useEventStore } from "@/stores/eventStore";
import { useUIStore } from "@/stores/uiStore";

export function AgentCard({ name }: { name: string }) {
  const state = useEventStore((store) => store.agentStates[name]);
  const selectedAgent = useUIStore((store) => store.selectedAgent);
  const selectAgent = useUIStore((store) => store.selectAgent);
  const status = state?.status ?? "idle";
  const isSelected = selectedAgent === name;
  const tokens = state ? state.token_input + state.token_output : 0;

  return (
    <button
      type="button"
      onClick={() => selectAgent(isSelected ? null : name)}
      className={`mb-1.5 block w-full rounded-md border bg-neutral-800 p-3 text-left shadow-sm transition-[border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 ${
        isSelected ? "border-indigo-500 shadow-[0_0_0_1px_#6366f1]" : "border-neutral-700 hover:border-neutral-600"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="block truncate text-xs font-semibold text-neutral-100">{name}</span>
          <span className="mt-0.5 block text-[10px] text-neutral-500">Agent node</span>
        </div>
        <AgentStatusBadge status={status} />
      </div>
      {state?.current_task ? <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-neutral-400">{state.current_task}</p> : null}
      {tokens > 0 ? <p className="mt-2 font-mono text-[10px] text-neutral-500">{tokens.toLocaleString()} tokens</p> : null}
    </button>
  );
}
