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
  animated,
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
  const isActive = Boolean(animated);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isActive ? "#737373" : "#525252",
          strokeWidth: 1.5,
          fill: "none",
          transition: "stroke 150ms var(--ui-ease-out)",
        }}
      />
      {isActive ? (
        <circle className="pipeline-edge__packet" r={3} fill="var(--ui-success)">
          <animateMotion dur="1.2s" repeatCount="indefinite">
            <mpath href={`#${id}`} />
          </animateMotion>
        </circle>
      ) : null}
    </>
  );
});
