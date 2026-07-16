"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, Check, Trash2, FolderOpen, Blocks, Bot, FileJson, Activity, TerminalSquare, LayoutTemplate, Monitor, Server, RefreshCw, AlertCircle } from "lucide-react";
import { usePipelineStore } from "@/stores/pipelineStore";

import { AgentSidebar } from "./AgentSidebar";
import { ToolCallInspector } from "./ToolCallInspector";
import { MessageStream } from "./MessageStream";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { NodePalette } from "@/components/pipeline/NodePalette";
import { NodeConfigInspector } from "@/components/pipeline/NodeConfigInspector";

// useAgentMeshEvents is now mounted by DashboardEventProvider in the shell layout.

type MCPServerRow = {
  id: string;
  name: string;
  server_type: string;
  command_or_url: string;
};

// --- Components ---

interface PanelButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  title: string;
}

const PanelButton = ({ onClick, children, className = "", title }: PanelButtonProps) => (
  <button
    onClick={onClick}
    className={`flex h-9 w-9 items-center justify-center rounded-md border border-neutral-800 bg-neutral-950 text-neutral-500 transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-100 ${className}`}
    title={title}
  >
    {children}
  </button>
);

function MCPServerStrip() {
  const [servers, setServers] = useState<MCPServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mcp/user-servers");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Failed to load MCP servers (${res.status})`);
      }
      const data = await res.json();
      setServers(data.servers ?? []);
    } catch (err) {
      setServers([]);
      setError(err instanceof Error ? err.message : "Failed to load MCP servers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return (
    <div className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950/95 px-4 py-2 text-sm shadow-[0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex min-w-0 items-center gap-3">
        <Server className="h-4 w-4 shrink-0 text-neutral-400" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-200">MCP registry</span>
            <span className="rounded-md border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
              {loading ? "Loading" : `${servers.length} server${servers.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className="mt-0.5 truncate text-xs text-neutral-500">
            {error
              ? error
              : servers.length > 0
                ? servers.map((server) => `${server.name} (${server.server_type})`).join(", ")
                : "No MCP servers registered. Add one in Settings, then select it on a Tool node."}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={fetchServers}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-800 text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-200"
        title="Refresh MCP servers"
      >
        {error ? <AlertCircle className="h-3.5 w-3.5 text-red-400" /> : <RefreshCw className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

/**
 * PipelineWorkbench — the full pipeline editor experience.
 * Previously called DashboardLayout; re-exported below for backward compat.
 * useAgentMeshEvents is now mounted by DashboardEventProvider in the shell.
 */
export function PipelineWorkbench() {
  const mode = usePipelineStore((s) => s.mode);
  const setMode = usePipelineStore((s) => s.setMode);
  const nodes = usePipelineStore((s) => s.nodes);
  const showPipelinesDrawer = usePipelineStore((s) => s.showPipelinesDrawer);
  const savedPipelines = usePipelineStore((s) => s.savedPipelines);
  const loadPipeline = usePipelineStore((s) => s.loadPipeline);
  const deleteSavedPipeline = usePipelineStore((s) => s.deleteSavedPipeline);
  const togglePipelinesDrawer = usePipelineStore((s) => s.togglePipelinesDrawer);

  const isRunning = usePipelineStore((s) => s.isRunning);

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setMode(isMobile ? "run" : "build");
  }, [isMobile, setMode]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (isRunning && !isMobile) {
      timeoutId = setTimeout(() => {
        setRightCollapsed(false);
        setBottomCollapsed(false);
      }, 0);
    }
    return () => clearTimeout(timeoutId);
  }, [isRunning, isMobile]);

  const agentNames = nodes
    .filter((n) => n.data?.kind === "llm_agent")
    .map((n) => (n.data?.config as { name?: string } | undefined)?.name ?? n.data?.label ?? n.id);

  return (
    // This component fills the content area provided by the dashboard shell layout.
    // The shell gives us h-full via the flex-1 min-h-0 wrapper, so we use h-full here.
    <div className="relative flex h-full w-full overflow-hidden bg-neutral-950 text-neutral-100 selection:bg-neutral-700">
      <div className="relative z-10 flex h-full w-full flex-col gap-3 p-3">
        <div className="relative z-50 mx-auto w-full max-w-[1920px] flex-shrink-0 rounded-lg border border-neutral-800 bg-neutral-950 shadow-sm">
          <PipelineHeader />
        </div>
        <MCPServerStrip />

        {/* Workspace section */}
        {(
          <div className="relative mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 gap-3 overflow-hidden">

            {/* LEFT PANEL */}
            {!isMobile && (
            <motion.div
              layout
              initial={false}
              animate={{
                width: leftCollapsed ? 64 : 340,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="group relative z-20 flex h-full flex-shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-sm"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {leftCollapsed ? (
                  <motion.div
                    key="left-collapsed"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.1 } }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.1 } }}
                    className="flex h-full w-16 flex-col items-center gap-8 pt-4"
                  >
                    <PanelButton onClick={() => setLeftCollapsed(false)} title="Expand Blocks">
                      <ChevronRight className="w-5 h-5" />
                    </PanelButton>
                    <div className="flex flex-col items-center gap-4 text-neutral-500">
                      <Blocks className="w-5 h-5 opacity-50" />
                      <div className="w-px h-12 bg-neutral-800" />
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
                    className="flex flex-col w-[340px] h-full"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                      <div className="flex items-center gap-3 text-neutral-200">
                        <div className="rounded-md border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-400">
                          {mode === "build" ? <Blocks className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-semibold tracking-wide">
                          {mode === "build" ? "Components" : "Agents"}
                        </span>
                      </div>
                      <button 
                        className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
                        onClick={() => setLeftCollapsed(true)} 
                        title="Collapse panel"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="min-h-0 w-full flex-1 overflow-hidden">
                      {mode === "build" ? <NodePalette /> : <AgentSidebar agentNames={agentNames} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            )}

            {/* CENTER CANVAS & BOTTOM PANEL */}
            <div className="relative flex min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-lg">
              
              {/* Canvas Container */}
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-sm">
                <PipelineCanvas mode={mode} />

                {/* Event stream toggler */}
                {!isMobile && (
                <AnimatePresence>
                  {bottomCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
                    >
                      <button
                        onClick={() => setBottomCollapsed(false)}
                        className="group flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs font-medium text-neutral-300 shadow-sm transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-white"
                      >
                        <TerminalSquare className="w-4 h-4 text-neutral-400" />
                        <span>Event Stream</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                )}
              </div>

              {/* Bottom Panel */}
              {!isMobile && (
              <AnimatePresence initial={false}>
                {!bottomCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: -24 }}
                    animate={{ height: 320, opacity: 1, marginTop: 0 }}
                    exit={{ height: 0, opacity: 0, marginTop: -24 }}
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                    className="relative flex w-full flex-shrink-0 flex-col rounded-lg border border-neutral-800 bg-neutral-950 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TerminalSquare className="w-4 h-4 text-neutral-400" />
                        <span className="text-xs font-medium text-neutral-300">Live Event Stream</span>
                      </div>
                      <button
                        className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
                        onClick={() => setBottomCollapsed(true)}
                        title="Collapse event stream"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative w-full flex-1 overflow-hidden">
                      <MessageStream />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              )}

              {/* Mobile editing disabled banner */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 left-4 right-4 z-30"
                >
                  <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 shadow-sm">
                    <Monitor className="w-5 h-5 text-neutral-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">Desktop Editing Only</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Pipeline editing is only enabled on larger screens. Viewing is still available.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* RIGHT PANEL */}
            {!isMobile && (
            <motion.div
              layout
              initial={false}
              animate={{
                width: rightCollapsed ? 64 : 340,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="group relative z-20 flex h-full flex-shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-sm"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {rightCollapsed ? (
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
                      <div className="w-px h-12 bg-neutral-800" />
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
                    className="flex flex-col w-[340px] h-full"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                      <button 
                        className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
                        onClick={() => setRightCollapsed(true)} 
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-3 text-neutral-200">
                        <span className="text-sm font-semibold tracking-wide">
                          {mode === "build" ? "Properties" : "Tool Calls"}
                        </span>
                        <div className="rounded-md border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-400">
                          {mode === "build" ? <LayoutTemplate className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                    <div className="custom-scrollbar w-full flex-1 overflow-hidden">
                      {mode === "build" ? <NodeConfigInspector /> : <ToolCallInspector />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            )}

          </div>
        )}
      </div>

      {/* Pipelines Drawer Modal Container */}
      <AnimatePresence>
        {showPipelinesDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 isolate"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={togglePipelinesDrawer}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-lg shadow-sm overflow-hidden flex flex-col max-h-[85vh] z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-neutral-800 flex flex-col gap-1.5">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-100 flex items-center gap-3">
                  <div className="rounded-md border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-400">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  My Pipelines
                </h2>
                <p className="text-xs text-neutral-500 font-mono">Manage your saved configurations and orchestrations.</p>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3">
                {savedPipelines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-lg border border-dashed border-neutral-700 flex items-center justify-center mb-5 bg-neutral-900 text-neutral-600">
                      <LayoutTemplate className="w-7 h-7 opacity-50" />
                    </div>
                    <p className="text-neutral-300 font-medium text-base mb-1.5">No pipelines yet</p>
                    <p className="text-neutral-500 text-sm max-w-xs text-center">Save a configuration from the canvas to see it here.</p>
                  </div>
                ) : (
                  savedPipelines.map((p) => (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      key={p.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-900 hover:border-neutral-700 transition-all"
                    >
                      <div>
                        <div className="font-semibold text-neutral-100 text-sm">{p.name}</div>
                        <div className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-mono mt-1.5 flex items-center gap-2">
                          <Activity className="w-3 h-3 text-emerald-500/70" />
                          Updated {p.updated_at?.slice(0, 10) || "Unknown"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={async () => {
                            try {
                              await loadPipeline(p.id);
                              toast.success(`Pipeline "${p.name}" loaded`);
                              togglePipelinesDrawer();
                            } catch {
                              toast.error("Failed to load pipeline");
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"
                        >
                          <Check className="w-4 h-4" /> Load
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteSavedPipeline(p.id);
                              toast.success("Pipeline deleted");
                            } catch {
                              toast.error("Failed to delete pipeline");
                            }
                          }}
                          className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all border border-transparent hover:border-red-500/20"
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

// Backward-compat re-export so any existing import of DashboardLayout still works.
export { PipelineWorkbench as DashboardLayout };
