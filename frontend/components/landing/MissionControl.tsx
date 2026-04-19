"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const NODES = [
  { name: "Router", meta: "decision layer", accent: "#00E5FF", live: true },
  { name: "Research", meta: "github + web", accent: "#7C3AED", live: false },
  { name: "Review", meta: "human gate", accent: "#F59E0B", live: false },
  { name: "Synthesis", meta: "final brief", accent: "#00E5FF", live: false },
];

const LOG = [
  { time: "00:00.12", msg: "router → research", accent: "#00E5FF" },
  { time: "00:01.88", msg: "tool: github.search_repos", accent: "#7C3AED" },
  { time: "00:04.31", msg: "handoff → human gate", accent: "#F59E0B" },
  { time: "00:07.09", msg: "approved — synthesis", accent: "#10B981" },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function MissionControl() {
  return (
    <section
      id="mission-control"
      style={{ background: "transparent", borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Section header */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 pt-24 pb-16">
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(240,244,255,0.3)",
            marginBottom: "18px",
          }}
        >
          <span style={{ color: "var(--accent-cyan)" }}>02</span> — Mission Control
        </p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "clamp(3.5rem, 8vw, 7.5rem)",
              lineHeight: 0.88,
              letterSpacing: "-0.045em",
              textTransform: "uppercase",
              color: "#F0F4FF",
            }}
          >
            Watch the<br />
            <span style={{ color: "var(--accent-cyan)" }}>mesh think.</span>
          </h2>
          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.75,
              color: "rgba(240,244,255,0.45)",
              maxWidth: "340px",
              paddingBottom: "4px",
            }}
          >
            Every agent event streams live via WebSocket. See the graph, inspect tool calls, and approve handoffs without leaving the UI.
          </p>
        </div>
      </div>

      {/* Dashboard panel — full width, no card rounding */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease }}
        className="mx-6 md:mx-10 mb-24 overflow-hidden rounded-[28px]"
        style={{
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(4, 6, 14, 0.4)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Panel top bar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28CA41" }} />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-1.5 w-1.5 rounded-full"
              style={{ background: "#10B981" }}
            >
              <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full opacity-75" style={{ background: "#10B981" }} />
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(240,244,255,0.35)",
              }}
            >
              Live · Run #47
            </span>
          </div>
        </div>

        {/* Panel body */}
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-0">

          {/* Left — agent nodes */}
          <div
            className="p-6 md:p-8 flex flex-col gap-3"
            style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="mb-2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(240,244,255,0.25)",
              }}
            >
              Agent Graph
            </p>
            {NODES.map((node, i) => (
              <motion.div
                key={node.name}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: i * 0.1 }}
                className="flex items-center justify-between rounded-xl px-4 py-3.5"
                style={{
                  border: `1px solid ${node.live ? node.accent + "40" : "rgba(255,255,255,0.08)"}`,
                  background: node.live ? node.accent + "0c" : "rgba(255,255,255,0.025)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: node.live ? "#F0F4FF" : "rgba(240,244,255,0.6)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {node.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.1em",
                      color: "rgba(240,244,255,0.3)",
                      marginTop: "2px",
                    }}
                  >
                    {node.meta}
                  </p>
                </div>
                {node.live ? (
                  <span
                    className="flex items-center gap-1.5 rounded-full px-3 py-1"
                    style={{
                      background: node.accent + "18",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: node.accent,
                    }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: node.accent }}
                      />
                      <span
                        className="relative inline-flex h-1.5 w-1.5 rounded-full"
                        style={{ background: node.accent }}
                      />
                    </span>
                    active
                  </span>
                ) : (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: node.accent, opacity: 0.4 }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Right — event log */}
          <div className="p-6 md:p-8 flex flex-col gap-3">
            <p
              className="mb-2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(240,244,255,0.25)",
              }}
            >
              Event Stream
            </p>
            {LOG.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease, delay: i * 0.12 }}
                className="flex items-center gap-4 rounded-xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "rgba(240,244,255,0.25)",
                    letterSpacing: "0.08em",
                    flexShrink: 0,
                  }}
                >
                  {entry.time}
                </span>
                <span
                  className="h-3 w-px flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: entry.accent,
                    letterSpacing: "0.04em",
                  }}
                >
                  {entry.msg}
                </span>
              </motion.div>
            ))}

            {/* CTA inside panel */}
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 no-underline"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--accent-cyan)",
                  transition: "opacity 0.2s",
                }}
              >
                Open Mission Control
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8H12.5M8.5 4L12.5 8L8.5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
