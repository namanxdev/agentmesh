"use client";

import { useState } from "react";

interface ApiKeyCardProps {
  provider: "gemini" | "groq" | "openai";
  label: string;
  description: string;
  accentColor: string;
  isSaved: boolean;
  savedAt?: string;
  onSaved: () => void;
}

export function ApiKeyCard({
  provider,
  label,
  description,
  accentColor,
  isSaved,
  savedAt,
  onSaved,
}: ApiKeyCardProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, api_key: value.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Save failed");
      }
      setValue("");
      setSuccess(true);
      onSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/keys/${provider}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: `1px solid ${isSaved ? accentColor + "44" : "var(--border-subtle)"}`,
        borderRadius: 14,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "border-color 0.2s ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}88`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
            }}
          >
            {label}
          </span>
        </div>

        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "3px 8px",
            borderRadius: 999,
            border: `1px solid ${isSaved ? accentColor + "55" : "var(--border-default)"}`,
            background: isSaved ? accentColor + "18" : "var(--bg-tertiary)",
            color: isSaved ? accentColor : "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {isSaved ? "saved" : "not set"}
        </span>
      </div>

      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>

      {/* Key input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder={isSaved ? "Paste new key to replace…" : "Paste your API key…"}
          style={{
            flex: 1,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 8,
            color: "var(--text-primary)",
            fontSize: 12,
            padding: "8px 12px",
            outline: "none",
            fontFamily: "var(--font-mono)",
          }}
        />
        <button
          onClick={handleSave}
          disabled={!value.trim() || loading}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: value.trim() && !loading ? accentColor : "var(--bg-tertiary)",
            color: value.trim() && !loading ? "#0a0a0a" : "var(--text-muted)",
            fontSize: 12,
            fontWeight: 700,
            cursor: value.trim() && !loading ? "pointer" : "not-allowed",
            transition: "background 0.2s ease, color 0.2s ease",
            fontFamily: "var(--font-display)",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Status / saved-at row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 20, gap: 8 }}>
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", flex: 1 }}>
          {error && <span style={{ color: "var(--status-error)" }}>{error}</span>}
          {success && <span style={{ color: "var(--status-active)" }}>Saved successfully</span>}
          {!error && !success && isSaved && savedAt && (
            <span style={{ color: "var(--text-muted)" }}>
              Added {new Date(savedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </span>

        {isSaved && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 6,
              color: "var(--status-error)",
              fontSize: 11,
              fontWeight: 600,
              cursor: deleting ? "not-allowed" : "pointer",
              opacity: deleting ? 0.5 : 1,
              padding: "4px 10px",
              fontFamily: "var(--font-mono)",
              whiteSpace: "nowrap",
            }}
          >
            {deleting ? "Removing…" : "Remove key"}
          </button>
        )}
      </div>
    </div>
  );
}
