"use client";

import dynamic from "next/dynamic";

const MeshCanvas = dynamic(
  () => import("@/components/ui/MeshCanvas").then((m) => m.MeshCanvas),
  { ssr: false }
);

export function GlobalMesh() {
  return <MeshCanvas />;
}