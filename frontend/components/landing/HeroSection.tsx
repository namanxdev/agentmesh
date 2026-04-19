"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";



const ease = [0.16, 1, 0.3, 1] as const;

function CursorSpotlight() {
  const [pos, setPos] = useState({ x: -999, y: -999 });

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        background: `radial-gradient(480px circle at ${pos.x}px ${pos.y}px, rgba(0,229,255,0.055), transparent 70%)`,
        transition: "background 0.06s linear",
      }}
    />
  );
}

function MagneticButton({
  children,
  className,
  style,
  href,
  external,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href: string;
  external?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const springX = useSpring(0, { stiffness: 200, damping: 20 });
  const springY = useSpring(0, { stiffness: 200, damping: 20 });

  useEffect(() => {
    springX.set(offset.x);
    springY.set(offset.y);
  }, [offset, springX, springY]);

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({ x: (e.clientX - cx) * 0.3, y: (e.clientY - cy) * 0.3 });
  };

  const onLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <motion.a
      ref={ref}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{ x: springX, y: springY, ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
    >
      {children}
    </motion.a>
  );
}

const STATS = [
  { value: "11", label: "event types" },
  { value: "03s", label: "handoff target" },
  { value: "∞", label: "parallel agents" },
  { value: "0", label: "black-box steps" },
];

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const headlineY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <>
      <CursorSpotlight />

      <section
        ref={containerRef}
        className="relative flex min-h-[100dvh] flex-col overflow-hidden"
        style={{ background: "transparent" }}
      >
        {/* === LAYER 1: R3F ambient mesh (very subtle) === */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {/* Global MeshCanvas is now mounted in page.tsx */}
        </div>

        <motion.div
          style={{ scale: videoScale, opacity: videoOpacity }}
          className="pointer-events-none absolute inset-0 z-[1]"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
            style={{ 
              opacity: 0.15, 
              objectPosition: "60% center", 
              mixBlendMode: "color-dodge",
              filter: "contrast(1.5) brightness(1.2)"
            }}
          >
            <source src="/hero-loop.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* === LAYER 3: Gradient vignette === */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: [
              "radial-gradient(ellipse 100% 60% at 50% 100%, transparent 0%, transparent 70%)",
              "linear-gradient(to bottom, rgba(4,6,14,0.1) 0%, transparent 30%, transparent 60%, rgba(4,6,14,0.85) 100%)",
            ].join(", "),
          }}
        />

        {/* === LAYER 4: Grain texture === */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[3] opacity-[0.32] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
          }}
        />

        {/* === LAYER 5: Content === */}
        <div className="relative z-[4] flex flex-1 flex-col justify-between px-6 pb-10 pt-28 md:px-12 lg:px-16 xl:px-20">

          {/* Top row — editorial label */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="flex items-center justify-between"
          >
            <span
              className="text-[10px] uppercase tracking-[0.4em]"
              style={{ color: "rgba(240,244,255,0.35)", fontFamily: "var(--font-mono)" }}
            >
              01 / Mission Control
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full land-signal-dot"
                style={{ background: "#00E5FF" }}
              />
              <span
                className="text-[10px] uppercase tracking-[0.32em]"
                style={{ color: "rgba(240,244,255,0.35)", fontFamily: "var(--font-mono)" }}
              >
                Live · MCP-Native
              </span>
            </span>
          </motion.div>

          {/* Center — massive headline */}
          <motion.div
            style={{ y: headlineY, opacity: headlineOpacity }}
            className="flex flex-col"
          >
            <motion.h1
              initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease, delay: 0.2 }}
              className="relative select-none leading-[0.84] tracking-[-0.05em] uppercase"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(5rem, 14vw, 15rem)",
                color: "#F0F4FF",
              }}
            >
              {/* Depth shadow layer */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 select-none"
                style={{
                  color: "#00E5FF",
                  opacity: 0.1,
                  transform: "translate(5px, 7px)",
                  filter: "blur(2px)",
                }}
              >
                Build the<br />
                <span>mesh.</span>
              </span>
              Build the
              <br />
              <span
                style={{
                  color: "#00E5FF",
                  textShadow: "0 0 120px rgba(0,229,255,0.35), 0 0 40px rgba(0,229,255,0.2)",
                }}
              >
                mesh.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.55 }}
              className="mt-7 max-w-[520px] text-base leading-[1.75] md:text-[1.05rem]"
              style={{ color: "rgba(240,244,255,0.6)", textShadow: "0 1px 20px rgba(4,6,14,0.8)" }}
            >
              Orchestrate AI agents across MCP servers, watch every handoff
              in real time, and keep humans in the loop — without losing the
              shape of the run.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.72 }}
              className="mt-10 flex items-center gap-4"
            >
              <MagneticButton
                href="/dashboard"
                className="group inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-[13px] font-bold no-underline"
                style={{
                  background: "#00E5FF",
                  color: "#04060E",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  boxShadow: "0 0 0 0 rgba(0,229,255,0.4)",
                  transition: "box-shadow 0.3s ease",
                }}
              >
                Open Mission Control
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path
                    d="M3.5 8H12.5M8.5 4L12.5 8L8.5 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </MagneticButton>

              <MagneticButton
                href="https://github.com/namanxdev/agentmesh"
                external
                className="inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[13px] no-underline"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(240,244,255,0.7)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  backdropFilter: "blur(12px)",
                  transition: "border-color 0.25s, background 0.25s",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* Bottom strip — stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 1.0 }}
            className="flex flex-wrap items-end justify-between gap-6 border-t pt-6"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex flex-wrap gap-8 sm:gap-12">
              {STATS.map(({ value, label }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span
                    className="leading-none tracking-[-0.04em]"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 900,
                      fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                      color: "#00E5FF",
                    }}
                  >
                    {value}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.24em]"
                    style={{ color: "rgba(240,244,255,0.28)", fontFamily: "var(--font-mono)" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Scroll cue */}
            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              className="hidden items-center gap-2.5 md:flex"
            >
              <span
                className="text-[10px] uppercase tracking-[0.28em]"
                style={{ color: "rgba(240,244,255,0.22)", fontFamily: "var(--font-mono)" }}
              >
                Scroll
              </span>
              <div
                className="h-6 w-px"
                style={{ background: "linear-gradient(to bottom, rgba(0,229,255,0.5), transparent)" }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
