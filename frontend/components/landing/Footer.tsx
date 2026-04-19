import Link from "next/link";

const LINKS = [
  { label: "GitHub", href: "https://github.com/namanxdev/agentmesh", external: true },
  { label: "Dashboard", href: "/dashboard" },
  { label: "How it works", href: "#how-it-works" },
];

export function Footer() {
  return (
    <footer
      style={{
        background: "transparent",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Wordmark */}
        <Link href="/" className="no-underline group">
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "13px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(240,244,255,0.35)",
              transition: "color 0.2s",
            }}
            className="group-hover:text-[var(--accent-cyan)]"
          >
            AgentMesh
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6 md:gap-8">
          {LINKS.map(({ label, href, external }) => (
            <a
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="no-underline transition-colors duration-200 hover:text-[var(--accent-cyan)]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(240,244,255,0.25)",
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right label */}
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(240,244,255,0.18)",
          }}
        >
          FastAPI + Next.js · Open Source
        </p>
      </div>
    </footer>
  );
}
