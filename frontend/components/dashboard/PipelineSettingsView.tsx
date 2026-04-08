"use client";

import { usePipelineStore } from "@/stores/pipelineStore";
import type { InputNodeConfig, LLMAgentConfig } from "@/types/pipeline";

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gpt-4o",
  "gpt-4o-mini",
];

const fieldStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 6,
  color: "var(--text-primary)",
  fontSize: 13,
  padding: "8px 12px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-muted)",
  marginBottom: 6,
  display: "block",
};

const sectionHeadStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 16,
  fontWeight: 700,
  color: "var(--text-primary)",
  letterSpacing: "-0.02em",
  margin: "0 0 16px",
};

export function PipelineSettingsView() {
  const nodes = usePipelineStore((s) => s.nodes);
  const pipelineName = usePipelineStore((s) => s.pipelineName);
  const setPipelineName = usePipelineStore((s) => s.setPipelineName);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);
  const savePipeline = usePipelineStore((s) => s.savePipeline);
  const isSaving = usePipelineStore((s) => s.isSaving);

  const inputNode = nodes.find((n) => n.data?.kind === "input");
  const inputConfig = inputNode?.data?.config as InputNodeConfig | undefined;
  const description = inputConfig?.description ?? "";

  const llmNodes = nodes.filter((n) => n.data?.kind === "llm_agent");
  const firstLLM = llmNodes[0];
  const firstLLMConfig = firstLLM?.data?.config as LLMAgentConfig | undefined;
  const currentModel = firstLLMConfig?.model ?? MODELS[0];
  const currentTemp = firstLLMConfig?.temperature ?? 0.4;

  const applyModelToAll = (model: string) => {
    llmNodes.forEach((n) => updateNodeConfig(n.id, { model }));
  };

  const applyTempToAll = (temperature: number) => {
    llmNodes.forEach((n) => updateNodeConfig(n.id, { temperature }));
  };

  const handleSave = () => {
    savePipeline();
  };

  return (
    <div
      style={{
        padding: "32px 40px",
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 32 }}>
          <p
            className="dashboard-kicker"
            style={{ margin: "0 0 8px", letterSpacing: "0.14em" }}
          >
            Configuration
          </p>
          <h1
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              margin: 0,
            }}
          >
            Pipeline settings
          </h1>
        </div>

        <div
          className="dashboard-panel"
          style={{ padding: 24, marginBottom: 16 }}
        >
          <h2 style={sectionHeadStyle}>Identity</h2>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Pipeline name</label>
            <input
              style={fieldStyle}
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              placeholder="Untitled pipeline"
            />
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Description / initial task</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 90, resize: "vertical" }}
              value={description}
              onChange={(e) =>
                inputNode && updateNodeConfig(inputNode.id, { description: e.target.value })
              }
              placeholder="Describe what this pipeline does or its initial task…"
              disabled={!inputNode}
            />
            {!inputNode && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  marginTop: 4,
                }}
              >
                Add an Input node to the pipeline to set description
              </p>
            )}
          </div>
        </div>

        <div className="dashboard-panel" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={sectionHeadStyle}>Defaults</h2>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              margin: "0 0 20px",
              fontFamily: "var(--font-mono)",
            }}
          >
            Applied to all {llmNodes.length} LLM agent{llmNodes.length !== 1 ? "s" : ""} on save
          </p>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Default model</label>
            <select
              style={fieldStyle}
              value={currentModel}
              onChange={(e) => applyModelToAll(e.target.value)}
              disabled={llmNodes.length === 0}
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>
              Default temperature: {currentTemp.toFixed(1)}
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={currentTemp}
              onChange={(e) => applyTempToAll(parseFloat(e.target.value))}
              disabled={llmNodes.length === 0}
              style={{ width: "100%", accentColor: "var(--accent-primary)" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                marginTop: 4,
              }}
            >
              <span>Precise (0.0)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            borderRadius: 999,
            padding: "12px 28px",
            fontSize: 13,
            fontWeight: 700,
            cursor: isSaving ? "default" : "pointer",
            fontFamily: "var(--font-display)",
            background: "var(--accent-primary)",
            color: "#120f0d",
            border: "none",
            opacity: isSaving ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {isSaving ? "Saving…" : "Save pipeline"}
        </button>
      </div>
    </div>
  );
}
