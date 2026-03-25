"use client";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionNumber } from "@/components/ui/SectionNumber";
import { staggerContainer, staggerItem } from "@/lib/motion";

const STEPS = [
  {
    num: "01",
    title: "Define Your Agents",
    description:
      "Create specialized agents with Python. Give each one a role, a system prompt, the MCP servers it needs, and handoff rules for passing work.",
    code: `agent = Agent(\n  name="Reviewer",\n  role="Code Reviewer",\n  mcp_servers=["github"],\n  handoff_rules={"on_complete": "Summarizer"}\n)`,
  },
  {
    num: "02",
    title: "Connect MCP Servers",
    description:
      "Register any MCP-compatible server. AgentMesh discovers tools automatically and namespaces them per server (server__tool).",
    code: `registry.register("github",\n  transport="stdio",\n  command="mcp-server-github"\n)`,
  },
  {
    num: "03",
    title: "Run Your Workflow",
    description:
      "Start a workflow with a task description. The orchestrator chains agents sequentially, passing context and results between them.",
    code: `result = await orchestrator.run(\n  workflow_name="code-review",\n  task="Review PR #42"\n)`,
  },
  {
    num: "04",
    title: "Monitor in Real-Time",
    description:
      "Open Mission Control to watch every agent activation, tool call, and handoff happen live. WebSocket events update the graph instantly.",
    code: `ws://localhost:8000/ws/events\n→ agent.activated: Reviewer\n→ tool.called: github__read_file\n→ agent.handoff: Reviewer → Summarizer`,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        background: "var(--bg-secondary)",
        padding: "120px 0",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <ScrollReveal style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 80 }}>
          <SectionNumber num="02" />
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
              How It Works
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 10, fontSize: 16 }}>
              From agent definition to live monitoring in four steps.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          style={{ display: "flex", flexDirection: "column", gap: 48 }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              variants={staggerItem}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 1fr",
                gap: 40,
                alignItems: "start",
              }}
            >
              {/* Step number */}
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 48,
                  fontWeight: 900,
                  color: "var(--accent-primary)",
                  lineHeight: 1,
                  opacity: 0.7,
                }}
              >
                {step.num}
              </div>

              {/* Text */}
              <div>
                <h3
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 22,
                    marginBottom: 12,
                    marginTop: 0,
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                  {step.description}
                </p>
              </div>

              {/* Code block */}
              <div
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px 20px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  whiteSpace: "pre",
                  overflow: "auto",
                }}
              >
                {step.code}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
