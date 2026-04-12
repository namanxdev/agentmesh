"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useAnimation, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, Trash2, FolderOpen, Blocks, Bot, FileJson, Activity, Sparkles, TerminalSquare, LayoutTemplate, Menu, X } from "lucide-react";
import { useAgentMeshEvents } from "@/hooks/useAgentMeshEvents";
import { usePipelineStore } from "@/stores/pipelineStore";

import { AgentSidebar } from "./AgentSidebar";
import { ToolCallInspector } from "./ToolCallInspector";
import { MessageStream } from "./MessageStream";
import { AnalyticsView } from "./AnalyticsView";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { NodePalette } from "@/components/pipeline/NodePalette";
import { NodeConfigInspector } from "@/components/pipeline/NodeConfigInspector";
import RetroGrid from "@/components/ui/retro-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { Spotlight } from "@/components/ui/spotlight";
import { TracingBeam } from "@/components/ui/tracing-beam";

type AppTab = "canvas" | "analytics";

const PanelButton = ({ onClick, children, className = "", title }: any) => (
  <AnimatedTooltip items={[{ id: 1, name: title }]}>
    <button
      onClick={onClick}
      className={`group relative flex items-center justify-center w-10 md:w-8 h-12 rounded-xl border border-white/5 bg-white/[0.02] text-neutral-400 hover:text-white hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-2xl transition-all duration-300 z-50 ${className}`}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {children}
    </button>
  </AnimatedTooltip>
);

export function DashboardLayout() {
  useAgentMeshEvents(true);

  const mode = usePipelineStore((s) => s.mode);
  const setMode = usePipelineStore((s) => s.setMode);
  const nodes = usePipelineStore((s) => s.nodes);
  const showPipelinesDrawer = usePipelineStore((s) => s.showPipelinesDrawer);
  const savedPipelines = usePipelineStore((s) => s.savedPipelines);
  const loadPipeline = usePipelineStore((s) => s.loadPipeline);
  const deleteSavedPipeline = usePipelineStore((s) => s.deleteSavedPipeline);
  const togglePipelinesDrawer = usePipelineStore((s) => s.togglePipelinesDrawer);
  const listPipelines = usePipelineStore((s) => s.listPipelines);

  const [activeTab, setActiveTab] = useState<AppTab>("canvas");
  
  // Mobile responsiveness state
  const [isMobile, setIsMobile] = useState(false);
  
  // Initialize panels conditionally based on screen size to prevent hydration mismatch logic breaking layout immediately
  const [leftCollapsed, setLeftCollapsed] = useState(true);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setLeftCollapsed(true);
        setRightCollapsed(true);
      } else {
        setLeftCollapsed(false);
      }
    };
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMode("build");
  }, [setMode]);

  useEffect(() => {
    listPipelines();
  }, [listPipelines]);

  useEffect(() => {
    if (mode === "run" && !isMobile) {
      setRightCollapsed(false);
      setBottomCollapsed(false);
    }
  }, [mode, isMobile]);

  const agentNames = nodes
    .filter((n) => n.data?.kind === "llm_agent")
    .map((n) => (n.data?.config as { name?: string } | undefined)?.name ?? n.data?.label ?? n.id);

  const isBuild = activeTab === "canvas";

  // Mobile Top Bar Navigation actions
  const toggleLeftMobile = () => {
    setLeftCollapsed(!leftCollapsed);
    if (!leftCollapsed === false) setRightCollapsed(true); // Close right if opening left
  };
  const toggleRightMobile = () => {
    setRightCollapsed(!rightCollapsed);
    if (!rightCollapsed === false) setLeftCollapsed(true); // Close left if opening right
  };

  return (
    <div className="relative w-screen h-screen flex flex-col md:flex-row overflow-hidden bg-black text-[#ededed] font-sans selection:bg-fuchsia-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_100%,transparent_110%)] pointer-events-none opacity-40 z-0"></div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full mix-blend-screen opacity-30 z-0">
        <div className="absolute top-[-30%] flex justify-center w-full h-[60%] opacity-40 blur-[120px] bg-gradient-to-r from-transparent via-indigo-500/30 to-fuchsia-500/20" />
      </div>
      
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 z-0" fill="white" />
      
      {/* Main Container */}
      <div className="relative z-10 flex flex-col w-full h-full p-2 md:p-6 pt-2 md:pt-4 gap-2 md:gap-6">
        
        {/* Header section */}
        <div className="relative flex-shrink-0 bg-[#0a0a0a]/60 border border-white/10 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] shadow-black/40 rounded-2xl md:rounded-[24px] overflow-hidden isolate ring-1 ring-white/5 mx-auto w-full max-w-[1920px] flex items-center justify-between z-40">
          {/* Mobile hamburger left */}
          <div className="lg:hidden flex items-center p-2 z-50">
             <button onClick={toggleLeftMobile} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white">
                <Menu className="w-5 h-5" />
             </button>
          </div>
          
          <BorderBeam size={800} duration={15} colorFrom="#ec4899" colorTo="#8b5cf6" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center justify-center lg:justify-start">
             <PipelineHeader activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Mobile tools right */}
          <div className="lg:hidden flex items-center p-2 z-50">
             <button onClick={toggleRightMobile} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white">
                <FileJson className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Workspace section */}
        {isBuild ? (
          <div className="relative flex flex-1 overflow-hidden gap-6 min-h-0 max-w-[1920px] w-full mx-auto pb-2 md:pb-0">
            
            {/* LEFT PANEL */}
            <motion.div
              layout={!isMobile}
              initial={false}
              animate={{
                width: isMobile ? (leftCollapsed ? 0 : "100%") : (leftCollapsed ? 64 : 340),
                opacity: isMobile && leftCollapsed ? 0 : 1,
                x: isMobile && leftCollapsed ? "-100%" : 0
              }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className={`group ${isMobile ? "absolute inset-y-0 left-0 w-full z-50" : "relative"} h-full flex flex-col bg-[#0a0a0a]/95 md:bg-[#0a0a0a]/80 border border-white/[0.08] backdrop-blur-[40px] rounded-2xl md:rounded-[24px] shadow-2xl flex-shrink-0 ring-1 ring-black/20 overflow-hidden`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-50" />
              {!isMobile && <BorderBeam size={300} duration={12} delay={2} colorFrom="#ec4899" colorTo="#3b82f6" />}
              
              <AnimatePresence mode="popLayout" initial={false}>
                {leftCollapsed && !isMobile ? (
                  <motion.div
                    key="left-collapsed"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.1 } }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.1 } }}
                    className="flex flex-col items-center pt-6 w-16 h-full gap-8"
                  >
                    <PanelButton onClick={() => setLeftCollapsed(false)} title="Expand Blocks">
                      <ChevronRight className="w-5 h-5" />
                    </PanelButton>
                    <div className="flex flex-col items-center gap-4 text-neutral-500">
                      <Blocks className="w-5 h-5 opacity-50" />
                      <div className="w-px h-12 bg-gradient-to-b from-white/10 to-transparent" />
                      <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-mono tracking-[0.3em] font-medium text-neutral-400/70 whitespace-nowrap">
                        {mode === "build" ? "COMPONENTS" : "AGENTS"}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="left-expanded"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.1 } }}
                    className="flex flex-col w-full md:w-[340px] h-full"
                  >
                    <div className="px-5 md:px-6 pt-5 pb-3 border-b border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-3 text-neutral-200">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                          {mode === "build" ? <Blocks className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-semibold tracking-wide">
                          {mode === "build" ? "Components" : "Agents"}
                        </span>
                      </div>
                      <button 
                        className="text-neutral-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 md:p-1.5 rounded-lg md:rounded-md border border-white/10 md:border-none" 
                        onClick={() => setLeftCollapsed(true)} 
                        title="Collapse panel"
                      >
                        {isMobile ? <X className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-black/20 pb-20 md:pb-0">
                      <div className="pt-4 px-4 md:px-10">
                        {mode === "build" ? <NodePalette /> : <AgentSidebar agentNames={agentNames} />}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* CENTER CANVAS & BOTTOM PANEL */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative rounded-2xl md:rounded-[24px] gap-4 md:gap-6">
              
              {/* Canvas Container */}
              <div className="flex-1 flex flex-col relative rounded-2xl md:rounded-[24px] border border-white/[0.08] bg-[#050505]/40 backdrop-blur-md shadow-2xl overflow-hidden min-h-0 ring-1 ring-black/50 z-10">
                <RetroGrid className="opacity-[0.15]" />
                <PipelineCanvas mode={mode} />
                
                <div className="absolute inset-0 pointer-events-none rounded-[24px] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" />

                {/* Event stream toggler */}
                <AnimatePresence>
                  {bottomCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20"
                    >
                      <button
                        onClick={() => setBottomCollapsed(false)}
                        className="group flex items-center gap-2.5 px-5 md:px-6 py-2.5 md:py-3 bg-[#111]/90 hover:bg-[#1a1a1a]/90 border border-white/10 hover:border-white/20 backdrop-blur-2xl rounded-full text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-neutral-300 hover:text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all hover:scale-105"
                      >
                        <TerminalSquare className="w-3 h-3 md:w-4 md:h-4 text-emerald-400 group-hover:text-emerald-300" />
                        <span className="whitespace-nowrap">Event Stream</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Panel */}
              <AnimatePresence initial={false}>
                {!bottomCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginBottom: -24 }}
                    animate={{ height: isMobile ? "40vh" : 320, opacity: 1, marginBottom: 0 }}
                    exit={{ height: 0, opacity: 0, marginBottom: -24 }}
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                    className="relative w-full bg-[#0a0a0a]/95 md:bg-[#0a0a0a]/80 border border-white/[0.08] backdrop-blur-[40px] rounded-2xl md:rounded-[24px] shadow-2xl flex flex-col flex-shrink-0 ring-1 ring-black/40 isolate z-20"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                    {!isMobile && <BorderBeam size={400} duration={10} delay={1} colorFrom="#10b981" colorTo="#3b82f6" />}
                    
                    <div className="px-4 md:px-6 py-3 border-b border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <TerminalSquare className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
                        <span className="text-[10px] md:text-xs font-mono tracking-widest uppercase text-neutral-300">Live Stream</span>
                      </div>
                      <button
                        className="p-1.5 md:p-2 text-neutral-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => setBottomCollapsed(true)}
                        title="Collapse event stream"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-hidden w-full relative bg-black/40 pb-2 md:pb-0">
                      <MessageStream />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT PANEL */}
            <motion.div
              layout={!isMobile}
              initial={false}
              animate={{
                width: isMobile ? (rightCollapsed ? 0 : "100%") : (rightCollapsed ? 64 : 400),
                opacity: isMobile && rightCollapsed ? 0 : 1,
                x: isMobile && rightCollapsed ? "100%" : 0
              }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className={`group ${isMobile ? "absolute inset-y-0 right-0 w-full z-50" : "relative"} h-full flex flex-col bg-[#0a0a0a]/95 md:bg-[#0a0a0a]/80 border border-white/[0.08] backdrop-blur-[40px] rounded-2xl md:rounded-[24px] shadow-2xl overflow-hidden flex-shrink-0 ring-1 ring-black/20`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              {!isMobile && <BorderBeam size={300} duration={12} delay={5} colorFrom="#3b82f6" colorTo="#8b5cf6" />}
              <AnimatePresence mode="popLayout" initial={false}>
                {rightCollapsed && !isMobile ? (
                  <motion.div
                    key="right-collapsed"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.1 } }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.1 } }}
                    className="flex flex-col items-center pt-6 w-16 h-full gap-8"
                  >
                    <PanelButton onClick={() => setRightCollapsed(false)} title="Inspector settings">
                      <ChevronLeft className="w-5 h-5" />
                    </PanelButton>
                    <div className="flex flex-col items-center gap-4 text-neutral-500">
                      <FileJson className="w-5 h-5 opacity-50" />
                      <div className="w-px h-12 bg-gradient-to-b from-white/10 to-transparent" />
                      <span className="[writing-mode:vertical-rl] text-[11px] font-mono tracking-[0.3em] font-medium text-neutral-400/70 whitespace-nowrap">
                        {mode === "build" ? "INSPECTOR" : "TOOL CALLS"}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="right-expanded"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.1 } }}
                    className="flex flex-col w-full md:w-[400px] h-full"
                  >
                    <div className="px-5 md:px-6 pt-5 pb-3 border-b border-white/[0.06] flex items-center justify-between">
                      <button 
                         className="text-neutral-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 md:p-1.5 rounded-lg md:rounded-md border border-white/10 md:border-none" 
                        onClick={() => setRightCollapsed(true)} 
                      >
                        {isMobile ? <X className="w-5 h-5" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="flex items-center gap-3 text-neutral-200">
                        <span className="text-sm font-semibold tracking-wide">
                          {mode === "build" ? "Properties" : "Tool Calls"}
                        </span>
                        <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          {mode === "build" ? <LayoutTemplate className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-black/20 pb-20 md:pb-0">
                      <div className="pt-4 px-4 md:px-10">
                        {mode === "build" ? <NodeConfigInspector /> : <ToolCallInspector />}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex-1 rounded-2xl md:rounded-[24px] border border-white/[0.08] bg-[#0a0a0a]/60 backdrop-blur-[40px] shadow-2xl overflow-hidden min-h-0 max-w-[1920px] w-full mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-black/0 to-fuchsia-500/5 pointer-events-none" />
            <AnalyticsView />
          </motion.div>
        )}
      </div>

      {/* Pipelines Drawer Modal Container */}
      <AnimatePresence>
        {showPipelinesDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 isolate"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={togglePipelinesDrawer} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl md:rounded-[24px] shadow-[0_0_100px_rgba(0,0,0,0.8)] ring-1 ring-white/5 overflow-hidden flex flex-col max-h-[85vh] z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
              
              <div className="px-6 md:px-8 py-5 md:py-6 border-b border-white/[0.06] bg-black/50 backdrop-blur-md flex flex-col gap-2 relative z-10">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <FolderOpen className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  My Pipelines
                </h2>
                <p className="text-xs md:text-sm text-neutral-400 font-mono">Manage your saved configurations and orchestrations.</p>
              </div>
              
              <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4 relative z-10">
                {savedPipelines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border border-dashed border-white/10 flex items-center justify-center mb-6 bg-white/[0.02] text-neutral-600">
                      <LayoutTemplate className="w-6 h-6 md:w-8 md:h-8 opacity-50" />
                    </div>
                    <p className="text-neutral-300 font-medium text-base md:text-lg mb-2">No pipelines yet</p>
                    <p className="text-neutral-500 text-xs md:text-sm max-w-xs text-center">Save a configuration from the canvas to see it here.</p>
                  </div>
                ) : (
                  savedPipelines.map((p) => (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      key={p.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all shadow-lg shadow-black/20"
                    >
                      <div>
                        <div className="font-semibold text-neutral-100 text-base md:text-lg group-hover:text-indigo-300 transition-colors">{p.name}</div>
                        <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-neutral-500 font-mono mt-2 flex items-center gap-2">
                          <Activity className="w-3 h-3 text-emerald-500/70" />
                          Updated {p.updated_at?.slice(0, 10) || "Unknown"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            loadPipeline(p.id);
                            togglePipelinesDrawer();
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                        >
                          <Check className="w-4 h-4" /> Load
                        </button>
                        <button
                          onClick={() => deleteSavedPipeline(p.id)}
                          className="p-2.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
