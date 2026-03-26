"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#features", label: "System" },
  { href: "#how-it-works", label: "Flow" },
  { href: "#tech-stack", label: "Compatibility" },
  { href: "#launch", label: "Launch" },
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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "px-3 pt-3" : "px-0 pt-0"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1400px] items-center justify-between gap-4 transition-all duration-500 ${
          scrolled
            ? "landing-panel rounded-full px-5 py-3 shadow-[0_18px_70px_rgba(23,18,15,0.14)]"
            : "px-5 py-4 md:px-8"
        }`}
      >
        <Link
          href="/"
          className="flex items-center gap-3 no-underline"
          style={{ color: "var(--text-primary)" }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.65)]">
            <span className="grid grid-cols-2 gap-[3px]">
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-primary)]" />
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--landing-acid)]" />
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--landing-ink)]" />
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-primary)]" />
            </span>
          </span>
          <span className="flex flex-col">
            <span
              className="text-sm uppercase tracking-[0.32em]"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
            >
              AgentMesh
            </span>
            <span
              className="text-[0.8rem]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Direct the agent system
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="landing-chip text-xs uppercase tracking-[0.22em] no-underline transition-transform duration-300 hover:-translate-y-0.5"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.45)] px-4 py-2 md:flex">
            <span
              className="landing-signal-dot h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--landing-acid)" }}
            />
            <span
              className="text-[11px] uppercase tracking-[0.28em]"
              style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
            >
              Live event fabric
            </span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
            style={{
              background: "var(--landing-ink)",
              color: "var(--landing-paper)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              boxShadow: "0 18px 40px rgba(23, 18, 15, 0.18)",
            }}
          >
            Open Mission Control
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3.5 8H12.5M8.5 4L12.5 8L8.5 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
