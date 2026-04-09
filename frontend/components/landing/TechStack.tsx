"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { staggerContainer, staggerItem } from "@/lib/motion";

const STACK_ITEMS = [
  "LangGraph",
  "FastAPI",
  "Next.js",
  "PostgreSQL",
  "FastMCP",
  "WebSockets",
];

const STACK_PANELS = [
  {
    title: "Model layer",
    description:
      "Provider abstraction keeps orchestration stable while the model mix underneath it evolves.",
    items: ["Gemini", "Groq", "OpenAI"],
    tone: "light",
  },
  {
    title: "Tool layer",
    description:
      "MCP servers expose capability in one consistent shape, from local filesystems to internal APIs.",
    items: ["stdio", "http", "namespaced tools"],
    tone: "dark",
  },
  {
    title: "Control layer",
    description:
      "Routing, retries, approvals, and event telemetry live beside the run instead of outside it.",
    items: ["handoffs", "approval gates", "typed events"],
    tone: "light",
  },
] as const;

export function TechStack() {
  return (
    <section id="tech-stack" className="border-b border-[color:var(--border-subtle)] py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[880px]"
        >
          <p className="landing-kicker">03 / Tech stack</p>
          <h2
            className="mt-4 text-[clamp(3.5rem,7vw,6.5rem)] leading-[0.85] tracking-[-0.05em]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
          >
            Built for production scale.
          </h2>
          <p
            className="mt-6 max-w-[600px] text-lg leading-8"
            style={{ color: "var(--text-secondary)" }}
          >
            We didn’t invent a new proprietary runtime. AgentMesh is a pure observability and control layer that wraps your existing multi-agent stack in a deterministic fabric.
          </p>
        </motion.div>

        <div className="mt-10 overflow-hidden rounded-[30px] border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.36)] px-4 py-4">
          <div className="landing-marquee">
            <div className="landing-marquee-track">
              {Array.from({ length: 2 }).flatMap((_, groupIndex) =>
                STACK_ITEMS.map((item, index) => (
                  <span
                    key={`${groupIndex}-${index}-${item}`}
                    className="landing-chip text-[11px] uppercase tracking-[0.28em]"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    {item}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-6 lg:grid-cols-3"
        >
          {STACK_PANELS.map((panel, idx) => {
            const dark = panel.tone === "dark";

            return (
              <motion.article
                variants={staggerItem}
                key={panel.title}
                whileHover={{ y: -8, scale: 1.01 }}
                className={`group relative overflow-hidden rounded-[40px] p-6 sm:p-9 transition-shadow duration-500 hover:shadow-[0_40px_80px_rgba(23,18,15,0.08)] ${dark ? "landing-panel-dark" : "landing-panel"}`}
              >
                {/* Awwwards style background numeral */}
                <div
                  className={`absolute -right-4 -bottom-8 text-[12rem] sm:text-[14rem] leading-none tracking-tighter select-none pointer-events-none transition-transform duration-700 group-hover:scale-110 ${
                    dark ? "text-white opacity-5" : "text-black opacity-[0.03]"
                  }`}
                  style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
                >
                  0{idx + 1}
                </div>
                
                <div className="relative z-10 flex h-full flex-col">
                  <p
                    className="text-[11px] uppercase tracking-[0.28em]"
                    style={{
                      color: dark ? "rgba(247,240,232,0.48)" : "var(--text-tertiary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {panel.title}
                  </p>

                  <h3
                    className="mt-5 text-[1.8rem] leading-tight tracking-[-0.05em]"
                  style={{
                    color: dark ? "#f7f0e8" : "var(--text-primary)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                  }}
                >
                  {panel.title}
                </h3>

                <p
                  className="mt-4 text-[15px] leading-7"
                  style={{ color: dark ? "rgba(247,240,232,0.7)" : "var(--text-secondary)" }}
                >
                  {panel.description}
                </p>

                <div className="mt-8 space-y-3">
                  {panel.items.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-[18px] px-4 py-3"
                      style={{
                        background: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.58)",
                        border: dark
                          ? "1px solid rgba(255,255,255,0.08)"
                          : "1px solid rgba(23,18,15,0.08)",
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background:
                            index === panel.items.length - 1
                              ? "var(--landing-acid)"
                              : "var(--accent-primary)",
                        }}
                      />
                      <span
                        className="text-[11px] uppercase tracking-[0.24em]"
                        style={{
                          color: dark ? "#f7f0e8" : "var(--text-primary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
