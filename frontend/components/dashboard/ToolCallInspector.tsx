"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEventStore } from "@/stores/eventStore";
import { useUIStore } from "@/stores/uiStore";
import type { ToolCalledEvent, ToolResultEvent, ToolErrorEvent } from "@/types/events";
import type { AgentRuntimeState } from "@/stores/eventStore";
import type { InspectorTab } from "@/stores/uiStore";
import { Maximize2, Minimize2, Copy, Check, FileText } from "lucide-react";

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

    if (event.type === "tool.result" || event.type === "tool.error") {
      for (const [key, toolCall] of callMap) {
        if (
          toolCall.call.agentName === event.agentName &&
          toolCall.call.tool === event.tool &&
          !toolCall.result &&
          !toolCall.error
        ) {
          callMap.set(
            key,
            event.type === "tool.result"
              ? { ...toolCall, result: event }
              : { ...toolCall, error: event }
          );
          break;
        }
      }
    }
  }

  return Array.from(callMap.values()).reverse();
}

const TABS: Array<{ key: InspectorTab; label: string }> = [
  { key: "output", label: "Output" },
  { key: "tools", label: "Tool Calls" },
  { key: "agent", label: "Agent" },
  { key: "tokens", label: "Tokens" },
];

export function ToolCallInspector() {
  const events = useEventStore((s) => s.events);
  const agentStates = useEventStore((s) => s.agentStates);
  const totalTokens = useEventStore((s) => s.totalTokens);
  const lastOutput = useEventStore((s) => s.lastOutput);
  const selectedAgent = useUIStore((s) => s.selectedAgent);
  const inspectorTab = useUIStore((s) => s.inspectorTab);
  const setInspectorTab = useUIStore((s) => s.setInspectorTab);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allCalls = buildToolCalls(events);
  const calls = selectedAgent
    ? allCalls.filter((toolCall) => toolCall.call.agentName === selectedAgent)
    : allCalls;

  return (
    <div
      className="dashboard-panel"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 18px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <p className="dashboard-kicker" style={{ margin: 0 }}>
            Inspector
          </p>
          <h2
            style={{
              color: "var(--text-primary)",
              fontSize: 22,
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              margin: "8px 0 0",
            }}
          >
            {selectedAgent ? selectedAgent : "Global view"}
          </h2>
        </div>
        <span
          className="dashboard-chip text-[11px] uppercase tracking-[0.22em]"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
        >
          {inspectorTab}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setInspectorTab(key)}
            style={{
              flex: 1,
              padding: "13px 6px",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: inspectorTab === key ? "var(--accent-primary)" : "var(--text-tertiary)",
              borderBottom: inspectorTab === key ? "2px solid var(--accent-primary)" : "2px solid transparent",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        {inspectorTab === "output" ? (
          <OutputPanel lastOutput={lastOutput} />
        ) : null}
        {inspectorTab === "tools" ? (
          <div style={{ padding: 10 }}>
            <ToolsPanel calls={calls} expandedId={expandedId} setExpandedId={setExpandedId} />
          </div>
        ) : null}
        {inspectorTab === "agent" ? (
          <div style={{ padding: 10 }}>
            <AgentPanel selectedAgent={selectedAgent} agentStates={agentStates} />
          </div>
        ) : null}
        {inspectorTab === "tokens" ? (
          <div style={{ padding: 10 }}>
            <TokensPanel agentStates={agentStates} totalTokens={totalTokens} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Linear-inspired Output Panel                                        */
/* ------------------------------------------------------------------ */

function OutputPanel({ lastOutput }: { lastOutput: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!lastOutput) return;
    navigator.clipboard.writeText(lastOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [lastOutput]);

  if (!lastOutput) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] px-6 text-center gap-4">
        <div className="w-12 h-12 rounded-2xl border border-dashed border-white/10 flex items-center justify-center bg-white/[0.02]">
          <FileText className="w-5 h-5 text-neutral-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-400">No output yet</p>
          <p className="text-xs text-neutral-600 font-mono mt-1">Run a pipeline to see results</p>
        </div>
      </div>
    );
  }

  const wordCount = lastOutput.trim().split(/\s+/).length;
  const charCount = lastOutput.length;

  return (
    <>
      {/* ── Inline (sidebar) view ── */}
      <div className="flex flex-col h-full">
        {/* mini toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.015] shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">
            {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
          </span>
          <div className="flex items-center gap-1">
            <IconBtn
              onClick={handleCopy}
              label={copied ? "Copied" : "Copy"}
              icon={copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            />
            <IconBtn
              onClick={() => setIsExpanded(true)}
              label="Expand"
              icon={<Maximize2 className="w-3 h-3" />}
            />
          </div>
        </div>

        {/* content — fills remaining height */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full overflow-y-auto custom-scrollbar sidebar-view">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{lastOutput}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* ── Expanded (full-screen) view ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] isolate"
          >
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#050505]/95 backdrop-blur-2xl"
              onClick={() => setIsExpanded(false)}
            />

            {/* document frame */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative h-full flex flex-col z-10"
            >
              {/* header */}
              <header className="shrink-0 flex items-center justify-between px-8 py-4 border-b border-white/[0.05] bg-[#0a0a0a]/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white tracking-tight">Output</h2>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                      {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ActionBtn onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </ActionBtn>
                  <ActionBtn onClick={() => setIsExpanded(false)}>
                    <Minimize2 className="w-3.5 h-3.5" /> Close
                  </ActionBtn>
                </div>
              </header>

              {/* document body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center">
                <article className="document-view w-full max-w-3xl py-12 px-8 md:px-12">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {lastOutput}
                  </ReactMarkdown>
                </article>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── helper components ── */
function IconBtn({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-all"
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ActionBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all border border-white/5 hover:border-white/10"
    >
      {children}
    </button>
  );
}

function ToolsPanel({
  calls,
  expandedId,
  setExpandedId,
}: {
  calls: ToolCall[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  if (calls.length === 0) {
    return (
      <p
        style={{
          color: "var(--text-tertiary)",
          fontSize: 12,
          textAlign: "center",
          padding: "32px 16px",
          fontFamily: "var(--font-mono)",
          margin: 0,
        }}
      >
        No tool calls yet
      </p>
    );
  }

  return (
    <div>
      {calls.map((toolCall) => {
        const isExpanded = expandedId === toolCall.call.id;
        const statusLabel = toolCall.error
          ? "ERR"
          : toolCall.result
            ? `${toolCall.result.duration_ms}ms`
            : "...";
        const statusColor = toolCall.error
          ? "var(--status-error)"
          : toolCall.result
            ? "var(--accent-primary)"
            : "var(--status-warning)";

        return (
          <div
            key={toolCall.call.id}
            style={{
              marginBottom: 8,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : toolCall.call.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "var(--text-tertiary)" }}>{toolCall.call.server}.</span>
                {toolCall.call.tool}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
                  color: statusColor,
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                }}
              >
                {statusLabel}
              </span>
            </button>

            <AnimatePresence>
              {isExpanded ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    overflow: "hidden",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(12,10,9,0.55)",
                  }}
                >
                  <div style={{ padding: "12px 14px" }}>
                    <p
                      style={{
                        color: "var(--text-tertiary)",
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        margin: "0 0 4px",
                        textTransform: "uppercase",
                      }}
                    >
                      args
                    </p>
                    <pre
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        overflow: "auto",
                        maxHeight: 120,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {JSON.stringify(toolCall.call.args, null, 2)}
                    </pre>

                    {toolCall.result ? (
                      <>
                        <p
                          style={{
                            color: "var(--text-tertiary)",
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            margin: "10px 0 4px",
                            textTransform: "uppercase",
                          }}
                        >
                          result
                        </p>
                        <pre
                          style={{
                            color: "var(--accent-primary)",
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            overflow: "auto",
                            maxHeight: 120,
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {JSON.stringify(toolCall.result.result, null, 2)}
                        </pre>
                      </>
                    ) : null}

                    {toolCall.error ? (
                      <p
                        style={{
                          color: "var(--status-error)",
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          marginTop: 8,
                        }}
                      >
                        {toolCall.error.error}
                      </p>
                    ) : null}
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

function AgentPanel({
  selectedAgent,
  agentStates,
}: {
  selectedAgent: string | null;
  agentStates: Record<string, AgentRuntimeState>;
}) {
  if (!selectedAgent) {
    return (
      <p
        style={{
          color: "var(--text-tertiary)",
          fontSize: 12,
          textAlign: "center",
          padding: "32px 16px",
          fontFamily: "var(--font-mono)",
          margin: 0,
        }}
      >
        Click an agent to inspect
      </p>
    );
  }

  const state = agentStates[selectedAgent];

  return (
    <div style={{ padding: 8 }}>
      <div className="dashboard-chip" style={{ marginBottom: 14 }}>
        <span className="dashboard-kicker" style={{ color: "var(--accent-secondary)" }}>
          Agent view
        </span>
      </div>

      <h3
        style={{
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: "-0.04em",
          margin: "0 0 16px",
        }}
      >
        {selectedAgent}
      </h3>

      <dl style={{ margin: 0 }}>
        {[
          ["Status", state?.status ?? "idle"],
          ["Tokens In", state?.token_input.toLocaleString() ?? "0"],
          ["Tokens Out", state?.token_output.toLocaleString() ?? "0"],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <dt style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{label}</dt>
            <dd style={{ color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-mono)", margin: 0 }}>{value}</dd>
          </div>
        ))}

        {state?.current_task ? (
          <div>
            <dt style={{ color: "var(--text-tertiary)", fontSize: 12, marginBottom: 6 }}>Current Task</dt>
            <dd
              style={{
                color: "var(--text-secondary)",
                fontSize: 12,
                lineHeight: 1.6,
                margin: 0,
                padding: "12px 14px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {state.current_task}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function TokensPanel({
  agentStates,
  totalTokens,
}: {
  agentStates: Record<string, AgentRuntimeState>;
  totalTokens: number;
}) {
  const entries = Object.entries(agentStates);

  if (entries.length === 0) {
    return (
      <p
        style={{
          color: "var(--text-tertiary)",
          fontSize: 12,
          textAlign: "center",
          padding: "32px 16px",
          fontFamily: "var(--font-mono)",
          margin: 0,
        }}
      >
        No token data
      </p>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      {entries.map(([name, state]) => {
        const total = state.token_input + state.token_output;
        const percent = totalTokens > 0 ? (total / totalTokens) * 100 : 0;

        return (
          <div key={name} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{name}</span>
              <span style={{ color: "var(--accent-primary)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                {total.toLocaleString()}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${percent}%`,
                  background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
                  transition: "width 0.6s ease",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        );
      })}

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>Total</span>
        <span
          style={{
            color: "var(--accent-secondary)",
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
          role="status"
          aria-live="polite"
        >
          {totalTokens.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
