"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function MeshCube() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.2;
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[2.5, 2.5, 2.5]} />
          <meshBasicMaterial 
            color="#00f2fe" 
            wireframe={true} 
            transparent={true} 
            opacity={0.3} 
          />
        </mesh>
        
        {/* Inner solid / emissive core */}
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial 
            color="#00f2fe" 
            emissive="#00f2fe" 
            emissiveIntensity={2} 
            transparent={true} 
            opacity={0.8} 
          />
        </mesh>

        {/* Outer points/nodes representing the mesh */}
        <points>
           <boxGeometry args={[2.5, 2.5, 2.5]} />
           <pointsMaterial 
             color="#ffffff" 
             size={0.15} 
             sizeAttenuation={true} 
             transparent={true} 
           />
        </points>
      </group>
    </Float>
  );
}

export function FooterCube() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <MeshCube />
      </Canvas>
    </div>
  );
}
