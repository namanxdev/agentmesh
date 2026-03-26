import Link from "next/link";

const LINKS = [
  { href: "#features", label: "System" },
  { href: "#how-it-works", label: "Flow" },
  { href: "#tech-stack", label: "Compatibility" },
  { href: "/dashboard", label: "Mission Control" },
];

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--border-subtle)] py-10">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-6 px-5 md:px-8">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.65)]">
            <span className="grid grid-cols-2 gap-[3px]">
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-primary)]" />
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--landing-acid)]" />
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--landing-ink)]" />
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-primary)]" />
            </span>
          </span>
          <div>
            <p className="landing-kicker">AgentMesh</p>
            <p
              className="mt-2 text-sm"
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
              }}
            >
              MCP-native orchestration with a front end that finally looks intentional.
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-3">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="landing-chip text-[11px] uppercase tracking-[0.28em] no-underline transition-transform duration-300 hover:-translate-y-0.5"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
