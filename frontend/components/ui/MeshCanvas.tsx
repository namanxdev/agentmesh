"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COUNT = 80;
const CONNECTION_DISTANCE = 2.2;
const SPREAD = 6;

function MeshNodes({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const { size } = useThree();

  const { positions, basePositions } = useMemo(() => {
    const pos = new Float32Array(NODE_COUNT * 3);
    const base = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      const x = (Math.random() - 0.5) * SPREAD * 2;
      const y = (Math.random() - 0.5) * SPREAD;
      const z = (Math.random() - 0.5) * 3;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
    }
    return { positions: pos, basePositions: base };
  }, []);

  const linePositions = useMemo(() => {
    const lines: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = basePositions[i * 3] - basePositions[j * 3];
        const dy = basePositions[i * 3 + 1] - basePositions[j * 3 + 1];
        const dz = basePositions[i * 3 + 2] - basePositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < CONNECTION_DISTANCE) {
          lines.push(
            basePositions[i * 3], basePositions[i * 3 + 1], basePositions[i * 3 + 2],
            basePositions[j * 3], basePositions[j * 3 + 1], basePositions[j * 3 + 2],
          );
        }
      }
    }
    return new Float32Array(lines);
  }, [basePositions]);

  const pointSizes = useMemo(() => {
    const sizes = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) {
      sizes[i] = 0.03 + Math.random() * 0.05;
    }
    return sizes;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pts = pointsRef.current;
    if (!pts) return;
    const pos = (pts.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;

    const mx = mouse.current[0] * 0.8;
    const my = mouse.current[1] * 0.4;

    for (let i = 0; i < NODE_COUNT; i++) {
      const phase = i * 0.37;
      pos[i * 3] = basePositions[i * 3] + Math.sin(t * 0.3 + phase) * 0.12 + mx * 0.15;
      pos[i * 3 + 1] = basePositions[i * 3 + 1] + Math.cos(t * 0.22 + phase) * 0.1 + my * 0.1;
      pos[i * 3 + 2] = basePositions[i * 3 + 2] + Math.sin(t * 0.18 + phase * 1.3) * 0.08;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={NODE_COUNT}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[pointSizes, 1]}
            count={NODE_COUNT}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#00E5FF"
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
            count={linePositions.length / 3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </>
  );
}

export function MeshCanvas() {
  const mouse = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = [
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      ];
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
    >
      <MeshNodes mouse={mouse} />
    </Canvas>
  );
}
