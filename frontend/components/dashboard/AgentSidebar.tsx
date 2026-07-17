"use client";

import { AgentCard } from "@/components/agents/AgentCard";
import { Badge } from "@/components/ui/Badge";
import { useEventStore } from "@/stores/eventStore";

export function AgentSidebar({ agentNames }: { agentNames: string[] }) {
  const totalTokens = useEventStore((store) => store.totalTokens);

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-neutral-900">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-800 px-3 py-3">
        <span className="text-xs font-medium text-neutral-400">Run participants</span>
        <Badge>{agentNames.length} loaded</Badge>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
        {agentNames.length > 0 ? (
          agentNames.map((name) => <AgentCard key={name} name={name} />)
        ) : (
          <p className="px-2 py-8 text-center text-xs leading-5 text-neutral-500">No agent nodes in this pipeline.</p>
        )}
      </div>
      {totalTokens > 0 ? (
        <div className="flex shrink-0 items-center justify-between border-t border-neutral-800 px-3 py-2.5">
          <span className="text-[11px] text-neutral-500">Token total</span>
          <span className="font-mono text-xs text-neutral-300" role="status" aria-live="polite" aria-label={`Total tokens: ${totalTokens.toLocaleString()}`}>
            {totalTokens.toLocaleString()}
          </span>
        </div>
      ) : null}
    </aside>
  );
}
