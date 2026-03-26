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

export default function SettingsPage() {
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

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
      </div>
    </div>
  );
}
