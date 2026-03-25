"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEventStore } from "@/stores/eventStore";
import { getAgentColor } from "@/types/agents";
import type { AgentMeshEvent } from "@/types/events";

interface EventDisplay {
  label: string;
  agentIndex?: number;
  color: string;
}

function describeEvent(
  event: AgentMeshEvent,
  agentNames: string[]
): EventDisplay {
  const idx = (name: string) => agentNames.indexOf(name);

  switch (event.type) {
    case "workflow.started":
      return { label: `Workflow started — ${event.agents.join(" → ")}`, color: "var(--accent-primary)" };
    case "workflow.completed":
      return { label: `Workflow completed (${event.totalTokens.toLocaleString()} tokens, ${event.duration.toFixed(1)}s)`, color: "var(--status-active)" };
    case "workflow.error":
      return { label: `Error in ${event.failedAgent}: ${event.error}`, color: "var(--status-error)" };
    case "agent.activated":
      return { label: `${event.agentName} activated`, agentIndex: idx(event.agentName), color: "var(--status-active)" };
    case "agent.thinking":
      return { label: `${event.agentName} thinking…`, agentIndex: idx(event.agentName), color: "var(--status-thinking)" };
    case "agent.completed":
      return { label: `${event.agentName} completed`, agentIndex: idx(event.agentName), color: "var(--accent-primary)" };
    case "agent.handoff":
      return { label: `${event.from} → ${event.to}  (${event.reason})`, agentIndex: idx(event.from), color: "var(--accent-secondary)" };
    case "tool.called":
      return { label: `${event.agentName}: ${event.server}.${event.tool}`, agentIndex: idx(event.agentName), color: "var(--status-warning)" };
    case "tool.result":
      return { label: `${event.server}.${event.tool} ✓ ${event.duration_ms}ms`, agentIndex: idx(event.agentName), color: "var(--text-secondary)" };
    case "tool.error":
      return { label: `Tool error: ${event.tool} — ${event.error}`, color: "var(--status-error)" };
    case "token.usage":
      return { label: `${event.agentName}: +${event.total.toLocaleString()} tokens`, agentIndex: idx(event.agentName), color: "var(--text-tertiary)" };
    default:
      return { label: String((event as AgentMeshEvent).type), color: "var(--text-tertiary)" };
  }
}

function ts(timestamp: number): string {
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
      style={{
        gridArea: "timeline",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: 0,
          }}
        >
          Event Stream ({events.length})
        </h2>
      </div>

      <div
        style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}
        role="log"
        aria-live="polite"
        aria-label="Agent activity log"
      >
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const { label, agentIndex, color } = describeEvent(event, agentNames);
            const agentColor = agentIndex !== undefined && agentIndex >= 0
              ? getAgentColor(agentIndex)
              : undefined;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "3px 6px",
                  borderRadius: 6,
                  alignItems: "flex-start",
                  marginBottom: 1,
                }}
              >
                <span
                  style={{
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    flexShrink: 0,
                    marginTop: 2,
                    minWidth: 60,
                  }}
                >
                  {ts(event.timestamp)}
                </span>
                {agentColor && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: agentColor,
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
                <span
                  style={{
                    color,
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.5,
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
