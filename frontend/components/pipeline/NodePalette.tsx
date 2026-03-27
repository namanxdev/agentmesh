"use client";
import { useState, useEffect } from "react";
import { NODE_COLORS, NODE_ICONS } from "./nodes/BaseNode";
import type { NodeKind, PipelineNode, PipelineEdge } from "@/types/pipeline";
import { usePipelineStore } from "@/stores/pipelineStore";

const PALETTE_ITEMS: Array<{ kind: NodeKind; name: string; description: string }> = [
  { kind: "input",     name: "Input",     description: "Pipeline entry point" },
  { kind: "output",    name: "Output",    description: "Collect final result" },
  { kind: "llm_agent", name: "LLM Agent", description: "AI reasoning agent" },
  { kind: "tool",      name: "Tool",      description: "MCP tool call" },
  { kind: "text",      name: "Text",      description: "Prompt template with {{variables}}" },
  { kind: "router",    name: "Router",    description: "Conditional branch" },
  { kind: "memory",    name: "Memory",    description: "Context / vector store" },
  { kind: "transform", name: "Transform", description: "JSON parse, extract, format" },
  { kind: "parallel",  name: "Parallel",  description: "Fan-out to multiple agents" },
];

export function NodePalette() {
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string; definition: { name: string; nodes: PipelineNode[]; edges: PipelineEdge[] } }>>([]);
  const loadTemplate = usePipelineStore((s) => s.loadTemplate);

  useEffect(() => {
    fetch("/api/pipelines/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => {});
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, kind: NodeKind) => {
    e.dataTransfer.setData("application/pipeline-node-kind", kind);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      className="dashboard-panel"
      style={{
        gridArea: "agents",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {templates.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", padding: "6px 4px 4px", fontFamily: "var(--font-mono)" }}>
              Templates
            </div>
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => loadTemplate(t.definition)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(240,106,55,0.06)",
                  cursor: "pointer",
                  marginBottom: 4,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(240,106,55,0.12)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(240,106,55,0.06)"; }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.4 }}>{t.description}</div>
              </div>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", padding: "2px 4px 4px", fontFamily: "var(--font-mono)" }}>
              Nodes
            </div>
          </>
        )}

        {PALETTE_ITEMS.map(({ kind, name, description }) => {
          const color = NODE_COLORS[kind];
          const icon = NODE_ICONS[kind];
          return (
            <div
              key={kind}
              draggable
              onDragStart={(e) => handleDragStart(e, kind)}
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
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  `${color}14`;
                (e.currentTarget as HTMLDivElement).style.borderColor = color;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "var(--bg-tertiary)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "var(--border-subtle)";
                (e.currentTarget as HTMLDivElement).style.borderLeftColor = color;
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

      {/* Footer hint */}
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
