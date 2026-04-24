"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle2, Save, FolderOpen, Settings, LogOut, Check, Activity, AlertTriangle, ArrowLeft } from "lucide-react";
import { usePipelineStore } from "@/stores/pipelineStore";
import { useUIStore } from "@/stores/uiStore";
import { MagicButton } from "@/components/ui/magic-button";

type AppTab = "canvas" | "analytics";

interface PipelineHeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

interface NavbarMenuProps {
  isSaving: boolean;
  currentPipelineId: string | null;
  savePipeline: () => Promise<void>;
  listPipelines: () => Promise<void>;
  togglePipelinesDrawer: () => void;
  handleValidate: () => Promise<void>;
  isValidating: boolean;
  mode: "build" | "run";
}

function NavbarMenu({ isSaving, currentPipelineId, savePipeline, listPipelines, togglePipelinesDrawer, handleValidate, isValidating, mode }: NavbarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 px-[9px] h-8 rounded-lg text-[11px] font-mono tracking-widest font-medium text-neutral-400 hover:text-white bg-transparent hover:bg-white/[0.04] transition-all duration-300 flex items-center justify-center gap-2 group active:scale-95"
      >
        <span className="hidden md:block">MENU</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: 4, filter: "blur(2px)" }}
            transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
            className="absolute right-0 top-full mt-3 w-56 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/[0.06] rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] overflow-hidden z-[200] flex flex-col p-1.5"
            style={{ transformOrigin: "top right" }}
          >
            <div className="px-3 py-2 border-b border-white/[0.04] mb-1 z-10 flex items-center justify-between">
              <span className="text-[9px] uppercase font-mono font-medium tracking-[0.2em] text-neutral-500">Actions</span>
            </div>

            <button
              onClick={async () => {
                try {
                  await savePipeline();
                  toast.success("Pipeline saved successfully");
                  setIsOpen(false);
                } catch {
                  toast.error("Failed to save pipeline");
                }
              }}
              disabled={isSaving || mode === "run"}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all duration-200 disabled:opacity-50 z-10 hover:-translate-y-[1px] active:translate-y-0"
            >
              {isSaving ? <Activity className="w-3.5 h-3.5 animate-spin text-neutral-400" /> : currentPipelineId ? <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" /> : <Save className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />}
              {isSaving ? "Saving..." : currentPipelineId ? "Saved" : "Save Pipeline"}
            </button>

            {mode === "build" && (
              <button
                onClick={() => { handleValidate(); setIsOpen(false); }}
                disabled={isValidating}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all duration-200 disabled:opacity-50 z-10 hover:-translate-y-[1px] active:translate-y-0"
              >
                {isValidating ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />}
                {isValidating ? "Checking..." : "Validate Workflow"}
              </button>
            )}

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent my-1 z-10" />

            <div className="px-3 py-2 border-b border-white/[0.04] mb-1 z-10 mt-1 flex items-center">
              <span className="text-[9px] uppercase font-mono font-medium tracking-[0.2em] text-neutral-500">Workspace</span>
            </div>

            <button
              onClick={async () => { await listPipelines(); togglePipelinesDrawer(); setIsOpen(false); }}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all duration-200 z-10 hover:-translate-y-[1px] active:translate-y-0"
            >
              <FolderOpen className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
              My Pipelines
            </button>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all duration-200 z-10 hover:-translate-y-[1px] active:translate-y-0"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
              Settings
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-red-500/10 transition-all duration-200 mt-1 z-10"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-400 transition-colors" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PipelineHeader({ activeTab, onTabChange }: PipelineHeaderProps) {
  const {
    mode,
    setMode,
    pipelineName,
    setPipelineName,
    isValidating,
    isRunning,
    validationResult,
    validatePipeline,
    runPipeline,
  } = usePipelineStore();

  const savePipeline = usePipelineStore((s) => s.savePipeline);
  const isSaving = usePipelineStore((s) => s.isSaving);
  const togglePipelinesDrawer = usePipelineStore((s) => s.togglePipelinesDrawer);
  const currentPipelineId = usePipelineStore((s) => s.currentPipelineId);
  const listPipelines = usePipelineStore((s) => s.listPipelines);

  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [task, setTask] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [noKeys, setNoKeys] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  const handleRunClick = async () => {
    setError(null);
    // Don't validate here - just open the task input directly.
    setShowTaskInput(true);
  };

  const handleGo = async () => {
    if (!task.trim()) return;
    setError(null);
    setNoKeys(null);
    try {
      const result = await validatePipeline();
      if (!result.is_dag) {
        const msg = result.errors[0] ?? "Pipeline is not a valid DAG";
        setError(msg);
        toast.error(msg);
        return; // Validation failed, do not run
      }

      setMode("run");
      await runPipeline(task.trim());
      toast.success("Pipeline started successfully");
      setShowTaskInput(false);
      setTask("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Run failed";
      if (msg.toLowerCase().includes("no_keys") || msg.toLowerCase().includes("no api key") || msg.toLowerCase().includes("missing api key") || msg.toLowerCase().includes("missing_provider") || msg.toLowerCase().includes("needs a")) {
        const displayMsg = msg === "no_keys" ? "No API keys — Add in Settings →" : msg;
        setNoKeys(displayMsg);
        toast.error(displayMsg);
      } else {
        setError(msg);
        toast.error(msg);
      }
    }
  };

  const handleValidate = async () => {
    setError(null);
    try {
      const result = await validatePipeline();
      if (result.is_dag) {
        toast.success("Pipeline validated successfully");
      } else {
        const msg = result.errors[0] ?? "Validation failed";
        toast.error(msg);
      }
    } catch {
      const msg = "Validation failed";
      setError(msg);
      toast.error(msg);
    }
  };

  const connectionColor =
    connectionStatus === "connected"
      ? "bg-emerald-500"
      : connectionStatus === "connecting"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4 w-full text-sm font-sans z-50 relative bg-transparent rounded-[20px] transition-all">
      {/* Left Area: Logo & Name Segment */}
      <div className="flex items-center gap-5 lg:gap-6 min-w-0 flex-1 w-full lg:w-auto justify-start">
        <Link href="/" className="group flex items-center justify-center p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-all duration-300 ease-out active:scale-95 shrink-0" title="Back to Home">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
        </Link>
        
        <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-white-[0.04]">
          <div className="relative w-6 h-6 rounded-md overflow-hidden">
            <Image src="/agentmesh_logo.png" alt="AgentMesh" width={24} height={24} className="object-contain" />
          </div>
          <span className="font-semibold text-neutral-200 tracking-tight text-[13px]">AgentMesh</span>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-0 px-2 py-1.5 group">
          <input
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            placeholder="Untitled pipeline"
            className="bg-transparent w-full border-none outline-none text-neutral-300 hover:text-white focus:text-white font-medium text-base tracking-tight placeholder:text-neutral-600 min-w-0 max-w-[360px] truncate transition-colors focus:ring-0 selection:bg-white/20"
          />
        </div>

        {/* Runtime Indicator */}
        {mode === "run" && (
          <div className="flex items-center px-2.5 py-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.03] gap-2 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            <span className="text-[10px] uppercase font-mono font-medium tracking-widest text-emerald-500/80 hidden sm:block">
              Live
            </span>
          </div>
        )}
      </div>

      {/* Center Area: Tab Switcher (Minimal Sliding Underline) */}
      <div className="flex justify-center shrink-0 w-full lg:w-auto">
        <div className="flex gap-1">
          {(["canvas", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative px-5 py-2 text-xs font-semibold tracking-wide capitalize transition-colors duration-300 z-10 ${
                activeTab === tab ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="active-tab-underline"
                  className="absolute bottom-0 left-3 right-3 h-px bg-white z-[-1]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Right Area: Actions */}
      <div className="flex items-center gap-3 flex-1 min-w-0 w-full lg:w-auto justify-end flex-nowrap pb-1 lg:pb-0">
        {/* Status Indicators */}
        {connectionStatus !== "connected" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-transparent shrink-0">
            <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${connectionColor}`} />
            <span className="text-[10px] uppercase font-mono font-medium tracking-widest text-neutral-500 hidden sm:block">{connectionStatus}</span>
          </div>
        )}

        {noKeys && (
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-transparent text-amber-500/80 text-[10px] uppercase font-mono font-medium tracking-widest hover:bg-amber-500/[0.03] hover:text-amber-400 hover:border-amber-500/40 transition-all shrink-0"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> {noKeys}
          </Link>
        )}

        {error && !noKeys && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-red-500/20 bg-transparent text-red-500/80 text-[10px] uppercase font-mono font-medium tracking-widest shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        {validationResult && !error && (
           <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] uppercase font-mono font-medium tracking-widest shrink-0 transition-colors ${
             validationResult.is_dag ? "text-neutral-500 border-white/[0.04]" : "text-red-500/80 border-red-500/20 bg-red-500/[0.02]"
           }`}>
             {validationResult.is_dag ? <Check className="w-3 h-3 opacity-60" /> : <AlertTriangle className="w-3.5 h-3.5" />}
             {validationResult.is_dag
              ? `${validationResult.num_nodes} Nodes`
              : "Invalid Graph"}
           </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 border-l border-white/[0.04] pl-3">
            {mode === "run" && (
              <button
                onClick={() => { setMode("build"); setError(null); }}
                className="px-4 py-1.5 rounded-lg text-[11px] font-mono font-medium text-neutral-400 hover:text-white bg-transparent hover:bg-white/[0.04] transition-all uppercase tracking-widest hidden sm:block active:scale-95"
              >
                End Run
              </button>
            )}

            {mode === "build" && (
              <div className="block" title={isRunning ? "Running..." : "Deploy Pipeline"}>
                <MagicButton
                  title={isRunning ? "Deploying..." : "Deploy"}
                  handleClick={handleRunClick}
                  disabled={isValidating || isRunning}
                  className="rounded-lg h-8 px-4 text-xs shadow-none border border-transparent hover:border-white/10"
                />
              </div>
            )}

            <NavbarMenu
              isSaving={isSaving}
              currentPipelineId={currentPipelineId}
              savePipeline={savePipeline}
              listPipelines={listPipelines}
              togglePipelinesDrawer={togglePipelinesDrawer}
              handleValidate={handleValidate}
              isValidating={isValidating}
              mode={mode}
            />
          </div>
      </div>

      {/* Task Prompt Modal (Minimal Premium) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showTaskInput && (
            <div key="task-modal" className="fixed inset-0 z-[99999] isolate">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowTaskInput(false)}
              />
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  className="w-full max-w-[480px] bg-[#0a0a0a]/90 backdrop-blur-[40px] border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden pointer-events-auto flex flex-col relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-7 flex flex-col gap-6 z-10">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[22px] font-semibold text-white tracking-tight">Deploy Pipeline</h3>
                      <p className="text-[13px] text-neutral-400">Enter the initial task prompt to begin execution.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="relative group">
                        <textarea
                          autoFocus
                          value={task}
                          onChange={(e) => setTask(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleGo();
                            }
                          }}
                          placeholder="What needs to be done?"
                          className="relative w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 outline-none text-white text-[15px] placeholder:text-neutral-500 min-h-[140px] resize-none focus:border-white/20 focus:bg-white/[0.05] transition-all hover:border-white/[0.12]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowTaskInput(false)}
                        className="px-5 py-2.5 rounded-lg text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-all"
                      >
                        Cancel
                      </button>
                      <MagicButton
                        title={isRunning ? "Starting..." : "Start Run"}
                        icon={isRunning ? <Activity className="w-4 h-4 animate-spin text-black" /> : <Play className="w-4 h-4 fill-black text-black" />}
                        position="right"
                        handleClick={handleGo}
                        disabled={!task.trim() || isRunning}
                        className="rounded-lg h-[38px] px-6 text-[13px] shadow-none ml-2 border border-transparent"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
