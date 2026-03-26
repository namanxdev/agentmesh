import Link from "next/link";

const PRIMARY_LINKS = [
  { href: "#features", label: "System overview" },
  { href: "#how-it-works", label: "Control logic" },
  { href: "#tech-stack", label: "Compatibility" },
  { href: "/dashboard", label: "Mission Control" },
];

const SECONDARY_LINKS = [
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
  { href: "#launch", label: "Launch locally" },
];

const FOOTER_NOTES = [
  "MCP-native",
  "typed telemetry",
  "human gates",
  "local-first",
];

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--border-subtle)] py-16 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <div className="landing-panel-dark overflow-hidden rounded-[38px] p-6 sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)]">
                  <span className="grid grid-cols-2 gap-[3px]">
                    <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-primary)]" />
                    <span className="h-[5px] w-[5px] rounded-full bg-[var(--landing-acid)]" />
                    <span className="h-[5px] w-[5px] rounded-full bg-[rgba(247,240,232,0.88)]" />
                    <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-primary)]" />
                  </span>
                </span>

                <div>
                  <p className="landing-kicker text-[rgba(247,240,232,0.52)]">AgentMesh</p>
                  <p
                    className="mt-2 text-sm"
                    style={{
                      color: "#f7f0e8",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                    }}
                  >
                    Orchestrate agents without hiding the structure.
                  </p>
                </div>
              </div>

              <h2
                className="mt-8 max-w-[620px] text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.95] tracking-[-0.07em]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "#f7f0e8" }}
              >
                A sharper close for a product that deserves one.
              </h2>

              <p
                className="mt-5 max-w-[560px] text-base leading-7"
                style={{ color: "rgba(247,240,232,0.72)" }}
              >
                Use the landing page to position the orchestration layer, then move people
                directly into Mission Control, authentication, and the actual product surface.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "var(--landing-acid)",
                    color: "var(--landing-ink)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                  }}
                >
                  Open Mission Control
                </Link>
                <Link
                  href="/signup"
                  className="landing-chip-dark text-[11px] uppercase tracking-[0.24em] no-underline"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Create account
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6">
                <p className="landing-kicker text-[rgba(247,240,232,0.52)]">Primary routes</p>
                <div className="mt-6 space-y-3">
                  {PRIMARY_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center justify-between rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
                      style={{ color: "#f7f0e8", fontFamily: "var(--font-display)", fontWeight: 700 }}
                    >
                      <span>{label}</span>
                      <span
                        className="text-[11px] uppercase tracking-[0.24em]"
                        style={{ fontFamily: "var(--font-mono)", color: "rgba(247,240,232,0.42)" }}
                      >
                        open
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6">
                  <p className="landing-kicker text-[rgba(247,240,232,0.52)]">Access</p>
                  <div className="mt-6 space-y-3">
                    {SECONDARY_LINKS.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className="landing-chip-dark w-full justify-between text-[11px] uppercase tracking-[0.24em] no-underline"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        <span>{label}</span>
                        <span className="opacity-70">go</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6">
                  <p className="landing-kicker text-[rgba(247,240,232,0.52)]">System notes</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {FOOTER_NOTES.map((note) => (
                      <span
                        key={note}
                        className="landing-chip-dark text-[11px] uppercase tracking-[0.24em]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(255,255,255,0.08)] pt-6">
            <p
              className="text-sm"
              style={{ color: "rgba(247,240,232,0.62)", fontFamily: "var(--font-display)" }}
            >
              MCP-native orchestration with a cleaner landing rhythm and a more serious close.
            </p>
            <p
              className="landing-kicker text-[rgba(247,240,232,0.42)]"
              style={{ margin: 0 }}
            >
              AgentMesh / 2026
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
