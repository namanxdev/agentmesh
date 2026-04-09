"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export function GitHubCTA() {
  const [copied, setCopied] = useState(false);
  const startCommand = "cd frontend && npm run dev";

  const copyCommand = async () => {
    await navigator.clipboard.writeText(startCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section id="launch" className="py-20 sm:py-24 relative z-10 bg-[linear-gradient(to_bottom,rgb(250,245,239),rgb(255,255,255))]">
      <div className="mx-auto max-w-[1440px] px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 80, filter: "blur(10px)", scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-[40px] border p-6 sm:p-10 lg:p-14 shadow-sm hover:shadow-[0_40px_100px_rgba(215,255,112,0.15)] transition-all duration-700 hover:-translate-y-2 cursor-default"
          style={{
            borderColor: "rgba(23,18,15,0.12)",
            background: "linear-gradient(180deg, rgba(215,255,112,0.95), rgba(215,255,112,0.85))",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <div>
              <p className="landing-kicker" style={{ color: "rgba(23,18,15,0.54)" }}>
                04 / Open source
              </p>
              <motion.h2
                initial={{ filter: "blur(8px)", opacity: 0, y: 20 }}
                whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4 max-w-[550px] text-[clamp(3.8rem,7vw,7rem)] leading-[0.85] tracking-[-0.06em]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "var(--landing-ink)" }}
              >
                Own the orchestration.
              </motion.h2>
              <p
                className="mt-6 max-w-[440px] text-lg leading-8"
                style={{ color: "rgba(23,18,15,0.72)" }}
              >
                Built for teams scaling AI in production. Control execution flow, trace every tool call, and inject human safety gates without surrendering your architecture to black-box commercial platforms.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div
                  className="rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.24em]"
                  style={{
                    borderColor: "rgba(23,18,15,0.12)",
                    background: "rgba(255,255,255,0.42)",
                    color: "var(--landing-ink)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Self-hosted / MCP-native / typed events
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "var(--landing-ink)",
                    color: "var(--landing-paper)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                  }}
                >
                  Open Mission Control
                </Link>
                <a
                  href="#tech-stack"
                  className="inline-flex items-center gap-3 rounded-full border px-6 py-4 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
                  style={{
                    borderColor: "rgba(23,18,15,0.12)",
                    background: "rgba(255,255,255,0.36)",
                    color: "var(--landing-ink)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                  }}
                >
                  Read the stack
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[30px] border border-[rgba(23,18,15,0.12)] bg-[rgba(255,255,255,0.36)] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="landing-kicker" style={{ color: "rgba(23,18,15,0.54)" }}>
                      Start locally
                    </p>
                    <p
                      className="mt-3 text-[1.5rem] leading-tight tracking-[-0.04em]"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        color: "var(--landing-ink)",
                      }}
                    >
                      Local entry point
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyCommand}
                    className="rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.24em]"
                    style={{
                      background: copied ? "var(--landing-ink)" : "rgba(23,18,15,0.06)",
                      color: copied ? "var(--landing-paper)" : "var(--landing-ink)",
                      fontFamily: "var(--font-mono)",
                      border: "1px solid rgba(23,18,15,0.12)",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div
                  className="mt-5 rounded-[24px] border border-[rgba(23,18,15,0.1)] bg-[rgba(23,18,15,0.92)] p-4"
                  style={{ fontFamily: "var(--font-mono)", color: "#f7f0e8" }}
                >
                  <span style={{ color: "var(--landing-acid)" }}>$</span> {startCommand}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    "Complete execution provenance.",
                    "Native multi-agent parallelization.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[20px] border border-[rgba(23,18,15,0.1)] bg-[rgba(255,255,255,0.34)] px-4 py-3 text-[13px] font-medium leading-6"
                      style={{ color: "rgba(23,18,15,0.85)" }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Aesthetic", value: "editorial" },
                  { label: "Runtime", value: "observable" },
                  { label: "Source", value: "open" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-[rgba(23,18,15,0.12)] bg-[rgba(255,255,255,0.32)] p-4"
                  >
                    <p className="landing-kicker" style={{ color: "rgba(23,18,15,0.54)" }}>
                      {item.label}
                    </p>
                    <p
                      className="mt-3 text-2xl tracking-[-0.05em]"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        color: "var(--landing-ink)",
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
