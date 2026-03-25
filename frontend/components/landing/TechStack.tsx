"use client";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionNumber } from "@/components/ui/SectionNumber";
import { staggerContainer, staggerItem } from "@/lib/motion";

const TECH = [
  { name: "Python", role: "Agent Framework", color: "hsl(53, 90%, 55%)" },
  { name: "FastAPI", role: "REST + WebSocket API", color: "hsl(160, 60%, 50%)" },
  { name: "FastMCP", role: "MCP Client", color: "hsl(185, 100%, 50%)" },
  { name: "Gemini", role: "LLM Provider", color: "hsl(200, 80%, 60%)" },
  { name: "Groq", role: "LLM Provider", color: "hsl(270, 80%, 65%)" },
  { name: "Next.js", role: "Frontend Framework", color: "hsl(0, 0%, 90%)" },
  { name: "React Flow", role: "Graph Visualization", color: "hsl(330, 80%, 60%)" },
  { name: "Framer Motion", role: "Animations", color: "hsl(38, 92%, 55%)" },
  { name: "Zustand", role: "State Management", color: "hsl(15, 85%, 55%)" },
  { name: "TypeScript", role: "Type Safety", color: "hsl(210, 80%, 60%)" },
  { name: "Tailwind CSS", role: "Styling", color: "hsl(185, 80%, 50%)" },
  { name: "Pydantic", role: "Data Validation", color: "hsl(142, 71%, 45%)" },
];

export function TechStack() {
  return (
    <section id="tech-stack" style={{ background: "var(--bg-primary)", padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <ScrollReveal style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 64 }}>
          <SectionNumber num="03" />
          <div>
            <h2
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Built With the Best
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 10, fontSize: 16 }}>
              Best-in-class tools across the full stack.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {TECH.map(({ name, role, color }) => (
            <motion.div
              key={name}
              variants={staggerItem}
              whileHover={{ y: -4, borderColor: color }}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                cursor: "default",
                transition: "border-color 0.2s ease, transform 0.2s ease",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 15,
                  marginBottom: 4,
                }}
              >
                {name}
              </div>
              <div style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{role}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
