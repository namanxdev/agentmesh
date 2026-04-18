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

      <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-8 flex flex-col items-center text-center">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative z-10 flex flex-col items-center w-full"
        >
          <motion.div variants={staggerItem} className="flex flex-wrap justify-center gap-3">
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

          <motion.div variants={staggerItem} className="mt-8 relative w-full flex flex-col items-center">
            <p className="landing-kicker">Editorial orchestration layer</p>
            <motion.h1
              initial={{ filter: "blur(12px)", opacity: 0, y: 30 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 w-full text-[clamp(4.5rem,10vw,12rem)] uppercase leading-[0.8] tracking-[-0.04em] relative z-10"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
            >
              Build the mesh.
              <span className="mt-3 block text-[clamp(3.5rem,8vw,10.5rem)]" style={{ color: "var(--text-secondary)" }}>
                Direct every <span className="landing-serif normal-case text-transparent bg-clip-text relative inline-block" style={{ backgroundImage: "linear-gradient(to right, var(--accent-primary), #ff8a00)" }}>handoff.<motion.span className="absolute -inset-2 opacity-40 blur-2xl z-[-1]" style={{ backgroundImage: "linear-gradient(to right, var(--accent-primary), #ff8a00)" }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}/></span>
              </span>
            </motion.h1>
            <p
              className="mt-6 max-w-[700px] text-lg leading-8 md:text-xl text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              AgentMesh turns multi-agent orchestration into a surface you can actually direct.
              Build with MCP-native tools, watch every branch unfold, and keep human review in
              the loop without losing the shape of the run.
            </p>
          </motion.div>

          <motion.div variants={staggerItem} className="mt-10 flex flex-wrap justify-center items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm no-underline"
              style={{
                background: "var(--landing-ink)",
                color: "var(--landing-paper)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                boxShadow: "0 20px 45px rgba(23, 18, 15, 0.18)",
                transition: "transform 160ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 28px 56px rgba(23,18,15,0.24)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 45px rgba(23,18,15,0.18)"; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
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
              className="inline-flex items-center gap-3 rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.45)] px-6 py-4 text-sm no-underline"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                transition: "transform 160ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            >
              See the control logic
            </a>
          </motion.div>

          <motion.div variants={staggerItem} className="mt-16 grid gap-4 w-full max-w-[1080px] sm:grid-cols-2 lg:grid-cols-4 text-left">
            {HERO_STATS.map(({ value, label }) => (
              <div key={label} className="landing-panel min-h-[118px] rounded-[24px] px-5 py-5 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_rgba(23,18,15,0.06)] group cursor-default">
                <div
                  className="text-[2.15rem] leading-none tracking-[-0.06em] transition-colors group-hover:text-[color:var(--accent-primary)]"
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
          className="relative z-10 mt-20 xl:mt-24 w-full max-w-[1080px] mx-auto text-left"
        >
          <motion.div
            variants={staggerItem}
            animate={{ y: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="hidden w-max rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.88)] px-4 py-2.5 shadow-[0_18px_48px_rgba(23,18,15,0.12)] xl:mb-8 xl:flex hover:scale-105 transition-transform"
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
                    className="mt-3 max-w-[420px] text-3xl leading-tight tracking-tight sm:text-4xl"
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
                    <motion.div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-30 pointer-events-none"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                        backgroundSize: "36px 36px",
                      }}
                      animate={{ backgroundPosition: ["0px 0px", "-36px -36px"] }}
                      transition={{ ease: "linear", duration: 8, repeat: Infinity }}
                    />
                    <style dangerouslySetInnerHTML={{ __html: `
                      @keyframes active-scan {
                        0% { transform: translateY(-150%); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translateY(400%); opacity: 0; }
                      }
                    `}} />
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-48 pointer-events-none z-10"
                      style={{
                        background: "linear-gradient(to bottom, transparent, rgba(215,255,112,0.05), transparent)",
                        animation: "active-scan 6s cubic-bezier(0.4, 0, 0.2, 1) infinite"
                      }}
                    />
                    {/* Animated connecting pipeline paths */}
                    <motion.div
                      aria-hidden="true"
                      className="absolute left-[15%] top-[29%] h-px w-[70%] hidden md:block origin-left z-0"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(232,93,42,0.85), transparent)" }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    />
                    <motion.div
                      aria-hidden="true"
                      className="absolute left-[15%] bottom-[33%] h-px w-[70%] hidden md:block origin-right z-0"
                      style={{ background: "linear-gradient(270deg, transparent, rgba(215,255,112,0.85), transparent)" }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                    />
                    <motion.div
                      aria-hidden="true"
                      className="absolute left-[49.5%] top-[25%] h-[50%] w-px hidden md:block origin-top z-0"
                      style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.2), transparent)" }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
                    />

                    <div className="relative z-10 grid gap-4 pb-6 md:grid-cols-2 md:gap-y-8 md:gap-x-4 md:pb-8">
                      {GRAPH_NODES.map((node, index) => (
                        <div
                          key={node.name}
                          className={`rounded-[22px] border border-[rgba(255,255,255,0.1)] bg-[rgba(12,10,9,0.72)] backdrop-blur-xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] min-w-0 ${
                            index === 1 ? "md:translate-y-6" : ""
                          } ${
                            index === 2 ? "md:-translate-y-3" : ""
                          } ${
                            index === 3 ? "md:translate-y-3" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-[11px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.48)]"
                                style={{ fontFamily: "var(--font-mono)" }}
                              >
                                {node.name}
                              </p>
                              <p className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-[#f7f0e8] truncate">
                                {node.meta}
                              </p>
                            </div>
                            {node.live ? (
                              <span
                                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] font-medium"
                                style={{
                                  background: "rgba(215,255,112,0.14)",
                                  color: "var(--landing-acid)",
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--landing-acid)" }}></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--landing-acid)" }}></span>
                                </span>
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

                    <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {[
                        ["active step", "handoff to reviewer"],
                        ["tool call", "github.read_file"],
                        ["observability", "timeline synced"],
                      ].map(([kicker, value]) => (
                        <div
                          key={kicker}
                          className="flex-1 min-w-[120px] rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                        >
                          <p
                            className="text-[10px] uppercase tracking-[0.24em] text-[rgba(247,240,232,0.5)]"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {kicker}
                          </p>
                          <p className="mt-1.5 text-sm font-medium leading-snug truncate text-white">{value}</p>
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
                          className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[18px] border border-[color:var(--border-subtle)] bg-[rgba(255,255,255,0.56)] px-4 py-3 transition-colors duration-300 hover:bg-white hover:border-[color:var(--border-default)] cursor-default"
                        >
                          <span className="h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-125" style={{ background: accent }} />
                          <span
                            className="text-[11px] uppercase tracking-[0.24em] transition-colors group-hover:text-black"
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
                        <motion.p
                          className="text-4xl leading-none tracking-[-0.06em]"
                          style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
                          animate={{ opacity: [1, 0.8, 1, 1, 0.85, 1] }}
                          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", times: [0, 0.1, 0.2, 0.5, 0.6, 1] }}
                        >
                          97%
                        </motion.p>
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
