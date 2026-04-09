import Link from "next/link";

const STATUS_ITEMS = [
  { label: "Event bus", value: "live" },
  { label: "MCP fabric", value: "connected" },
  { label: "Human gates", value: "inline" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0c0a09] pt-28 pb-8 sm:pt-36">
      <div className="mx-auto max-w-[1440px] px-5 md:px-8 relative z-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="flex items-center gap-4 group cursor-default">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-colors group-hover:bg-[rgba(255,255,255,0.1)]">
                <span
                  className="text-[14px] font-bold tracking-[0.1em]"
                  style={{ fontFamily: "var(--font-mono)", color: "#f7f0e8" }}
                >
                  AM
                </span>
              </span>
              <div>
                <p
                  className="text-[1.3rem] leading-none tracking-[-0.04em] text-[#f7f0e8]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                  }}
                >
                  AgentMesh
                </p>
                <p
                  className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-[rgba(247,240,232,0.4)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Orchestration Layer
                </p>
              </div>
            </div>

            <p
              className="mt-8 max-w-[400px] text-base leading-7 text-[rgba(247,240,232,0.65)]"
            >
              The MCP-native orchestration engine for teams building production AI workflows. Direct multi-agent runs, inject human safety gates, and watch your logic execute live.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://github.com/agentmesh/agentmesh"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)] px-6 py-4 text-[13px] font-semibold text-[#f7f0e8] no-underline transition-all hover:-translate-y-1 hover:bg-[rgba(255,255,255,0.1)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Star on GitHub
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full px-7 py-4 text-[13px] no-underline transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(232,93,42,0.4)]"
                style={{
                  background: "var(--accent-primary)",
                  color: "#ffffff",
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                }}
              >
                Mission Control
              </Link>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-start-7 lg:col-span-6 mt-12 lg:mt-0">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[rgba(247,240,232,0.4)]" style={{ fontFamily: 'var(--font-mono)' }}>Product</p>
              <ul className="mt-8 flex flex-col gap-4 p-0 m-0" style={{ listStyle: "none" }}>
                <li><Link href="#features" className="text-[15px] no-underline transition-colors hover:text-[color:var(--landing-acid)] text-[#f7f0e8] font-medium">Features</Link></li>
                <li><Link href="#how-it-works" className="text-[15px] no-underline transition-colors hover:text-[color:var(--landing-acid)] text-[#f7f0e8] font-medium">Architecture</Link></li>
                <li><Link href="/dashboard" className="text-[15px] no-underline transition-colors hover:text-[color:var(--landing-acid)] text-[#f7f0e8] font-medium">Mission Control</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[rgba(247,240,232,0.4)]" style={{ fontFamily: 'var(--font-mono)' }}>Open Source</p>
              <ul className="mt-8 flex flex-col gap-4 p-0 m-0" style={{ listStyle: "none" }}>
                <li><a href="https://github.com/agentmesh/agentmesh" target="_blank" rel="noreferrer" className="text-[15px] flex items-center gap-2 no-underline transition-colors hover:text-[color:var(--landing-acid)] text-[#f7f0e8] font-medium">Source Code</a></li>
                <li><a href="https://github.com/agentmesh/agentmesh/issues" target="_blank" rel="noreferrer" className="text-[15px] flex items-center gap-2 no-underline transition-colors hover:text-[color:var(--landing-acid)] text-[#f7f0e8] font-medium">Issue Tracker</a></li>
                <li><a href="https://github.com/agentmesh/agentmesh/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="text-[15px] flex items-center gap-2 no-underline transition-colors hover:text-[color:var(--landing-acid)] text-[#f7f0e8] font-medium">Contribute</a></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[rgba(247,240,232,0.4)]" style={{ fontFamily: 'var(--font-mono)' }}>Company</p>
              <ul className="mt-8 flex flex-col gap-4 p-0 m-0" style={{ listStyle: "none" }}>
                <li><a href="mailto:contribute@agentmesh.com" className="text-[15px] flex items-center gap-2 no-underline transition-colors hover:text-[color:var(--landing-acid)] text-[#f7f0e8] font-medium">Email Us</a></li>
                <li><a href="#" className="text-[15px] flex items-center gap-2 no-underline transition-colors hover:text-[color:var(--landing-acid)] text-[#f7f0e8] font-medium">Support</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-28 flex flex-col items-center justify-between gap-6 border-t border-[rgba(255,255,255,0.06)] pt-10 md:flex-row pb-6">
          <div className="flex flex-wrap gap-4">
            {STATUS_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-2.5 transition-colors hover:bg-[rgba(255,255,255,0.06)] cursor-default"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--landing-acid)", boxShadow: "0 0 10px var(--landing-acid)" }} />
                <span
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: "rgba(247,240,232,0.6)", fontFamily: "var(--font-mono)" }}
                >
                  <span className="font-semibold text-white mr-2">{item.label}:</span>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <p
            className="text-[13px] text-[rgba(247,240,232,0.4)] z-10"
          >
            © {new Date().getFullYear()} AgentMesh Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* Massive Awwwards Footer Brand Typography */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden flex justify-center opacity-[0.03] select-none pointer-events-none translate-y-1/4">
        <span 
          className="text-[25vw] leading-[0.75] tracking-tighter whitespace-nowrap block" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: "#f7f0e8" }}
        >
          AGENTMESH
        </span>
      </div>
    </footer>
  );
}
