"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { staggerContainer, staggerItem } from "@/lib/motion";

const FEATURES = [
  {
    id: "01",
    eyebrow: "MCP Server Management",
    title: "Connect the tool fabric without inventing a second plugin system.",
    description:
      "HTTP, stdio, and internal services land in one namespace so agents can discover capability without the UI turning into a mystery box.",
    points: ["github", "filesystem", "postgres", "slack"],
    className: "lg:col-span-5 lg:row-span-2",
    tone: "dark",
  },
  {
    id: "02",
    eyebrow: "Live WebSocket Events",
    title: "See the bus move in real time.",
    description:
      "Every activation, handoff, tool call, and exception has a visible place in the run.",
    points: ["agent_start", "tool_call", "handoff", "error"],
    className: "lg:col-span-3",
    tone: "light",
  },
  {
    id: "03",
    eyebrow: "Human Approval Gates",
    title: "Inline checkpoints when the run reaches risk.",
    description:
      "Approvals, timeouts, and manual review stay inside the graph instead of being handled out of band.",
    points: ["approve", "reject", "timeout"],
    className: "lg:col-span-4",
    tone: "accent",
  },
  {
    id: "04",
    eyebrow: "Parallel Agent Execution",
    title: "Fork when it buys speed. Rejoin without losing the plot.",
    description:
      "Parallel branches stay legible on the canvas, with merge points that still read like part of the same run.",
    points: ["fork", "merge", "token sync", "shared state"],
    className: "lg:col-start-6 lg:col-span-4",
    tone: "light",
  },
  {
    id: "05",
    eyebrow: "Pipeline Builder",
    title: "Compose the run with a graph that already feels operational.",
    description:
      "Drag nodes, wire roles, and keep structure visible before the first token is spent.",
    points: ["node canvas", "snap grid", "inspector"],
    className: "lg:col-start-10 lg:col-span-3",
    tone: "light",
  },
  {
    id: "06",
    eyebrow: "Auth & API Keys",
    title: "Keys, members, and provider access stay first-party.",
    description:
      "The product can stay self-hosted and serious about credentials without the settings page feeling bolted on.",
    points: ["masked keys", "revoke", "members", "audit"],
    className: "lg:col-span-6",
    tone: "light",
  },
] as const;

type Feature = (typeof FEATURES)[number];

function FeatureCard({ id, eyebrow, title, description, points, className, tone }: Feature) {
  const isDark = tone === "dark";
  const isAccent = tone === "accent";

  return (
    <motion.article
      variants={staggerItem}
      whileHover={{ y: -4 }}
      className={`group relative flex min-h-[220px] overflow-hidden rounded-[30px] p-6 sm:p-7 ${className}`}
      style={
        isDark
          ? undefined
          : isAccent
            ? {
                background:
                  "linear-gradient(180deg, rgba(215,255,112,0.65), rgba(215,255,112,0.46))",
                border: "1px solid rgba(23, 18, 15, 0.12)",
                boxShadow: "0 26px 70px rgba(23, 18, 15, 0.08)",
              }
            : undefined
      }
    >
      {!isDark && !isAccent ? <div className="landing-panel absolute inset-0" /> : null}
      {isDark ? <div className="landing-panel-dark absolute inset-0" /> : null}
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 h-32 w-32 rounded-full opacity-70 blur-3xl"
        style={{ background: isDark ? "rgba(232, 93, 42, 0.2)" : "rgba(232, 93, 42, 0.12)" }}
      />

      <div className="relative flex h-full w-full flex-col justify-between gap-8">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span
              className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.28em] ${
                isDark ? "landing-chip-dark" : "landing-chip"
              }`}
              style={{
                color: isDark ? "#f7f0e8" : "var(--text-primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {id}
            </span>
            <span
              className="text-[11px] uppercase tracking-[0.28em]"
              style={{
                color: isDark ? "rgba(247,240,232,0.48)" : "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {eyebrow}
            </span>
          </div>

          <h3
            className="mt-6 max-w-[430px] text-[1.7rem] leading-tight tracking-[-0.05em] sm:text-[2rem]"
            style={{
              color: isDark ? "#f7f0e8" : "var(--text-primary)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
            }}
          >
            {title}
          </h3>

          <p
            className="mt-4 max-w-[430px] text-[15px] leading-7"
            style={{ color: isDark ? "rgba(247,240,232,0.7)" : "var(--text-secondary)" }}
          >
            {description}
          </p>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex flex-wrap gap-2">
            {points.map((point) => (
              <span
                key={point}
                className="rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.22em]"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: isDark
                    ? "rgba(255,255,255,0.06)"
                    : isAccent
                      ? "rgba(23,18,15,0.08)"
                      : "rgba(255,255,255,0.58)",
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(23,18,15,0.08)",
                  color: isDark ? "#f7f0e8" : "var(--text-primary)",
                }}
              >
                {point}
              </span>
            ))}
          </div>

          {id === "01" ? (
            <div
              className="grid gap-3 rounded-[22px] border p-4 sm:grid-cols-2"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {points.map((point, index) => (
                <div key={point} className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <div
                    className="text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: "rgba(247,240,232,0.48)", fontFamily: "var(--font-mono)" }}
                  >
                    {index < 2 ? "stdio" : "http"}
                  </div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: "#f7f0e8" }}>
                    {point}
                  </div>
                </div>
              ))}
            </div>
          ) : id === "02" ? (
            <div
              className="grid gap-2 rounded-[22px] border p-4"
              style={{
                borderColor: "rgba(23,18,15,0.08)",
                background: "rgba(255,255,255,0.44)",
              }}
            >
              {points.map((point, index) => (
                <div key={point} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: index === 3 ? "#d24e42" : index === 2 ? "#f6c36d" : "var(--accent-primary)" }}
                  />
                  <span
                    className="text-[11px] uppercase tracking-[0.24em]"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    {point}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                  >
                    live
                  </span>
                </div>
              ))}
            </div>
          ) : id === "03" ? (
            <div
              className="grid gap-3 rounded-[22px] border p-4"
              style={{
                borderColor: "rgba(23,18,15,0.08)",
                background: "rgba(23,18,15,0.08)",
              }}
            >
              {points.map((point, index) => (
                <div key={point} className="flex items-center justify-between rounded-[16px] bg-[rgba(255,255,255,0.34)] px-4 py-3">
                  <span
                    className="text-[11px] uppercase tracking-[0.22em]"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    {point}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]"
                    style={{
                      background: index === 0 ? "rgba(215,255,112,0.4)" : "rgba(23,18,15,0.08)",
                      color: "var(--landing-ink)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {index === 0 ? "ready" : "hold"}
                  </span>
                </div>
              ))}
            </div>
          ) : id === "04" ? (
            <div
              className="rounded-[22px] border p-4"
              style={{
                borderColor: "rgba(23,18,15,0.08)",
                background: "rgba(255,255,255,0.44)",
              }}
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="space-y-2">
                  {["fork", "branch a"].map((item) => (
                    <div key={item} className="rounded-[16px] border border-[rgba(23,18,15,0.08)] bg-[rgba(255,255,255,0.62)] px-4 py-3 text-[11px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)" }}>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="h-full w-px bg-gradient-to-b from-[rgba(232,93,42,0.5)] via-[rgba(215,255,112,0.5)] to-[rgba(23,18,15,0.08)]" />
                <div className="space-y-2">
                  {["branch b", "merge"].map((item) => (
                    <div key={item} className="rounded-[16px] border border-[rgba(23,18,15,0.08)] bg-[rgba(255,255,255,0.62)] px-4 py-3 text-[11px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)" }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : id === "05" ? (
            <div
              className="rounded-[22px] border p-4"
              style={{
                borderColor: "rgba(23,18,15,0.08)",
                background: "rgba(255,255,255,0.44)",
              }}
            >
              <div className="grid grid-cols-3 gap-2">
                {["input", "agent", "output"].map((node, index) => (
                  <div key={node} className="rounded-[16px] border border-[rgba(23,18,15,0.08)] bg-[rgba(255,255,255,0.62)] px-3 py-5 text-center">
                    <div
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: index === 1 ? "var(--accent-primary)" : "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                    >
                      {node}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="grid gap-3 rounded-[22px] border p-4 sm:grid-cols-2"
              style={{
                borderColor: "rgba(23,18,15,0.08)",
                background: "rgba(255,255,255,0.44)",
              }}
            >
              {["openai", "anthropic", "member roles", "key revoke"].map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-[16px] border border-[rgba(23,18,15,0.08)] bg-[rgba(255,255,255,0.62)] px-4 py-3">
                  <span
                    className="text-[11px] uppercase tracking-[0.2em]"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    {item}
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: index === 3 ? "#d24e42" : "var(--accent-primary)" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function FeaturesBento() {
  return (
    <section id="features" className="border-b border-[color:var(--border-subtle)] py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <ScrollReveal className="mb-10 max-w-[780px]">
          <p className="landing-kicker">01 / System overview</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2
              className="max-w-[580px] text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] tracking-[-0.07em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
            >
              Everything inspectable. Nothing hidden.
            </h2>
            <p
              className="max-w-[420px] text-base leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              The section below uses a real bento system with fixed spans and aligned rows.
              The visual language stays editorial, but the composition now holds together.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 lg:grid-cols-12 lg:auto-rows-[168px]"
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
