"use client";

import React from "react";
import Link from "next/link";
import { Syne } from "next/font/google";
import { HandHelping, Users, Zap } from "lucide-react";
import { FooterCube } from "@/components/ui/footer-cube";

const syne = Syne({ subsets: ["latin"], weight: ["800"] });

const Separator = ({ className, orientation = "horizontal" }: { className?: string, orientation?: "horizontal" | "vertical" }) => (
  <div className={className} />
);

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FooterLines = () => (
  <div className="absolute inset-0 pointer-events-none select-none z-0">
     {/* Vertical grid lines faintly mapped */}
     <div className="absolute inset-0 max-w-screen-2xl mx-auto border-x border-[#ffffff03] flex justify-between">
       <div className="h-full w-px bg-white/[0.02]"></div>
       <div className="h-full w-px bg-white/[0.02]"></div>
     </div>
  </div>
);

export const AgentMeshFooter = ({
  features = [
    {
      icon: <HandHelping className="h-auto w-5 text-[#00f2fe]" />,
      title: "Flexible Support",
      description: "Benefit from around-the-clock assistance to keep your business running smoothly.",
    },
    {
      icon: <Users className="h-auto w-5 text-[#00f2fe]" />,
      title: "Collaborative Tools",
      description: "Enhance teamwork with tools designed to simplify project management and communication.",
    },
    {
      icon: <Zap className="h-auto w-5 text-[#00f2fe]" />,
      title: "Lightning Fast Speed",
      description: "Experience the fastest load times with our high performance servers.",
    },
  ]
}: { features?: Feature[] }) => {
  return (
    <footer className="relative w-full bg-[#04060E] pt-32 overflow-hidden border-t border-white/[0.05]">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] max-w-[1000px] h-[500px] bg-gradient-to-b from-[#4facfe]/10 to-transparent blur-[120px] pointer-events-none" />

      <FooterLines />

      <div className="relative z-10 mx-auto max-w-screen-2xl px-[6vw]">
        
        {/* Features Row (from old Hero45) */}
        <div className="flex flex-col md:flex-row gap-8 pb-32 w-full justify-between">
          {features.map((feature, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <Separator orientation="vertical" className="mx-8 hidden h-auto w-[1px] bg-white/[0.05] md:block" />
              )}
              <div className="flex grow basis-0 flex-col rounded-md bg-transparent py-4 items-center md:items-start text-center md:text-left">
                <div className="mb-6 flex size-12 items-center justify-center rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/20">
                  {feature.icon}
                </div>
                <h3 className="mb-3 font-bold text-lg text-white tracking-tight">{feature.title}</h3>
                <p className="text-sm text-neutral-400 font-medium leading-relaxed max-w-xs">{feature.description}</p>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Top CTA Section */}
        <div className="flex flex-col relative overflow-hidden rounded-[2rem] bg-white/[0.02] border border-white/[0.05] p-10 md:p-20 mt-12 mb-20 items-center text-center">
          {/* Subtle Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-full bg-[#00f2fe]/10 blur-[100px] pointer-events-none z-0" />
          
          <div className="absolute inset-0 right-0 z-0 pointer-events-none opacity-30 mix-blend-screen overflow-hidden flex items-center justify-center">
             <FooterCube />
          </div>
          
          <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
            <h2 className={`text-[clamp(2.5rem,6vw,6rem)] font-black text-white tracking-tight uppercase leading-[0.9] ${syne.className}`}>
              READY TO <br /> ORCHESTRATE?
            </h2>
            <p className="mt-8 text-neutral-400 text-sm md:text-base max-w-xl text-center font-medium leading-relaxed">
              The next generation of autonomous mission control awaits. Stop typing boilerplate, start orchestrating.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/dashboard" 
                className="bg-white text-black font-semibold text-sm px-8 py-4 rounded-full hover:scale-105 transition-transform w-fit h-fit shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]"
              >
                Launch Platform
              </Link>
              <Link 
                href="https://github.com/namanxdev/agentmesh"
                target="_blank"
                className="border border-white/20 text-white font-semibold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition-colors w-fit h-fit"
              >
                Star on GitHub
              </Link>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid flex-wrap grid-cols-2 md:grid-cols-4 gap-12 py-24">
          <div className="flex flex-col gap-6">
            <h4 className={`text-white font-black text-sm tracking-wide uppercase opacity-90 mb-2 ${syne.className}`}>Platform</h4>
            <Link href="/dashboard" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Mission Control</Link>
            <Link href="/agents" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Agents</Link>
            <Link href="/events" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Live Events</Link>
            <Link href="/pipelines" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Pipelines</Link>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className={`text-white font-black text-sm tracking-wide uppercase opacity-90 mb-2 ${syne.className}`}>Resources</h4>
            <Link href="/docs" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Documentation</Link>
            <Link href="/mcp" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">MCP Integration</Link>
            <Link href="/api" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">API Reference</Link>
            <Link href="/design" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Design System</Link>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className={`text-white font-black text-sm tracking-wide uppercase opacity-90 mb-2 ${syne.className}`}>Company</h4>
            <Link href="#" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">About</Link>
            <Link href="#" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Blog</Link>
            <Link href="#" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Careers</Link>
            <Link href="#" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Contact</Link>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className={`text-white font-black text-sm tracking-wide uppercase opacity-90 mb-2 ${syne.className}`}>Legal</h4>
            <Link href="#" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Privacy Policy</Link>
            <Link href="#" className="text-white/50 hover:text-white text-[13px] font-medium transition-colors w-fit">Terms of Service</Link>
            
            <div className="mt-8 flex gap-3">
              {/* x.com (twitter) */}
              <a href="#" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/10 hover:bg-white/10 hover:border-white/30 cursor-pointer transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              {/* github */}
              <a href="https://github.com/namanxdev/agentmesh" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/10 hover:bg-white/10 hover:border-white/30 cursor-pointer transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Massive Typography Footer Base */}
      <div className="relative w-full flex flex-col items-center justify-end overflow-hidden group select-none mt-12 pb-6 px-[6vw]">
        
        <div className="relative w-full overflow-hidden text-center flex items-center justify-center">
           <h1 
             className={`text-[19vw] lg:text-[16vw] leading-[0.7] font-black text-[#ffffff02] uppercase tracking-[-0.04em] text-center w-full transition-colors duration-1000 group-hover:text-[#00f2fe]/5 ${syne.className}`}
           >
             AGENTMESH
           </h1>

           {/* Inner Copyright overlaying the huge text at bottom absolute */}
           <div className="absolute bottom-2 md:bottom-6 w-full flex flex-col md:flex-row gap-2 justify-between items-end text-neutral-500 font-mono text-[8px] sm:text-[10px] md:text-xs tracking-[0.2em] uppercase pb-2">
               <span className="w-full text-center md:text-left">© {new Date().getFullYear()} AGENTMESH INC. ALL RIGHTS RESERVED.</span>
               <span className="w-full text-center md:text-right">SYSTEM STATE: DEPLOYED</span>
           </div>
        </div>
      </div>
    </footer>
  );
};
