"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#tech-stack", label: "Tech stack" },
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
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-in-out ${
        scrolled ? "bg-[rgba(250,245,239,0.92)] backdrop-blur-2xl border-b border-[color:var(--border-subtle)] shadow-[0_4px_30px_rgba(23,18,15,0.04)] py-4" : "bg-transparent py-6"
    }`}>
      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 no-underline group"
              style={{ color: "var(--text-primary)" }}
            >
              <span className="text-[1.4rem] tracking-[-0.04em] uppercase transition-colors group-hover:text-[var(--accent-primary)]" style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}>AgentMesh</span>
            </Link>

            <div className="hidden flex-1 items-center justify-center gap-10 xl:flex">
                {NAV_LINKS.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="text-[11px] uppercase tracking-[0.22em] font-semibold transition-colors hover:text-[color:var(--accent-primary)]"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    {label}
                  </a>
                ))}
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="hidden items-center gap-3 rounded-full border border-[color:var(--border-default)] bg-white px-4 py-2 md:flex shadow-sm hover:shadow-md transition-shadow cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--landing-acid)" }}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--landing-acid)", boxShadow: "0 0 8px var(--landing-acid)" }}></span>
                </span>
                <span
                  className="text-[10px] uppercase tracking-[0.24em] font-bold"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                >
                  Live Connection
                </span>
              </div>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden lg:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm no-underline transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: "var(--landing-ink)",
                      color: "var(--landing-paper)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                    }}
                  >
                    Open Console
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
                    className="rounded-full border border-[color:var(--border-default)] bg-white px-1.5 py-1.5 no-underline shadow-[0_2px_10px_rgba(23,18,15,0.04)]"
                    style={{ color: "var(--text-primary)" }}
                  >
                      <span className="flex items-center gap-3 rounded-full pr-4">
                      <span
                        style={{
                          position: "relative",
                          display: "inline-flex",
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          overflow: "hidden",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(23, 18, 15, 0.12)",
                          background: "var(--landing-ink)",
                          color: "white",
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
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
                          className="text-[9px] uppercase tracking-[0.2em]"
                          style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
                        >
                          Dashboard
                        </span>
                        <span
                          className="max-w-[120px] truncate text-[13px]"
                          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
                        >
                          {user.name || user.email || "Log in"}
                        </span>
                      </span>
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="landing-chip px-3 py-2 border-transparent bg-transparent text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors hover:text-[color:var(--accent-primary)] hover:-translate-y-0"
                    style={{
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="landing-chip px-4 py-2 text-[10px] uppercase tracking-[0.2em] no-underline bg-transparent border-transparent font-semibold transition-colors hover:text-[color:var(--accent-primary)] hover:-translate-y-0"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(23,18,15,0.12)]"
                    style={{
                      background: "var(--landing-ink)",
                      color: "var(--landing-paper)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
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
      </div>
    </nav>
  );
}
