"use client";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionNumber } from "@/components/ui/SectionNumber";
import { staggerContainer, staggerItem } from "@/lib/motion";

const FEATURES = [
  {
    icon: "🧠",
    title: "Agent Definition Layer",
    description:
      "Define specialized AI agents as first-class Python objects. Assign roles, system prompts, MCP servers, and declarative handoff rules.",
    wide: false,
    tall: true,
  },
  {
    icon: "🔌",
    title: "MCP Integration",
    description:
      "Connect agents to any Model Context Protocol server — GitHub, filesystem, web search, databases, and custom tools.",
    wide: true,
    tall: false,
  },
  {
    icon: "⚡",
    title: "Orchestration Engine",
    description: "Sequential workflow execution with intelligent agent handoffs, error recovery, and timeout guards.",
    wide: false,
    tall: false,
  },
  {
    icon: "🛰️",
    title: "Mission Control Dashboard",
    description:
      "Real-time interactive visualization of your agent workflows with animated node graphs and live event streaming.",
    wide: true,
    tall: false,
  },
  {
    icon: "📡",
    title: "Real-Time Event System",
    description: "WebSocket-powered event bus broadcasting 11 typed event types — agent activations, tool calls, token usage.",
    wide: false,
    tall: false,
  },
];

function FeatureCard({
  icon,
  title,
  description,
  wide,
  tall,
}: (typeof FEATURES)[0]) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ borderColor: "var(--accent-primary)", y: -3 }}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "28px",
        cursor: "default",
        transition: "border-color 0.3s ease, transform 0.3s ease",
        gridColumn: wide ? "span 2" : "span 1",
        gridRow: tall ? "span 2" : "span 1",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle inner glow on hover — CSS only */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 30% 30%, hsl(185deg 100% 50% / 0.04), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <span style={{ fontSize: 32 }}>{icon}</span>
      <h3
        style={{
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 18,
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 14,
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {description}
      </p>
    </motion.div>
  );
}

export function FeaturesBento() {
  return (
    <section id="features" style={{ background: "var(--bg-primary)", padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <ScrollReveal style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 64 }}>
          <SectionNumber num="01" />
          <div>
            <h2
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Everything You Need
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 10, fontSize: 16, lineHeight: 1.6 }}>
              A complete platform for building and monitoring multi-agent AI systems.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "auto auto",
            gap: 16,
          }}
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
