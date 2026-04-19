"use client";

import { motion } from "framer-motion";

const CATEGORIES = [
  {
    label: "Backend",
    items: ["FastAPI", "LangGraph", "FastMCP", "Python 3.11+", "WebSocket"],
  },
  {
    label: "Frontend",
    items: ["Next.js 16", "React 19", "Framer Motion", "Tailwind CSS", "TypeScript"],
  },
  {
    label: "AI / LLM",
    items: ["Gemini API", "Groq", "MCP Protocol", "LangChain"],
  },
  {
    label: "Deploy",
    items: ["Render", "Vercel", "Docker", "GitHub Actions"],
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function TechStack() {
  return (
    <section
      id="tech-stack"
      style={{ background: "transparent", borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Section header */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 pt-24 pb-16">
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
          <span style={{ color: "var(--accent-cyan)" }}>04</span> — Stack
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
          Built on<br />proven tools.
        </h2>
      </div>

      {/* Categories — table layout, no cards */}
      <div className="mx-auto max-w-[1400px]">
        {CATEGORIES.map((cat, ci) => (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease, delay: ci * 0.07 }}
            className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-10 px-6 md:px-10 py-10 md:py-12"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Category label */}
            <div className="flex md:items-start">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(240,244,255,0.3)",
                  paddingTop: "2px",
                }}
              >
                {cat.label}
              </span>
            </div>

            {/* Items row */}
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {cat.items.map((item, ii) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: ci * 0.07 + ii * 0.05 }}
                  whileHover={{ color: "#00E5FF" }}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
                    letterSpacing: "-0.02em",
                    color: "rgba(240,244,255,0.75)",
                    cursor: "default",
                    transition: "color 0.2s",
                  }}
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </motion.div>
        ))}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
      </div>
    </section>
  );
}
