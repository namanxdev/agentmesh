"use client";

import { motion, useScroll } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useRef } from "react";

const STEPS = [
  {
    id: "01",
    title: "Build",
    description: "Set up your agentic blocks and tools on the visual canvas. Define roles explicitly before execution begins.",
    code: "nodes.add({ type: 'llm', role: 'synthesizer' })",
  },
  {
    id: "02",
    title: "Connect",
    description: "Wire agents and tools together with defined handoffs. Inject human approval gates exactly where risk occurs.",
    code: "edges.add({ source: 'router', target: 'approval' })",
  },
  {
    id: "03",
    title: "Run",
    description: "Deploy the pipeline in Mission Control and see the live orchestration of complex token movement.",
    code: "mesh.execute(pipeline_id, { stream: true })",
  },
  {
    id: "04",
    title: "Watch",
    description: "Observe the real-time event bus. Every API call, parallel branch, and system failure is traced instantly.",
    code: "Stream: [Agent Start] -> [Tool Search] ...",
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  return (
    <section id="how-it-works" ref={containerRef} className="border-b border-[color:var(--border-subtle)] py-20 sm:py-24 lg:py-32 bg-[linear-gradient(to_bottom,rgb(255,250,244),rgb(250,245,239))]">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 relative z-10">
        <div className="grid gap-x-8 gap-y-14 lg:grid-cols-12 lg:items-start">
          <ScrollReveal className="lg:col-span-5 lg:sticky lg:top-28">
            <p className="landing-kicker">02 / Control logic</p>
            <h2
              className="mt-4 max-w-[520px] text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] tracking-[-0.04em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
            >
              From prompt to observable run.
            </h2>
            <p
              className="mt-5 max-w-[430px] text-base leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              Move past generic chatbots. AgentMesh enables step-by-step direction over 
              specialized workers and tools—safeguarding production outcomes with an uncompromised audit trail.
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

          <div className="lg:col-start-6 lg:col-span-7 relative pl-10 md:pl-12 py-4">
            {/* Scrubbable Scroll Progress Connector Line */}
            <div className="absolute left-[12px] md:left-[14px] top-12 bottom-12 w-[2px] bg-[rgba(23,18,15,0.06)]" />
            <motion.div
              className="absolute left-[12px] md:left-[14px] top-12 bottom-12 w-[2px] origin-top bg-[var(--landing-acid)] shadow-[0_0_15px_var(--landing-acid)]"
              style={{ scaleY: scrollYProgress }}
            />

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-80px" }}
              className="space-y-6"
            >
              {STEPS.map((step, index) => (
                <motion.article
                  key={step.id}
                  variants={staggerItem}
                  whileHover={{ x: 4 }}
                  className="relative landing-panel grid gap-5 rounded-[32px] p-5 sm:p-6 xl:grid-cols-[1fr_300px] transition-transform duration-300"
                >
                  {/* Progress Node Dot */}
                  <div className="absolute -left-[35px] md:-left-[41px] top-8 h-4 w-4 rounded-full bg-[var(--landing-acid)] shadow-[0_0_8px_var(--landing-acid)] border-[3px] border-[#f7f0e6]">
                    <span className="animate-ping absolute -inset-[2px] rounded-full opacity-90 delay-150 duration-1000" style={{ background: "var(--landing-acid)" }}></span>
                  </div>

                  <div>
                    <h3
                      className="text-[1.8rem] leading-none tracking-[-0.05em]"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
                    >
                      <span className="opacity-30 mr-3">{step.id}</span>
                      {step.title}
                    </h3>
                    <p
                      className="mt-4 max-w-[500px] text-[15px] leading-7"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {step.description}
                    </p>
                  </div>

                  <div
                    className="rounded-[24px] border border-[color:var(--border-subtle)] p-4 flex flex-col justify-center"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.56), rgba(255,250,244,0.84))",
                    }}
                  >
                    <pre
                      className="overflow-x-auto whitespace-pre-wrap text-[12px] leading-5"
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
      </div>
    </section>
  );
}
