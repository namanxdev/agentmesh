"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { GripVertical, LayoutTemplate, Plus, RotateCcw, Search } from "lucide-react";
import toast from "react-hot-toast";
import type { NodeKind, PipelineDefinition } from "@/types/pipeline";
import { usePipelineStore } from "@/stores/pipelineStore";
import { NODE_ICONS } from "./nodes/BaseNode";

type PaletteItem = {
  kind: NodeKind;
  name: string;
  description: string;
  group: "Core" | "Intelligence" | "Flow";
};

const PALETTE_ITEMS: PaletteItem[] = [
  { kind: "input", name: "Input", description: "Workflow entry", group: "Core" },
  { kind: "text", name: "Text", description: "Prompt template", group: "Core" },
  { kind: "output", name: "Output", description: "Final response", group: "Core" },
  { kind: "llm_agent", name: "LLM agent", description: "Reason and generate", group: "Intelligence" },
  { kind: "tool", name: "Tool call", description: "Invoke an MCP tool", group: "Intelligence" },
  { kind: "memory", name: "Memory", description: "Persist context", group: "Intelligence" },
  { kind: "router", name: "Router", description: "Conditional branch", group: "Flow" },
  { kind: "transform", name: "Transform", description: "Reshape payload", group: "Flow" },
  { kind: "parallel", name: "Parallel", description: "Fan out work", group: "Flow" },
];

type PipelineTemplate = {
  id: string;
  name: string;
  description: string;
  definition: PipelineDefinition;
};

function isPipelineTemplate(value: unknown): value is PipelineTemplate {
  if (!value || typeof value !== "object") return false;
  const template = value as Record<string, unknown>;
  return (
    typeof template.id === "string" &&
    typeof template.name === "string" &&
    typeof template.description === "string" &&
    typeof template.definition === "object" &&
    template.definition !== null
  );
}

export function NodePalette() {
  const [query, setQuery] = useState("");
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const nodes = usePipelineStore((state) => state.nodes);
  const addNode = usePipelineStore((state) => state.addNode);
  const loadTemplate = usePipelineStore((state) => state.loadTemplate);

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    setTemplateError(null);
    try {
      const response = await fetch("/api/pipelines/templates", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { templates?: unknown; error?: unknown }
        | null;
      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Templates unavailable");
      }
      if (!Array.isArray(payload?.templates)) throw new Error("Templates unavailable");
      setTemplates(payload.templates.filter(isPipelineTemplate));
    } catch (error) {
      setTemplates([]);
      setTemplateError(error instanceof Error ? error.message : "Templates unavailable");
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return PALETTE_ITEMS;
    return PALETTE_ITEMS.filter((item) =>
      `${item.name} ${item.description} ${item.group}`.toLowerCase().includes(term)
    );
  }, [query]);

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, kind: NodeKind) => {
    event.dataTransfer.setData("application/pipeline-node-kind", kind);
    event.dataTransfer.effectAllowed = "copy";
  };

  const insertNode = (kind: NodeKind) => {
    const column = nodes.length % 3;
    const row = Math.floor(nodes.length / 3);
    addNode(kind, { x: 96 + column * 272, y: 112 + row * 168 });
  };

  return (
    <div className="flex h-full w-full flex-col bg-neutral-900">
      <div className="border-b border-neutral-800 p-2.5">
        <label className="flex h-8 items-center gap-2 rounded-md border border-neutral-700 bg-neutral-950 px-2.5 text-neutral-500 transition-colors duration-150 ease-out focus-within:border-indigo-500 focus-within:text-neutral-300">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a component"
            className="min-w-0 flex-1 border-0 bg-transparent text-[12px] text-neutral-200 outline-none placeholder:text-neutral-600"
          />
          <kbd className="font-mono text-[9px] text-neutral-600">9 blocks</kbd>
        </label>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-2.5">
        {!query && (
          <section className="mb-3 border-b border-neutral-800 pb-3">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-[10px] font-medium text-neutral-500">Starter templates</span>
              {templateError && (
                <button
                  type="button"
                  onClick={() => void fetchTemplates()}
                  className="flex items-center gap-1 text-[10px] text-neutral-600 transition-colors hover:text-neutral-300"
                >
                  <RotateCcw className="h-3 w-3" /> Retry
                </button>
              )}
            </div>

            {isLoadingTemplates ? (
              <div className="flex h-12 items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-3">
                <div className="h-6 w-6 animate-pulse rounded bg-neutral-800" />
                <div className="space-y-1.5">
                  <div className="h-2 w-24 animate-pulse rounded bg-neutral-800" />
                  <div className="h-2 w-16 animate-pulse rounded bg-neutral-800/70" />
                </div>
              </div>
            ) : templates.length > 0 ? (
              <div className="space-y-1">
                {templates.slice(0, 2).map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      loadTemplate(template.definition);
                      toast.success(`Loaded ${template.name}`);
                    }}
                    className="group flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-2 text-left transition-colors duration-150 ease-out hover:border-neutral-700 hover:bg-neutral-800"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-400">
                      <LayoutTemplate className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-neutral-300">{template.name}</span>
                      <span className="block truncate text-[10px] text-neutral-600">{template.description}</span>
                    </span>
                    <Plus className="h-3.5 w-3.5 text-neutral-700 group-hover:text-neutral-300" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-10 items-center gap-2 rounded-md border border-dashed border-neutral-800 px-2.5 text-[10px] text-neutral-600">
                <LayoutTemplate className="h-3.5 w-3.5" />
                {templateError ? "Starter library is offline" : "No saved starters yet"}
              </div>
            )}
          </section>
        )}

        {(["Core", "Intelligence", "Flow"] as const).map((group) => {
          const items = filteredItems.filter((item) => item.group === group);
          if (items.length === 0) return null;
          return (
            <section key={group} className="mb-3">
              <div className="mb-1 px-1 text-[10px] font-medium text-neutral-500">{group}</div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  return (
                    <button
                      type="button"
                      key={item.kind}
                      draggable
                      onDragStart={(event) => handleDragStart(event, item.kind)}
                      onClick={() => insertNode(item.kind)}
                      className="group flex w-full cursor-grab items-center gap-2 rounded-md border border-transparent px-1.5 py-1.5 text-left transition-colors duration-150 ease-out hover:border-neutral-700 hover:bg-neutral-800 focus-visible:border-indigo-500 focus-visible:bg-neutral-800 focus-visible:outline-none active:cursor-grabbing"
                      title={`Click to add ${item.name}, or drag it onto the canvas`}
                    >
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-neutral-800 transition-colors group-hover:text-neutral-600" />
                      <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 px-1 font-mono text-[8px] font-semibold text-indigo-400">
                        {NODE_ICONS[item.kind]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-medium text-neutral-300">{item.name}</span>
                        <span className="block truncate text-[10px] text-neutral-600">{item.description}</span>
                      </span>
                      <Plus className="h-3.5 w-3.5 shrink-0 text-neutral-800 transition-colors group-hover:text-neutral-300" />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="px-2 py-8 text-center text-[11px] text-neutral-600">No components match “{query}”.</div>
        )}
      </div>

      <div className="flex h-8 shrink-0 items-center justify-center border-t border-neutral-800 text-[10px] text-neutral-600">
        Click to add · drag to position
      </div>
    </div>
  );
}
