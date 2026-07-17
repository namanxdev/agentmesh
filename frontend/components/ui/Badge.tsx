import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "running" | "success" | "pending" | "error";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-neutral-700 bg-neutral-800 text-neutral-300",
  running: "border-emerald-500/40 bg-neutral-800 text-emerald-400",
  success: "border-emerald-500/40 bg-neutral-800 text-emerald-400",
  pending: "border-amber-500/40 bg-neutral-800 text-amber-400",
  error: "border-red-500/40 bg-neutral-800 text-red-400",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 max-w-full items-center gap-1.5 truncate rounded-md border px-1.5 font-mono text-xs leading-none",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
