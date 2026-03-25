"use client";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { GradientText } from "@/components/ui/GradientText";

export function GitHubCTA() {
  return (
    <section
      style={{
        background: "var(--bg-secondary)",
        padding: "120px 0",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "0 32px",
          textAlign: "center",
        }}
      >
        <ScrollReveal>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(32px, 5vw, 56px)",
              lineHeight: 1.15,
              margin: "0 0 20px",
            }}
          >
            <span style={{ color: "var(--text-primary)" }}>Open Source &amp;</span>
            <br />
            <GradientText>Ready to Use</GradientText>
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 17,
              lineHeight: 1.7,
              marginBottom: 48,
            }}
          >
            Clone the repo, install dependencies, and start orchestrating agents in minutes.
            No API keys required for the framework itself.
          </p>

          {/* Clone command */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 32,
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              textAlign: "left",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--accent-primary)" }}>$</span> git clone
              https://github.com/your-org/agentmesh && cd agentmesh
            </span>
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  "git clone https://github.com/your-org/agentmesh && cd agentmesh"
                )
              }
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                cursor: "pointer",
                transition: "color 0.2s",
                flexShrink: 0,
              }}
            >
              Copy
            </button>
          </div>

          <motion.a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 32px",
              borderRadius: "var(--radius-full)",
              background: "var(--text-primary)",
              color: "var(--bg-primary)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              transition: "all 0.3s ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Star on GitHub
          </motion.a>
        </ScrollReveal>
      </div>
    </section>
  );
}
