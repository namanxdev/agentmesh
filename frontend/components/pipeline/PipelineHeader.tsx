"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Play, CheckCircle2, Save, FolderOpen, Settings, LogOut, Check, Activity, AlertTriangle, ArrowLeft } from "lucide-react";
import { usePipelineStore } from "@/stores/pipelineStore";
import { useUIStore } from "@/stores/uiStore";
import { MagicButton } from "@/components/ui/magic-button";

type AppTab = "canvas" | "analytics";

interface PipelineHeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
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

  const handleRunClick = async () => {
    setError(null);
    try {
      const result = await validatePipeline();
      if (!result.is_dag) {
        const msg = result.errors[0] ?? "Pipeline is not a valid DAG";
        setError(msg);
        toast.error(msg);
        return;
      }
      setShowTaskInput(true);
    } catch {
      const msg = "Validation failed";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleGo = async () => {
    if (!task.trim()) return;
    setError(null);
    setNoKeys(null);
    try {
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
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4 w-full text-sm font-sans z-50 relative bg-black/20 backdrop-blur-xl border-b border-white/5">
      {/* Left Area: Logo & Name Segment */}
      <div className="flex items-center gap-4 lg:gap-6 min-w-0 w-full lg:w-auto">
        <Link href="/" className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all shrink-0" title="Back to Home">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 shadow-inner">
          <div className="grid grid-cols-2 gap-1 opacity-80">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">Mission Control</span>
            <span className="font-bold text-white tracking-wide">AgentMesh</span>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3 flex-1 lg:flex-none min-w-0 bg-black/40 rounded-xl px-3 lg:px-4 py-2 border border-white/10 group hover:border-white/20 transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50">
          <span className="text-[10px] lg:text-[11px] uppercase font-mono tracking-widest text-neutral-500 hidden sm:block">Pipeline</span>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <input
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            placeholder="Untitled pipeline"
            className="bg-transparent w-full border-none outline-none text-white font-bold text-base lg:text-lg tracking-tight placeholder:text-neutral-600 min-w-[120px] lg:min-w-[220px] max-w-[360px]"
          />
        </div>

        {/* Runtime Indicator */}
        {mode === "run" && (
          <div className="flex items-center px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 gap-2 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 hidden sm:block">
              Runtime
            </span>
          </div>
        )}
      </div>

      {/* Center Area: Tab Switcher (No absolute overlap now!) */}
      <div className="flex justify-center shrink-0 w-full lg:w-auto">
        <div className="flex p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
          {(["canvas", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative px-6 py-2 rounded-xl text-xs font-semibold tracking-wide capitalize transition-colors z-10 ${
                activeTab === tab ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl z-[-1]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Right Area: Actions */}
      <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto justify-end overflow-x-auto custom-scrollbar flex-nowrap pb-1 lg:pb-0">
        {/* Status Indicators */}
        {connectionStatus !== "connected" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-black/40 shrink-0">
            <span className={`h-2 w-2 rounded-full ${connectionColor}`} />
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">{connectionStatus}</span>
          </div>
        )}

        {noKeys && (
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] uppercase font-mono tracking-wider hover:bg-amber-500/20 transition-colors shrink-0"
          >
            <AlertTriangle className="w-3 h-3" /> {noKeys}
          </Link>
        )}

        {error && !noKeys && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] uppercase font-mono tracking-wider shrink-0">
            <AlertTriangle className="w-3 h-3" /> {error}
          </div>
        )}

        {validationResult && !error && (
           <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-black/40 text-[10px] uppercase font-mono tracking-wider shrink-0 ${
             validationResult.is_dag ? "text-indigo-400 border-indigo-500/30" : "text-red-400 border-red-500/30"
           }`}>
             {validationResult.is_dag ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
             {validationResult.is_dag
              ? `${validationResult.num_nodes} Nodes | ${validationResult.num_edges} Edges`
              : "Invalid Graph"}
           </div>
        )}

        {/* Action Buttons */}
        {showTaskInput ? (
          <div className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-2xl bg-black/60 border border-white/20 shadow-inner shrink-0">
            <input
              autoFocus
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGo()}
              placeholder="Enter initial task prompt..."
              className="bg-transparent border-none outline-none text-white text-sm min-w-[150px] lg:min-w-[240px] placeholder:text-neutral-600"
            />
            <button
              onClick={() => setShowTaskInput(false)}
              className="px-2 lg:px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <MagicButton
              title="Start Run"
              icon={<Play className="w-4 h-4 fill-white" />}
              position="right"
              handleClick={handleGo}
              disabled={!task.trim() || isRunning}
              className="!h-8 !px-4"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            {mode === "run" && (
              <button
                onClick={() => { setMode("build"); setError(null); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all uppercase tracking-widest hidden sm:block"
              >
                End Run
              </button>
            )}

            <button
              onClick={async () => {
                try {
                  await savePipeline();
                  toast.success("Pipeline saved successfully");
                } catch {
                  toast.error("Failed to save pipeline");
                }
              }}
              disabled={isSaving || mode === "run"}
              title="Save Pipeline"
              className="group flex items-center justify-center w-10 md:w-auto gap-2 md:px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : currentPipelineId ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              <span className="hidden md:block">{isSaving ? "Saving..." : currentPipelineId ? "Saved" : "Save"}</span>
            </button>

            <button
              onClick={async () => { await listPipelines(); togglePipelinesDrawer(); }}
              title="My Pipelines"
              className="flex items-center justify-center w-10 md:w-auto gap-2 md:px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <FolderOpen className="w-4 h-4" /> <span className="hidden md:block">Pipelines</span>
            </button>

            {mode === "build" && (
              <button
                onClick={handleValidate}
                disabled={isValidating}
                title="Validate Pipeline"
                className="hidden md:flex px-4 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? "Checking..." : "Validate"}
              </button>
            )}

            {mode === "build" && (
              <div className="block" title={isRunning ? "Running..." : "Deploy Pipeline"}>
                <MagicButton
                  title={isRunning ? "" : "Deploy"}
                  icon={isRunning ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                  position="right"
                  handleClick={handleRunClick}
                  disabled={isValidating || isRunning}
                />
              </div>
            )}

            {/* Quick Actions (Settings, Logout) */}
            <div className="flex items-center gap-1 ml-1 md:ml-2 pl-2 md:pl-3 border-l border-white/10">
              <Link
                href="/settings"
                title="Settings"
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sign out"
                className="hidden sm:block p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
