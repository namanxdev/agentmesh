"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, KeyRound, Trash2 } from "lucide-react";
import type { LLMProviderId } from "@/config/llmProviders";

interface ApiKeyCardProps {
  provider: LLMProviderId;
  label: string;
  description: string;
  isSaved: boolean;
  savedAt?: string;
  onSaved: () => void;
}

export function ApiKeyCard({ provider, label, description, isSaved, savedAt, onSaved }: ApiKeyCardProps) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!value.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, api_key: value.trim() }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(data.detail ?? "Unable to save key");
      }
      setValue("");
      toast.success(`${label} key saved`);
      onSaved();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to save key";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/keys/${provider}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to revoke key");
      toast.success(`${label} key revoked`);
      onSaved();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to revoke key";
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="border border-neutral-800 bg-neutral-950">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 text-neutral-500">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-200">{label}</h3>
              <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
            </div>
          </div>
        </div>

        <div className={`flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${isSaved ? "text-emerald-400" : "text-neutral-600"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isSaved ? "bg-emerald-500" : "bg-neutral-700"}`} />
          {isSaved ? "Stored" : "Missing"}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-neutral-800 bg-neutral-900/20 p-4 sm:flex-row">
        <input
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") void handleSave(); }}
          placeholder={isSaved ? "Paste a replacement key" : "Paste API key"}
          className="min-w-0 flex-1 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-neutral-600"
        />
        <button type="button" onClick={() => void handleSave()} disabled={!value.trim() || saving} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800 px-3 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-600 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Check className="h-3.5 w-3.5 text-indigo-300" />{saving ? "Saving" : "Save key"}
        </button>
        {isSaved && <button type="button" onClick={() => void handleDelete()} disabled={deleting} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />{deleting ? "Revoking" : "Revoke"}</button>}
      </div>

      <div className="min-h-8 border-t border-neutral-800 px-4 py-2 font-mono text-[10px]">
        {error ? <span className="text-red-400">{error}</span> : isSaved && savedAt ? <span className="text-neutral-600">Stored {new Date(savedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span> : <span className="text-neutral-700">A provider key is required to run a matching model.</span>}
      </div>
    </article>
  );
}
