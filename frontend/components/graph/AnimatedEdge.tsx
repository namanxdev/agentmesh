"use client";
import { memo } from "react";
import { getBezierPath, type EdgeProps } from "@xyflow/react";

export const AnimatedEdge = memo(function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isActive = Boolean(data?.active);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isActive ? "var(--accent-primary)" : "var(--border-default)",
          strokeWidth: isActive ? 2 : 1.5,
          fill: "none",
          transition: "stroke 0.4s ease, stroke-width 0.4s ease",
        }}
      />
      {isActive && (
        <circle r={5} fill="var(--accent-primary)" opacity={0.9}>
          <animateMotion dur="1.2s" repeatCount="indefinite">
            <mpath href={`#${id}`} />
          </animateMotion>
        </circle>
      )}
    </>
  );
});
