"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Circle, Clock, MessageSquare, MoreHorizontal, User, Zap } from "lucide-react";

export default function LinearWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const tasks = [
    { id: "AM-104", title: "Generate MCP schemas for REST API", status: "Pipeline", icon: Circle, color: "text-neutral-500" },
    { id: "AM-105", title: "Resolve schema validation error in Architect", status: "In Progress", icon: Clock, color: "text-yellow-500" },
    { id: "AM-106", title: "Deploy initial workflow structure", status: "Executing", icon: Zap, color: "text-blue-500" },
    { id: "AM-107", title: "Review final agent execution logs", status: "Pipeline", icon: Circle, color: "text-neutral-500" },
    { id: "AM-108", title: "Sync updated nodes to registry", status: "In Progress", icon: Clock, color: "text-yellow-500" },
  ];

  const messages = [
    {
      role: "Architect",
      time: "12:50 PM",
      content: "I've drafted the pipeline structure for the REST API integration. It requires a new validator node.",
      initials: "AR",
      bg: "bg-blue-600",
    },
    {
      role: "Reviewer",
      time: "12:51 PM",
      content: "The schema looks good. I'm passing it to the Builder now to implement the MCP tool definitions.",
      initials: "RV",
      bg: "bg-emerald-600",
    },
    {
      role: "Builder",
      time: "12:52 PM",
      content: "I have resolved the schema validation error. Everything is ready to be merged and executed. Task AM-105 updated.",
      initials: "BU",
      bg: "bg-violet-600",
    },
  ];

  return (
    <section className="relative w-full bg-[#000000] py-32 px-6 md:px-12 lg:px-24 overflow-hidden border-t border-white/[0.04]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-16">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="flex-1 max-w-2xl">
            <h2 className="text-4xl md:text-5xl lg:text-[56px] font-medium tracking-tighter text-white leading-[1.1] font-sans">
              Every decision visible. <br className="hidden md:block" />
              <span className="text-white/40 mb-2 block">Every pipeline yours.</span>
            </h2>
          </div>
          
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              1.0 Agent Handoff →
            </div>
            <p className="text-neutral-400 font-sans text-base md:text-lg leading-relaxed">
              AgentMesh automatically structures abstract LLM conversations into distinct, trackable pipeline stages. Your agents collaborate in threads, resolving tasks like a senior engineering team.
            </p>
          </div>
        </div>

        {/* Desktop UI Container */}
        <div 
          ref={containerRef}
          className="relative w-full h-[600px] lg:h-[700px] rounded-2xl md:rounded-3xl border border-white/[0.08] bg-[#0A0A0B] overflow-hidden shadow-2xl flex"
        >
          {/* Top Bar Mock */}
          <div className="absolute top-0 left-0 w-full h-12 border-b border-white/[0.06] bg-[#0A0A0B]/80 backdrop-blur-md z-20 flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/[0.15]" />
              <div className="w-3 h-3 rounded-full bg-white/[0.15]" />
              <div className="w-3 h-3 rounded-full bg-white/[0.15]" />
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.04] text-xs font-medium text-neutral-400 font-sans tracking-wide">
              AM-105 <span className="text-neutral-600">/</span> Schema Validation
            </div>
            <div className="w-16" /> {/* Spacer */}
          </div>

          {/* Kanban Board (Background/Right) */}
          <div className="absolute inset-0 pt-12 pl-[5%] lg:pl-[20%] pr-6 pb-6 overflow-hidden">
            <div className="w-full h-full pt-10 flex gap-6 overflow-hidden relative">
              
              {/* Columns Overlay Fade */}
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0A0A0B] to-transparent z-10 pointer-events-none" />
              
              {["Pipeline", "In Progress", "Executing"].map((column, colIdx) => (
                <div key={column} className="flex-1 min-w-[280px] max-w-[320px] flex flex-col gap-4 relative">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-400 tracking-tight font-sans">
                    {colIdx === 0 && <span className="w-2 h-2 rounded-full border border-neutral-500" />}
                    {colIdx === 1 && <span className="w-2 h-2 rounded-full bg-yellow-500/80" />}
                    {colIdx === 2 && <span className="w-2 h-2 rounded-full bg-blue-500/80" />}
                    {column} <span className="text-neutral-600 ml-1">{colIdx === 1 ? 2 : colIdx === 0 ? 3 : 1}</span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {tasks.filter(t => t.status === column || (colIdx === 0 && t.status === "Pipeline")).map((task, i) => {
                      const Icon = task.icon;
                      return (
                        <div 
                          key={`${task.id}-${i}`}
                          className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl hover:bg-white/[0.04] transition-colors flex flex-col gap-3 cursor-default"
                        >
                          <div className="text-[13px] leading-snug text-neutral-300 font-sans">
                            {task.title}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-500 font-sans">
                              {task.id}
                              <div className="w-4 h-4 rounded-[4px] bg-white/[0.06] flex items-center justify-center">
                                <Icon className={`w-2.5 h-2.5 ${task.color}`} />
                              </div>
                            </div>
                            <div className="flex -space-x-1">
                              <div className="w-5 h-5 rounded-full bg-emerald-600 border-2 border-[#0A0A0B] flex items-center justify-center text-[8px] font-bold text-white uppercase">RV</div>
                              <div className="w-5 h-5 rounded-full bg-violet-600 border-2 border-[#0A0A0B] flex items-center justify-center text-[8px] font-bold text-white uppercase">BU</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Thread (Foreground/Left) */}
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] as [number, number, number, number], delay: 0.2 }}
            className="absolute bottom-[-10px] left-4 md:left-12 lg:left-24 w-full max-w-[400px] md:max-w-[480px] bg-[#121214] border border-white/[0.08] shadow-2xl rounded-t-2xl md:rounded-t-3xl overflow-hidden flex flex-col z-30 font-sans"
          >
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neutral-400" />
                <span className="text-sm font-medium text-white tracking-tight">Thread in #pipeline-handoff</span>
              </div>
              <MoreHorizontal className="w-4 h-4 text-neutral-500" />
            </div>

            <div className="p-5 flex flex-col gap-6 max-h-[400px] overflow-y-auto">
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                  transition={{ duration: 0.5, delay: 0.5 + (idx * 0.15), ease: "easeOut" }}
                  className="flex gap-3 relative"
                >
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-medium text-white shadow-inner ${msg.bg}`}>
                    {msg.initials}
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-neutral-200">{msg.role}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">{msg.time}</span>
                    </div>
                    <p className="text-[13px] text-neutral-300 leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 bg-[#0A0A0B] border-t border-white/[0.06]">
              <div className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center px-4 py-3 gap-3 focus-within:border-white/[0.2] transition-colors">
                <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold pb-px">@</div>
                <input 
                  type="text" 
                  placeholder="builder generate pipelines and execute..." 
                  className="bg-transparent border-none outline-none text-[13px] text-neutral-300 placeholder:text-neutral-500 w-full font-sans"
                  readOnly
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
