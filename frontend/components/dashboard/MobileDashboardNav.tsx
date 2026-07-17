"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, GitBranch, LayoutDashboard, Play, Server, Settings } from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/pipelines", label: "Pipelines", icon: GitBranch, exact: false },
  { href: "/dashboard/runs", label: "Runs", icon: Play, exact: false },
  { href: "/dashboard/mcp", label: "MCP", icon: Server, exact: false },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2, exact: false },
  { href: "/settings", label: "Settings", icon: Settings, exact: true },
] as const;

export function MobileDashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobile navigation" className="mobile-dashboard-nav flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-800 bg-neutral-950 px-3 py-2 md:hidden">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${active ? "bg-indigo-500/15 text-indigo-200" : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"}`}
          >
            <Icon className={`h-3.5 w-3.5 ${active ? "text-indigo-400" : "text-neutral-600"}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
