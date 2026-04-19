"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "https://github.com/namanxdev/agentmesh", label: "GitHub", external: true },
];

interface NavbarProps {
  initialSession: Session | null;
}

export function Navbar({ initialSession }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();
  const resolvedSession = session ?? initialSession;
  const user = resolvedSession?.user;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-700"
      style={{
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-5 flex items-center justify-between">

        {/* Wordmark — no icon, just text */}
        <Link href="/" className="no-underline group">
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

        {/* Right side — plain text links only */}
        <div className="flex items-center gap-8 md:gap-10">
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

          {/* CTA — text with arrow, no pill */}
          {user ? (
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
              Open App ↗
            </Link>
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
      </div>
    </motion.nav>
  );
}
