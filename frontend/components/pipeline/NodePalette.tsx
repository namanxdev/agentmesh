"use client";

import { useEffect, useState } from "react";
import type { NodeKind, PipelineDefinition } from "@/types/pipeline";
import { usePipelineStore } from "@/stores/pipelineStore";
import { NODE_COLORS, NODE_ICONS } from "./nodes/BaseNode";

const PALETTE_ITEMS: Array<{ kind: NodeKind; name: string; description: string }> = [
  { kind: "input", name: "Input", description: "Pipeline entry point" },
  { kind: "output", name: "Output", description: "Collect final result" },
  { kind: "llm_agent", name: "LLM Agent", description: "AI reasoning agent" },
  { kind: "tool", name: "Tool", description: "MCP tool call" },
  { kind: "text", name: "Text", description: "Prompt template with {{variables}}" },
  { kind: "router", name: "Router", description: "Conditional branch" },
  { kind: "memory", name: "Memory", description: "Context / vector store" },
  { kind: "transform", name: "Transform", description: "JSON parse, extract, format" },
  { kind: "parallel", name: "Parallel", description: "Fan-out to multiple agents" },
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

export function NodePalette() {
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const loadTemplate = usePipelineStore((s) => s.loadTemplate);

  useEffect(() => {
    let cancelled = false;
    // Retry delays: 2s, 4s, 8s, 15s — handles the FastAPI startup race condition
    // where the server is briefly unavailable immediately after a cold start.
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
        setTemplateError(error instanceof Error ? error.message : "Unable to load templates");
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
      className="dashboard-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p className="dashboard-kicker" style={{ margin: 0 }}>
          Build surface
        </p>
        <h2
          style={{
            color: "var(--text-primary)",
            fontSize: 22,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            margin: "8px 0 0",
          }}
        >
          Node palette
        </h2>
      </div>

      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            padding: "6px 4px 4px",
            fontFamily: "var(--font-mono)",
          }}
        >
          Templates
        </div>

        {isLoadingTemplates ? (
          <div
            style={{
              padding: "12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Loading templates...
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              Fetching starter workflows from the pipeline API.
            </span>
          </div>
        ) : templateError ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(213,80,63,0.2)",
              background: "rgba(213,80,63,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--status-error)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Templates unavailable
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              {templateError}
            </span>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "4px 8px",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                textAlign: "left",
              }}
            >
              Retry {"->"}
            </button>
          </div>
        ) : templates.length === 0 ? (
          <div
            style={{
              padding: "12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              No templates found
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              The backend responded, but it did not return any starter workflows.
            </span>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              onClick={() => loadTemplate(template.definition)}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(240,106,55,0.06)",
                cursor: "pointer",
                marginBottom: 4,
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = "rgba(240,106,55,0.12)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "rgba(240,106,55,0.06)";
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 2,
                }}
              >
                {template.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  lineHeight: 1.4,
                }}
              >
                {template.description}
              </div>
            </div>
          ))
        )}

        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.06)",
            margin: "8px 0",
          }}
        />
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            padding: "2px 4px 4px",
            fontFamily: "var(--font-mono)",
          }}
        >
          Nodes
        </div>

        {PALETTE_ITEMS.map(({ kind, name, description }) => {
          const color = NODE_COLORS[kind];
          const icon = NODE_ICONS[kind];

          return (
            <div
              key={kind}
              draggable
              onDragStart={(event) => handleDragStart(event, kind)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 12px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.06)",
                borderLeft: `3px solid ${color}`,
                background: "rgba(255,255,255,0.03)",
                cursor: "grab",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = `${color}14`;
                event.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "var(--bg-tertiary)";
                event.currentTarget.style.borderColor = "var(--border-subtle)";
                event.currentTarget.style.borderLeftColor = color;
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  background: `${color}22`,
                  color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginTop: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: "12px 14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: 10,
          color: "var(--text-muted)",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Drag nodes onto the canvas
      </div>
    </div>
  );
}
