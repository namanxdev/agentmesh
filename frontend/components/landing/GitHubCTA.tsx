"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { count, ref };
}

const ease = [0.16, 1, 0.3, 1] as const;

export function GitHubCTA() {
  const [stars, setStars] = useState(124);
  const { count, ref: counterRef } = useAnimatedCounter(stars);

  useEffect(() => {
    fetch("https://api.github.com/repos/namanxdev/agentmesh")
      .then((r) => r.json())
      .then((d) => { if (d.stargazers_count) setStars(d.stargazers_count); })
      .catch(() => {});
  }, []);

  return (
    <section
      style={{ background: "transparent", borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease }}
        className="mx-auto max-w-[1400px] px-6 md:px-10 py-28 md:py-40"
      >
        {/* Kicker */}
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(240,244,255,0.3)",
            marginBottom: "20px",
          }}
        >
          Open source · Free forever
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "clamp(4rem, 12vw, 12rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
            color: "#F0F4FF",
            marginBottom: "48px",
          }}
        >
          Build in<br />
          <span style={{ color: "var(--accent-cyan)" }}>public.</span>
        </h2>

        {/* Star count + CTAs row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.75,
              color: "rgba(240,244,255,0.45)",
              maxWidth: "420px",
            }}
          >
            AgentMesh is fully open source. Star it, fork it, break it, and build the next
            generation of multi-agent workflows on top of it.
          </p>

          <div className="flex flex-col gap-5">
            {/* Star count */}
            <div className="flex items-baseline gap-3">
              <span
                ref={counterRef}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  letterSpacing: "-0.04em",
                  color: "var(--accent-cyan)",
                  lineHeight: 1,
                }}
              >
                {count.toLocaleString()}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(240,244,255,0.3)",
                }}
              >
                GitHub stars
              </span>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-8">
              <a
                href="https://github.com/namanxdev/agentmesh"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline inline-flex items-center gap-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--accent-cyan)",
                  transition: "opacity 0.2s",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                Star on GitHub ↗
              </a>
              <a
                href="#how-it-works"
                className="no-underline"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(240,244,255,0.3)",
                  transition: "color 0.2s",
                }}
              >
                Read the Docs →
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
