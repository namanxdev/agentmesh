"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  GitBranch,
  Play,
  Server,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Command,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/pipelines", label: "Pipelines", icon: GitBranch, exact: false },
  { href: "/dashboard/runs", label: "Runs", icon: Play, exact: false },
  { href: "/dashboard/mcp", label: "MCP Registry", icon: Server, exact: false },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2, exact: false },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={`relative hidden h-screen shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 transition-[width] duration-150 ease-out md:flex ${
        collapsed ? "w-[60px]" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-neutral-800 px-3.5">
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-neutral-800 bg-neutral-900">
          <Image
            src="/agentmesh_logo.png"
            alt="AgentMesh"
            width={28}
            height={28}
            className="object-contain"
          />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-tight text-neutral-100">
            AgentMesh
          </span>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Primary navigation" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-4">
        {!collapsed && <span className="mb-1 px-2 text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-neutral-600">Workspace</span>}
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-indigo-500/15 text-indigo-200"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "text-indigo-400" : "text-neutral-500"}`}
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings + Collapse toggle */}
      <div className="flex shrink-0 flex-col gap-1 border-t border-neutral-800 px-2.5 py-3">
        {!collapsed && (
          <div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-mono text-neutral-600">
            <Command className="h-3 w-3" /> LOCAL CONTROL PLANE
          </div>
        )}
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className="flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
        >
          <Settings className="w-4 h-4 shrink-0 text-neutral-500" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex min-h-9 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
