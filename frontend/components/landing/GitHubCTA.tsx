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
    <section id="launch" className="py-24 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <ScrollReveal className="landing-panel-dark overflow-hidden rounded-[38px] p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="landing-kicker text-[rgba(247,240,232,0.52)]">04 / Launch</p>
              <h2
                className="mt-4 max-w-[520px] text-[clamp(2.8rem,5.4vw,4.8rem)] leading-[0.95] tracking-[-0.07em]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "#f7f0e8" }}
              >
                Put the better front end in front of the product.
              </h2>
              <p
                className="mt-5 max-w-[430px] text-base leading-7"
                style={{ color: "rgba(247,240,232,0.7)" }}
              >
                No fake repo URL, no placeholder clone line. This close is about the next real
                step in your local environment: run the front end, open Mission Control, and see
                the new visual system with the actual product surface.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "var(--landing-acid)",
                    color: "var(--landing-ink)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                  }}
                >
                  Open Mission Control
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-3 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-6 py-4 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
                  style={{
                    color: "#f7f0e8",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                  }}
                >
                  Revisit the system
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[30px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="landing-kicker text-[rgba(247,240,232,0.52)]">Start locally</p>
                    <p
                      className="mt-3 text-[1.5rem] leading-tight tracking-[-0.04em]"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        color: "#f7f0e8",
                      }}
                    >
                      Front end entry point
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyCommand}
                    className="rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.24em]"
                    style={{
                      background: copied ? "var(--landing-acid)" : "rgba(255,255,255,0.06)",
                      color: copied ? "var(--landing-ink)" : "#f7f0e8",
                      fontFamily: "var(--font-mono)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div
                  className="mt-5 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,9,8,0.4)] p-4"
                  style={{ fontFamily: "var(--font-mono)", color: "#f7f0e8" }}
                >
                  <span style={{ color: "var(--landing-acid)" }}>$</span> {startCommand}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    "The landing palette is scoped so the dashboard stays intact.",
                    "Mission Control remains one click away for actual workflow use.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-6"
                      style={{ color: "rgba(247,240,232,0.76)" }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Aesthetic", value: "editorial" },
                  { label: "Tone", value: "product-first" },
                  { label: "Motion", value: "purposeful" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4"
                  >
                    <p className="landing-kicker text-[rgba(247,240,232,0.52)]">{item.label}</p>
                    <p
                      className="mt-3 text-2xl tracking-[-0.05em]"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        color: "#f7f0e8",
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
