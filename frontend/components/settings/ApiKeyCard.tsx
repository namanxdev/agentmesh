"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";

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
        const msg = data.detail ?? "Save failed";
        setError(msg);
        toast.error(msg);
        throw new Error(msg);
      }
      toast.success(`${label} API key saved and encrypted`);
      setValue("");
      setSuccess(true);
      onSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
      if (!msg.includes("Save failed")) {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/keys/${provider}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = "Delete failed";
        setError(msg);
        toast.error(msg);
        throw new Error(msg);
      }
      toast.success(`${label} API key revoked`);
      onSaved();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      setError(msg);
      if (!msg.includes("Delete failed")) {
        toast.error(msg);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="group relative flex flex-col gap-4 p-5 md:p-6 rounded-[20px] bg-[#0c0a09]/80 border transition-all duration-300"
      style={{
        borderColor: isSaved ? `${accentColor}33` : "rgba(255,255,255,0.06)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)",
        backdropFilter: "blur(12px)"
      }}
    >
      {/* Background glow when saved */}
      {isSaved && (
        <div 
          className="absolute inset-0 rounded-[20px] opacity-10 pointer-events-none transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent 60%)` }}
        />
      )}

      {/* Header */}
      <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)`,
              border: `1px solid ${accentColor}44`,
              color: accentColor,
            }}
          >
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-neutral-100 tracking-tight">
              {label}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Provider</span>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase"
          style={{
            border: `1px solid ${isSaved ? accentColor + "55" : "rgba(255,255,255,0.1)"}`,
            background: isSaved ? accentColor + "18" : "rgba(255,255,255,0.03)",
            color: isSaved ? accentColor : "#737373",
          }}
        >
          {isSaved ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
          {isSaved ? "Secured" : "Not Set"}
        </div>
      </div>

      <p className="text-xs text-neutral-400 leading-relaxed font-medium relative z-10">
        {description}
      </p>

      {/* Key input */}
      <div className="flex flex-col sm:flex-row gap-2 relative z-10">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder={isSaved ? "Paste new key to replace…" : "Paste your API key…"}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl text-white text-sm px-4 py-2.5 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all font-mono placeholder:text-neutral-600 placeholder:font-sans"
        />
        <button
          onClick={handleSave}
          disabled={!value.trim() || loading}
          className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap"
          style={{
            background: value.trim() && !loading ? accentColor : "rgba(255,255,255,0.05)",
            color: value.trim() && !loading ? "#000" : "#737373",
            cursor: value.trim() && !loading ? "pointer" : "not-allowed",
            boxShadow: value.trim() && !loading ? `0 0 20px ${accentColor}44` : "none"
          }}
        >
          {loading ? "Encrypting…" : "Save Key"}
        </button>
      </div>

      {/* Status / saved-at row */}
      <div className="flex items-center justify-between min-h-[24px] gap-2 mt-1 relative z-10">
        <div className="text-[11px] font-mono flex-1">
          {error && <span className="text-red-400">{error}</span>}
          {success && <span style={{ color: accentColor }}>Encrypted uniquely to your account.</span>}
          {!error && !success && isSaved && savedAt && (
            <span className="text-neutral-500">
              Active since {(new Date(savedAt)).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        {isSaved && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 hover:border-red-500/40 transition-all disabled:opacity-50"
          >
             <Trash2 className="w-3 h-3" />
            {deleting ? "Removing…" : "Revoke"}
          </button>
        )}
      </div>
    </div>
  );
}
