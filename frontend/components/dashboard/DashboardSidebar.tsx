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
      className={`relative flex flex-col shrink-0 h-screen bg-neutral-950 border-r border-neutral-800 transition-all duration-200 ${
        collapsed ? "w-14" : "w-52"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-neutral-800 shrink-0">
        <div className="relative w-7 h-7 rounded-md overflow-hidden shrink-0">
          <Image
            src="/agentmesh_logo.png"
            alt="AgentMesh"
            width={28}
            height={28}
            className="object-contain"
          />
        </div>
        {!collapsed && (
          <span className="font-semibold text-neutral-200 text-sm tracking-tight truncate">
            AgentMesh
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2 py-3 flex-1 min-h-0 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 border border-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${active ? "text-indigo-400" : "text-neutral-500"}`}
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings + Collapse toggle */}
      <div className="flex flex-col gap-0.5 px-2 py-3 border-t border-neutral-800 shrink-0">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 border border-transparent transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0 text-neutral-500" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium text-neutral-500 hover:text-neutral-100 hover:bg-neutral-900 border border-transparent transition-colors w-full"
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
