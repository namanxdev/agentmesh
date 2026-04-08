"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEventStore } from "@/stores/eventStore";
import { getAgentColor } from "@/types/agents";
import type { AgentMeshEvent } from "@/types/events";

interface EventDisplay {
  label: string;
  agentIndex?: number;
  color: string;
}

function describeEvent(event: AgentMeshEvent, agentNames: string[]): EventDisplay {
  const idx = (name: string) => agentNames.indexOf(name);

  switch (event.type) {
    case "workflow.started":
      return { label: `Workflow started - ${event.agents.join(" -> ")}`, color: "var(--accent-primary)" };
    case "workflow.completed":
      return {
        label: `Workflow completed (${event.totalTokens.toLocaleString()} tokens, ${event.duration.toFixed(1)}s)`,
        color: "var(--status-active)",
      };
    case "workflow.error":
      return { label: `Error in ${event.failedAgent}: ${event.error}`, color: "var(--status-error)" };
    case "agent.activated":
      return { label: `${event.agentName} activated`, agentIndex: idx(event.agentName), color: "var(--status-active)" };
    case "agent.thinking":
      return { label: `${event.agentName} thinking...`, agentIndex: idx(event.agentName), color: "var(--status-thinking)" };
    case "agent.completed":
      return { label: `${event.agentName} completed`, agentIndex: idx(event.agentName), color: "var(--accent-secondary)" };
    case "agent.handoff":
      return { label: `${event.from} -> ${event.to} (${event.reason})`, agentIndex: idx(event.from), color: "var(--accent-primary)" };
    case "tool.called":
      return { label: `${event.agentName}: ${event.server}.${event.tool}`, agentIndex: idx(event.agentName), color: "var(--status-warning)" };
    case "tool.result":
      return { label: `${event.server}.${event.tool} OK ${event.duration_ms}ms`, agentIndex: idx(event.agentName), color: "var(--text-secondary)" };
    case "tool.error":
      return { label: `Tool error: ${event.tool} - ${event.error}`, color: "var(--status-error)" };
    case "token.usage":
      return { label: `${event.agentName}: +${event.total.toLocaleString()} tokens`, agentIndex: idx(event.agentName), color: "var(--text-tertiary)" };
    default:
      return { label: "unknown event", color: "var(--text-tertiary)" };
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function MessageStream() {
  const events = useEventStore((s) => s.events);
  const agentStates = useEventStore((s) => s.agentStates);
  const agentNames = Object.keys(agentStates);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div
      className="dashboard-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "16px 20px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div>
          <p className="dashboard-kicker" style={{ margin: 0 }}>
            Timeline
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
            Event stream
          </h2>
        </div>
        <span
          className="dashboard-chip text-[11px] uppercase tracking-[0.22em]"
          style={{ color: "var(--accent-secondary)", fontFamily: "var(--font-mono)" }}
        >
          {events.length} events
        </span>
      </div>

      <div
        style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}
        role="log"
        aria-live="polite"
        aria-label="Agent activity log"
      >
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const { label, agentIndex, color } = describeEvent(event, agentNames);
            const agentColor =
              agentIndex !== undefined && agentIndex >= 0 ? getAgentColor(agentIndex) : undefined;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "66px 12px 1fr",
                  gap: 12,
                  alignItems: "start",
                  padding: "10px 12px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    marginTop: 2,
                  }}
                >
                  {formatTimestamp(event.timestamp)}
                </span>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: agentColor ?? color,
                    marginTop: 4,
                    boxShadow: `0 0 16px ${agentColor ?? color}`,
                  }}
                />
                <span
                  style={{
                    color,
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                  }}
                >
                  {label}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
