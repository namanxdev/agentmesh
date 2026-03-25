import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = "var(--accent-primary)", className }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full", className)}
      style={{
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
        color,
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </span>
  );
}
