"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
  /** Rotation intensity in degrees (default 7) */
  intensity?: number;
  /** Enable rainbow shimmer glare on hover */
  shimmer?: boolean;
}

/**
 * Parallax 3D tilt card — tracks mouse position with spring physics.
 * Uses useMotionValue/useTransform exclusively (no useState) for perf.
 */
export function Tilt3DCard({
  children,
  className = "",
  intensity = 7,
  shimmer = false,
}: Tilt3DCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);

  const rotateX = useTransform(yRaw, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(xRaw, [-0.5, 0.5], [-intensity, intensity]);

  // Shimmer glare position
  const glareX = useTransform(xRaw, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(yRaw, [-0.5, 0.5], [0, 100]);

  const spring = { stiffness: 120, damping: 22, mass: 0.8 };
  const springRotateX = useSpring(rotateX, spring);
  const springRotateY = useSpring(rotateY, spring);
  const springGlareX  = useSpring(glareX,  { stiffness: 80, damping: 20 });
  const springGlareY  = useSpring(glareY,  { stiffness: 80, damping: 20 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    xRaw.set((e.clientX - rect.left) / rect.width  - 0.5);
    yRaw.set((e.clientY - rect.top)  / rect.height - 0.5);
  }

  function onMouseLeave() {
    xRaw.set(0);
    yRaw.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        perspective: 900,
      }}
      className={`relative ${className}`}
    >
      {children}

      {/* Holographic shimmer glare layer */}
      {shimmer && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useTransform(
              [springGlareX, springGlareY],
              ([gx, gy]) =>
                `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.14) 0%, transparent 60%)`,
            ),
          }}
        />
      )}
    </motion.div>
  );
}
