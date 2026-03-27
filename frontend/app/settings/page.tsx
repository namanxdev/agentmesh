"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ApiKeyCard } from "@/components/settings/ApiKeyCard";

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
        {/* API Keys section */}
        <div style={{ marginBottom: 36 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--accent-primary)",
              fontFamily: "var(--font-mono)",
              margin: "0 0 8px",
            }}
          >
            API Keys
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              margin: "0 0 10px",
            }}
          >
            Your provider keys
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            Keys are encrypted with AES-256 and stored per account. Each pipeline run uses your
            own keys — you control your spend.
          </p>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
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

        <p
          style={{
            marginTop: 32,
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            lineHeight: 1.6,
          }}
        >
          Keys are never logged or exposed in responses. You can remove them at any time.
        </p>

        {/* MCP Servers section */}
        <div style={{ marginTop: 56, marginBottom: 24 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--accent-secondary)",
              fontFamily: "var(--font-mono)",
              margin: "0 0 8px",
            }}
          >
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
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            Register Model Context Protocol servers to use as tools inside pipeline nodes.
          </p>
        </div>

        {/* Existing servers list */}
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
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    flexShrink: 0,
                  }}
                >
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
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              marginBottom: 16,
            }}
          >
            No servers configured yet.
          </p>
        )}

        {/* Add server form */}
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
