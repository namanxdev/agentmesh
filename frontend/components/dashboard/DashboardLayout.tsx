"use client";

import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
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

const MOBILE_BREAKPOINT = "(max-width: 767px)";

function subscribeToViewport(callback: () => void) {
  const query = window.matchMedia(MOBILE_BREAKPOINT);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_BREAKPOINT).matches;
}

function useIsMobileViewport() {
  return useSyncExternalStore(subscribeToViewport, getMobileSnapshot, () => false);
}

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
    className={`flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-500 transition-colors duration-150 ease-out hover:border-neutral-600 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 ${className}`}
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
    <div className="flex h-8 items-center justify-between gap-3 border-t border-neutral-800 bg-neutral-900 px-3 text-sm">
      <div className="flex min-w-0 items-center gap-2.5">
        <Server className="h-3 w-3 shrink-0 text-neutral-600" />
        <span className="shrink-0 text-[10px] font-medium text-neutral-500">MCP registry</span>
        <span className="text-[11px] text-neutral-500">
          {loading ? "Loading…" : `${servers.length} server${servers.length === 1 ? "" : "s"}`}
        </span>
        {!loading && !error && servers.length > 0 && (
          <span className="hidden md:block text-[12px] text-neutral-600 truncate min-w-0">
            — {servers.map((s) => s.name).join(", ")}
          </span>
        )}
        {!loading && !error && servers.length === 0 && (
          <span className="hidden md:block text-[12px] text-neutral-600 truncate min-w-0">
            — No servers registered. Add one in Settings.
          </span>
        )}
        {error && (
          <span className="text-[12px] text-red-400/70 truncate min-w-0">{error}</span>
        )}
      </div>
      <button
        type="button"
        onClick={fetchServers}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-600 transition-colors hover:bg-neutral-900 hover:text-neutral-200"
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
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);
  const isMobile = useIsMobileViewport();

  useEffect(() => {
    if (!isMobile) setMode("build");
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

  const nodeCount = nodes.length;

  return (
    // This component fills the content area provided by the dashboard shell layout.
    // The shell gives us h-full via the flex-1 min-h-0 wrapper, so we use h-full here.
    <div className="pipeline-workbench relative flex h-full w-full overflow-hidden bg-ui-canvas text-ui-text selection:bg-indigo-500/30">
      <div className="relative z-10 flex h-full w-full flex-col">
        <div className="relative z-50 w-full flex-shrink-0 overflow-visible border-b border-neutral-800 bg-neutral-900 shadow-sm">
          <PipelineHeader />
          <MCPServerStrip />
        </div>

        {/* Workspace section */}
        {(
          <div className="relative flex min-h-0 w-full flex-1 overflow-hidden bg-neutral-950">

            {/* LEFT PANEL */}
            {!isMobile && (
            <motion.div
              layout
              initial={false}
              animate={{
                width: leftCollapsed ? 36 : 272,
              }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="group relative z-20 hidden h-full flex-shrink-0 flex-col overflow-hidden border-r border-neutral-800 bg-neutral-900 md:flex"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {leftCollapsed ? (
                  <motion.div
                    key="left-collapsed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    className="flex h-full w-9 flex-col items-center pt-2"
                  >
                    <PanelButton
                      onClick={() => setLeftCollapsed(false)}
                      title={mode === "build" ? "Components" : "Agents"}
                    >
                      <Blocks className="w-4 h-4" />
                    </PanelButton>
                  </motion.div>
                ) : (
                  <motion.div
                    key="left-expanded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    className="flex h-full w-[272px] flex-col"
                  >
                    <div className="flex h-11 items-center justify-between border-b border-neutral-800 px-3">
                      <div className="flex items-center gap-3 text-neutral-200">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-400">
                          {mode === "build" ? <Blocks className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <span className="text-[12px] font-semibold text-neutral-300">
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
            <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">

              {/* Canvas Container */}
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-neutral-950">
                <PipelineCanvas mode={mode} />

                {/* Status strip — docked at bottom of canvas (VS Code pattern) */}
                {!isMobile && (
                  <div className="flex h-7 shrink-0 items-center justify-between border-t border-neutral-800 bg-neutral-900 px-2">
                    <button
                      onClick={() => setBottomCollapsed((v) => !v)}
                      className="inline-flex items-center gap-1.5 h-full px-2 text-[12px] text-neutral-500 hover:text-neutral-200 transition-colors rounded"
                    >
                      <TerminalSquare className="w-3.5 h-3.5" />
                      Events
                    </button>
                    <span className="text-[11px] font-mono text-neutral-600 pr-1 tabular-nums">
                      {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Panel */}
              {!isMobile && (
              <AnimatePresence initial={false}>
                {!bottomCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 320, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="relative flex w-full flex-shrink-0 flex-col border-t border-neutral-800 bg-neutral-900"
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 left-4 right-4 z-30 md:hidden"
                >
                  <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 shadow-sm">
                    <Monitor className="w-5 h-5 text-neutral-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">Desktop editing only</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Pipeline editing is only enabled on larger screens. Viewing is still available.</p>
                    </div>
                  </div>
                </motion.div>
            </div>

            {/* RIGHT PANEL */}
            {!isMobile && (
            <motion.div
              layout
              initial={false}
              animate={{
                width: rightCollapsed ? 36 : 304,
              }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="group relative z-20 hidden h-full flex-shrink-0 flex-col overflow-hidden border-l border-neutral-800 bg-neutral-900 md:flex"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {rightCollapsed ? (
                  <motion.div
                    key="right-collapsed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    className="flex h-full w-9 flex-col items-center pt-2"
                  >
                    <PanelButton
                      onClick={() => setRightCollapsed(false)}
                      title={mode === "build" ? "Properties" : "Tool Calls"}
                    >
                      <FileJson className="w-4 h-4" />
                    </PanelButton>
                  </motion.div>
                ) : (
                  <motion.div
                    key="right-expanded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    className="flex h-full w-[304px] flex-col"
                  >
                    <div className="flex h-11 items-center justify-between border-b border-neutral-800 px-3">
                      <button
                        className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
                        onClick={() => setRightCollapsed(true)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-3 text-neutral-200">
                        <span className="text-[12px] font-semibold text-neutral-300">
                          {mode === "build" ? "Properties" : "Tool Calls"}
                        </span>
                        <div className="rounded-md border border-neutral-700 bg-neutral-800 p-1.5 text-neutral-400">
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
              className="absolute inset-0 bg-black/70"
              onClick={togglePipelinesDrawer}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-neutral-800 flex flex-col gap-1.5">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-100 flex items-center gap-3">
                  <div className="rounded-md border border-neutral-700 bg-neutral-800 p-1.5 text-neutral-400">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  My pipelines
                </h2>
                <p className="text-xs text-neutral-500">Manage your saved configurations and orchestrations.</p>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3">
                {savedPipelines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-800 text-neutral-600">
                      <LayoutTemplate className="w-7 h-7 opacity-50" />
                    </div>
                    <p className="text-neutral-300 font-medium text-base mb-1.5">No pipelines yet</p>
                    <p className="text-neutral-500 text-sm max-w-xs text-center">Save a configuration from the canvas to see it here.</p>
                  </div>
                ) : (
                  savedPipelines.map((p) => (
                    <div
                      key={p.id}
                      className="group flex flex-col justify-between gap-4 rounded-md border border-neutral-700 bg-neutral-800 p-4 transition-colors duration-150 ease-out hover:border-neutral-600 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="font-semibold text-neutral-100 text-sm">{p.name}</div>
                        <div className="text-xs text-neutral-500 font-mono mt-1.5 flex items-center gap-2">
                          <Activity className="h-3 w-3 text-neutral-500" />
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
                          className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors border border-transparent hover:border-red-500/20"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
