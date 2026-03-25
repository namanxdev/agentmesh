import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassPanel({ children, className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(className)}
      style={{
        background: "hsl(225 20% 10% / 0.6)",
        backdropFilter: "blur(20px) saturate(150%)",
        WebkitBackdropFilter: "blur(20px) saturate(150%)",
        border: "1px solid hsl(225 15% 20% / 0.4)",
        borderRadius: "var(--radius-lg)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
