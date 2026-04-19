"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { Syne } from "next/font/google";
import { OrchestratorHUD } from "@/components/ui/orchestrator-hud";
import { LiveMeshGrid } from "@/components/ui/live-mesh";
import LinearWorkflow from "@/components/landing/LinearWorkflow";
import BespokeTestimonials from "@/components/landing/BespokeTestimonials";
import { AgentMeshFooter } from "@/components/landing/AgentMeshFooter";
import { Hero } from "@/components/hero-1";

const syne = Syne({ subsets: ['latin'], weight: ['800'] });

import { Navbar } from "@/components/landing/Navbar";

// 1. Cinematic Pre-loader (Noomo Style)
const letterVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.8,
      ease: [0.77, 0, 0.175, 1] as [number, number, number, number], // Strong custom ease out
    },
  }),
};

function Preloader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const word = "AGENTMESH".split("");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#04060E]"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{
            clipPath: "inset(100% 0% 0% 0%)",
            transition: { duration: 1, ease: [0.77, 0, 0.175, 1] as [number, number, number, number] },
          }}
        >
          <div className="flex overflow-hidden">
            {word.map((letter, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                className={`text-2xl md:text-4xl font-black leading-none tracking-[0.2em] text-white uppercase ${syne.className}`}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 2. The Hero Section (Linear x Noomo style + Current Assets)
// Magnetic Button from current setup
function MagneticButton({ children, href, className, external }: { children: React.ReactNode, href: string, className?: string, external?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const springX = useSpring(0, { stiffness: 200, damping: 20 });
  const springY = useSpring(0, { stiffness: 200, damping: 20 });

  useEffect(() => {
    springX.set(offset.x);
    springY.set(offset.y);
  }, [offset, springX, springY]);

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setOffset({ x: (e.clientX - (rect.left + rect.width / 2)) * 0.3, y: (e.clientY - (rect.top + rect.height / 2)) * 0.3 });
  };

  const onLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <motion.a 
      ref={ref} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
      style={{ x: springX, y: springY }} onMouseMove={onMove} onMouseLeave={onLeave} className={className}
    >
      {children}
    </motion.a>
  );
}

function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { clientX, clientY } = e;
    const { left, top } = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: clientX - left, y: clientY - top });
  }

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative flex min-h-[100dvh] w-full flex-col justify-between pt-24 pb-12 px-[6vw] bg-[#000000] overflow-hidden"
    >
      {/* Linear-style ambient background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#2a2a35_0%,#000000_100%)] opacity-40"></div>
      
      {/* Noomo-style pixelated/noise grain overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      ></div>

      {/* Linear-style cursor glow tracking */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,.06), transparent 40%)`,
        }}
      />

      <div className="relative z-10 flex flex-col w-full h-full">
        {/* Top row — editorial label */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="flex items-center justify-between w-full"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-mono">
            01 / Mission Control
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#eeeeee] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.32em] text-white/40 font-mono">
              Live · MCP-Native
            </span>
          </span>
        </motion.div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center mt-12 w-full">
          {/* Center Content */}
          <div className="relative w-full lg:col-span-7 xl:col-span-8 flex flex-col justify-center min-w-0 z-10">
            <div className="pb-4 w-full">
              <motion.h1
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ delay: 2.2, duration: 1.2, ease: [0.77, 0, 0.175, 1] as [number, number, number, number] }}
                className={`text-[clamp(2.5rem,10vw,4.5rem)] md:text-[clamp(3.5rem,7vw,5.5rem)] lg:text-[clamp(2.5rem,4vw,5rem)] xl:text-[min(4vw,5.5rem)] font-black leading-[0.8] tracking-[-0.04em] text-[#eeeeee] uppercase whitespace-nowrap ${syne.className}`}
              >
                ORCHESTRATE <br className="hidden md:block" />
                THE <br className="hidden md:block" />
                UNSEEN.
              </motion.h1>
            </div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 2.6 }}
              className="mt-8 max-w-[500px] text-base leading-[1.75] text-white/60 md:text-[1.05rem]"
            >
              Orchestrate AI agents across MCP servers, watch every handoff in real time, and keep humans in the loop — without losing the shape of the run.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.8 }}
              className="mt-10 flex items-center gap-4"
            >
              <MagneticButton
                href="/dashboard"
                className="group inline-flex items-center gap-3 bg-[#eeeeee] text-[#000000] px-7 py-3.5 text-[13px] font-bold no-underline hover:bg-white transition-colors"
              >
                OPEN MISSION CONTROL
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="transition-transform duration-200 group-hover:translate-x-0.5">
                  <path d="M3.5 8H12.5M8.5 4L12.5 8L8.5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MagneticButton>
              <MagneticButton
                href="https://github.com/namanxdev/agentmesh" external
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-[13px] font-semibold text-white/70 backdrop-blur-md border border-white/10 hover:bg-white/5 transition-colors"
              >
                GITHUB
              </MagneticButton>
            </motion.div>
          </div>

          {/* Right side floating Glass Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 3, duration: 1 }}
            className="hidden lg:block lg:col-span-5 xl:col-span-4 w-full relative"
          >
             <div className="relative aspect-[4/3] w-full rounded-2xl border border-white/[0.1] bg-black/40 backdrop-blur-3xl shadow-[0_0_80px_-20px_rgba(255,255,255,0.1)] overflow-hidden group">
                <div className="absolute inset-0 transition-opacity duration-700 opacity-50 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_100%)] pointer-events-none z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none z-10"></div>
                
                {/* Simulated Neural Network / Routing Engine inside the Glass */}
                <div className="absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]">
                   <div className="w-[150%] h-[150%] animate-[spin_60s_linear_infinite] opacity-50 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center z-20">
                   <div className="relative w-32 h-32">
                     <div className="absolute inset-0 border border-white/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                     <div className="absolute inset-4 border border-white/40 rounded-full animate-[spin_4s_linear_infinite] border-t-transparent"></div>
                     <div className="absolute inset-8 border border-white/60 rounded-full animate-[spin_3s_linear_infinite_reverse] border-b-transparent border-l-transparent"></div>
                     <div className="absolute inset-0 m-auto w-4 h-4 bg-white rounded-full shadow-[0_0_20px_4px_rgba(255,255,255,0.8)]"></div>
                   </div>
                </div>

                <div className="absolute bottom-4 left-6 z-20 font-mono tracking-widest text-[9px] uppercase text-white/40">
                  Matrix Synthesis Active
                </div>
             </div>
             <div className="mt-8 flex items-center justify-end gap-5 font-mono text-[11px] text-white/50 tracking-[0.2em] uppercase">
                <span>SYS.INIT {"->"} MCP.CONNECT()</span>
                <div className="h-px w-12 bg-white/30"></div>
             </div>
          </motion.div>
        </div>

        {/* Bottom strip — stats */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 3.2 }}
           className="flex flex-wrap items-end justify-between gap-6 border-t border-white/[0.07] pt-6 mt-12 w-full"
         >
           <div className="flex flex-wrap gap-12 sm:gap-16">
             {[
               { value: "11", label: "event types" },
               { value: "03s", label: "handoff target" },
               { value: "∞", label: "parallel agents" },
               { value: "0", label: "black-box steps" },
             ].map(({ value, label }) => (
               <div key={label} className="flex flex-col gap-1">
                 <span className={`text-[1.8rem] font-black leading-none tracking-[-0.04em] text-[#eeeeee] ${syne.className}`}>
                   {value}
                 </span>
                 <span className="text-[10px] uppercase tracking-[0.24em] text-white/30 font-mono">
                   {label}
                 </span>
               </div>
             ))}
           </div>
         </motion.div>
      </div>
    </section>
  );
}

// 3. Keep scroll functionality native via Lenis
function StickyFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const scrollX = useTransform(scrollYProgress, [0, 1], ["0%", "-66.66%"]);

  return (
    <div ref={containerRef} className="relative h-[300vh] w-full bg-[#04060E]">
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">
        <motion.div style={{ x: scrollX }} className="flex h-full w-[300vw]">
          
          {/* Panel 1 */}
          <div className="flex h-full w-screen items-center justify-between border-r border-[#ffffff10] px-[6vw] lg:px-[10vw]">
            <div className="w-[45%] flex flex-col justify-center min-w-0 z-10">
              <h2 className={`text-[clamp(3.5rem,8vw,7rem)] lg:text-[clamp(3.5rem,6vw,90px)] xl:text-[110px] font-black uppercase leading-[0.8] tracking-[-0.05em] text-white break-words hyphens-auto ${syne.className}`}>
                OBSERVE.
              </h2>
              <p className="mt-8 font-mono text-[10px] sm:text-xs lg:text-sm tracking-[0.2em] text-white/50 leading-relaxed uppercase">
                Real-time observability <br /> Event streams mapped
              </p>
            </div>
            <div className="w-[45%] aspect-[4/3] max-h-[65vh] flex items-center justify-end z-0">
               <LiveMeshGrid />
            </div>
          </div>

          {/* Panel 2 */}
          <div className="flex h-full w-screen items-center justify-between border-r border-[#ffffff10] px-[6vw] lg:px-[10vw]">
            <div className="w-[45%] flex flex-col justify-center min-w-0 z-10">
              <h2 className={`text-[clamp(3.5rem,8vw,7rem)] lg:text-[clamp(3.5rem,6vw,90px)] xl:text-[110px] font-black uppercase leading-[0.8] tracking-[-0.05em] text-white break-words hyphens-auto ${syne.className}`}>
                DIRECT.
              </h2>
              <p className="mt-8 font-mono text-[10px] sm:text-xs lg:text-sm tracking-[0.2em] text-white/50 leading-relaxed uppercase">
                Instant agent handoffs <br /> Neural mesh execution
              </p>
            </div>
            <div className="w-[45%] aspect-[4/3] max-h-[65vh] flex items-center justify-end z-0">
               <div className="relative h-full w-full border border-white/[0.08] bg-black/40 backdrop-blur-3xl shadow-[0_0_80px_-20px_rgba(255,255,255,0.15)] overflow-hidden rounded-2xl flex items-center justify-center transform hover:-translate-y-2 transition-all duration-700 ease-out">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-10"></div>
                 <OrchestratorHUD />
               </div>
            </div>
          </div>

          {/* Panel 3 */}
          <div className="flex h-full w-screen items-center justify-center relative overflow-hidden bg-[#04060E]">
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-[6vw]">
              <motion.h2 
                initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                className="text-[clamp(3.5rem,7vw,8rem)] font-medium tracking-tight text-white/90 leading-[1.1]"
              >
                Zero friction. <br />
                <span className="text-white/40">Infinite scale.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                className="mt-8 text-lg sm:text-xl text-white/40 tracking-wide font-light max-w-lg"
              >
                Experience the purest form of orchestration. No bottlenecks. Just raw performance flowing directly to your agents.
              </motion.p>
            </div>
            
            {/* Subtle ambient light glow for that Apple-like premium feel */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
          </div>

        </motion.div>
      </div>
    </div>
  );
}

// 4. Brutalist Statement
function BrutalistStatement() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0.1, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [50, 0]);

  return (
    <div ref={ref} className="flex min-h-[70vh] w-full items-center justify-center bg-[#04060E] px-[4vw]">
      <motion.h2 
        style={{ opacity, y }}
        className={`text-center text-[7vw] font-black uppercase leading-[0.85] tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-400 to-neutral-900 ${syne.className}`}
      >
        EVERY DECISION VISIBLE. <br />
        EVERY PIPELINE YOURS.
      </motion.h2>
    </div>
  );
}

// 5. How It Works (Asymmetric Scroll)
function HowItWorks() {
  return (
    <div className="relative w-full bg-[#04060E] px-[4vw] py-32">
       {/* ZERO equal columns - asymmetrical grid */}
       <div className="grid grid-cols-[1fr_2fr] gap-0 border-t border-[#ffffff10]">
          
          {/* Left: Sticky Numerals */}
          <div className="relative border-r border-[#ffffff10] pr-[4vw] pt-24">
            <div className="sticky top-32">
               <span className="font-mono text-xs text-white/40 tracking-widest">HOW IT WORKS</span>
               <div className={`mt-12 text-[10vw] font-black text-white/10 tracking-[-0.04em] leading-[0.8] mix-blend-overlay hover:opacity-100 transition-opacity duration-700 cursor-default ${syne.className}`}>
                  01 <br/> 02 <br/> 03
               </div>
            </div>
          </div>

          {/* Right: Flowing Content */}
          <div className="pl-[8vw] pt-24">
             {/* Step 1 */}
             <div className="mb-64">
               <h3 className={`text-4xl font-bold uppercase tracking-tight text-white mb-12 ${syne.className}`}>Initialize The Mesh</h3>
               <div className="w-full bg-[#0a0a0a] border border-[#ffffff10] p-8 -mx-4 rounded-none">
                  <pre className="font-mono text-sm text-neutral-300">
                    <code>{`const mesh = new AgentMesh({
  mode: 'brutal',
  orchestration: 'dag',
  mcpProviders: ['tavily', 'github', 'notion']
});`}</code>
                  </pre>
               </div>
             </div>

             {/* Step 2 */}
             <div className="mb-64">
               <h3 className={`text-4xl font-bold uppercase tracking-tight text-white mb-12 ${syne.className}`}>Define Unseen Edges</h3>
               <div className="w-full bg-[#0a0a0a] border border-[#ffffff10] p-8 mt-12 rounded-none">
                  {/* Pseudo code block */}
                  <pre className="font-mono text-xs text-neutral-400">
                    <code>{`mesh.bindEdge({
  from: 'Architect',
  to: 'Builder',
  condition: (state) => state.confidence > 0.95
});`}</code>
                  </pre>
               </div>
             </div>
             
             {/* Step 3 */}
             <div className="mb-32">
               <h3 className={`text-4xl font-bold uppercase tracking-tight text-white mb-12 ${syne.className}`}>Deploy To Edge</h3>
               <button className="bg-white text-black font-mono text-sm px-8 py-4 uppercase tracking-widest hover:bg-neutral-200 transition-colors" style={{ borderRadius: 0 }}>
                 EXECUTE SEQUENCE
               </button>
             </div>
          </div>

       </div>
    </div>
  );
}

import type { Session } from "next-auth";

export function V2Layout({ session }: { session: Session | null }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="bg-[#04060E] selection:bg-white selection:text-black">
      <Preloader />
      <Navbar initialSession={session} />
      <Hero title="Deploy Autonomous Agents in Seconds" subtitle="AgentMesh provides native Multi-Agent Orchestration via the Model Context Protocol." ctaLabel="Access the Pipeline" />
      <StickyFeatures />
      <LinearWorkflow />
      <BespokeTestimonials />
      <AgentMeshFooter />
    </div>
  );
}
