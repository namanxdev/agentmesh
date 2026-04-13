"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { NodeKind, PipelineDefinition } from "@/types/pipeline";
import { usePipelineStore } from "@/stores/pipelineStore";
import { NODE_COLORS, NODE_ICONS } from "./nodes/BaseNode";
import { FolderHeart } from "lucide-react";

const PALETTE_ITEMS: Array<{ kind: NodeKind; name: string; description: string }> = [
  { kind: "input", name: "Input", description: "Pipeline entry point" },
  { kind: "output", name: "Output", description: "Collect final result" },
  { kind: "llm_agent", name: "LLM Agent", description: "AI reasoning agent" },
  { kind: "tool", name: "Tool", description: "MCP tool call" },
  { kind: "text", name: "Text", description: "Prompt templates" },
  { kind: "router", name: "Router", description: "Conditional branching" },
  { kind: "memory", name: "Memory", description: "Context storage" },
  { kind: "transform", name: "Transform", description: "Data formatting" },
  { kind: "parallel", name: "Parallel", description: "Concurrent scatter/gather" },
];

type PipelineTemplate = {
  id: string;
  name: string;
  description: string;
  definition: PipelineDefinition;
};

function isPipelineTemplate(value: unknown): value is PipelineTemplate {
  if (!value || typeof value !== "object") {
    return false;
  }

  const template = value as Record<string, unknown>;
  return (
    typeof template.id === "string" &&
    typeof template.name === "string" &&
    typeof template.description === "string" &&
    typeof template.definition === "object" &&
    template.definition !== null
  );
}

function withAlphaHex(colorHex: string, alpha: number) {
  if (colorHex.startsWith("#") && colorHex.length === 7) {
    const hex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${colorHex}${hex}`;
  }
  return colorHex;
}

export function NodePalette() {
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const loadTemplate = usePipelineStore((s) => s.loadTemplate);

  useEffect(() => {
    let cancelled = false;
    const RETRY_DELAYS = [2000, 4000, 8000, 15000];

    const attempt = async (retriesLeft: number): Promise<void> => {
      if (cancelled) return;
      setIsLoadingTemplates(true);
      setTemplateError(null);

      try {
        const response = await fetch("/api/pipelines/templates", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { templates?: unknown; error?: unknown }
          | null;

        if (!response.ok) {
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : `Request failed with status ${response.status}`
          );
        }
        if (!Array.isArray(payload?.templates)) {
          throw new Error("Templates response was invalid");
        }
        if (!cancelled) setTemplates(payload.templates.filter(isPipelineTemplate));
      } catch (error) {
        if (cancelled) return;
        const delay = RETRY_DELAYS[RETRY_DELAYS.length - 1 - retriesLeft];
        if (retriesLeft > 0 && delay !== undefined) {
          await new Promise<void>((r) => setTimeout(r, delay));
          return attempt(retriesLeft - 1);
        }
        setTemplates([]);
        const msg = error instanceof Error ? error.message : "Unable to load templates";
        setTemplateError(msg);
        toast.error(msg);
      } finally {
        if (!cancelled) setIsLoadingTemplates(false);
      }
    };

    void attempt(RETRY_DELAYS.length - 1);
    return () => { cancelled = true; };
  }, [retryKey]);

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    kind: NodeKind
  ) => {
    event.dataTransfer.setData("application/pipeline-node-kind", kind);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%"
      }}
    >
      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          paddingBottom: 20
        }}
      >
        {/* TEMPLATES SECTION */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pl-2">
            <FolderHeart className="w-4 h-4 text-neutral-500" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-semibold">
              Templates
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {isLoadingTemplates ? (
              <div className="flex flex-col gap-2 p-4 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse">
                <div className="h-4 w-1/2 bg-white/10 rounded" />
                <div className="h-3 w-3/4 bg-white/5 rounded mt-2" />
              </div>
            ) : templateError ? (
              <div className="flex flex-col gap-2 p-4 rounded-2xl border border-red-500/20 bg-red-500/10">
                <span className="text-xs font-mono text-red-400 font-semibold">Unavailable</span>
                <span className="text-[10px] text-red-500/70">{templateError}</span>
                <button
                  onClick={() => setRetryKey((k) => k + 1)}
                  className="mt-2 text-[10px] font-mono border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg px-3 py-1.5 transition-all outline-none w-fit"
                >
                  Retry Connection
                </button>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col gap-2 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-xs text-neutral-400 font-medium">No templates</span>
                <span className="text-[10px] text-neutral-600 leading-relaxed">No starter configurations found in the directory.</span>
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => {
                    loadTemplate(template.definition);
                    toast.success(`Template "${template.name}" loaded`);
                  }}
                  className="group relative flex flex-col gap-1 p-3.5 rounded-[16px] border border-white/[0.04] bg-white/[0.02] cursor-pointer hover:bg-indigo-500/10 hover:border-indigo-500/30 overflow-hidden transition-all duration-300"
                >
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/0 group-hover:via-indigo-500/50 to-transparent transition-all duration-500" />
                  <span className="text-xs font-semibold text-neutral-200 group-hover:text-indigo-300 transition-colors">{template.name}</span>
                  <span className="text-[10px] text-neutral-500 leading-relaxed group-hover:text-indigo-200/60 transition-colors">{template.description}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="h-px bg-white/5 mx-2" />

        {/* NODES SECTION */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pl-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-semibold">
              Components
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PALETTE_ITEMS.map(({ kind, name, description }) => {
              const color = NODE_COLORS[kind];
              const icon = NODE_ICONS[kind];

              return (
                <div
                  key={kind}
                  draggable
                  onDragStart={(event) => handleDragStart(event, kind)}
                  className="group relative flex flex-col p-3 rounded-[16px] border border-white/[0.05] bg-[#0c0a09]/80 cursor-grab active:cursor-grabbing hover:-translate-y-[2px] transition-all duration-200"
                  style={{
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)"
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor = withAlphaHex(color, 0.4);
                    event.currentTarget.style.background = `linear-gradient(145deg, #0c0a09 40%, ${withAlphaHex(color, 0.1)} 100%)`;
                    event.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${withAlphaHex(color, 0.1)}, inset 0 1px 0 rgba(255,255,255,0.05)`;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                    event.currentTarget.style.background = "#0c0a09";
                    event.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)";
                  }}
                >
                  <div 
                    style={{ background: `linear-gradient(90deg, transparent, ${withAlphaHex(color, 0.6)}, transparent)` }}
                    className="absolute inset-x-4 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  />

                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span
                      style={{
                        background: `linear-gradient(135deg, ${withAlphaHex(color, 0.2)}, ${withAlphaHex(color, 0.05)})`,
                        border: `1px solid ${withAlphaHex(color, 0.3)}`,
                        color: color,
                      }}
                      className="flex items-center justify-center w-6 h-6 rounded-md font-mono text-[9px] font-bold shrink-0"
                    >
                      {icon}
                    </span>
                    <span className="text-xs font-semibold text-neutral-200 whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                      {name}
                    </span>
                  </div>
                  
                  <span className="text-[9px] text-neutral-500 leading-relaxed font-medium">
                    {description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 mt-auto border-t border-white/[0.04] shrink-0 text-center">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-600 font-semibold bg-neutral-900/50 py-1.5 px-3 rounded-lg border border-white/[0.02]">
          Drag into Canvas
        </span>
      </div>
    </div>
  );
}
