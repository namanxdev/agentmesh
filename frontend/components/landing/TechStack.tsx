"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { staggerContainer, staggerItem } from "@/lib/motion";

const RAIL_A = ["Gemini", "Groq", "GitHub", "Filesystem", "Postgres", "Slack", "Linear", "HTTP APIs"];

const RAIL_B = [
  "Python core",
  "FastAPI",
  "WebSocket events",
  "Next.js 16",
  "React Flow",
  "Framer Motion",
  "Tailwind v4",
  "Typed state",
];

const COMPATIBILITY_CARDS = [
  {
    title: "Model layer",
    description:
      "Keep the orchestration language stable even when the model providers underneath it change.",
    items: ["Gemini", "Groq", "Provider abstraction"],
  },
  {
    title: "Tool layer",
    description:
      "Expose external capability through MCP so each tool stays discoverable, scoped, and reviewable.",
    items: ["MCP servers", "Namespaces", "Custom transports"],
  },
  {
    title: "Control layer",
    description:
      "Human approvals, retries, and branch logic live beside the run instead of outside it.",
    items: ["Approval gates", "Retries", "Typed telemetry"],
  },
];

export function TechStack() {
  return (
    <section id="tech-stack" className="border-b border-[color:var(--border-subtle)] py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <ScrollReveal className="max-w-[820px]">
          <p className="landing-kicker">03 / Compatibility</p>
          <h2
            className="mt-4 text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] tracking-[-0.07em]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
          >
            Plug into real stacks, not a demo-only playground.
          </h2>
          <p
            className="mt-5 max-w-[560px] text-base leading-7"
            style={{ color: "var(--text-secondary)" }}
          >
            The references from Gumloop and Relay are strong because they make capability feel
            broad and composable. This section does the same, but grounds it in the actual stack
            AgentMesh already uses.
          </p>
        </ScrollReveal>

        <div className="mt-10 space-y-4">
          <div className="landing-panel rounded-[30px] px-4 py-4">
            <div className="landing-marquee">
              <div className="landing-marquee-track">
                {Array.from({ length: 2 }).flatMap((_, groupIndex) =>
                  RAIL_A.map((item, index) => (
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

          <div className="landing-panel rounded-[30px] px-4 py-4">
            <div className="landing-marquee">
              <div className="landing-marquee-track reverse">
                {Array.from({ length: 2 }).flatMap((_, groupIndex) =>
                  RAIL_B.map((item, index) => (
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
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-8 grid gap-4 lg:grid-cols-3"
        >
          {COMPATIBILITY_CARDS.map((card, index) => (
            <motion.article
              key={card.title}
              variants={staggerItem}
              whileHover={{ y: -5 }}
              className={`rounded-[30px] p-6 sm:p-7 ${
                index === 1 ? "landing-panel-dark" : "landing-panel"
              }`}
            >
              <p
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{
                  color: index === 1 ? "rgba(247,240,232,0.48)" : "var(--text-tertiary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {`0${index + 1}`}
              </p>

              <h3
                className="mt-5 text-[1.8rem] leading-tight tracking-[-0.05em]"
                style={{
                  color: index === 1 ? "#f7f0e8" : "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                }}
              >
                {card.title}
              </h3>

              <p
                className="mt-4 text-[15px] leading-7"
                style={{ color: index === 1 ? "rgba(247,240,232,0.72)" : "var(--text-secondary)" }}
              >
                {card.description}
              </p>

              <div className="mt-8 space-y-3">
                {card.items.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[18px] px-4 py-3"
                    style={{
                      background: index === 1 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.58)",
                      border:
                        index === 1
                          ? "1px solid rgba(255,255,255,0.08)"
                          : "1px solid rgba(23,18,15,0.08)",
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background:
                          item === card.items[card.items.length - 1]
                            ? "var(--landing-acid)"
                            : "var(--accent-primary)",
                      }}
                    />
                    <span
                      className="text-[11px] uppercase tracking-[0.24em]"
                      style={{
                        color: index === 1 ? "#f7f0e8" : "var(--text-primary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
