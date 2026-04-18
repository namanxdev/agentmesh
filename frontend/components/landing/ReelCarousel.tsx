"use client";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

// ─── DATA ──────────────────────────────────────────────────────────────────────

const REELS = [
  {
    id: "01",
    subtitle: "Engineering",
    title: "Code Review Pipeline",
    description:
      "Router dispatches PR diff to a research agent, runs security analysis in parallel, then gates on human approval before merge.",
    accent: "#e85d2a",
    bg: "radial-gradient(ellipse at 28% 36%, rgba(232,93,42,0.26) 0%, transparent 52%), radial-gradient(ellipse at 72% 64%, rgba(215,255,112,0.12) 0%, transparent 44%), linear-gradient(145deg, #100c0a 0%, #1d1410 100%)",
    metrics: [
      { label: "agents",    value: "4"    },
      { label: "tool calls", value: "12" },
      { label: "latency",   value: "3.2s" },
    ],
    date: "Apr 2025",
  },
  {
    id: "02",
    subtitle: "Data intelligence",
    title: "Market Research Agent",
    description:
      "Web search, competitor analysis, and report synthesis run in parallel branches. Final brief requires human sign-off.",
    accent: "#d7ff70",
    bg: "radial-gradient(ellipse at 64% 28%, rgba(215,255,112,0.18) 0%, transparent 50%), radial-gradient(ellipse at 20% 72%, rgba(232,93,42,0.1) 0%, transparent 44%), linear-gradient(145deg, #0b0e09 0%, #131a0f 100%)",
    metrics: [
      { label: "agents",  value: "6"  },
      { label: "sources", value: "28" },
      { label: "latency", value: "8.7s" },
    ],
    date: "Mar 2025",
  },
  {
    id: "03",
    subtitle: "Publishing",
    title: "Content Pipeline",
    description:
      "Outline → draft → fact-check → editorial review. Each handoff stays inspectable with full token history and audit trail.",
    accent: "#f6c36d",
    bg: "radial-gradient(ellipse at 50% 20%, rgba(246,195,109,0.22) 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(232,93,42,0.08) 0%, transparent 44%), linear-gradient(145deg, #0f0d09 0%, #1c1a0f 100%)",
    metrics: [
      { label: "agents",    value: "3"   },
      { label: "approvals", value: "2"   },
      { label: "latency",   value: "5.1s" },
    ],
    date: "Feb 2025",
  },
  {
    id: "04",
    subtitle: "Compliance",
    title: "Security Audit Agent",
    description:
      "Scans codebase, cross-references CVE database, drafts remediation report. Halts automatically on severity-5 findings.",
    accent: "#e85d2a",
    bg: "radial-gradient(ellipse at 78% 48%, rgba(232,93,42,0.22) 0%, transparent 50%), radial-gradient(ellipse at 12% 28%, rgba(215,255,112,0.07) 0%, transparent 40%), linear-gradient(145deg, #0d0a09 0%, #1e1410 100%)",
    metrics: [
      { label: "agents", value: "5"   },
      { label: "scans",  value: "847" },
      { label: "latency", value: "12s" },
    ],
    date: "Jan 2025",
  },
] as const;

const REEL_DURATION = 4200; // ms per reel

// ─── 3D TILT HOOK ──────────────────────────────────────────────────────────────

function useTilt(intensity = 8) {
  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);

  const spring = { stiffness: 110, damping: 22, mass: 0.8 };
  const rotateX = useSpring(useTransform(yRaw, [-0.5, 0.5], [intensity, -intensity]), spring);
  const rotateY = useSpring(useTransform(xRaw, [-0.5, 0.5], [-intensity, intensity]), spring);
  const glareX  = useSpring(useTransform(xRaw, [-0.5, 0.5], [10, 90]), { stiffness: 80, damping: 20 });
  const glareY  = useSpring(useTransform(yRaw, [-0.5, 0.5], [10, 90]), { stiffness: 80, damping: 20 });

  const glare = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.10) 0%, transparent 55%)`
  );

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    xRaw.set((e.clientX - rect.left) / rect.width  - 0.5);
    yRaw.set((e.clientY - rect.top)  / rect.height - 0.5);
  }

  function onLeave() {
    xRaw.set(0);
    yRaw.set(0);
  }

  return { rotateX, rotateY, glare, onMove, onLeave };
}

// ─── PROGRESS BAR ──────────────────────────────────────────────────────────────

function ProgressBar({
  state,
  progress,
}: {
  state: "past" | "active" | "future";
  progress: number;
}) {
  return (
    <div
      className="flex-1 h-[3px] rounded-full overflow-hidden"
      style={{ background: "rgba(23,18,15,0.14)" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          background: "var(--landing-ink)",
          width:
            state === "past"
              ? "100%"
              : state === "active"
              ? `${progress * 100}%`
              : "0%",
        }}
      />
    </div>
  );
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────────

export function ReelCarousel() {
  const [index, setIndex]   = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const startTimeRef  = useRef<number | null>(null);
  const animRef       = useRef<number | null>(null);
  const pausedAtRef   = useRef(0);

  const { rotateX, rotateY, glare, onMove, onLeave } = useTilt(7);

  // ── Navigation ──
  const goTo = useCallback((i: number) => {
    setIndex(i);
    setProgress(0);
    startTimeRef.current = null;
    pausedAtRef.current  = 0;
  }, []);

  const prev = useCallback(() => goTo((index - 1 + REELS.length) % REELS.length), [index, goTo]);
  const next = useCallback(() => goTo((index + 1) % REELS.length),                [index, goTo]);

  // ── Autoplay progress ──
  useEffect(() => {
    if (paused) {
      pausedAtRef.current = progress;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const tick = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now - pausedAtRef.current * REEL_DURATION;
      }
      const elapsed = now - startTimeRef.current;
      const p = Math.min(elapsed / REEL_DURATION, 1);
      setProgress(p);

      if (p < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setIndex((prev) => (prev + 1) % REELS.length);
        setProgress(0);
        startTimeRef.current = null;
        pausedAtRef.current  = 0;
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [index, paused]);

  const reel = REELS[index];

  return (
    <section className="border-b border-[color:var(--border-subtle)] py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">

        {/* Section header */}
        <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="landing-kicker">01.5 / Use cases</p>
            <h2
              className="mt-4 max-w-[480px] text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.92] tracking-[-0.04em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
            >
              Real workflows. Real results.
            </h2>
          </div>
          <p
            className="max-w-[380px] text-base leading-7"
            style={{ color: "var(--text-secondary)" }}
          >
            Four production-grade pipelines, each fully observable and human-gated at every decision point.
          </p>
        </div>

        {/* Carousel — centred, max-width */}
        <div className="mx-auto max-w-[460px]">

          {/* Progress bars */}
          <div className="flex gap-1.5 mb-5">
            {REELS.map((_, i) => (
              <ProgressBar
                key={i}
                state={i < index ? "past" : i === index ? "active" : "future"}
                progress={progress}
              />
            ))}
          </div>

          {/* 3D tilt wrapper */}
          <motion.div
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
              perspective: 900,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1,    filter: "blur(0px)" }}
                exit={{    opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-[28px] cursor-default select-none"
                style={{
                  background: reel.bg,
                  aspectRatio: "4/5",
                }}
              >
                {/* Grid overlay */}
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.055]"
                >
                  <defs>
                    <pattern id={`reel-grid-${reel.id}`} width="36" height="36" patternUnits="userSpaceOnUse">
                      <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#reel-grid-${reel.id})`} />
                </svg>

                {/* Shimmer glare that follows mouse in 3D space */}
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 rounded-[28px]"
                  style={{ background: glare }}
                />

                {/* Pause / play button */}
                <div className="absolute top-4 right-4 z-20">
                  <button
                    onClick={() => setPaused((p) => !p)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                    aria-label={paused ? "Play" : "Pause"}
                  >
                    {paused ? (
                      <Play className="h-3.5 w-3.5 fill-white stroke-none" />
                    ) : (
                      <Pause className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Slide ID — depth layer */}
                <div
                  aria-hidden="true"
                  className="absolute right-5 top-5 text-[7rem] leading-none font-black opacity-[0.04] select-none pointer-events-none"
                  style={{ fontFamily: "var(--font-display)", color: "#fff" }}
                >
                  {reel.id}
                </div>

                {/* Content bottom stack */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col p-7">
                  {/* Metrics row */}
                  <div className="flex gap-2 mb-6">
                    {reel.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="flex-1 rounded-[12px] border border-white/10 px-3 py-2.5 backdrop-blur-sm"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <p
                          className="text-[9px] uppercase tracking-[0.26em]"
                          style={{ fontFamily: "var(--font-mono)", color: "rgba(247,240,232,0.42)" }}
                        >
                          {m.label}
                        </p>
                        <p
                          className="mt-1 text-xl leading-none tracking-[-0.04em] font-bold text-white"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Subtitle accent */}
                  <p
                    className="mb-1.5 text-[10px] uppercase tracking-[0.3em]"
                    style={{ fontFamily: "var(--font-mono)", color: reel.accent }}
                  >
                    {reel.subtitle}
                  </p>

                  {/* Title */}
                  <h3
                    className="text-[1.9rem] leading-[1.08] tracking-[-0.04em] text-white"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
                  >
                    {reel.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="mt-3 text-[13px] leading-[1.6]"
                    style={{ color: "rgba(247,240,232,0.58)" }}
                  >
                    {reel.description}
                  </p>

                  {/* Date */}
                  <p
                    className="mt-5 text-[9px] uppercase tracking-[0.3em]"
                    style={{ fontFamily: "var(--font-mono)", color: "rgba(247,240,232,0.28)" }}
                  >
                    {reel.date}
                  </p>
                </div>

                {/* Invisible prev / next click zones (stories UX) */}
                <button
                  onClick={prev}
                  className="absolute left-0 top-0 h-full w-1/3 cursor-pointer z-[5]"
                  aria-label="Previous reel"
                />
                <button
                  onClick={next}
                  className="absolute right-0 top-0 h-full w-1/3 cursor-pointer z-[5]"
                  aria-label="Next reel"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Arrow controls below */}
          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={prev}
              className="flex items-center gap-2 rounded-full border border-[color:var(--border-default)] px-4 py-2.5 text-[11px] uppercase tracking-[0.24em] transition-colors hover:bg-white/80"
              style={{
                background: "rgba(255,255,255,0.56)",
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
              }}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>

            <div className="flex gap-2">
              {REELS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: i === index ? 24 : 8,
                    background: i === index ? "var(--landing-ink)" : "rgba(23,18,15,0.2)",
                  }}
                  aria-label={`Go to reel ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex items-center gap-2 rounded-full border border-[color:var(--border-default)] px-4 py-2.5 text-[11px] uppercase tracking-[0.24em] transition-colors hover:bg-white/80"
              style={{
                background: "rgba(255,255,255,0.56)",
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
              }}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
