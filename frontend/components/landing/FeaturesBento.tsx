"use client";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { staggerContainer, staggerItem } from "@/lib/motion";

// ─── ISOLATED MICRO-ANIMATION COMPONENTS ──────────────────────────────────────
// Each is memo-wrapped and fully self-contained for performance.

// Card 01 — Visual Pipeline Builder: animated node graph
const PIPE_NODES = [
  { label: "Router",   cx: 36,  cy: 0   },
  { label: "Research", cx: 195, cy: -44 },
  { label: "Review",   cx: 195, cy: 44  },
  { label: "Synth",    cx: 352, cy: 0   },
];
const PIPE_EDGES = [
  { fi: 0, ti: 1, x1: 72,  y1: 0,   x2: 159, y2: -44 },
  { fi: 0, ti: 2, x1: 72,  y1: 0,   x2: 159, y2: 44  },
  { fi: 1, ti: 3, x1: 231, y1: -44, x2: 316, y2: 0   },
  { fi: 2, ti: 3, x1: 231, y1: 44,  x2: 316, y2: 0   },
];

const CanvasMini = memo(function CanvasMini() {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p + 1) % PIPE_EDGES.length), 850);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-auto pt-4 w-full select-none" aria-hidden="true">
      <svg width="100%" viewBox="0 -72 388 144" style={{ height: 108, overflow: "visible" }}>
        {PIPE_EDGES.map((e, i) => (
          <g key={i}>
            <line
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"
            />
            {pulse === i && (
              <motion.circle
                key={`p-${pulse}-${i}`}
                r="4"
                fill="var(--accent-primary)"
                style={{ filter: "drop-shadow(0 0 4px var(--accent-primary))" }}
                initial={{ cx: e.x1, cy: e.y1, opacity: 1 }}
                animate={{ cx: e.x2, cy: e.y2, opacity: [1, 1, 0] }}
                transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </g>
        ))}
        {PIPE_NODES.map((n, i) => (
          <g key={n.label}>
            <rect
              x={n.cx - 36} y={n.cy - 13}
              width={72} height={26} rx={9}
              fill="rgba(255,255,255,0.06)"
              stroke={
                pulse === i || (i === 3 && pulse === 3)
                  ? "rgba(255,255,255,0.28)"
                  : "rgba(255,255,255,0.1)"
              }
              strokeWidth={1}
              style={{ transition: "stroke 300ms" }}
            />
            <text
              x={n.cx} y={n.cy + 4}
              textAnchor="middle"
              fill="rgba(247,240,232,0.62)"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              letterSpacing="0.07em"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
});

// Card 02 — Real-time Event Stream: live scrolling log
const STREAM_EVENTS = [
  { label: "router → research",    dot: "#e85d2a" },
  { label: "github.search called", dot: "#f6c36d" },
  { label: "agent started",        dot: "#e85d2a" },
  { label: "human gate opened",    dot: "#d7ff70" },
  { label: "review → synthesis",   dot: "#e85d2a" },
  { label: "synthesis finalized",  dot: "#d7ff70" },
  { label: "tool call complete",   dot: "#f6c36d" },
];

let _evtKey = 100;

const EventStreamMini = memo(function EventStreamMini() {
  const [items, setItems] = useState(() =>
    STREAM_EVENTS.slice(0, 3).map((e, i) => ({ ...e, key: i }))
  );
  const idxRef = useRef(3);

  useEffect(() => {
    const id = setInterval(() => {
      const next = STREAM_EVENTS[idxRef.current % STREAM_EVENTS.length];
      idxRef.current++;
      _evtKey++;
      setItems((prev) => [...prev.slice(-3), { ...next, key: _evtKey }]);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-auto space-y-2 pt-6" aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.key}
            layout
            initial={{ opacity: 0, y: -10, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="flex items-center gap-2.5 rounded-[14px] border border-[color:var(--border-subtle)] px-3 py-2"
            style={{ background: "rgba(255,255,255,0.64)" }}
          >
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: item.dot }} />
            <span
              className="text-[10px] uppercase tracking-[0.2em] truncate flex-1"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
            >
              {item.label}
            </span>
            <span
              className="text-[9px] uppercase tracking-[0.18em] flex-shrink-0"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
            >
              now
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

// Card 03 — Parallel Execution: fork/rejoin animation
const ParallelMini = memo(function ParallelMini() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setActive(false);
      setTimeout(() => setActive(true), 500);
    };
    const id = setInterval(cycle, 3400);
    cycle();
    return () => clearInterval(id);
  }, []);

  const branches = [
    { label: "Research", color: "#e85d2a" },
    { label: "Verify",   color: "#f6c36d" },
  ];

  return (
    <div className="mt-auto pt-6 flex flex-col items-center gap-2" aria-hidden="true">
      <div
        className="rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.22em]"
        style={{
          borderColor: "var(--border-default)",
          background: "rgba(255,255,255,0.68)",
          fontFamily: "var(--font-mono)",
          color: "var(--text-primary)",
        }}
      >
        Pipeline start
      </div>

      <div className="w-px h-4" style={{ background: "var(--border-default)" }} />

      <div className="flex gap-4">
        {branches.map((b, i) => (
          <motion.div
            key={b.label}
            animate={
              active
                ? { borderColor: b.color, backgroundColor: b.color + "1a" }
                : { borderColor: "rgba(23,18,15,0.14)", backgroundColor: "rgba(255,255,255,0.68)" }
            }
            transition={{ duration: 0.45, delay: i * 0.1 }}
            className="rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.22em]"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
          >
            {b.label}
          </motion.div>
        ))}
      </div>

      <div className="w-px h-4" style={{ background: "var(--border-default)" }} />

      <motion.div
        animate={active ? { opacity: 1, scale: 1 } : { opacity: 0.32, scale: 0.96 }}
        transition={{ duration: 0.4, delay: 0.28 }}
        className="rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.22em]"
        style={{
          borderColor: "var(--border-default)",
          background: "rgba(255,255,255,0.68)",
          fontFamily: "var(--font-mono)",
          color: "var(--text-primary)",
        }}
      >
        Synthesis
      </motion.div>
    </div>
  );
});

// Card 04 — MCP-native Tools: hub-spoke network topology
const MESH_NODES = [
  { name: "github.search", x: 68,  y: 58,  color: "#e85d2a", rgb: "232,93,42",  lat: "12ms" },
  { name: "http.fetch",    x: 332, y: 58,  color: "#f6c36d", rgb: "246,195,109", lat: "8ms"  },
  { name: "local.review",  x: 68,  y: 142, color: "#d7ff70", rgb: "215,255,112", lat: "4ms"  },
  { name: "stdio.output",  x: 332, y: 142, color: "#e85d2a", rgb: "232,93,42",   lat: "6ms"  },
] as const;

const HUB_X = 200, HUB_Y = 100;

const McpToolsMini = memo(function McpToolsMini() {
  const [connCount, setConnCount] = useState(0);
  const [travelIdx, setTravelIdx] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function run() {
      setConnCount(0);
      setTravelIdx(null);
      await new Promise((r) => setTimeout(r, 500));
      for (let i = 0; i < MESH_NODES.length; i++) {
        if (!active) return;
        setTravelIdx(i);
        await new Promise((r) => setTimeout(r, 560));
        if (!active) return;
        setConnCount(i + 1);
        setTravelIdx(null);
        await new Promise((r) => setTimeout(r, 140));
      }
      await new Promise((r) => setTimeout(r, 2800));
      if (active) run();
    }
    run();
    return () => { active = false; };
  }, []);

  const allConnected = connCount >= MESH_NODES.length;

  return (
    <div className="mt-auto pt-3 w-full select-none" aria-hidden="true">
      <svg width="100%" viewBox="0 0 400 200" style={{ height: 140, overflow: "visible" }}>
        {/* Pulse ring from hub when all connected — CSS animation (r can't be Framer-animated) */}
        <defs>
          <style>{`@keyframes mcpHubPulse { from { transform: scale(1); opacity: 0.4; } to { transform: scale(2.1); opacity: 0; } }`}</style>
        </defs>
        {allConnected && (
          <circle
            cx={HUB_X} cy={HUB_Y} r={25}
            fill="none"
            stroke="var(--landing-acid)"
            strokeWidth={0.8}
            style={{
              transformOrigin: `${HUB_X}px ${HUB_Y}px`,
              animation: "mcpHubPulse 1.7s ease-out infinite",
            }}
          />
        )}

        {/* Connection lines */}
        {MESH_NODES.map((node, i) => {
          const isConn = i < connCount;
          return (
            <line
              key={`line-${i}`}
              x1={HUB_X} y1={HUB_Y}
              x2={node.x} y2={node.y}
              stroke={isConn ? node.color : "rgba(255,255,255,0.1)"}
              strokeWidth={isConn ? 1.5 : 1}
              strokeOpacity={isConn ? 0.4 : 1}
              strokeDasharray={isConn ? undefined : "4 5"}
              style={{ transition: "stroke 380ms cubic-bezier(0.16,1,0.3,1), stroke-opacity 380ms" }}
            />
          );
        })}

        {/* Traveling connection dot */}
        {travelIdx !== null && (
          <motion.circle
            key={`td-${travelIdx}`}
            r={4}
            fill={MESH_NODES[travelIdx].color}
            style={{ filter: `drop-shadow(0 0 5px ${MESH_NODES[travelIdx].color})` }}
            initial={{ cx: HUB_X, cy: HUB_Y, opacity: 1 }}
            animate={{ cx: MESH_NODES[travelIdx].x, cy: MESH_NODES[travelIdx].y, opacity: [1, 1, 0.3] }}
            transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        {/* Center hub */}
        <circle cx={HUB_X} cy={HUB_Y} r={25} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        <circle cx={HUB_X} cy={HUB_Y} r={16} fill="rgba(255,255,255,0.07)" />
        <text x={HUB_X} y={HUB_Y - 2} textAnchor="middle" fill="rgba(247,240,232,0.65)" fontSize={7.5} fontFamily="JetBrains Mono, monospace" letterSpacing="0.06em">mesh</text>
        <text x={HUB_X} y={HUB_Y + 8} textAnchor="middle" fill="rgba(247,240,232,0.45)" fontSize={7} fontFamily="JetBrains Mono, monospace" letterSpacing="0.05em">hub</text>

        {/* Tool nodes */}
        {MESH_NODES.map((node, i) => {
          const isConn = i < connCount;
          const isRight = node.x > HUB_X;
          return (
            <g key={`node-${i}`}>
              {/* Node ring */}
              <circle
                cx={node.x} cy={node.y} r={18}
                fill={isConn ? `rgba(${node.rgb},0.14)` : "rgba(255,255,255,0.03)"}
                stroke={isConn ? node.color : "rgba(255,255,255,0.09)"}
                strokeWidth={1}
                strokeOpacity={isConn ? 0.45 : 1}
                style={{ transition: "fill 380ms cubic-bezier(0.16,1,0.3,1), stroke 380ms cubic-bezier(0.16,1,0.3,1)" }}
              />
              {/* Node center dot */}
              <circle
                cx={node.x} cy={node.y} r={5.5}
                fill={isConn ? node.color : "rgba(255,255,255,0.16)"}
                style={{
                  transition: "fill 300ms cubic-bezier(0.16,1,0.3,1)",
                  filter: isConn ? `drop-shadow(0 0 6px ${node.color})` : "none",
                }}
              />
              {/* Tool name */}
              <text
                x={isRight ? node.x + 27 : node.x - 27}
                y={node.y - 2}
                textAnchor={isRight ? "start" : "end"}
                fontSize={8.5}
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="0.04em"
                fill={isConn ? "rgba(247,240,232,0.88)" : "rgba(247,240,232,0.22)"}
                style={{ transition: "fill 300ms" }}
              >
                {node.name}
              </text>
              {/* Latency — fades in on connect */}
              <text
                x={isRight ? node.x + 27 : node.x - 27}
                y={node.y + 10}
                textAnchor={isRight ? "start" : "end"}
                fontSize={7.5}
                fontFamily="JetBrains Mono, monospace"
                fill={node.color}
                fillOpacity={isConn ? 0.7 : 0}
                style={{ transition: "fill-opacity 350ms cubic-bezier(0.16,1,0.3,1)" }}
              >
                {node.lat}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

// Card 05 — Human-in-the-loop gates: approval cycle
type GateState = "pending" | "approved";

const HumanGateMini = memo(function HumanGateMini() {
  const [state, setState] = useState<GateState>("pending");

  useEffect(() => {
    let active = true;
    async function cycle() {
      setState("pending");
      await new Promise((r) => setTimeout(r, 2600));
      if (!active) return;
      setState("approved");
      await new Promise((r) => setTimeout(r, 2000));
      if (!active) return;
      cycle();
    }
    cycle();
    return () => { active = false; };
  }, []);

  return (
    <div className="mt-auto pt-6" aria-hidden="true">
      <AnimatePresence mode="wait">
        {state === "pending" ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="rounded-[18px] border p-4"
            style={{ borderColor: "rgba(246,195,109,0.22)", background: "rgba(246,195,109,0.07)" }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <motion.span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ background: "#f6c36d" }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              />
              <span
                className="text-[11px] uppercase tracking-[0.24em]"
                style={{ fontFamily: "var(--font-mono)", color: "#f6c36d" }}
              >
                Awaiting approval
              </span>
            </div>
            <p
              className="text-[11px] leading-5 mb-4"
              style={{ color: "rgba(247,240,232,0.5)", fontFamily: "var(--font-mono)" }}
            >
              router → tools → synthesis
            </p>
            <div className="flex gap-2">
              <div
                className="flex-1 rounded-[12px] py-2 text-center text-[10px] uppercase tracking-[0.22em]"
                style={{ background: "rgba(215,255,112,0.14)", color: "#d7ff70", fontFamily: "var(--font-mono)" }}
              >
                Approve
              </div>
              <div
                className="flex-1 rounded-[12px] py-2 text-center text-[10px] uppercase tracking-[0.22em]"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(247,240,232,0.28)", fontFamily: "var(--font-mono)" }}
              >
                Reject
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="approved"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="rounded-[18px] border p-4 flex items-center gap-3"
            style={{ borderColor: "rgba(215,255,112,0.24)", background: "rgba(215,255,112,0.08)" }}
          >
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: "#d7ff70" }} />
            <span
              className="text-[11px] uppercase tracking-[0.22em]"
              style={{ fontFamily: "var(--font-mono)", color: "#d7ff70" }}
            >
              Gate cleared — run continues
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Card 06 — Inspectable handoffs: sequential field reveal
const HANDOFF_ROWS = [
  { key: "target",   value: "reviewer" },
  { key: "input",    value: "{ query: '...' }" },
  { key: "tokens",   value: "1,247" },
  { key: "approved", value: "true" },
];

const HandoffMini = memo(function HandoffMini() {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    let active = true;
    async function cycle() {
      setRevealed(0);
      await new Promise((r) => setTimeout(r, 350));
      for (let i = 1; i <= HANDOFF_ROWS.length; i++) {
        if (!active) return;
        setRevealed(i);
        await new Promise((r) => setTimeout(r, 460));
      }
      await new Promise((r) => setTimeout(r, 2600));
      if (active) cycle();
    }
    cycle();
    return () => { active = false; };
  }, []);

  return (
    <div className="mt-auto pt-6" aria-hidden="true">
      <div
        className="rounded-[16px] border border-[color:var(--border-subtle)] p-4"
        style={{ background: "rgba(255,255,255,0.62)" }}
      >
        <p
          className="text-[10px] uppercase tracking-[0.28em] mb-4"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
        >
          handoff.inspect
        </p>
        <div className="space-y-2.5">
          {HANDOFF_ROWS.map((row, i) => (
            <motion.div
              key={row.key}
              animate={{ opacity: i < revealed ? 1 : 0.1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <span
                className="w-[60px] text-[10px] flex-shrink-0"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
              >
                {row.key}
              </span>
              <span
                className="text-[11px]"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
              >
                {row.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ─── MINI MAP ──────────────────────────────────────────────────────────────────

const MINI_MAP = {
  canvas:   <CanvasMini />,
  events:   <EventStreamMini />,
  parallel: <ParallelMini />,
  mcp:      <McpToolsMini />,
  approval: <HumanGateMini />,
  handoff:  <HandoffMini />,
} as const;

type MiniKey = keyof typeof MINI_MAP;

// ─── FEATURES ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: "01",
    eyebrow: "Canvas",
    title: "Visual Pipeline Builder",
    description:
      "Compose the run with a graph that already feels operational. Drag nodes, wire roles, and keep structure visible before the first token is spent.",
    className: "lg:col-span-7",
    tone: "dark" as const,
    mini: "canvas" as MiniKey,
  },
  {
    id: "02",
    eyebrow: "Telemetry",
    title: "Real-time Event Stream",
    description:
      "Every activation, handoff, tool call, and exception has a visible, trackable place in the run.",
    className: "lg:col-span-5",
    tone: "light" as const,
    mini: "events" as MiniKey,
  },
  {
    id: "03",
    eyebrow: "Architecture",
    title: "Parallel Execution",
    description:
      "Fork when it buys speed. Rejoin without losing the plot. Parallel branches stay legible on the canvas layout.",
    className: "lg:col-span-5",
    tone: "light" as const,
    mini: "parallel" as MiniKey,
  },
  {
    id: "04",
    eyebrow: "Tooling",
    title: "MCP-native Tools",
    description:
      "Connect the tool fabric without inventing a second plugin system. HTTP, stdio, all in one native isolated namespace.",
    className: "lg:col-span-7",
    tone: "dark" as const,
    mini: "mcp" as MiniKey,
  },
  {
    id: "05",
    eyebrow: "Security",
    title: "Human-in-the-loop gates",
    description:
      "Inline checkpoints when the run reaches risk limits. Approvals, timeouts, and review stay safely inside the graph.",
    className: "lg:col-span-7",
    tone: "dark" as const,
    mini: "approval" as MiniKey,
  },
  {
    id: "06",
    eyebrow: "Observability",
    title: "Inspectable handoffs",
    description:
      "Tool inputs, approval requests, raw message outputs, and token counts remain fully inspectable retrospectively.",
    className: "lg:col-span-5",
    tone: "light" as const,
    mini: "handoff" as MiniKey,
  },
] as const;

type Feature = (typeof FEATURES)[number];

// ─── CARD ─────────────────────────────────────────────────────────────────────
// Dark cards get full 3D parallax tilt + holographic shimmer.
// Light cards get a simple spring y-lift on hover.

function FeatureCard({ id, eyebrow, title, description, className, tone, mini }: Feature) {
  const isDark = tone === "dark";

  // 3D tilt motion values — always created, only applied when isDark
  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);
  const spring = { stiffness: 120, damping: 22, mass: 0.8 };
  const springRX = useSpring(useTransform(yRaw, [-0.5, 0.5], [6, -6]), spring);
  const springRY = useSpring(useTransform(xRaw, [-0.5, 0.5], [-6, 6]), spring);
  const springGX = useSpring(useTransform(xRaw, [-0.5, 0.5], [20, 80]), { stiffness: 80, damping: 20 });
  const springGY = useSpring(useTransform(yRaw, [-0.5, 0.5], [20, 80]), { stiffness: 80, damping: 20 });
  const glareStyle = useTransform(
    [springGX, springGY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.13) 0%, transparent 52%)`
  );

  function onMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (!isDark) return;
    const rect = e.currentTarget.getBoundingClientRect();
    xRaw.set((e.clientX - rect.left) / rect.width  - 0.5);
    yRaw.set((e.clientY - rect.top)  / rect.height - 0.5);
  }
  function onMouseLeave() {
    xRaw.set(0);
    yRaw.set(0);
  }

  return (
    <motion.article
      variants={staggerItem}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      whileHover={isDark ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={isDark ? {
        rotateX: springRX,
        rotateY: springRY,
        transformStyle: "preserve-3d",
        perspective: 900,
      } : undefined}
      className={`group relative flex min-h-[320px] overflow-hidden rounded-[36px] p-7 sm:p-9 ${className} cursor-default`}
    >
      {!isDark && (
        <div className="landing-panel absolute inset-0 transition-opacity duration-300 group-hover:opacity-60" />
      )}
      {isDark && (
        <div className="landing-panel-dark absolute inset-0 transition-opacity duration-300 group-hover:opacity-90" />
      )}

      {/* Holographic shimmer glare — dark cards only */}
      {isDark && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-[36px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glareStyle }}
        />
      )}

      {/* Background number decorator */}
      <div
        className={`absolute -right-6 -bottom-10 text-[14rem] sm:text-[20rem] leading-none tracking-tighter select-none pointer-events-none transition-transform duration-500 group-hover:scale-110 ${
          isDark ? "text-white opacity-5" : "text-black opacity-[0.03]"
        }`}
        style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
      >
        {id}
      </div>

      <div className="relative flex h-full w-full flex-col z-10">
        <div>
          <span
            className="text-[11px] uppercase tracking-[0.28em]"
            style={{
              color: isDark ? "rgba(247,240,232,0.45)" : "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {eyebrow}
          </span>

          <h3
            className="mt-6 max-w-[430px] text-[2rem] leading-[1.1] tracking-[-0.05em] sm:text-[2.2rem]"
            style={{
              color: isDark ? "#f7f0e8" : "var(--text-primary)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
            }}
          >
            {title}
          </h3>

          <p
            className="mt-5 max-w-[430px] text-[15px] leading-7"
            style={{
              color: isDark ? "rgba(247,240,232,0.62)" : "var(--text-secondary)",
            }}
          >
            {description}
          </p>
        </div>

        {MINI_MAP[mini]}
      </div>
    </motion.article>
  );
}

// ─── SECTION ──────────────────────────────────────────────────────────────────

export function FeaturesBento() {
  return (
    <section id="features" className="border-b border-[color:var(--border-subtle)] py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <ScrollReveal className="mb-10 max-w-[780px]">
          <p className="landing-kicker">01 / System overview</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2
              className="max-w-[580px] text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] tracking-[-0.04em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
            >
              Everything inspectable. Nothing hidden.
            </h2>
            <p
              className="max-w-[420px] text-base leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              The platform connects the fragmented dots of modern AI orchestration.
              Observe parallel branch execution, control human handoffs, and manage
              agent logic from a single visual fabric.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-5 lg:grid-cols-12 lg:auto-rows-[minmax(240px,auto)]"
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
