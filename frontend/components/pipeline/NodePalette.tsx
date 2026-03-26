"use client";
import { NODE_COLORS, NODE_ICONS } from "./nodes/BaseNode";
import type { NodeKind } from "@/types/pipeline";

const PALETTE_ITEMS: Array<{ kind: NodeKind; name: string; description: string }> = [
  { kind: "input",     name: "Input",     description: "Pipeline entry point" },
  { kind: "output",    name: "Output",    description: "Collect final result" },
  { kind: "llm_agent", name: "LLM Agent", description: "AI reasoning agent" },
  { kind: "tool",      name: "Tool",      description: "MCP tool call" },
  { kind: "text",      name: "Text",      description: "Prompt template with {{variables}}" },
  { kind: "router",    name: "Router",    description: "Conditional branch" },
  { kind: "memory",    name: "Memory",    description: "Context / vector store" },
  { kind: "transform", name: "Transform", description: "JSON parse, extract, format" },
];

export function NodePalette() {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, kind: NodeKind) => {
    e.dataTransfer.setData("application/pipeline-node-kind", kind);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      style={{
        gridArea: "agents",
        background: "var(--bg-secondary)",
        borderRadius: 8,
        border: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--border-subtle)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Node Palette
      </div>

      {/* Items */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
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
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid var(--border-subtle)",
                borderLeft: `3px solid ${color}`,
                background: "var(--bg-tertiary)",
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
          padding: "8px 14px",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: 10,
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        Drag nodes onto the canvas
      </div>
    </div>
  );
}
