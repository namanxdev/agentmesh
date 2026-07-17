"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle2, Save, FolderOpen, Settings, LogOut, Check, Activity, AlertTriangle, MoreHorizontal } from "lucide-react";
import { usePipelineStore } from "@/stores/pipelineStore";
import { useUIStore } from "@/stores/uiStore";

// PipelineHeader no longer owns the analytics/canvas tab-switch.
// Navigation lives in DashboardSidebar. This header is pipeline-editor-only.
export type PipelineHeaderProps = Record<string, never>;

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
        title="More actions"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-800 text-neutral-500 transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-200"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-56 bg-neutral-950 border border-neutral-800 rounded-lg shadow-sm overflow-hidden z-[200] flex flex-col p-1.5"
            style={{ transformOrigin: "top right" }}
          >
            <div className="px-3 py-2 border-b border-neutral-800 mb-1 z-10">
              <span className="text-[11px] font-medium text-neutral-500">Actions</span>
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors duration-150 disabled:opacity-50"
            >
              {isSaving ? <Activity className="w-3.5 h-3.5 animate-spin text-neutral-400" /> : currentPipelineId ? <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" /> : <Save className="w-3.5 h-3.5 text-neutral-500" />}
              {isSaving ? "Saving..." : currentPipelineId ? "Saved" : "Save pipeline"}
            </button>

            {mode === "build" && (
              <button
                onClick={() => { handleValidate(); setIsOpen(false); }}
                disabled={isValidating}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors duration-150 disabled:opacity-50"
              >
                {isValidating ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-neutral-500" />}
                {isValidating ? "Checking..." : "Validate workflow"}
              </button>
            )}

            <div className="h-px w-full bg-neutral-800 my-1" />

            <div className="px-3 py-2 border-b border-neutral-800 mb-1 z-10">
              <span className="text-[11px] font-medium text-neutral-500">Workspace</span>
            </div>

            <button
              onClick={async () => {
                try {
                  await listPipelines();
                  togglePipelinesDrawer();
                  setIsOpen(false);
                } catch {
                  toast.error("Failed to load pipelines");
                }
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors duration-150"
            >
              <FolderOpen className="w-3.5 h-3.5 text-neutral-500" />
              My pipelines
            </button>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors duration-150"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-500" />
              Settings
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-red-500/10 transition-colors duration-150 mt-1"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-500" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PipelineHeader() {
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
    nodes,
    edges,
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
    <div className="relative z-50 flex h-12 w-full items-center justify-between gap-3 bg-transparent px-3 font-sans text-sm">
      {/* Left Area: Pipeline Name */}
      <div className="flex min-w-0 flex-1 items-center justify-start gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 xl:inline">Pipeline</span>
          <span className="hidden h-4 w-px bg-neutral-800 xl:block" />
          <input
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            placeholder="Untitled pipeline"
            className="min-w-0 max-w-[220px] truncate border-none bg-transparent text-[13px] font-semibold tracking-tight text-neutral-200 outline-none transition-colors placeholder:text-neutral-600 hover:text-white focus:text-white focus:ring-0 selection:bg-white/20"
          />
        </div>

        <div className="hidden items-center gap-2 font-mono text-[10px] tabular-nums text-neutral-600 lg:flex">
          <span>{nodes.length} nodes</span>
          <span className="text-neutral-800">/</span>
          <span>{edges.length} edges</span>
        </div>

        {/* Runtime Indicator */}
        {mode === "run" && (
          <div className="flex items-center px-2.5 py-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.03] gap-2 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[12px] text-emerald-500/80 hidden sm:block">
              Live
            </span>
          </div>
        )}
      </div>

      {/* Right Area: Actions */}
      <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2">
        {/* Status Indicators */}
        {connectionStatus !== "connected" && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-neutral-800 bg-transparent shrink-0">
            <span className={`h-1.5 w-1.5 rounded-full ${connectionColor}`} />
            <span className="text-[12px] text-neutral-400 hidden sm:block">{connectionStatus}</span>
          </div>
        )}

        {noKeys && (
          <Link
            href="/settings"
            className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-amber-500/20 bg-transparent text-amber-500/80 text-[12px] hover:bg-amber-500/[0.03] hover:text-amber-400 hover:border-amber-500/40 transition-colors shrink-0"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> {noKeys}
          </Link>
        )}

        {error && !noKeys && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-red-500/20 bg-transparent text-red-400/80 text-[12px] shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        {validationResult && !error && (
           <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border text-[12px] shrink-0 transition-colors ${
             validationResult.is_dag ? "text-neutral-400 border-neutral-800" : "text-red-400/80 border-red-500/20 bg-red-500/[0.02]"
           }`}>
             {validationResult.is_dag ? <Check className="w-3 h-3 opacity-60" /> : <AlertTriangle className="w-3.5 h-3.5" />}
             {validationResult.is_dag
              ? `${validationResult.num_nodes} nodes`
              : "Invalid graph"}
           </div>
        )}

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-1.5 border-l border-neutral-800 pl-2">
            {mode === "run" && (
              <button
                onClick={() => { setMode("build"); setError(null); }}
                className="px-3.5 h-8 rounded-md text-[13px] font-medium text-neutral-400 hover:text-white bg-transparent hover:bg-neutral-900 transition-colors duration-150 hidden sm:block border border-neutral-800 hover:border-neutral-700"
              >
                End run
              </button>
            )}

            {mode === "build" && (
              <>
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  title="Validate workflow"
                  className="hidden h-8 items-center gap-1.5 rounded-md border border-neutral-800 px-2.5 text-[12px] font-medium text-neutral-400 transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-100 disabled:opacity-50 lg:inline-flex"
                >
                  {isValidating ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Validate
                </button>
                <button
                  onClick={async () => {
                    try {
                      await savePipeline();
                      toast.success("Pipeline saved successfully");
                    } catch {
                      toast.error("Failed to save pipeline");
                    }
                  }}
                  disabled={isSaving}
                  title="Save pipeline"
                  className="hidden h-8 items-center gap-1.5 rounded-md border border-neutral-800 px-2.5 text-[12px] font-medium text-neutral-400 transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-100 disabled:opacity-50 lg:inline-flex"
                >
                  {isSaving ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </button>
                <button
                  onClick={handleRunClick}
                  disabled={isValidating || isRunning}
                  title={isRunning ? "Starting pipeline" : "Run pipeline"}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-indigo-500 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRunning ? (
                    <Activity className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                  {isRunning ? "Starting" : "Run"}
                </button>
              </>
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

      {/* Task Prompt Modal */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showTaskInput && (
            <div key="task-modal" className="fixed inset-0 z-[99999] isolate">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
                onClick={() => setShowTaskInput(false)}
              />
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none p-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="w-full max-w-[480px] bg-neutral-950 border border-neutral-800 shadow-sm rounded-lg overflow-hidden pointer-events-auto flex flex-col relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-7 flex flex-col gap-6 z-10">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[22px] font-semibold text-white tracking-tight">Run pipeline</h3>
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
                          className="relative w-full bg-neutral-900 border border-neutral-800 rounded-md px-4 py-3 outline-none text-white text-[15px] placeholder:text-neutral-500 min-h-[140px] resize-none focus:border-neutral-600 transition-colors hover:border-neutral-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowTaskInput(false)}
                        className="px-3.5 h-8 rounded-md text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors duration-150 border border-neutral-800 hover:border-neutral-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleGo}
                        disabled={!task.trim() || isRunning}
                        className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-md h-8 px-4 text-[13px] font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRunning ? (
                          <Activity className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        {isRunning ? "Starting…" : "Start run"}
                      </button>
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
