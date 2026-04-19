"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NODES = [
  { id: "router", label: "Router", x: 25, y: 20, desc: "Entry / Dispatch" },
  { id: "architect", label: "Architect", x: 15, y: 70, desc: "Topology Synthesis" },
  { id: "matrix", label: "Matrix", x: 70, y: 85, desc: "State Mesh" },
  { id: "tool-exec", label: "Tool Exec", x: 80, y: 35, desc: "Compute Layer" },
];

export function OrchestratorHUD() {
  const [activeTarget, setActiveTarget] = useState(0);
  const [hitNode, setHitNode] = useState(0);

  useEffect(() => {
    // Sequence: Packet flies for 800ms, then stays on node for 400ms, then flies to next.
    const interval = setInterval(() => {
      setActiveTarget((prev) => (prev + 1) % NODES.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // It hits the target node after 800ms (the duration of the packet travel)
    const t = setTimeout(() => {
      setHitNode(activeTarget);
    }, 800);
    return () => clearTimeout(t);
  }, [activeTarget]);

  return (
    <div className="relative w-full h-full bg-[#04060E] overflow-hidden rounded-2xl flex items-center justify-center">
      {/* Background Base */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)] pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          transform: "perspective(1000px) rotateX(40deg) scale(2)",
          transformOrigin: "top center",
        }}
      />

      {/* Connection Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {NODES.map((node, i) => {
          const nextNode = NODES[(i + 1) % NODES.length];
          return (
            <line
              key={`edge-${i}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${nextNode.x}%`}
              y2={`${nextNode.y}%`}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {NODES.map((node, i) => {
        const isHit = hitNode === i;
        return (
          <motion.div
            key={node.id}
            className="absolute rounded-xl flex flex-col p-4 backdrop-blur-xl"
            style={{
              left: `calc(${node.x}% - 80px)`,
              top: `calc(${node.y}% - 40px)`,
              width: "160px",
              boxShadow: isHit
                ? "0 0 40px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.3)"
                : "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            animate={{
              scale: isHit ? 1.05 : 1,
              borderColor: isHit ? "rgba(255,255,255,0.3)" : "rgba(255, 255, 255, 0.1)",
              backgroundColor: isHit
                ? "rgba(255,255,255,0.06)"
                : "rgba(255, 255, 255, 0.02)",
            }}
            transition={{
              type: "spring",
              duration: 0.5,
              bounce: 0.3,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-500",
                  isHit ? "bg-white shadow-[0_0_10px_white]" : "bg-white/20"
                )}
              />
              <h3 className="text-white text-sm font-semibold tracking-wide">
                {node.label}
              </h3>
            </div>
            <p className="text-white/40 text-xs font-mono tracking-tighter">
              {node.desc}
            </p>
          </motion.div>
        );
      })}

      {/* Data Packet */}
      <motion.div
        className="absolute w-3 h-3 rounded-full pointer-events-none z-10"
        style={{
          boxShadow: "0 0 20px 4px rgba(255,255,255,0.6)",
          backgroundColor: "#fff",
        }}
        animate={{
          left: `calc(${NODES[activeTarget].x}% - 6px)`,
          top: `calc(${NODES[activeTarget].y}% - 6px)`,
        }}
        transition={{
          duration: 0.8,
          ease: [0.77, 0, 0.175, 1] as [number, number, number, number], // Strong ease-in-out from Emil's guidelines
        }}
      />
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
