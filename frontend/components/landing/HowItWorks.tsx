"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { staggerContainer, staggerItem } from "@/lib/motion";

const STEPS = [
  {
    num: "01",
    title: "Define your workflow",
    description:
      "Lay out roles, tools, approvals, and branches in one pipeline surface so the run starts with structure instead of implicit behavior.",
    code: `input -> router -> researcher\n            -> reviewer\n            -> synthesis`,
  },
  {
    num: "02",
    title: "Watch the mesh run",
    description:
      "Mission Control streams event bus activity live, so branch selection, tool execution, token movement, and human gates stay visible.",
    code: `agent_start 12:04:18\n tool_call github.read_file\n handoff reviewer -> synthesizer`,
  },
  {
    num: "03",
    title: "Inspect every decision",
    description:
      "Tool inputs, approval requests, message output, and final summaries remain inspectable after the workflow finishes.",
    code: `approval.required = true\nrisk_score = 0.82\nfinal_report = markdown`,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-[color:var(--border-subtle)] py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <div className="grid gap-x-8 gap-y-14 lg:grid-cols-12 lg:items-start">
          <ScrollReveal className="lg:col-span-5 lg:sticky lg:top-28">
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
              Three steps, oversized numerals, and a cleaner editorial rhythm. The layout now
              reads like a guided system walkthrough instead of a staggered card pile.
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

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-80px" }}
            className="lg:col-start-6 lg:col-span-7 space-y-5"
          >
            {STEPS.map((step) => (
              <motion.article
                key={step.num}
                variants={staggerItem}
                whileHover={{ y: -3 }}
                className="landing-panel grid gap-5 rounded-[32px] p-5 sm:p-6 xl:grid-cols-[140px_1fr_320px]"
              >
                <div
                  className="text-[3.6rem] leading-none tracking-[-0.08em] opacity-90"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    color: "transparent",
                    WebkitTextStroke: "1px rgba(232, 93, 42, 0.8)",
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
                    <span className="landing-kicker">Mission signal</span>
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
