"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LiveMeshGrid({ className }: { className?: string }) {
  const [nodes, setNodes] = useState<{ id: number; x: number; y: number }[]>([]);
  const [edges, setEdges] = useState<{ id: string; source: number; target: number }[]>([]);

  useEffect(() => {
    // Generate a fixed symmetrical grid to keep it neat (Linear style)
    const newNodes: { id: number; x: number; y: number }[] = [];
    const cols = 6;
    const rows = 4;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Random slight jitter
        newNodes.push({
          id: c * rows + r,
          x: 10 + c * 16 + (Math.random() * 4 - 2),
          y: 15 + r * 23 + (Math.random() * 4 - 2)
        });
      }
    }
    
    // Connect nearest neighbors 
    const newEdges: { id: string; source: number; target: number }[] = [];
    for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[i].x - newNodes[j].x;
            const dy = newNodes[i].y - newNodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 22 && Math.random() > 0.3) {
                 newEdges.push({ id: `${i}-${j}`, source: i, target: j });
            }
        }
    }
    
    // Defer state update to avoid cascading render error
    setTimeout(() => {
      setNodes(newNodes);
      setEdges(newEdges);
    }, 0);
  }, []);

  return (
    <div className={cn("relative w-full h-full bg-black/40 border border-white/[0.08] backdrop-blur-xl overflow-hidden rounded-2xl group", className)}>
      {/* Background grid structure */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      {/* Subtle underglow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.1)_0%,transparent_70%)] pointer-events-none"></div>

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="mesh-glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Render Edges */}
        {edges.map((edge) => {
          const source = nodes[edge.source];
          const target = nodes[edge.target];
          if (!source || !target) return null;
          
          // Generate deterministic "random" based on edge id
          const idHash = edge.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
          const delay = (idHash % 40) / 10;
          const duration = 1.5 + (idHash % 20) / 10;

          return (
            <g key={edge.id}>
              {/* Base thin line */}
              <line
                x1={`${source.x}%`} y1={`${source.y}%`}
                x2={`${target.x}%`} y2={`${target.y}%`}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.2"
              />
              
              {/* The "Data Packet" traveling along the edge */}
              <motion.circle
                r="0.8"
                fill="#38bdf8"
                filter="url(#mesh-glow)"
                initial={{ cx: `${source.x}%`, cy: `${source.y}%`, opacity: 0 }}
                animate={{ 
                  cx: [`${source.x}%`, `${target.x}%`], 
                  cy: [`${source.y}%`, `${target.y}%`],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  delay: delay,
                  ease: "easeInOut"
                }}
              />
            </g>
          );
        })}
        
        {/* Render Nodes */}
        {nodes.map(node => {
          const idHash = node.id;
          const duration = 2 + (idHash % 20) / 10;
          const delay = (idHash % 30) / 10;

          return (
            <g key={`node-${node.id}`}>
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r="0.5"
                fill="rgba(56,189,248,0.5)"
              />
              {/* Blinking node core */}
              <motion.circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r="1.2"
                fill="#0ea5e9"
                filter="url(#mesh-glow)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 0.5] }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  delay: delay
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
