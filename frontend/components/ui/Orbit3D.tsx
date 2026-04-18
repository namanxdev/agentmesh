"use client";

import { motion } from "framer-motion";
import { memo } from "react";

const STACK_LAYERS = [
  {
    id: "model",
    label: "Model layer",
    nodes: ["Gemini", "Groq", "OpenAI"],
    accent: "#d7ff70",
    accentRgb: "215,255,112",
    highlight: false,
  },
  {
    id: "control",
    label: "AgentMesh control",
    nodes: ["LangGraph", "FastMCP", "WebSocket"],
    accent: "#e85d2a",
    accentRgb: "232,93,42",
    highlight: true,
  },
  {
    id: "infra",
    label: "Infrastructure",
    nodes: ["FastAPI", "PostgreSQL", "Next.js"],
    accent: "rgba(247,240,232,0.42)",
    accentRgb: "247,240,232",
    highlight: false,
  },
] as const;

export const Orbit3D = memo(function Orbit3D({
  size = 320,
}: {
  size?: number;
  /** @deprecated – no longer used, kept for API compat */
  radius?: number;
}) {
  const w = Math.max(size, 340);

  return (
    <div
      className="relative select-none"
      style={{ width: w, perspective: 1000 }}
      aria-hidden="true"
    >
      <motion.div
        initial={{ opacity: 0, rotateX: 0, rotateY: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, rotateX: 6, rotateY: -12, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="rounded-[32px] border border-[rgba(255,255,255,0.09)] p-5"
        style={{
          background:
            "linear-gradient(155deg, rgba(28,22,18,0.95) 0%, rgba(14,11,9,0.98) 100%)",
          boxShadow:
            "0 40px 90px rgba(23,18,15,0.28), inset 0 1px 0 rgba(255,255,255,0.06)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Window-chrome bar */}
        <div className="mb-5 flex items-center justify-between">
          <span
            className="text-[9px] uppercase tracking-[0.32em]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "rgba(247,240,232,0.28)",
            }}
          >
            stack.layers
          </span>
          <span className="flex items-center gap-1.5">
            {["#e85d2a", "#d7ff70", "rgba(247,240,232,0.18)"].map((c, i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full"
                style={{ background: c }}
              />
            ))}
          </span>
        </div>

        {/* Layer rows */}
        <div className="flex flex-col gap-3">
          {STACK_LAYERS.map((layer, li) => (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: li * 0.16 + 0.35,
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="rounded-[18px] border p-4"
              style={{
                borderColor: layer.highlight
                  ? `rgba(${layer.accentRgb},0.28)`
                  : "rgba(255,255,255,0.07)",
                background: layer.highlight
                  ? `rgba(${layer.accentRgb},0.08)`
                  : "rgba(255,255,255,0.03)",
                boxShadow: layer.highlight
                  ? `inset 0 1px 0 rgba(${layer.accentRgb},0.1)`
                  : "none",
              }}
            >
              {/* Layer label */}
              <p
                className="mb-3 text-[9px] uppercase tracking-[0.3em]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: layer.accent,
                }}
              >
                {layer.label}
              </p>

              {/* Node pills */}
              <div className="flex flex-wrap gap-2">
                {layer.nodes.map((node, ni) => (
                  <motion.div
                    key={node}
                    initial={{ opacity: 0, scale: 0.86 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: li * 0.16 + ni * 0.07 + 0.5,
                      duration: 0.32,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5"
                    style={{
                      borderColor: layer.highlight
                        ? `rgba(${layer.accentRgb},0.22)`
                        : "rgba(255,255,255,0.09)",
                      background: layer.highlight
                        ? `rgba(${layer.accentRgb},0.1)`
                        : "rgba(255,255,255,0.04)",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ background: layer.accent }}
                    />
                    <span
                      className="text-[10px] uppercase tracking-[0.22em]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "rgba(247,240,232,0.82)",
                      }}
                    >
                      {node}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom connector line */}
        <div
          className="mx-auto mt-4 h-px w-3/4"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(232,93,42,0.25), transparent)",
          }}
        />
      </motion.div>
    </div>
  );
});
