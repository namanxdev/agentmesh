import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthShellProps {
  pageLabel: string;
  title: string;
  description: string;
  cardLabel: string;
  cardTitle: string;
  cardDescription: string;
  alternateText: string;
  alternateHref: string;
  alternateLabel: string;
  children: React.ReactNode;
}

const HIGHLIGHTS = [
  "Live run visibility",
  "Typed event stream",
  "Tooling through MCP",
];

export function AuthShell({
  pageLabel,
  title,
  description,
  cardLabel,
  cardTitle,
  cardDescription,
  alternateText,
  alternateHref,
  alternateLabel,
  children,
}: AuthShellProps) {
  return (
    <main className="auth-shell flex items-center justify-center px-5 py-10 md:px-8">
      <div className="grid w-full max-w-[1400px] gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        {/* Global Back Button */}
        <div className="lg:col-span-2 flex items-center">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-white/80 hover:text-white transition-colors"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/15 bg-white/[0.08] group-hover:bg-white/15 group-hover:border-white/30 transition-all shadow-sm">
              <ArrowLeft className="w-4 h-4 text-white/80 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
            </span>
            <span className="font-semibold">Back</span>
          </Link>
        </div>
        <section className="space-y-8">
          <div className="dashboard-chip w-fit text-[11px] uppercase tracking-[0.28em]" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent-secondary)" }} />
            {pageLabel}
          </div>

          <div className="max-w-[720px]">
            <p className="dashboard-kicker">AgentMesh access</p>
            <h1
              className="mt-5 text-[clamp(3rem,8vw,6.8rem)] leading-[0.9] tracking-[-0.08em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "var(--text-primary)" }}
            >
              {title}
            </h1>
            <p className="mt-6 max-w-[560px] text-lg leading-8" style={{ color: "var(--text-secondary)" }}>
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {HIGHLIGHTS.map((item) => (
              <span
                key={item}
                className="dashboard-chip text-[11px] uppercase tracking-[0.24em]"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
              >
                {item}
              </span>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
            <div className="auth-card rounded-[30px] p-6">
              <p className="dashboard-kicker">Control room preview</p>
              <div className="mt-5 grid gap-4">
                <div className="auth-soft-card rounded-[24px] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="dashboard-kicker">Active route</p>
                      <p className="mt-2 text-lg tracking-[-0.03em]" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                        {"review -> tools -> synthesis"}
                      </p>
                    </div>
                    <span className="dashboard-chip text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--accent-secondary)", fontFamily: "var(--font-mono)" }}>
                      live
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "agents", value: "4" },
                    { label: "tool calls", value: "12" },
                    { label: "approvals", value: "2" },
                  ].map((item) => (
                    <div key={item.label} className="auth-soft-card rounded-[22px] p-4">
                      <p className="dashboard-kicker">{item.label}</p>
                      <p
                        className="mt-3 text-3xl leading-none tracking-[-0.06em]"
                        style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 800 }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="auth-soft-card rounded-[30px] p-5">
              <p className="dashboard-kicker">What you get</p>
              <div className="mt-5 space-y-3">
                {[
                  "A workflow surface that stays readable during branching.",
                  "One-click access to Mission Control after sign-in.",
                  "A consistent visual system across landing, auth, and product screens.",
                ].map((item) => (
                  <div key={item} className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card rounded-[34px] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
              <span className="grid grid-cols-2 gap-[3px]">
                <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-primary)]" />
                <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-secondary)]" />
                <span className="h-[5px] w-[5px] rounded-full bg-[var(--text-primary)]" />
                <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-primary)]" />
              </span>
            </span>
            <div>
              <p className="dashboard-kicker">{cardLabel}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                AgentMesh account flow
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2
              className="text-[2.2rem] leading-tight tracking-[-0.05em]"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 800 }}
            >
              {cardTitle}
            </h2>
            <p className="mt-4 text-[15px] leading-7" style={{ color: "var(--text-secondary)" }}>
              {cardDescription}
            </p>
          </div>

          <div className="mt-8">{children}</div>

          <div className="mt-8 border-t border-[rgba(255,255,255,0.08)] pt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            {alternateText}{" "}
            <Link href={alternateHref} className="no-underline" style={{ color: "var(--accent-secondary)", fontWeight: 700 }}>
              {alternateLabel}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
