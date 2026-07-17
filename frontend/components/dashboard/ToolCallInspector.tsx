"use client";

import { useCallback, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, FileText, PanelRightOpen, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentStatusBadge } from "@/components/agents/AgentStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { useEventStore, type AgentRuntimeState } from "@/stores/eventStore";
import { useUIStore, type InspectorTab } from "@/stores/uiStore";
import type { ToolCalledEvent, ToolErrorEvent, ToolResultEvent } from "@/types/events";

interface ToolCall {
  call: ToolCalledEvent;
  result?: ToolResultEvent;
  error?: ToolErrorEvent;
}

function buildToolCalls(events: ReturnType<typeof useEventStore.getState>["events"]): ToolCall[] {
  const callMap = new Map<string, ToolCall>();

  for (const event of events) {
    if (event.type === "tool.called") {
      callMap.set(event.id, { call: event });
      continue;
    }
    if (event.type !== "tool.result" && event.type !== "tool.error") continue;

    for (const [key, toolCall] of callMap) {
      if (
        toolCall.call.agentName === event.agentName &&
        toolCall.call.tool === event.tool &&
        !toolCall.result &&
        !toolCall.error
      ) {
        callMap.set(key, event.type === "tool.result" ? { ...toolCall, result: event } : { ...toolCall, error: event });
        break;
      }
    }
  }

  return Array.from(callMap.values()).reverse();
}

const TABS: Array<{ key: InspectorTab; label: string }> = [
  { key: "output", label: "Output" },
  { key: "tools", label: "Tool calls" },
  { key: "agent", label: "Agent" },
  { key: "tokens", label: "Tokens" },
];

export function ToolCallInspector() {
  const events = useEventStore((store) => store.events);
  const agentStates = useEventStore((store) => store.agentStates);
  const totalTokens = useEventStore((store) => store.totalTokens);
  const lastOutput = useEventStore((store) => store.lastOutput);
  const selectedAgent = useUIStore((store) => store.selectedAgent);
  const inspectorTab = useUIStore((store) => store.inspectorTab);
  const setInspectorTab = useUIStore((store) => store.setInspectorTab);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const allCalls = buildToolCalls(events);
  const calls = selectedAgent
    ? allCalls.filter((toolCall) => toolCall.call.agentName === selectedAgent)
    : allCalls;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-neutral-900">
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-neutral-800 px-3">
        <span className="min-w-0 truncate text-xs font-medium text-neutral-300">{selectedAgent ?? "All agents"}</span>
        <Badge>{events.length} events</Badge>
      </div>
      <div className="grid shrink-0 grid-cols-4 border-b border-neutral-800">
        {TABS.map(({ key, label }) => {
          const active = inspectorTab === key;
          return (
            <button
              type="button"
              key={key}
              onClick={() => setInspectorTab(key)}
              className={`relative h-9 px-1 text-[10px] font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-indigo-500 ${active ? "text-indigo-300 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-indigo-500" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {inspectorTab === "output" ? <OutputPanel lastOutput={lastOutput} /> : null}
        {inspectorTab === "tools" ? <ToolsPanel calls={calls} expandedId={expandedId} setExpandedId={setExpandedId} /> : null}
        {inspectorTab === "agent" ? <AgentPanel selectedAgent={selectedAgent} agentStates={agentStates} /> : null}
        {inspectorTab === "tokens" ? <TokensPanel agentStates={agentStates} totalTokens={totalTokens} /> : null}
      </div>
    </div>
  );
}

function EmptyPanel({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center px-5 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-500">{icon}</div>
      <p className="mt-3 text-xs font-medium text-neutral-300">{title}</p>
      <p className="mt-1 max-w-52 text-[11px] leading-4 text-neutral-500">{copy}</p>
    </div>
  );
}

function OutputPanel({ lastOutput }: { lastOutput: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const displayOutput = lastOutput?.replace(/\n?\[ROUTE:\s*[a-zA-Z_][a-zA-Z0-9_]*\]\s*$/g, "").trim() ?? "";

  const handleCopy = useCallback(() => {
    if (!displayOutput) return;
    void navigator.clipboard.writeText(displayOutput);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [displayOutput]);

  if (!displayOutput) {
    return <EmptyPanel icon={<FileText className="h-4 w-4" />} title="No output yet" copy="Run a pipeline to see its final result." />;
  }

  const wordCount = displayOutput.trim().split(/\s+/).length;
  const characterCount = displayOutput.length;

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-3 py-2">
          <span className="font-mono text-[9px] text-neutral-500">{wordCount.toLocaleString()} words · {characterCount.toLocaleString()} chars</span>
          <div className="flex items-center gap-1">
            <CompactButton onClick={handleCopy} label={copied ? "Copied" : "Copy"} icon={copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />} />
            <CompactButton onClick={() => setIsExpanded(true)} label="Read" icon={<PanelRightOpen className="h-3 w-3" />} />
          </div>
        </div>
        <div className="sidebar-view custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayOutput}</ReactMarkdown>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-[200] isolate flex justify-end">
            <button type="button" aria-label="Close output" className="absolute inset-0 bg-black/70" onClick={() => setIsExpanded(false)} />
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex h-full w-full max-w-[920px] flex-col border-l border-neutral-800 bg-neutral-900 shadow-sm"
            >
              <header className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-400"><FileText className="h-4 w-4" /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-100">Output</h2>
                    <p className="mt-0.5 font-mono text-[9px] text-neutral-500">{wordCount.toLocaleString()} words · {characterCount.toLocaleString()} chars</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <ActionButton onClick={handleCopy}>{copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}</ActionButton>
                  <ActionButton onClick={() => setIsExpanded(false)}><X className="h-3.5 w-3.5" /> Close</ActionButton>
                </div>
              </header>
              <div className="custom-scrollbar flex min-h-0 flex-1 justify-center overflow-y-auto">
                <article className="document-view w-full max-w-[920px] px-6 py-8 md:px-10"><ReactMarkdown remarkPlugins={[remarkGfm]}>{displayOutput}</ReactMarkdown></article>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function CompactButton({ onClick, label, icon }: { onClick: () => void; label: string; icon: ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label} className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] text-neutral-500 transition-colors duration-150 ease-out hover:bg-neutral-800 hover:text-neutral-200">
      {icon}<span>{label}</span>
    </button>
  );
}

function ActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex h-8 items-center gap-1.5 rounded-md border border-neutral-700 px-2.5 text-xs text-neutral-400 transition-colors duration-150 ease-out hover:bg-neutral-800 hover:text-neutral-100">
      {children}
    </button>
  );
}

function ToolsPanel({ calls, expandedId, setExpandedId }: { calls: ToolCall[]; expandedId: string | null; setExpandedId: (id: string | null) => void }) {
  if (calls.length === 0) {
    return <EmptyPanel icon={<PanelRightOpen className="h-4 w-4" />} title="No tool calls yet" copy="Tool activity will appear here during a run." />;
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-2">
      {calls.map((toolCall) => {
        const expanded = expandedId === toolCall.call.id;
        const state = toolCall.error ? "error" : toolCall.result ? "success" : "pending";
        const stateLabel = toolCall.error ? "Error" : toolCall.result ? `${toolCall.result.duration_ms}ms` : "Pending";
        const dotClass = state === "error" ? "bg-red-400" : state === "success" ? "bg-emerald-400" : "bg-amber-400";

        return (
          <div key={toolCall.call.id} className="mb-1.5 overflow-hidden rounded-md border border-neutral-700 bg-neutral-800 shadow-sm">
            <button type="button" onClick={() => setExpandedId(expanded ? null : toolCall.call.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-neutral-700/60">
              <span className="min-w-0 truncate font-mono text-[11px] text-neutral-300"><span className="text-neutral-500">{toolCall.call.server}.</span>{toolCall.call.tool}</span>
              <Badge><span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />{stateLabel}</Badge>
            </button>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="overflow-hidden border-t border-neutral-700 bg-neutral-950">
                  <div className="space-y-3 p-3">
                    <CodeBlock label="Arguments" value={toolCall.call.args} />
                    {toolCall.result ? <CodeBlock label="Result" value={toolCall.result.result} /> : null}
                    {toolCall.error ? <p className="font-mono text-[10px] leading-4 text-red-400">{toolCall.error.error}</p> : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function CodeBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-medium text-neutral-500">{label}</div>
      <pre className="custom-scrollbar max-h-32 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-4 text-neutral-400">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

function AgentPanel({ selectedAgent, agentStates }: { selectedAgent: string | null; agentStates: Record<string, AgentRuntimeState> }) {
  if (!selectedAgent) {
    return <EmptyPanel icon={<PanelRightOpen className="h-4 w-4" />} title="No agent selected" copy="Choose an agent in the left panel to inspect it." />;
  }

  const state = agentStates[selectedAgent];
  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-3">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <h3 className="min-w-0 truncate text-sm font-semibold text-neutral-100">{selectedAgent}</h3>
        <AgentStatusBadge status={state?.status ?? "idle"} />
      </div>
      <dl className="mt-3 space-y-2.5">
        {[
          ["Tokens in", state?.token_input.toLocaleString() ?? "0"],
          ["Tokens out", state?.token_output.toLocaleString() ?? "0"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-[11px] text-neutral-500">{label}</dt>
            <dd className="m-0 font-mono text-[11px] text-neutral-300">{value}</dd>
          </div>
        ))}
        {state?.current_task ? (
          <div className="pt-1">
            <dt className="mb-1.5 text-[11px] text-neutral-500">Current task</dt>
            <dd className="m-0 rounded-md border border-neutral-700 bg-neutral-800 p-3 text-xs leading-5 text-neutral-400">{state.current_task}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function TokensPanel({ agentStates, totalTokens }: { agentStates: Record<string, AgentRuntimeState>; totalTokens: number }) {
  const entries = Object.entries(agentStates);
  if (entries.length === 0) {
    return <EmptyPanel icon={<FileText className="h-4 w-4" />} title="No token data" copy="Usage appears after an agent produces tokens." />;
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-3">
      <div className="space-y-4">
        {entries.map(([name, state]) => {
          const total = state.token_input + state.token_output;
          const percentage = totalTokens > 0 ? (total / totalTokens) * 100 : 0;
          return (
            <div key={name}>
              <div className="mb-1.5 flex justify-between gap-3">
                <span className="truncate text-[11px] text-neutral-400">{name}</span>
                <span className="font-mono text-[11px] text-neutral-300">{total.toLocaleString()}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-sm bg-neutral-700">
                <div className="h-full rounded-sm bg-indigo-500 transition-[width] duration-150 ease-out" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-neutral-800 pt-3">
        <span className="text-[11px] text-neutral-500">Total</span>
        <span className="font-mono text-xs text-neutral-300" role="status" aria-live="polite">{totalTokens.toLocaleString()}</span>
      </div>
    </div>
  );
}
