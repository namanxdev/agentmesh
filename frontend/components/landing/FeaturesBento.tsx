"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FEATURES = [
  {
    num: "01",
    label: "Observe",
    headline: "Every token.\nIn public.",
    description:
      "Real-time WebSocket stream surfaces every agent event — tool calls, handoffs, token budgets, and errors. No hidden state. The whole mesh thinks out loud.",
    bullets: [
      "Live WebSocket event stream",
      "Per-agent token tracking",
      "Tool call inspector with payloads",
      "Full handoff trace with context",
    ],
    image: "/grok-observe.jpg",
    accent: "#00E5FF",
  },
  {
    num: "02",
    label: "Direct",
    headline: "You control\nthe handoffs.",
    description:
      "Define when agents hand off, set human checkpoints, and control MCP tool access. Parallel execution where safe, human gates where it matters.",
    bullets: [
      "Declarative handoff rules in Python",
      "Human-in-the-loop checkpoints",
      "Parallel + sequential execution",
      "Rollback to any checkpoint",
    ],
    image: "/grok-direct.jpg",
    accent: "#7C3AED",
  },
  {
    num: "03",
    label: "Deploy",
    headline: "pip install\nagentmesh.",
    description:
      "One package, any MCP server. Connect filesystem, GitHub, or any custom tool. Deploy free on Render or Vercel with zero infra overhead.",
    bullets: [
      "pip install agentmesh",
      "Any MCP server compatible",
      "Gemini + Groq free tier LLMs",
      "Render / Vercel deploy",
    ],
    image: "/grok-deploy.jpg",
    accent: "#10B981",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function FeaturesBento() {
  const [active, setActive] = useState(0);
  const feat = FEATURES[active];

  return (
    <section
      id="features"
      style={{ background: "transparent", borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Header row */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 pt-24 pb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div>
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
            <span style={{ color: "var(--accent-cyan)" }}>01</span> — Capability
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
            What you<br />can do.
          </h2>
        </div>

        {/* Tab switcher — plain text links, no pills */}
        <nav className="flex flex-row md:flex-col gap-4 md:gap-1 md:items-end md:pb-1">
          {FEATURES.map((f, i) => (
            <button
              key={f.num}
              onClick={() => setActive(i)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: active === i ? f.accent : "rgba(240,244,255,0.25)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 0",
                transition: "color 0.25s",
                textAlign: "right",
              }}
            >
              {f.num} — {f.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Split content panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.38, ease }}
          className="grid lg:grid-cols-[1fr_1.15fr]"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            minHeight: "520px",
          }}
        >
          {/* Text side */}
          <div className="flex flex-col justify-center px-6 md:px-10 lg:px-16 xl:px-20 py-16 lg:py-20">
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: feat.accent,
                marginBottom: "24px",
              }}
            >
              {feat.num} — {feat.label}
            </p>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(2.2rem, 4vw, 3.6rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.035em",
                color: "#F0F4FF",
                marginBottom: "24px",
                whiteSpace: "pre-line",
              }}
            >
              {feat.headline}
            </h3>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.8,
                color: "rgba(240,244,255,0.5)",
                marginBottom: "36px",
                maxWidth: "440px",
              }}
            >
              {feat.description}
            </p>
            <ul style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {feat.bullets.map((b, i) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease, delay: i * 0.06 }}
                  style={{ display: "flex", alignItems: "center", gap: "14px" }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "1px",
                      background: feat.accent,
                      flexShrink: 0,
                      opacity: 0.8,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      letterSpacing: "0.06em",
                      color: "rgba(240,244,255,0.45)",
                    }}
                  >
                    {b}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Image side — full bleed, no card */}
          <div
            className="relative min-h-[320px] lg:min-h-0"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={feat.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity: 0.85 }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(150deg, rgba(4,6,14,0.5) 0%, rgba(4,6,14,0) 60%, rgba(4,6,14,0.2) 100%)",
              }}
            />
            {/* Watermark number */}
            <div
              aria-hidden="true"
              className="absolute bottom-6 right-8 select-none pointer-events-none"
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "clamp(6rem, 14vw, 12rem)",
                  lineHeight: 1,
                  color: "rgba(240,244,255,0.035)",
                  letterSpacing: "-0.06em",
                }}
              >
                {feat.num}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
