"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    title: "Define",
    description:
      "Declare agents in Python — roles, prompts, MCP servers, handoff rules. One config describes the whole mesh.",
    code: `agent = Agent(
  role="researcher",
  mcp=["github", "web"],
  handoff_to=["reviewer"]
)`,
    accent: "#00E5FF",
  },
  {
    num: "02",
    title: "Connect",
    description:
      "Each agent connects to any MCP server automatically. Filesystem, GitHub, web — plug in any tool without adapters.",
    code: `mesh.connect(
  mcp_servers=[
    "github", "filesystem"
  ]
)`,
    accent: "#7C3AED",
  },
  {
    num: "03",
    title: "Direct",
    description:
      "Launch and watch it run. Every step streams live to Mission Control — routes, handoffs, tool calls, human reviews.",
    code: `mesh.run(
  workflow,
  mission_control=True
)`,
    accent: "#00E5FF",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
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
          <span style={{ color: "var(--accent-cyan)" }}>03</span> — Workflow
        </p>
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
          Three steps.<br />
          <span style={{ color: "rgba(240,244,255,0.22)" }}>That's it.</span>
        </h2>
      </div>

      {/* Steps — full-width rows, no cards */}
      <div className="mx-auto max-w-[1400px]">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease, delay: i * 0.08 }}
            className="grid md:grid-cols-[120px_1fr_1fr] gap-6 md:gap-10 px-6 md:px-10 py-12 md:py-14 items-start"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Step number */}
            <div className="flex items-center md:items-start md:pt-1">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: step.accent,
                }}
              >
                {step.num}
              </span>
            </div>

            {/* Title + description */}
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.04em",
                  textTransform: "uppercase",
                  color: "#F0F4FF",
                  marginBottom: "16px",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.75,
                  color: "rgba(240,244,255,0.48)",
                  maxWidth: "380px",
                }}
              >
                {step.description}
              </p>
            </div>

            {/* Code block */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: `1px solid ${step.accent}22`,
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: `1px solid ${step.accent}15` }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28CA41" }} />
                <span
                  className="ml-auto"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "rgba(240,244,255,0.2)",
                    letterSpacing: "0.1em",
                  }}
                >
                  agentmesh.py
                </span>
              </div>
              <pre
                className="px-5 py-4 overflow-x-auto"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  color: step.accent,
                  margin: 0,
                }}
              >
                <code>{step.code}</code>
              </pre>
            </div>
          </motion.div>
        ))}

        {/* Bottom border */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
      </div>
    </section>
  );
}
