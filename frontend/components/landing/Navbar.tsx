"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#products", label: "Products" },
  { href: "https://github.com/namanxdev/agentmesh", label: "GitHub", external: true },
];

interface NavbarProps {
  initialSession: Session | null;
}

export function Navbar({ initialSession }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const resolvedSession = session ?? initialSession;
  const user = resolvedSession?.user;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change / link click
  const closeMenu = () => setMenuOpen(false);

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-700"
      style={{
        borderBottom: scrolled || menuOpen ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        background: menuOpen ? "rgba(4,6,14,0.98)" : "transparent",
        backdropFilter: menuOpen ? "blur(12px)" : undefined,
      }}
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-5 flex items-center justify-between">

        {/* Wordmark */}
        <Link href="/" className="no-underline group" onClick={closeMenu}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "15px",
              letterSpacing: "0.06em",
              color: "rgba(240,244,255,0.9)",
              textTransform: "uppercase",
              transition: "color 0.2s",
            }}
            className="group-hover:text-[var(--accent-cyan)]"
          >
            AgentMesh
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map(({ href, label, external }) => (
            <a
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="no-underline transition-colors duration-200 hover:text-[var(--accent-cyan)]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(240,244,255,0.4)",
              }}
            >
              {label}
            </a>
          ))}

          {user ? (
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="no-underline transition-colors duration-200 hover:text-[var(--accent-cyan)]"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--accent-cyan)",
                }}
              >
                Dashboard
              </Link>
              <Link href="/settings" className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/10 transition-all hover:ring-white/30 bg-white/5">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || "User Avatar"} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-white uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                    {user?.name?.[0] || "U"}
                  </span>
                )}
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="no-underline transition-colors duration-200 hover:text-[var(--accent-cyan)]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--accent-cyan)",
              }}
            >
              Get Started ↗
            </Link>
          )}
        </div>

        {/* Mobile right: CTA + hamburger */}
        <div className="flex md:hidden items-center gap-4">
          {user ? (
            <Link href="/settings" className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/10 bg-white/5">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name || "User Avatar"} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-white uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                  {user?.name?.[0] || "U"}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="no-underline"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--accent-cyan)",
              }}
            >
              Get Started ↗
            </Link>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center justify-center w-8 h-8 text-white/60 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-white/[0.06] px-6 py-6 flex flex-col gap-5"
          >
            {NAV_LINKS.map(({ href, label, external }) => (
              <a
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                onClick={closeMenu}
                className="no-underline transition-colors duration-200 hover:text-[var(--accent-cyan)]"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(240,244,255,0.5)",
                }}
              >
                {label}
              </a>
            ))}
            {user && (
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className="no-underline"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--accent-cyan)",
                }}
              >
                Dashboard ↗
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
