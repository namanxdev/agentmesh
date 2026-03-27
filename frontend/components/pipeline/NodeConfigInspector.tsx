"use client";
import { usePipelineStore } from "@/stores/pipelineStore";
import { NODE_COLORS } from "./nodes/BaseNode";
import { useEffect, useState } from "react";
import type {
  NodeKind,
  InputNodeConfig,
  OutputNodeConfig,
  LLMAgentConfig,
  ToolNodeConfig,
  TextNodeConfig,
  RouterNodeConfig,
  MemoryNodeConfig,
  TransformNodeConfig,
} from "@/types/pipeline";

// Shared field styles
const fieldStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 6,
  color: "var(--text-primary)",
  fontSize: 12,
  padding: "6px 10px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-muted)",
  marginBottom: 4,
  display: "block",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function InputForm({ id, config }: { id: string; config: InputNodeConfig }) {
  const update = usePipelineStore((s) => s.updateNodeConfig);
  return (
    <>
      <Field label="Name">
        <input
          style={fieldStyle}
          value={config.name}
          onChange={(e) => update(id, { name: e.target.value })}
          placeholder="Pipeline name"
        />
      </Field>
      <Field label="Description / Initial Task">
        <textarea
          style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
          value={config.description}
          onChange={(e) => update(id, { description: e.target.value })}
          placeholder="Describe the pipeline task…"
        />
      </Field>
    </>
  );
}

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gpt-4o",
  "gpt-4o-mini",
];

function LLMAgentForm({ id, config }: { id: string; config: LLMAgentConfig }) {
  const update = usePipelineStore((s) => s.updateNodeConfig);
  return (
    <>
      <Field label="Agent Name">
        <input
          style={fieldStyle}
          value={config.name}
          onChange={(e) => update(id, { name: e.target.value })}
          placeholder="Agent name"
        />
      </Field>
      <Field label="Model">
        <select
          style={fieldStyle}
          value={config.model}
          onChange={(e) => update(id, { model: e.target.value })}
        >
          {MODELS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </Field>
      <Field label={`Temperature: ${config.temperature}`}>
        <input
          type="range"
          min={0} max={1} step={0.1}
          style={{ width: "100%", accentColor: "var(--accent-primary)" }}
          value={config.temperature}
          onChange={(e) => update(id, { temperature: parseFloat(e.target.value) })}
        />
      </Field>
      <Field label="System Prompt">
        <textarea
          style={{ ...fieldStyle, minHeight: 120, resize: "vertical", fontFamily: "monospace", fontSize: 11 }}
          value={config.system_prompt}
          onChange={(e) => update(id, { system_prompt: e.target.value })}
          placeholder="You are a helpful assistant…"
        />
      </Field>
    </>
  );
}

function OutputForm({ id, config }: { id: string; config: OutputNodeConfig }) {
  const update = usePipelineStore((s) => s.updateNodeConfig);
  const formats: OutputNodeConfig["output_format"][] = ["text", "json", "markdown"];
  return (
    <Field label="Output Format">
      <div style={{ display: "flex", gap: 6 }}>
        {formats.map((fmt) => (
          <button
            key={fmt}
            onClick={() => update(id, { output_format: fmt })}
            style={{
              flex: 1,
              padding: "5px",
              borderRadius: 5,
              border: `1px solid ${config.output_format === fmt ? "var(--accent-primary)" : "var(--border-subtle)"}`,
              background: config.output_format === fmt ? "var(--accent-primary)22" : "var(--bg-tertiary)",
              color: config.output_format === fmt ? "var(--accent-primary)" : "var(--text-secondary)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {fmt}
          </button>
        ))}
      </div>
    </Field>
  );
}

type MCPServerOption = { id: string; name: string };

function ToolForm({ id, config }: { id: string; config: ToolNodeConfig }) {
  const update = usePipelineStore((s) => s.updateNodeConfig);
  const [mcpServers, setMcpServers] = useState<MCPServerOption[]>([]);

  useEffect(() => {
    fetch("/api/mcp/user-servers")
      .then((r) => r.ok ? r.json() : { servers: [] })
      .then((data) => setMcpServers(data.servers ?? []))
      .catch(() => {});
  }, []);

  return (
    <>
      <Field label="Server">
        {mcpServers.length > 0 ? (
          <select
            style={fieldStyle}
            value={config.server}
            onChange={(e) => update(id, { server: e.target.value })}
          >
            <option value="">-- select server --</option>
            {mcpServers.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        ) : (
          <input
            style={fieldStyle}
            value={config.server}
            onChange={(e) => update(id, { server: e.target.value })}
            placeholder="mcp-server-name"
          />
        )}
      </Field>
      <Field label="Tool Name">
        <input style={fieldStyle} value={config.tool_name} onChange={(e) => update(id, { tool_name: e.target.value })} placeholder="tool_function_name" />
      </Field>
      <Field label="Parameters (JSON)">
        <textarea style={{ ...fieldStyle, minHeight: 80, fontFamily: "monospace", fontSize: 11 }} value={config.parameters} onChange={(e) => update(id, { parameters: e.target.value })} placeholder="{}" />
      </Field>
    </>
  );
}

function TextForm({ id, config }: { id: string; config: TextNodeConfig }) {
  const update = usePipelineStore((s) => s.updateNodeConfig);
  return (
    <>
      <Field label="Template Content">
        <textarea
          style={{ ...fieldStyle, minHeight: 100, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}
          value={config.content}
          onChange={(e) => update(id, { content: e.target.value })}
          placeholder="Use {{variable}} for dynamic handles…"
        />
      </Field>
      {(config.variables ?? []).length > 0 && (
        <Field label="Detected Variables">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {(config.variables ?? []).map((v) => (
              <span key={v} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontFamily: "monospace", color: NODE_COLORS.text }}>
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        </Field>
      )}
    </>
  );
}

function RouterForm({ id, config }: { id: string; config: RouterNodeConfig }) {
  const update = usePipelineStore((s) => s.updateNodeConfig);
  const conditions = config.conditions ?? [];

  const updateCondition = (i: number, field: "key" | "target", value: string) => {
    const updated = conditions.map((c, idx) => idx === i ? { ...c, [field]: value } : c);
    update(id, { conditions: updated });
  };
  const addCondition = () => update(id, { conditions: [...conditions, { key: "", target: "" }] });
  const removeCondition = (i: number) => update(id, { conditions: conditions.filter((_, idx) => idx !== i) });

  return (
    <>
      <Field label="Routing Key">
        <input style={fieldStyle} value={config.routing_key} onChange={(e) => update(id, { routing_key: e.target.value })} placeholder="route" />
      </Field>
      <Field label="Conditions">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {conditions.map((cond, i) => (
            <div key={i} style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input style={{ ...fieldStyle, flex: 1 }} value={cond.key} onChange={(e) => updateCondition(i, "key", e.target.value)} placeholder="condition" />
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>→</span>
              <input style={{ ...fieldStyle, flex: 1 }} value={cond.target} onChange={(e) => updateCondition(i, "target", e.target.value)} placeholder="agent name" />
              <button onClick={() => removeCondition(i)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>×</button>
            </div>
          ))}
          <button
            onClick={addCondition}
            style={{ ...fieldStyle, cursor: "pointer", textAlign: "center", color: "var(--accent-primary)", border: "1px dashed var(--accent-primary)44", background: "var(--accent-primary)0a" }}
          >
            + Add Condition
          </button>
        </div>
      </Field>
    </>
  );
}

function MemoryForm({ id, config }: { id: string; config: MemoryNodeConfig }) {
  const update = usePipelineStore((s) => s.updateNodeConfig);
  return (
    <>
      <Field label="Memory Type">
        <div style={{ display: "flex", gap: 6 }}>
          {(["context", "vector"] as const).map((t) => (
            <button key={t} onClick={() => update(id, { memory_type: t })} style={{ flex: 1, padding: "5px", borderRadius: 5, border: `1px solid ${config.memory_type === t ? NODE_COLORS.memory : "var(--border-subtle)"}`, background: config.memory_type === t ? `${NODE_COLORS.memory}22` : "var(--bg-tertiary)", color: config.memory_type === t ? NODE_COLORS.memory : "var(--text-secondary)", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "uppercase" }}>
              {t}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Key">
        <input style={fieldStyle} value={config.key} onChange={(e) => update(id, { key: e.target.value })} placeholder="memory_key" />
      </Field>
    </>
  );
}

function TransformForm({ id, config }: { id: string; config: TransformNodeConfig }) {
  const update = usePipelineStore((s) => s.updateNodeConfig);
  return (
    <>
      <Field label="Transform Type">
        <select style={fieldStyle} value={config.transform_type} onChange={(e) => update(id, { transform_type: e.target.value as TransformNodeConfig["transform_type"] })}>
          <option value="json_parse">json_parse</option>
          <option value="extract">extract</option>
          <option value="format">format</option>
        </select>
      </Field>
      <Field label="Expression">
        <input style={{ ...fieldStyle, fontFamily: "monospace" }} value={config.expression} onChange={(e) => update(id, { expression: e.target.value })} placeholder="$.data.result" />
      </Field>
    </>
  );
}

type InspectorFormProps = { id: string; config: unknown };

const FORM_MAP: Record<NodeKind, React.ComponentType<InspectorFormProps>> = {
  input: InputForm as React.ComponentType<InspectorFormProps>,
  output: OutputForm as React.ComponentType<InspectorFormProps>,
  llm_agent: LLMAgentForm as React.ComponentType<InspectorFormProps>,
  tool: ToolForm as React.ComponentType<InspectorFormProps>,
  text: TextForm as React.ComponentType<InspectorFormProps>,
  router: RouterForm as React.ComponentType<InspectorFormProps>,
  memory: MemoryForm as React.ComponentType<InspectorFormProps>,
  transform: TransformForm as React.ComponentType<InspectorFormProps>,
};

export function NodeConfigInspector() {
  const { nodes, selectedNodeId } = usePipelineStore();
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  if (!selectedNode) {
    return (
      <div
        className="dashboard-panel"
        style={{
          gridArea: "inspector",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "var(--text-muted)",
        }}
      >
        <span style={{ fontSize: 28, opacity: 0.4 }}>◻</span>
        <span style={{ fontSize: 12 }}>Select a node to configure</span>
      </div>
    );
  }

  const { id, data } = selectedNode;
  const { kind, label, config } = data;
  const color = NODE_COLORS[kind];
  const FormComponent = FORM_MAP[kind];

  return (
    <div
      className="dashboard-panel"
      style={{
        gridArea: "inspector",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 18px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: `color-mix(in srgb, ${color} 10%, transparent)`,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${color}88`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-primary)",
            flex: 1,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 10,
            color,
            background: `${color}22`,
            border: `1px solid ${color}44`,
            borderRadius: 4,
            padding: "1px 6px",
            textTransform: "uppercase",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {kind}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <FormComponent id={id} config={config} />
      </div>
    </div>
  );
}
