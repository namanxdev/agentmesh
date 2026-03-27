"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEventStore } from "@/stores/eventStore";
import { useUIStore } from "@/stores/uiStore";
import type { ToolCalledEvent, ToolResultEvent, ToolErrorEvent } from "@/types/events";
import type { AgentRuntimeState } from "@/stores/eventStore";
import type { InspectorTab } from "@/stores/uiStore";

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
        gridArea: "inspector",
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

      <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
        {inspectorTab === "output" ? (
          <OutputPanel lastOutput={lastOutput} />
        ) : null}
        {inspectorTab === "tools" ? (
          <ToolsPanel calls={calls} expandedId={expandedId} setExpandedId={setExpandedId} />
        ) : null}
        {inspectorTab === "agent" ? (
          <AgentPanel selectedAgent={selectedAgent} agentStates={agentStates} />
        ) : null}
        {inspectorTab === "tokens" ? (
          <TokensPanel agentStates={agentStates} totalTokens={totalTokens} />
        ) : null}
      </div>
    </div>
  );
}

function OutputPanel({ lastOutput }: { lastOutput: string | null }) {
  if (!lastOutput) {
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
        No output yet — run a pipeline to see results here
      </p>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      <pre
        style={{
          color: "var(--text-primary)",
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          margin: 0,
          padding: "14px 16px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {lastOutput}
      </pre>
    </div>
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
