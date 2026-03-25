import Link from "next/link";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "https://github.com", label: "GitHub", external: true },
];

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-primary)",
        borderTop: "1px solid var(--border-subtle)",
        padding: "40px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "var(--accent-primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 900,
              color: "var(--bg-primary)",
            }}
          >
            A
          </span>
          <span
            style={{
              color: "var(--text-tertiary)",
              fontSize: 14,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
            }}
          >
            AgentMesh
          </span>
          <span style={{ color: "var(--text-tertiary)", fontSize: 13, marginLeft: 8 }}>
            © {new Date().getFullYear()} — MIT License
          </span>
        </div>

        <nav style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {LINKS.map(({ href, label, external }) =>
            external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--text-tertiary)",
                  textDecoration: "none",
                  fontSize: 14,
                  transition: "color 0.2s",
                }}
              >
                {label}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                style={{
                  color: "var(--text-tertiary)",
                  textDecoration: "none",
                  fontSize: 14,
                  transition: "color 0.2s",
                }}
              >
                {label}
              </Link>
            )
          )}
        </nav>
      </div>
    </footer>
  );
}
