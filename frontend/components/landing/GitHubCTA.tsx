"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function GitHubCTA() {
  const [copied, setCopied] = useState(false);
  const startCommand = "cd frontend && npm run dev";

  const copyCommand = async () => {
    await navigator.clipboard.writeText(startCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section id="launch" className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <ScrollReveal
          className="overflow-hidden rounded-[38px] border p-6 sm:p-8 lg:p-10"
          style={{
            borderColor: "rgba(23,18,15,0.12)",
            background: "linear-gradient(180deg, rgba(215,255,112,0.92), rgba(215,255,112,0.78))",
            boxShadow: "0 28px 80px rgba(23,18,15,0.1)",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <div>
              <p className="landing-kicker" style={{ color: "rgba(23,18,15,0.54)" }}>
                04 / Open source
              </p>
              <h2
                className="mt-4 max-w-[520px] text-[clamp(2.8rem,5.4vw,4.8rem)] leading-[0.95] tracking-[-0.07em]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "var(--landing-ink)" }}
              >
                AgentMesh is open source.
              </h2>
              <p
                className="mt-5 max-w-[430px] text-base leading-7"
                style={{ color: "rgba(23,18,15,0.72)" }}
              >
                The close now matches the rest of the page: bold, direct, and product-first.
                It points people at the real app and the real local entry point instead of ending
                on another dark block.
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
                    "Warm landing, dark dashboard, one coherent product surface.",
                    "Mission Control stays one click away from the editorial story.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[20px] border border-[rgba(23,18,15,0.1)] bg-[rgba(255,255,255,0.34)] px-4 py-3 text-sm leading-6"
                      style={{ color: "rgba(23,18,15,0.76)" }}
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
        </ScrollReveal>
      </div>
    </section>
  );
}
