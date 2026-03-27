"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { staggerContainer, staggerItem } from "@/lib/motion";

const STEPS = [
  {
    num: "01",
    title: "Compose specialist roles",
    description:
      "Model the workflow in terms of roles, not monoliths. Every agent gets a clear job, a clear tool surface, and a clear next hop.",
    code: `agent = Agent(\n  name="reviewer",\n  role="PR reviewer",\n  mcp_servers=["github"],\n  handoff_rules={"on_complete": "summarizer"}\n)`,
  },
  {
    num: "02",
    title: "Attach the tool fabric",
    description:
      "Mount the MCP servers each workflow needs. Tools stay namespaced and traceable, which matters once runs span multiple services.",
    code: `registry.register("github",\n  transport="stdio",\n  command="mcp-server-github"\n)`,
  },
  {
    num: "03",
    title: "Launch and branch with intent",
    description:
      "Start from a real task, let the orchestrator route work, and branch only when the run actually benefits from parallelism.",
    code: `result = await orchestrator.run(\n  workflow_name="code-review",\n  task="Review PR #42"\n)`,
  },
  {
    num: "04",
    title: "Review the run in Mission Control",
    description:
      "Watch activations, tool calls, approvals, and final output in one place. The graph and event stream stay in sync throughout the run.",
    code: `ws://localhost:8000/ws/events\n-> agent.activated: reviewer\n-> tool.called: github.read_file\n-> agent.handoff: reviewer -> summarizer`,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-[color:var(--border-subtle)] py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <div className="grid gap-x-6 gap-y-16 lg:grid-cols-12 lg:items-start relative">
          <ScrollReveal className="lg:col-span-4 lg:sticky lg:top-32">
            <p className="landing-kicker">02 / Control logic</p>
            <h2
              className="mt-4 max-w-[520px] text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] tracking-[-0.07em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
            >
              From prompt to observable run.
            </h2>
            <p
              className="mt-5 max-w-[430px] text-base leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              This is where the page shifts from mood to mechanism. The steps stay concise,
              but every one of them points back to the real thing you care about: a run you
              can inspect, steer, and trust.
            </p>

            <div className="mt-8 space-y-3">
              {["Roles stay explicit", "Tools stay namespaced", "Events stay typed"].map((item) => (
                <div
                  key={item}
                  className="landing-chip text-[11px] uppercase tracking-[0.28em]"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                >
                  {item}
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Awwwards Vertical Line Tracker inside Col 5 Void */}
          <div className="hidden lg:flex flex-col items-center absolute left-[37.5%] top-16 bottom-0 w-px opacity-40 pointer-events-none">
            <div className="w-px h-32 border-l border-dashed border-[color:var(--border-default)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] my-6 animate-pulse shadow-[0_0_12px_var(--accent-primary)]" />
            <div className="origin-center -rotate-90 whitespace-nowrap text-[9px] uppercase tracking-[0.3em] font-mono text-[color:var(--text-tertiary)] my-16">
              SYS_ROUTER // ACTIVE
            </div>
            <div className="w-px flex-1 border-l border-dashed border-[color:var(--border-default)]" />
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-80px" }}
            className="lg:col-start-6 lg:col-span-7 space-y-8"
          >
            {STEPS.map((step, index) => (
              <motion.article
                key={step.num}
                variants={staggerItem}
                whileHover={{ y: -4 }}
                className={`landing-panel grid gap-5 rounded-[32px] p-5 sm:p-6 xl:grid-cols-[110px_1fr_310px] ${
                  index % 2 === 1 ? "xl:translate-x-5" : ""
                }`}
              >
                <div
                  className="text-[3rem] leading-none tracking-[-0.08em]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    color: "var(--accent-primary)",
                  }}
                >
                  {step.num}
                </div>

                <div>
                  <p className="landing-kicker">Step {step.num}</p>
                  <h3
                    className="mt-3 text-[1.7rem] leading-tight tracking-[-0.05em]"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="mt-4 max-w-[520px] text-[15px] leading-7"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {step.description}
                  </p>
                </div>

                <div
                  className="rounded-[24px] border border-[color:var(--border-subtle)] p-4"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.56), rgba(255,250,244,0.84))",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="landing-kicker">Runtime excerpt</span>
                    <span
                      className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        background: "rgba(23,18,15,0.06)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      typed
                    </span>
                  </div>
                  <pre
                    className="mt-4 overflow-x-auto whitespace-pre-wrap text-[12px] leading-6"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
                  >
                    {step.code}
                  </pre>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
