"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { staggerContainer, staggerItem } from "@/lib/motion";

const HERO_TAGS = ["MCP native", "Inspectable workflows", "Live mission control"];

const HERO_STATS = [
  { value: "11", label: "event types mapped" },
  { value: "03s", label: "handoff latency target" },
  { value: "multi", label: "agent roles on a single run" },
  { value: "zero", label: "black box steps" },
];

const GRAPH_NODES = [
  { name: "Router", meta: "decision layer", accent: "var(--accent-primary)", live: true },
  { name: "Research", meta: "github + web", accent: "var(--landing-acid)" },
  { name: "Review", meta: "human gate", accent: "#f6c36d" },
  { name: "Synthesis", meta: "final brief", accent: "var(--accent-primary)" },
];

const TRACE_LINES = [
  { label: "router -> research", accent: "var(--accent-primary)" },
  { label: "research -> github.search", accent: "var(--landing-acid)" },
  { label: "review -> human gate", accent: "#f6c36d" },
  { label: "handoff -> synthesis", accent: "var(--accent-primary)" },
];

const MARQUEE_ITEMS = [
  "Prompt -> Route -> Tool -> Handoff -> Review",
  "MCP servers",
  "Human checkpoints",
  "Live graph state",
  "Event bus telemetry",
  "Productive, inspectable runs",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[color:var(--border-subtle)] pt-22 sm:pt-24 lg:pt-28">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[760px]"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(232, 93, 42, 0.12), transparent 28%), radial-gradient(circle at 85% 12%, rgba(215, 255, 112, 0.15), transparent 16%)",
        }}
      />

      <div className="mx-auto grid max-w-[1440px] gap-x-8 gap-y-12 px-5 pb-16 md:px-8 lg:grid-cols-12 lg:items-start xl:gap-x-12">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative z-10 lg:col-span-5 lg:pt-4 xl:pt-6"
        >
          <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
            {HERO_TAGS.map((tag) => (
              <span
                key={tag}
                className="landing-chip text-[11px] uppercase tracking-[0.28em]"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      tag === "Live mission control" ? "var(--landing-acid)" : "var(--accent-primary)",
                  }}
                />
                {tag}
              </span>
            ))}
          </motion.div>

          <motion.div variants={staggerItem} className="mt-8 max-w-[760px]">
            <p className="landing-kicker">Editorial orchestration layer</p>
            <h1
              className="mt-4 max-w-[7.2ch] text-[clamp(3.5rem,7vw,7.4rem)] uppercase leading-[0.9] tracking-[-0.085em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
            >
              Build the mesh.
              <span className="mt-2 block">
                Direct every <span className="landing-serif normal-case">handoff</span>.
              </span>
            </h1>
            <p
              className="mt-6 max-w-[620px] text-lg leading-8 md:text-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              AgentMesh turns multi-agent orchestration into a surface you can actually direct.
              Build with MCP-native tools, watch every branch unfold, and keep human review in
              the loop without losing the shape of the run.
            </p>
          </motion.div>

          <motion.div variants={staggerItem} className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
              style={{
                background: "var(--landing-ink)",
                color: "var(--landing-paper)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                boxShadow: "0 20px 45px rgba(23, 18, 15, 0.18)",
              }}
            >
              Open Mission Control
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3.5 8H12.5M8.5 4L12.5 8L8.5 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-3 rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.45)] px-6 py-4 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
              }}
            >
              See the control logic
            </a>
          </motion.div>

          <motion.div variants={staggerItem} className="mt-9 grid gap-4 sm:grid-cols-2">
            {HERO_STATS.map(({ value, label }) => (
              <div key={label} className="landing-panel min-h-[118px] rounded-[24px] px-5 py-5">
                <div
                  className="text-[2.15rem] leading-none tracking-[-0.06em]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
                >
                  {value}
                </div>
                <div
                  className="mt-3 text-xs uppercase tracking-[0.24em]"
                  style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative z-10 lg:col-start-7 lg:col-span-6 lg:mt-8 xl:mt-12"
        >
          <motion.div
            variants={staggerItem}
            className="landing-floating absolute left-6 top-0 hidden rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.88)] px-4 py-2.5 shadow-[0_18px_48px_rgba(23,18,15,0.12)] xl:flex"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
          >
            Parallel when safe. Human when needed.
          </motion.div>

          <motion.div variants={staggerItem} className="landing-panel rounded-[36px] p-4 sm:p-6 xl:mt-12">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="landing-kicker">Mission control</p>
                  <h2
                    className="mt-3 max-w-[420px] text-3xl leading-tight tracking-[-0.05em] sm:text-4xl"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
                  >
                    Watch the mesh think in public.
                  </h2>
                </div>
                <div
                  className="landing-chip text-[11px] uppercase tracking-[0.28em]"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
                >
                  <span
                    className="landing-signal-dot h-2.5 w-2.5 rounded-full"
                    style={{ background: "var(--landing-acid)" }}
                  />
                  Live graph state
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(280px,0.72fr)]">
                <div className="landing-panel-dark rounded-[30px] p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className="landing-chip-dark text-[11px] uppercase tracking-[0.24em]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Active run
                    </span>
                    <span
                      className="text-xs uppercase tracking-[0.24em] text-[rgba(247,240,232,0.58)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      code review / live mesh
                    </span>
                  </div>

                  <div
                    className="relative mt-5 overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.08)] p-4 sm:p-5"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                    }}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                        backgroundSize: "36px 36px",
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute left-[18%] right-[18%] top-[31%] hidden h-px bg-gradient-to-r from-transparent via-[rgba(232,93,42,0.65)] to-transparent md:block"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute bottom-[31%] left-[18%] right-[18%] hidden h-px bg-gradient-to-r from-transparent via-[rgba(215,255,112,0.6)] to-transparent md:block"
                    />

                    <div className="relative grid gap-3 md:grid-cols-2">
                      {GRAPH_NODES.map((node, index) => (
                        <div
                          key={node.name}
                          className={`rounded-[22px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4 ${
                            index === 1 ? "md:translate-y-6" : ""
                          } ${
                            index === 2 ? "md:-translate-y-1" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p
                                className="text-[11px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.48)]"
                                style={{ fontFamily: "var(--font-mono)" }}
                              >
                                {node.name}
                              </p>
                              <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                                {node.meta}
                              </p>
                            </div>
                            {node.live ? (
                              <span
                                className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]"
                                style={{
                                  background: "rgba(215,255,112,0.14)",
                                  color: "var(--landing-acid)",
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                live
                              </span>
                            ) : (
                              <span
                                className="h-3 w-3 rounded-full border border-[rgba(255,255,255,0.12)]"
                                style={{ background: node.accent, boxShadow: `0 0 18px ${node.accent}` }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                      {[
                        ["active step", "handoff to reviewer"],
                        ["tool call", "github.read_file"],
                        ["observability", "timeline synced"],
                      ].map(([kicker, value]) => (
                        <div
                          key={kicker}
                          className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3"
                        >
                          <p
                            className="text-[11px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.48)]"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {kicker}
                          </p>
                          <p className="mt-2 text-base font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="landing-panel rounded-[28px] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="landing-kicker">Trace tape</p>
                        <p
                          className="mt-2 text-xl tracking-[-0.04em]"
                          style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
                        >
                          Every transition stays readable.
                        </p>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]"
                        style={{
                          fontFamily: "var(--font-mono)",
                          background: "rgba(232, 93, 42, 0.1)",
                          color: "var(--accent-primary)",
                        }}
                      >
                        4 events/sec
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      {TRACE_LINES.map(({ label, accent }, index) => (
                        <div
                          key={label}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[18px] border border-[color:var(--border-subtle)] bg-[rgba(255,255,255,0.56)] px-4 py-3"
                        >
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
                          <span
                            className="text-[11px] uppercase tracking-[0.24em]"
                            style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                          >
                            {label}
                          </span>
                          <span
                            className="text-[10px] uppercase tracking-[0.2em]"
                            style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                          >
                            {`0${index + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="landing-floating-delayed rounded-[28px] border border-[color:rgba(23,18,15,0.12)] bg-[rgba(215,255,112,0.55)] p-5 shadow-[0_24px_60px_rgba(23,18,15,0.1)]">
                    <p className="landing-kicker" style={{ color: "rgba(23,18,15,0.58)" }}>
                      Run quality
                    </p>
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p
                          className="text-4xl leading-none tracking-[-0.06em]"
                          style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
                        >
                          97%
                        </p>
                        <p
                          className="mt-2 max-w-[180px] text-sm leading-6"
                          style={{ color: "rgba(23,18,15,0.76)" }}
                        >
                          workflows still keep a clear audit trail after branching.
                        </p>
                      </div>
                      <div className="space-y-2">
                        {["approvals inline", "tools namespaced"].map((item) => (
                          <div
                            key={item}
                            className="rounded-full bg-[rgba(23,18,15,0.08)] px-3 py-2 text-[11px] uppercase tracking-[0.24em]"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="border-y border-[color:var(--border-subtle)] bg-[rgba(255,255,255,0.35)]">
        <div className="landing-marquee py-4">
          <div className="landing-marquee-track">
            {Array.from({ length: 2 }).flatMap((_, groupIndex) =>
              MARQUEE_ITEMS.map((item, index) => (
                <span
                  key={`${groupIndex}-${index}-${item}`}
                  className="landing-chip text-[11px] uppercase tracking-[0.3em]"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                >
                  {item}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
