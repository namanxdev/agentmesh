"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { staggerContainer, staggerItem } from "@/lib/motion";

const FEATURES = [
  {
    id: "01",
    eyebrow: "Canvas",
    title: "Visual Pipeline Builder",
    description: "Compose the run with a graph that already feels operational. Drag nodes, wire roles, and keep structure visible before the first token is spent.",
    className: "lg:col-span-7",
    tone: "dark",
  },
  {
    id: "02",
    eyebrow: "Telemetry",
    title: "Real-time Event Stream",
    description: "Every activation, handoff, tool call, and exception has a visible, trackable place in the run.",
    className: "lg:col-span-5",
    tone: "light",
  },
  {
    id: "03",
    eyebrow: "Architecture",
    title: "Parallel Execution",
    description: "Fork when it buys speed. Rejoin without losing the plot. Parallel branches stay legible on the canvas layout.",
    className: "lg:col-span-5",
    tone: "light",
  },
  {
    id: "04",
    eyebrow: "Tooling",
    title: "MCP-native Tools",
    description: "Connect the tool fabric without inventing a second plugin system. HTTP, stdio, all in one native isolated namespace.",
    className: "lg:col-span-7",
    tone: "dark",
  },
  {
    id: "05",
    eyebrow: "Security",
    title: "Human-in-the-loop gates",
    description: "Inline checkpoints when the run reaches risk limits. Approvals, timeouts, and review stay safely inside the graph.",
    className: "lg:col-span-7",
    tone: "dark",
  },
  {
    id: "06",
    eyebrow: "Observability",
    title: "Inspectable handoffs",
    description: "Tool inputs, approval requests, raw message outputs, and token counts remain fully inspectable retrospectively.",
    className: "lg:col-span-5",
    tone: "light",
  },
] as const;

type Feature = (typeof FEATURES)[number];

function FeatureCard({ id, eyebrow, title, description, className, tone }: Feature) {
  const isDark = tone === "dark";

  return (
    <motion.article
      variants={staggerItem}
      whileHover={{ y: -6 }}
      className={`group relative flex min-h-[300px] overflow-hidden rounded-[36px] p-6 sm:p-9 ${className} transition-all duration-400 cursor-default`}
    >
      {!isDark ? <div className="landing-panel absolute inset-0 transition-opacity duration-300 group-hover:opacity-60" /> : null}
      {isDark ? <div className="landing-panel-dark absolute inset-0 transition-opacity duration-300 group-hover:opacity-90" /> : null}
      
      {/* Oversized background typography decorator */}
      <div
        className={`absolute -right-6 -bottom-10 text-[14rem] sm:text-[20rem] leading-none tracking-tighter select-none pointer-events-none transition-transform duration-500 group-hover:scale-110 ${
          isDark ? "text-white opacity-5" : "text-black opacity-[0.03]"
        }`}
        style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
      >
        {id}
      </div>

      <div className="relative flex h-full w-full flex-col justify-between gap-8 z-10">
        <div>
          <div className="flex items-center gap-4">
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
            className="mt-6 max-w-[430px] text-[2rem] leading-[1.1] tracking-[-0.05em] sm:text-[2.2rem]"
            style={{
              color: isDark ? "#f7f0e8" : "var(--text-primary)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
            }}
          >
            {title}
          </h3>

          <p
            className="mt-5 max-w-[430px] text-[16px] leading-7"
            style={{ color: isDark ? "rgba(247,240,232,0.65)" : "var(--text-secondary)" }}
          >
            {description}
          </p>
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
              className="max-w-[580px] text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] tracking-[-0.04em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
            >
              Everything inspectable. Nothing hidden.
            </h2>
            <p
              className="max-w-[420px] text-base leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              The platform connects the fragmented dots of modern AI orchestration. 
              Observe parallel branch execution, control human handoffs, and manage agent logic from a single visual fabric.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 lg:grid-cols-12 lg:auto-rows-[minmax(220px,auto)]"
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
