"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { staggerContainer, staggerItem } from "@/lib/motion";

const FEATURES = [
  {
    id: "01",
    title: "Direct specialist agents with a shared grammar.",
    description:
      "Define roles, prompts, servers, and handoff rules without turning the workflow into a mystery box.",
    points: ["router", "research", "review", "final synthesis"],
    className: "lg:col-span-5",
    tone: "dark",
  },
  {
    id: "02",
    title: "Mount any MCP surface.",
    description:
      "GitHub, filesystem, web, databases, and internal tools all land in one consistent namespace for agents to use.",
    points: ["github.read_file", "filesystem.write", "postgres.query"],
    className: "lg:col-start-8 lg:col-span-4 lg:mt-32",
    tone: "light",
  },
  {
    id: "03",
    title: "Branch when it helps. Pause when it matters.",
    description:
      "Parallel paths, guardrails, retries, and human approvals stay explicit instead of being bolted on later.",
    points: ["parallel branches", "approval gate", "retry path"],
    className: "lg:col-start-2 lg:col-span-4 lg:mt-12",
    tone: "accent",
  },
  {
    id: "04",
    title: "Mission Control makes the run legible.",
    description:
      "Track activations, tool calls, timing, and handoffs in one surface that feels like a control room, not a log dump.",
    points: ["live graph", "event tape", "token telemetry", "tool inspector"],
    className: "lg:col-start-7 lg:col-span-6 lg:mt-32",
    tone: "light",
  },
  {
    id: "05",
    title: "Local-first, production-minded.",
    description:
      "Prototype quickly, then keep the same orchestration language when the workflow earns real traffic and real review policies.",
    points: ["Python core", "Next front end", "typed events"],
    className: "lg:col-start-1 lg:col-span-5 lg:mt-16",
    tone: "light",
  },
] as const;

type Feature = (typeof FEATURES)[number];

function FeatureCard({ id, title, description, points, className, tone }: Feature) {
  const isDark = tone === "dark";
  const isAccent = tone === "accent";

  return (
    <motion.article
      variants={staggerItem}
      whileHover={{ y: -6 }}
      className={`group relative overflow-hidden rounded-[30px] p-6 sm:p-7 ${className}`}
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

      <div className="relative flex h-full flex-col justify-between">
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
              System layer
            </span>
          </div>

          <h3
            className="mt-6 max-w-[420px] text-[1.7rem] leading-tight tracking-[-0.05em] sm:text-[2rem]"
            style={{
              color: isDark ? "#f7f0e8" : "var(--text-primary)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
            }}
          >
            {title}
          </h3>

          <p
            className="mt-4 max-w-[420px] text-[15px] leading-7"
            style={{ color: isDark ? "rgba(247,240,232,0.7)" : "var(--text-secondary)" }}
          >
            {description}
          </p>
        </div>

        <div className="mt-8 space-y-3">
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

          <div
            className="grid gap-2 rounded-[22px] border p-4"
            style={{
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(23,18,15,0.08)",
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.44)",
            }}
          >
            {points.map((point, index) => (
              <div key={`${point}-${index}`} className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      index === points.length - 1 ? "var(--landing-acid)" : "var(--accent-primary)",
                  }}
                />
                <span
                  className="text-[11px] uppercase tracking-[0.24em]"
                  style={{
                    color: isDark ? "rgba(247,240,232,0.62)" : "var(--text-tertiary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {point}
                </span>
              </div>
            ))}
          </div>
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
              The workflow surface should look as deliberate as the automation.
            </h2>
            <p
              className="max-w-[420px] text-base leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              The references you gave all share one thing: they make structure visible.
              This section does the same for AgentMesh instead of hiding it behind safe,
              interchangeable SaaS cards.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-x-6 gap-y-16 lg:grid-cols-12 lg:auto-rows-auto relative"
        >
          {/* Aesthetic Awwwards structural voids decorators */}
          <div className="hidden lg:flex absolute left-[45%] top-32 flex-col items-center pointer-events-none opacity-40">
             <div className="w-px h-16 border-l border-dashed border-[color:var(--border-default)]" />
             <div className="w-8 h-8 rounded-full border border-[color:var(--text-tertiary)] flex items-center justify-center my-4 animate-[spin_10s_linear_infinite]">
               <div className="w-1 h-1 rounded-full bg-[color:var(--text-primary)] -translate-y-4" />
             </div>
             <div className="w-px h-32 border-l border-dashed border-[color:var(--border-default)]" />
          </div>

          <div className="hidden lg:flex absolute right-[25%] bottom-64 flex-col items-start pointer-events-none opacity-50">
             <div className="text-[10px] font-mono tracking-widest text-[color:var(--text-tertiary)]">
                [GRID_Y: 204]
             </div>
             <div className="w-16 h-px border-t border-[color:var(--border-default)] mt-2" />
          </div>

          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
