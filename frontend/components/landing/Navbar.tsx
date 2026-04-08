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
    <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-2 sm:px-4">
      <div className="mx-auto max-w-[1440px]">
        <div
          className={`rounded-[26px] border border-[color:var(--border-default)] bg-[rgba(255,250,244,0.72)] backdrop-blur-xl transition-all duration-500 ${
            scrolled
              ? "shadow-[0_18px_56px_rgba(23,18,15,0.14)]"
              : "shadow-[0_14px_38px_rgba(23,18,15,0.08)]"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 md:px-5">
            <Link
              href="/"
              className="flex items-center gap-3 no-underline"
              style={{ color: "var(--text-primary)" }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.82)] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <span
                  className="rounded-full border border-[rgba(23,18,15,0.1)] px-2 py-1 text-[10px] uppercase tracking-[0.28em]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  AM
                </span>
              </span>
              <span className="flex flex-col">
                <span
                  className="text-[0.95rem] uppercase tracking-[-0.08em]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
                >
                  AgentMesh
                </span>
                <span
                  className="hidden text-[10px] uppercase tracking-[0.26em] lg:block"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
                >
                  Mission Control for MCP agents
                </span>
              </span>
            </Link>

            <div className="hidden flex-1 items-center justify-center px-6 xl:flex">
              <div className="flex items-center gap-1 rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.58)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]">
                {NAV_LINKS.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] no-underline transition-all duration-300 hover:-translate-y-0.5 hover:bg-[rgba(23,18,15,0.06)]"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.5)] px-3 py-2 md:flex">
                <span
                  className="landing-signal-dot h-2 w-2 rounded-full"
                  style={{ background: "var(--landing-acid)" }}
                />
                <span
                  className="text-[10px] uppercase tracking-[0.22em]"
                  style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                >
                  Live event fabric
                </span>
              </div>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
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
                    className="rounded-full border border-[color:var(--border-default)] bg-[rgba(255,255,255,0.58)] px-1 py-1 no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
                    style={{ color: "var(--text-primary)" }}
                  >
                      <span className="flex items-center gap-3 rounded-full pr-4">
                      <span
                        style={{
                          position: "relative",
                          display: "inline-flex",
                          width: 38,
                          height: 38,
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
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="landing-chip px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-transform duration-300 hover:-translate-y-0.5"
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
                    className="landing-chip px-4 py-2 text-[10px] uppercase tracking-[0.2em] no-underline transition-transform duration-300 hover:-translate-y-0.5"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm no-underline transition-transform duration-300 hover:-translate-y-0.5"
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

          <div className="flex gap-2 overflow-x-auto border-t border-[color:var(--border-subtle)] px-4 pb-2 pt-2 xl:hidden">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="landing-chip shrink-0 px-3 py-2 text-[10px] uppercase tracking-[0.22em] no-underline"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
