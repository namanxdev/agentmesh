"use client";
import React from "react";

export const GridBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full w-full bg-neutral-950 relative flex items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      <div className="absolute inset-0 pointer-events-none">{children}</div>
    </div>
  );
};
