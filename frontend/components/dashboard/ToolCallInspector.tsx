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

function buildToolCalls(
  events: ReturnType<typeof useEventStore.getState>["events"]
): ToolCall[] {
  const callMap = new Map<string, ToolCall>();
  for (const evt of events) {
    if (evt.type === "tool.called") {
      callMap.set(evt.id, { call: evt });
    } else if (evt.type === "tool.result" || evt.type === "tool.error") {
      // Match result/error to call by agentName+tool order
      for (const [key, tc] of callMap) {
        if (tc.call.agentName === evt.agentName && tc.call.tool === evt.tool && !tc.result && !tc.error) {
          if (evt.type === "tool.result") callMap.set(key, { ...tc, result: evt });
          else callMap.set(key, { ...tc, error: evt });
          break;
        }
      }
    }
  }
  return Array.from(callMap.values()).reverse();
}

const TABS: Array<{ key: InspectorTab; label: string }> = [
  { key: "tools", label: "Tool Calls" },
  { key: "agent", label: "Agent" },
  { key: "tokens", label: "Tokens" },
];

export function ToolCallInspector() {
  const events = useEventStore((s) => s.events);
  const agentStates = useEventStore((s) => s.agentStates);
  const totalTokens = useEventStore((s) => s.totalTokens);
  const { selectedAgent, inspectorTab, setInspectorTab } = useUIStore((s) => ({
    selectedAgent: s.selectedAgent,
    inspectorTab: s.inspectorTab,
    setInspectorTab: s.setInspectorTab,
  }));

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allCalls = buildToolCalls(events);
  const calls = selectedAgent
    ? allCalls.filter((tc) => tc.call.agentName === selectedAgent)
    : allCalls;

  return (
    <div
      style={{
        gridArea: "inspector",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-subtle)",
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
              borderBottom:
                inspectorTab === key
                  ? "2px solid var(--accent-primary)"
                  : "2px solid transparent",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {inspectorTab === "tools" && (
          <ToolsPanel calls={calls} expandedId={expandedId} setExpandedId={setExpandedId} />
        )}
        {inspectorTab === "agent" && (
          <AgentPanel selectedAgent={selectedAgent} agentStates={agentStates} />
        )}
        {inspectorTab === "tokens" && (
          <TokensPanel agentStates={agentStates} totalTokens={totalTokens} />
        )}
      </div>
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
      {calls.map((tc) => {
        const isExpanded = expandedId === tc.call.id;
        const statusLabel = tc.error ? "ERR" : tc.result ? `${tc.result.duration_ms}ms` : "…";
        const statusColor = tc.error
          ? "var(--status-error)"
          : tc.result
          ? "var(--accent-primary)"
          : "var(--status-warning)";

        return (
          <div
            key={tc.call.id}
            style={{
              marginBottom: 6,
              borderRadius: 8,
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : tc.call.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
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
                <span style={{ color: "var(--text-tertiary)" }}>{tc.call.server}.</span>
                {tc.call.tool}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 4,
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
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    overflow: "hidden",
                    borderTop: "1px solid var(--border-subtle)",
                    background: "var(--bg-primary)",
                  }}
                >
                  <div style={{ padding: "10px 12px" }}>
                    <p style={{ color: "var(--text-tertiary)", fontSize: 10, fontFamily: "var(--font-mono)", margin: "0 0 4px", textTransform: "uppercase" }}>args</p>
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
                      {JSON.stringify(tc.call.args, null, 2)}
                    </pre>
                    {tc.result && (
                      <>
                        <p style={{ color: "var(--text-tertiary)", fontSize: 10, fontFamily: "var(--font-mono)", margin: "10px 0 4px", textTransform: "uppercase" }}>result</p>
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
                          {JSON.stringify(tc.result.result, null, 2)}
                        </pre>
                      </>
                    )}
                    {tc.error && (
                      <p style={{ color: "var(--status-error)", fontSize: 11, fontFamily: "var(--font-mono)", marginTop: 8 }}>
                        {tc.error.error}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
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
      <p style={{ color: "var(--text-tertiary)", fontSize: 12, textAlign: "center", padding: "32px 16px", fontFamily: "var(--font-mono)", margin: 0 }}>
        Click an agent to inspect
      </p>
    );
  }
  const state = agentStates[selectedAgent];
  return (
    <div style={{ padding: 8 }}>
      <h3 style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, margin: "0 0 16px" }}>
        {selectedAgent}
      </h3>
      <dl style={{ margin: 0 }}>
        {[
          ["Status", state?.status ?? "idle"],
          ["Tokens In", state?.token_input.toLocaleString() ?? "0"],
          ["Tokens Out", state?.token_output.toLocaleString() ?? "0"],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <dt style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{label}</dt>
            <dd style={{ color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-mono)", margin: 0 }}>{value}</dd>
          </div>
        ))}
        {state?.current_task && (
          <div>
            <dt style={{ color: "var(--text-tertiary)", fontSize: 12, marginBottom: 4 }}>Current Task</dt>
            <dd style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
              {state.current_task}
            </dd>
          </div>
        )}
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
      <p style={{ color: "var(--text-tertiary)", fontSize: 12, textAlign: "center", padding: "32px 16px", fontFamily: "var(--font-mono)", margin: 0 }}>
        No token data
      </p>
    );
  }
  return (
    <div style={{ padding: 8 }}>
      {entries.map(([name, state]) => {
        const total = state.token_input + state.token_output;
        const pct = totalTokens > 0 ? (total / totalTokens) * 100 : 0;
        return (
          <div key={name} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{name}</span>
              <span style={{ color: "var(--accent-primary)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                {total.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 3, background: "var(--border-default)", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "var(--accent-primary)",
                  transition: "width 0.6s ease",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        );
      })}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>Total</span>
        <span
          style={{
            color: "var(--accent-primary)",
            fontFamily: "var(--font-mono)",
            fontSize: 15,
            fontWeight: 700,
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
