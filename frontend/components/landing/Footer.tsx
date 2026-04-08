import Link from "next/link";

const QUICK_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#tech-stack", label: "Tech stack" },
  { href: "/dashboard", label: "Mission Control" },
];

const STATUS_ITEMS = [
  { label: "Event bus", value: "live" },
  { label: "MCP fabric", value: "connected" },
  { label: "Human gates", value: "inline" },
];

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--border-subtle)] py-16 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.85fr_0.85fr]">
          <div className="landing-panel rounded-[30px] p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.82)] px-2 py-2">
                <span
                  className="rounded-full border border-[rgba(23,18,15,0.1)] px-2 py-1 text-[10px] uppercase tracking-[0.28em]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  AM
                </span>
              </span>
              <div>
                <p className="landing-kicker">AgentMesh</p>
                <p
                  className="mt-2 text-sm"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                  }}
                >
                  MCP-native multi-agent orchestration.
                </p>
              </div>
            </div>

            <h2
              className="mt-7 max-w-[520px] text-[clamp(1.9rem,3.2vw,3rem)] leading-[0.98] tracking-[-0.06em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
            >
              Warm editorial story in front. Dark Mission Control behind it.
            </h2>

            <p
              className="mt-5 max-w-[520px] text-base leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              The landing page now hands off cleanly into the product instead of competing with
              it. Same product, better positioning, stronger hierarchy.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  background: "var(--landing-ink)",
                  color: "var(--landing-paper)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                }}
              >
                Open Mission Control
              </Link>
              <Link
                href="/signup"
                className="landing-chip text-[11px] uppercase tracking-[0.24em] no-underline"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
              >
                Create account
              </Link>
            </div>
          </div>

          <div className="landing-panel rounded-[30px] p-6 sm:p-7">
            <p className="landing-kicker">Quick links</p>
            <div className="mt-6 space-y-3">
              {QUICK_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-[18px] border border-[rgba(23,18,15,0.08)] bg-[rgba(255,255,255,0.58)] px-4 py-3 text-sm no-underline"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 700 }}
                >
                  <span>{label}</span>
                  <span
                    className="text-[11px] uppercase tracking-[0.24em]"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
                  >
                    open
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="landing-panel rounded-[30px] p-6 sm:p-7">
            <p className="landing-kicker">Status</p>
            <div className="mt-6 space-y-3">
              {STATUS_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[18px] border border-[rgba(23,18,15,0.08)] bg-[rgba(255,255,255,0.58)] px-4 py-3"
                >
                  <span
                    className="text-[11px] uppercase tracking-[0.24em]"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    {item.label}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--landing-acid)" }} />
                    <span
                      className="text-[11px] uppercase tracking-[0.24em]"
                      style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                    >
                      {item.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p
            className="text-sm"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}
          >
            AgentMesh / Mission Control / 2026
          </p>
          <p className="landing-kicker" style={{ margin: 0 }}>
            Inspectable workflows, live telemetry, human checkpoints
          </p>
        </div>
      </div>
    </footer>
  );
}
