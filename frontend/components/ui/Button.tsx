import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
  asChild?: boolean;
}

const STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "var(--accent-primary)",
    color: "var(--bg-primary)",
    border: "none",
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: "var(--radius-full)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-default)",
    fontFamily: "var(--font-display)",
    fontWeight: 500,
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: "var(--radius-full)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  outline: {
    background: "transparent",
    color: "var(--accent-primary)",
    border: "1px solid var(--accent-primary)",
    fontFamily: "var(--font-display)",
    fontWeight: 500,
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: "var(--radius-full)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};

export function Button({ variant = "primary", children, className, style, ...props }: ButtonProps) {
  return (
    <button
      className={cn("inline-flex items-center justify-center gap-2 hover:-translate-y-px", className)}
      style={{ ...STYLES[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
