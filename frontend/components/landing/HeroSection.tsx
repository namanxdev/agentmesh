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

const TRACE_LINES = [
  { label: "router -> research", accent: "var(--accent-primary)" },
  { label: "research -> github.search", accent: "var(--landing-acid)" },
  { label: "review -> human gate", accent: "#f6c36d" },
  { label: "handoff -> final synthesis", accent: "var(--accent-primary)" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[color:var(--border-subtle)] pt-28 sm:pt-36">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[620px]"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(232, 93, 42, 0.12), transparent 28%), radial-gradient(circle at 85% 12%, rgba(215, 255, 112, 0.15), transparent 16%)",
        }}
      />

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 pb-12 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-10">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative z-10"
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
              className="mt-5 text-[clamp(4rem,11vw,8.2rem)] uppercase leading-[0.92] tracking-[-0.08em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
            >
              Build the mesh.
              <span className="block">
                Direct every <span className="landing-serif normal-case">handoff</span>.
              </span>
            </h1>
            <p
              className="mt-6 max-w-[620px] text-lg leading-8 md:text-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              AgentMesh turns agent workflows into something you can stage, inspect, and
              refine. Think Relay and Gumloop clarity, but with a sharper system for engineers
              who need to see every decision, tool call, and branch.
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
              href="#how-it-works"
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

          <motion.div variants={staggerItem} className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {HERO_STATS.map(({ value, label }) => (
              <div key={label} className="landing-panel rounded-[24px] px-5 py-5">
                <div
                  className="text-[2rem] leading-none tracking-[-0.06em]"
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
          className="relative z-10 lg:pl-6"
        >
          <motion.div
            variants={staggerItem}
            className="landing-floating absolute -left-2 top-12 hidden rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.88)] px-5 py-3 shadow-[0_18px_48px_rgba(23,18,15,0.12)] xl:flex"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
          >
            Parallel when safe. Human when needed.
          </motion.div>

          <motion.div variants={staggerItem} className="landing-panel rounded-[36px] p-4 sm:p-6">
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

              <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
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

                    <div className="relative grid gap-4 md:grid-cols-[1fr_32px_1fr]">
                      <div className="space-y-3">
                        <div className="rounded-[22px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p
                                className="text-[11px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.48)]"
                                style={{ fontFamily: "var(--font-mono)" }}
                              >
                                Router
                              </p>
                              <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                                Task triage
                              </p>
                            </div>
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
                          </div>
                        </div>
                        <div className="rounded-[22px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                          <p
                            className="text-[11px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.48)]"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            Research
                          </p>
                          <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                            Repo context + tool selection
                          </p>
                        </div>
                      </div>

                      <div className="relative hidden items-center justify-center md:flex">
                        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-[rgba(232,93,42,0.6)] via-[rgba(215,255,112,0.55)] to-transparent" />
                        <span className="h-4 w-4 rounded-full border border-[rgba(255,255,255,0.12)] bg-[var(--accent-primary)] shadow-[0_0_24px_rgba(232,93,42,0.45)]" />
                      </div>

                      <div className="space-y-3 md:pt-8">
                        <div className="rounded-[22px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                          <p
                            className="text-[11px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.48)]"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            Review
                          </p>
                          <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                            Risk scoring + human gate
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                          <p
                            className="text-[11px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.48)]"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            Synthesis
                          </p>
                          <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                            Actionable final brief
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3">
                        <p
                          className="text-[11px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.48)]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          active step
                        </p>
                        <p className="mt-2 text-base font-semibold">handoff to reviewer</p>
                      </div>
                      <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3">
                        <p
                          className="text-[11px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.48)]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          tool call
                        </p>
                        <p className="mt-2 text-base font-semibold">github.read_file</p>
                      </div>
                      <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3">
                        <p
                          className="text-[11px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.48)]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          observability
                        </p>
                        <p className="mt-2 text-base font-semibold">timeline synced</p>
                      </div>
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
                      {TRACE_LINES.map(({ label, accent }) => (
                        <div
                          key={label}
                          className="flex items-center gap-3 rounded-[18px] border border-[color:var(--border-subtle)] bg-[rgba(255,255,255,0.56)] px-4 py-3"
                        >
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
                          <span
                            className="text-[11px] uppercase tracking-[0.24em]"
                            style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                          >
                            {label}
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
                        <div
                          className="rounded-full bg-[rgba(23,18,15,0.08)] px-3 py-2 text-[11px] uppercase tracking-[0.24em]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          approvals inline
                        </div>
                        <div
                          className="rounded-full bg-[rgba(23,18,15,0.08)] px-3 py-2 text-[11px] uppercase tracking-[0.24em]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          tools namespaced
                        </div>
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
        <div className="landing-marquee py-3">
          <div className="landing-marquee-track">
            {Array.from({ length: 2 }).flatMap((_, groupIndex) =>
              [
                "Prompt -> Route -> Tool -> Handoff -> Review",
                "MCP servers",
                "Human checkpoints",
                "Live graph state",
                "Event bus telemetry",
                "Productive, inspectable runs",
              ].map((item, index) => (
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
