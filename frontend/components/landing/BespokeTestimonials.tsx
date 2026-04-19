"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Syne } from "next/font/google";
import { BrainCircuit, Cpu, ShieldAlert, Sparkles, Workflow } from "lucide-react";

const syne = Syne({ subsets: ["latin"], weight: ["800"] });

export default function BespokeTestimonials() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    damping: 20,
    stiffness: 100,
  });

  const y1 = useTransform(smoothProgress, [0, 1], [150, -150]);
  const y2 = useTransform(smoothProgress, [0, 1], [300, -250]);
  const y3 = useTransform(smoothProgress, [0, 1], [200, -100]);

  const rotate1 = useTransform(smoothProgress, [0, 1], [-5, 5]);
  const rotate2 = useTransform(smoothProgress, [0, 1], [5, -5]);
  const rotate3 = useTransform(smoothProgress, [0, 1], [-2, 8]);

  return (
    <section 
      ref={containerRef}
      className="relative w-full min-h-[120vh] bg-[#04060E] py-40 overflow-hidden flex items-center"
      style={{ perspective: "1000px" }}
    >
      {/* Background Glows for Depth */}
      <div className="absolute top-1/2 left-1/4 w-[40vw] h-[40vw] -translate-x-1/2 -translate-y-1/2 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[30vw] h-[30vw] translate-x-1/2 -translate-y-1/2 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
        
        {/* Left Side: Massive Typography */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center">
          <h2 className={`text-[clamp(4rem,8vw,8rem)] leading-[0.85] font-black uppercase text-white tracking-tighter ${syne.className}`}>
            GREAT WORK<br />
            CAN&apos;T HAPPEN<br />
            WITHOUT<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              TEAM AI.
            </span>
          </h2>
        </div>

        {/* Right Side: Descriptive Text */}
        <div className="col-span-1 lg:col-span-5 flex flex-col justify-center">
          <p className="text-neutral-400 text-lg md:text-xl xl:text-2xl leading-relaxed tracking-tight max-w-lg font-medium">
            We work as one team with our agents. Through continuous integration pipelines, we uncover context and translate it into multi-agent workflows that reflect your mission. Our mesh combines declarative logic with raw autonomous intelligence to create work that connects elegantly and drives production.
          </p>
        </div>

      </div>

      {/* Floating 3D Cards (Glassmorphism / Solid Noomo Style) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex items-center justify-center">
        
        {/* Card 1 - Left Center */}
        <motion.div 
          style={{ y: y1, rotateZ: rotate1, rotateX: 5, rotateY: -10 }}
          className="absolute left-[5%] md:left-[15%] top-[60%] w-[320px] bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/10 p-8 shadow-2xl flex flex-col gap-6 rounded-sm"
        >
          <div className="flex items-center gap-3 text-white">
            <Workflow className="w-8 h-8" />
            <span className="font-black text-xl tracking-tight">ORCHESTRATOR</span>
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed font-medium">
            "AgentMesh does such incredible and thoughtful routing. I have been coordinating agents for years and have never been more impressed with a pipeline runner."
          </p>
          <div className="mt-4 flex flex-col">
            <span className="text-xs font-bold text-neutral-500 tracking-wider uppercase">ARCHITECT NODE</span>
            <span className="text-[10px] text-neutral-600">Director of Synthetics</span>
          </div>
        </motion.div>

        {/* Card 2 - Center Right */}
        <motion.div 
          style={{ y: y2, rotateZ: rotate2, rotateX: -5, rotateY: 15 }}
          className="absolute right-[5%] md:right-[20%] top-[25%] w-[340px] bg-[#0A0A0C]/90 backdrop-blur-2xl border border-white/[0.15] p-8 shadow-2xl flex flex-col gap-6 rounded-sm"
        >
          <div className="flex items-center gap-3 text-white">
            <BrainCircuit className="w-8 h-8 text-blue-400" />
            <span className="font-black text-xl tracking-tight">SYNAPSE</span>
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed font-medium">
            "I've been very impressed with how the mesh has worked quickly to immerse itself into the narrative of our complicated suite of products and solutions. Their willingness to collaborate in agent-space has allowed us to explore innovative execution..."
          </p>
          <div className="mt-4 flex flex-col">
            <span className="text-xs font-bold text-neutral-500 tracking-wider uppercase">BUILDER AGENT</span>
            <span className="text-[10px] text-neutral-600">Sr. Autonomous Developer</span>
          </div>
        </motion.div>

        {/* Card 3 - Bottom Right */}
        <motion.div 
          style={{ y: y3, rotateZ: rotate3, rotateX: 2, rotateY: -5 }}
          className="absolute right-[2%] md:right-[5%] top-[70%] w-[300px] bg-[#111115] border border-white/5 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col gap-6 rounded-sm"
        >
          <div className="flex items-center gap-3 text-white">
            <Cpu className="w-8 h-8 text-indigo-400" />
            <span className="font-black text-xl tracking-tight">RUNTIME</span>
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed font-medium">
            "The entire network provides exceptional value. AgentMesh is shaping our architecture's dedication to quality and pushing for experiences that makes the codebase feel like we have a full creative engineering team again."
          </p>
          <div className="mt-4 flex flex-col">
            <span className="text-xs font-bold text-neutral-500 tracking-wider uppercase">SYSTEM RUNTIME</span>
            <span className="text-[10px] text-neutral-600">Core Operations</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
