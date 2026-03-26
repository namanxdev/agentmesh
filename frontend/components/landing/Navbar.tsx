"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";

const NAV_LINKS = [
  { href: "#features", label: "System" },
  { href: "#how-it-works", label: "Flow" },
  { href: "#tech-stack", label: "Compatibility" },
  { href: "#launch", label: "Launch" },
];

interface NavbarProps {
  initialSession: Session | null;
}

function getInitials(name?: string | null) {
  if (!name) return "GM";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "GM";
}

export function Navbar({ initialSession }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();
  const resolvedSession = session ?? initialSession;
  const user = resolvedSession?.user;

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

          {user ? (
            <>
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

              <Link
                href="/dashboard"
                className="landing-chip no-underline"
                style={{
                  gap: 10,
                  padding: "0.45rem 0.55rem 0.45rem 0.5rem",
                  color: "var(--text-primary)",
                }}
              >
                <span
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(23, 18, 15, 0.12)",
                    background: "rgba(23, 18, 15, 0.08)",
                    color: "var(--landing-ink)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                  }}
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name || "Google profile"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </span>
                <span className="hidden min-w-0 flex-col md:flex">
                  <span
                    className="text-[11px] uppercase tracking-[0.18em]"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
                  >
                    Signed in
                  </span>
                  <span
                    className="max-w-[180px] truncate text-sm"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
                  >
                    {user.name || user.email || "Google account"}
                  </span>
                </span>
              </Link>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="landing-chip text-xs uppercase tracking-[0.22em] transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="landing-chip text-xs uppercase tracking-[0.22em] no-underline transition-transform duration-300 hover:-translate-y-0.5"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  background: "var(--landing-ink)",
                  color: "var(--landing-paper)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  boxShadow: "0 18px 40px rgba(23, 18, 15, 0.18)",
                }}
              >
                Sign up
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
