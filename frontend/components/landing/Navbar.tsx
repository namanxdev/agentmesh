"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#tech-stack", label: "Tech Stack" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        background: scrolled ? "hsl(225 25% 6% / 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          color: "var(--text-primary)",
          textDecoration: "none",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent-primary)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 900,
            color: "var(--bg-primary)",
          }}
        >
          A
        </span>
        AgentMesh
      </Link>

      {/* Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {NAV_LINKS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: 14,
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)"; }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/dashboard"
        style={{
          background: "var(--accent-primary)",
          color: "var(--bg-primary)",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 14,
          padding: "10px 24px",
          borderRadius: "var(--radius-full)",
          textDecoration: "none",
          transition: "all 0.2s ease",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Mission Control
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </nav>
  );
}
