"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { GradientText } from "@/components/ui/GradientText";
import { Badge } from "@/components/ui/Badge";

export function HeroSection() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: "var(--gradient-hero)",
      }}
    >
      {/* Dot grid background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.25,
          backgroundImage: "radial-gradient(circle, hsl(225, 15%, 30%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow orb */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, hsl(185deg 100% 50% / 0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "120px 32px 80px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}
        >
          {/* Badge */}
          <motion.div variants={staggerItem}>
            <Badge>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--status-active)",
                  display: "inline-block",
                  animation: "pulse 2s infinite",
                }}
              />
              MCP-Native · Multi-Agent · Real-Time
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={staggerItem}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(48px, 8vw, 88px)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 900,
              margin: 0,
            }}
          >
            <span style={{ color: "var(--text-primary)" }}>Orchestrate</span>{" "}
            <GradientText>AI Agents</GradientText>
            <br />
            <span style={{ color: "var(--text-primary)" }}>Like Never Before</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={staggerItem}
            style={{
              maxWidth: 560,
              fontSize: 18,
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              margin: 0,
            }}
          >
            A Python framework for building multi-agent systems powered by MCP servers,
            with real-time Mission Control for live workflow monitoring.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={staggerItem}
            style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}
          >
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: "var(--radius-full)",
                background: "var(--accent-primary)",
                color: "var(--bg-primary)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                transition: "all 0.3s ease",
                boxShadow: "0 0 40px hsl(185deg 100% 50% / 0.25)",
              }}
            >
              Open Mission Control
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: "var(--radius-full)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 15,
                textDecoration: "none",
                border: "1px solid var(--border-default)",
                transition: "all 0.3s ease",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              View on GitHub
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={staggerItem}
            style={{ display: "flex", gap: 48, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}
          >
            {[
              { value: "∞", label: "MCP Servers" },
              { value: "2+", label: "LLM Providers" },
              { value: "11", label: "Event Types" },
              { value: "0", label: "Config Files" },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--accent-primary)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 24,
            height: 40,
            borderRadius: 12,
            border: "1px solid var(--border-default)",
            display: "flex",
            justifyContent: "center",
            paddingTop: 6,
          }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 4, height: 8, borderRadius: 2, background: "var(--accent-primary)" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
