"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Monitor } from "lucide-react";

export function MobileWorkspaceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOverview = pathname === "/dashboard";

  if (isOverview) return <>{children}</>;

  return (
    <>
      <div className="hidden h-full md:block">{children}</div>
      <div className="flex h-full items-center justify-center px-6 md:hidden">
        <div className="max-w-sm border-l-2 border-indigo-500/70 py-1 pl-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 text-indigo-300">
            <Monitor className="h-4 w-4" />
          </div>
          <p className="app-eyebrow">Desktop workspace</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-neutral-100">Use a larger screen for this surface.</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">Pipeline editing, run inspection, registry management, and analytics are designed for a tablet or desktop workspace.</p>
          <Link href="/dashboard" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300 transition-colors hover:text-indigo-200">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to overview
          </Link>
        </div>
      </div>
    </>
  );
}
