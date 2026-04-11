"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ApiKeyCard } from "@/components/settings/ApiKeyCard";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { InputNodeConfig, LLMAgentConfig } from "@/types/pipeline";

const PROVIDERS = [
  {
    provider: "gemini" as const,
    label: "Google Gemini",
    description: "Used for Gemini 2.0 Flash and Gemini 2.0 Pro models. Get your key at Google AI Studio.",
    accentColor: "var(--accent-primary)",
  },
  {
    provider: "groq" as const,
    label: "Groq",
    description: "Used for Llama 3.3 70B and other open-source models. Get your key at console.groq.com.",
    accentColor: "var(--accent-secondary)",
  },
  {
    provider: "openai" as const,
    label: "OpenAI",
    description: "Used for GPT-4o and GPT-4o-mini models. Get your key at platform.openai.com.",
    accentColor: "var(--status-active)",
  },
];

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gpt-4o",
  "gpt-4o-mini",
];

type MCPServerRow = {
  id: string;
  name: string;
  server_type: string;
  command_or_url: string;
  created_at: string | null;
};

const SERVER_TYPES = ["stdio", "sse", "http"] as const;

export default function SettingsPage() {
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // MCP servers state
  const [mcpServers, setMcpServers] = useState<MCPServerRow[]>([]);
  const [mcpLoading, setMcpLoading] = useState(true);
  const [mcpName, setMcpName] = useState("");
  const [mcpType, setMcpType] = useState<typeof SERVER_TYPES[number]>("stdio");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpAdding, setMcpAdding] = useState(false);
  const [mcpError, setMcpError] = useState("");

  // Pipeline settings from store
  const nodes = usePipelineStore((s) => s.nodes);
  const pipelineName = usePipelineStore((s) => s.pipelineName);
  const setPipelineName = usePipelineStore((s) => s.setPipelineName);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);
  const savePipeline = usePipelineStore((s) => s.savePipeline);
  const isSaving = usePipelineStore((s) => s.isSaving);
  const currentPipelineId = usePipelineStore((s) => s.currentPipelineId);

  const inputNode = nodes.find((n) => n.data?.kind === "input");
  const inputConfig = inputNode?.data?.config as InputNodeConfig | undefined;
  const description = inputConfig?.description ?? "";
  const llmNodes = nodes.filter((n) => n.data?.kind === "llm_agent");
  const firstLLMConfig = llmNodes[0]?.data?.config as LLMAgentConfig | undefined;
  const currentModel = firstLLMConfig?.model ?? MODELS[0];
  const currentTemp = firstLLMConfig?.temperature ?? 0.4;

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/keys");
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, string> = {};
      for (const k of data.keys as { provider: string; saved_at: string }[]) {
        map[k.provider] = k.saved_at;
      }
      setSavedKeys(map);
    } catch {
      // silent — user sees "not set" badges
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMcpServers = useCallback(async () => {
    try {
      const res = await fetch("/api/mcp/user-servers");
      if (!res.ok) return;
      const data = await res.json();
      setMcpServers(data.servers ?? []);
    } catch {
      // silent
    } finally {
      setMcpLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchMcpServers();
  }, [fetchKeys, fetchMcpServers]);

  const handleAddMcpServer = async () => {
    setMcpError("");
    if (!mcpName.trim() || !mcpUrl.trim()) {
      setMcpError("Name and command/URL are required.");
      return;
    }
    setMcpAdding(true);
    try {
      const res = await fetch("/api/mcp/user-servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mcpName.trim(),
          server_type: mcpType,
          command_or_url: mcpUrl.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMcpError(err.detail ?? "Failed to add server.");
        return;
      }
      setMcpName("");
      setMcpType("stdio");
      setMcpUrl("");
      await fetchMcpServers();
    } catch {
      setMcpError("Network error.");
    } finally {
      setMcpAdding(false);
    }
  };

  const handleDeleteMcpServer = async (id: string) => {
    try {
      await fetch(`/api/mcp/user-servers/${id}`, { method: "DELETE" });
      setMcpServers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // silent
    }
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 6,
    color: "var(--text-primary)",
    fontSize: 12,
    padding: "7px 10px",
    outline: "none",
    fontFamily: "inherit",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    flex: "0 0 90px",
    cursor: "pointer",
  };

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

  const sectionKicker: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontFamily: "var(--font-mono)",
    margin: "0 0 8px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "16px 28px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-secondary)",
            fontSize: 12,
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          ← Mission Control
        </Link>
        <span style={{ color: "var(--border-default)" }}>|</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
          }}
        >
          Settings
        </span>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "1px solid var(--border-subtle)",
            borderRadius: 6,
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
            padding: "5px 12px",
          }}
        >
          Sign out
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          maxWidth: 680,
          width: "100%",
          margin: "0 auto",
          padding: "48px 28px",
        }}
      >
        {/* ── Pipeline ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ ...sectionKicker, color: "var(--text-muted)" }}>
            Pipeline
          </p>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              margin: "0 0 20px",
            }}
          >
            {currentPipelineId ? pipelineName || "Untitled pipeline" : "No pipeline loaded"}
          </h2>

          {currentPipelineId ? (
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "20px 20px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  style={fieldStyle}
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  placeholder="Untitled pipeline"
                />
              </div>

              <div>
                <label style={labelStyle}>Description / initial task</label>
                <textarea
                  style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
                  value={description}
                  onChange={(e) =>
                    inputNode && updateNodeConfig(inputNode.id, { description: e.target.value })
                  }
                  placeholder="Describe what this pipeline does…"
                  disabled={!inputNode}
                />
                {!inputNode && (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                    Add an Input node to the canvas to set description
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>
                  Default model — applied to all {llmNodes.length} LLM agent{llmNodes.length !== 1 ? "s" : ""}
                </label>
                <select
                  style={fieldStyle}
                  value={currentModel}
                  onChange={(e) => llmNodes.forEach((n) => updateNodeConfig(n.id, { model: e.target.value }))}
                  disabled={llmNodes.length === 0}
                >
                  {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Default temperature: {currentTemp.toFixed(1)}
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={currentTemp}
                  onChange={(e) => llmNodes.forEach((n) => updateNodeConfig(n.id, { temperature: parseFloat(e.target.value) }))}
                  disabled={llmNodes.length === 0}
                  style={{ width: "100%", accentColor: "var(--accent-primary)" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  <span>Precise (0.0)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              <button
                onClick={savePipeline}
                disabled={isSaving}
                style={{
                  alignSelf: "flex-start",
                  borderRadius: 999,
                  padding: "10px 24px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isSaving ? "default" : "pointer",
                  fontFamily: "var(--font-display)",
                  background: "var(--accent-primary)",
                  color: "#120f0d",
                  border: "none",
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? "Saving…" : "Save pipeline"}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Open a pipeline in Mission Control to configure it here.
            </p>
          )}
        </div>

        {/* ── API Keys ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ ...sectionKicker, color: "var(--accent-primary)" }}>
            API Keys
          </p>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              margin: "0 0 10px",
            }}
          >
            Your provider keys
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.6 }}>
            Keys are encrypted with AES-256 and stored per account. Each pipeline run uses your
            own keys — you control your spend.
          </p>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 160,
                    borderRadius: 14,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-subtle)",
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {PROVIDERS.map((p) => (
                <ApiKeyCard
                  key={p.provider}
                  provider={p.provider}
                  label={p.label}
                  description={p.description}
                  accentColor={p.accentColor}
                  isSaved={p.provider in savedKeys}
                  savedAt={savedKeys[p.provider]}
                  onSaved={fetchKeys}
                />
              ))}
            </div>
          )}

          <p style={{ marginTop: 20, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
            Keys are never logged or exposed in responses. You can remove them at any time.
          </p>
        </div>

        {/* ── MCP Servers ───────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ ...sectionKicker, color: "var(--accent-secondary)" }}>
            MCP Servers
          </p>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              margin: "0 0 10px",
            }}
          >
            Your MCP servers
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.6 }}>
            Register Model Context Protocol servers to use as tools inside pipeline nodes.
          </p>
        </div>

        {!mcpLoading && mcpServers.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {mcpServers.map((srv) => (
              <div
                key={srv.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--accent-secondary)",
                    background: "var(--accent-secondary)18",
                    border: "1px solid var(--accent-secondary)33",
                    borderRadius: 4,
                    padding: "1px 6px",
                    flexShrink: 0,
                  }}
                >
                  {srv.server_type}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", flexShrink: 0 }}>
                  {srv.name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {srv.command_or_url}
                </span>
                <button
                  onClick={() => handleDeleteMcpServer(srv.id)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 5,
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: 11,
                    padding: "3px 8px",
                    flexShrink: 0,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {!mcpLoading && mcpServers.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 16 }}>
            No servers configured yet.
          </p>
        )}

        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 10,
            padding: "16px 16px 14px",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-secondary)",
              margin: "0 0 12px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-mono)",
            }}
          >
            Add server
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              style={{ ...inputStyle, flex: "0 0 160px" }}
              placeholder="Name (e.g. github)"
              value={mcpName}
              onChange={(e) => setMcpName(e.target.value)}
            />
            <select
              style={selectStyle}
              value={mcpType}
              onChange={(e) => setMcpType(e.target.value as typeof SERVER_TYPES[number])}
            >
              {SERVER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              style={inputStyle}
              placeholder="Command or URL"
              value={mcpUrl}
              onChange={(e) => setMcpUrl(e.target.value)}
            />
          </div>
          {mcpError && (
            <p style={{ fontSize: 11, color: "var(--status-error, #ef4444)", margin: "0 0 8px" }}>
              {mcpError}
            </p>
          )}
          <button
            onClick={handleAddMcpServer}
            disabled={mcpAdding}
            style={{
              background: "var(--accent-secondary)18",
              border: "1px solid var(--accent-secondary)44",
              borderRadius: 6,
              color: "var(--accent-secondary)",
              cursor: mcpAdding ? "default" : "pointer",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              opacity: mcpAdding ? 0.6 : 1,
            }}
          >
            {mcpAdding ? "Adding…" : "Add Server"}
          </button>
        </div>
      </div>
    </div>
  );
}
