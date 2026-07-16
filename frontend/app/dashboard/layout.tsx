import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { DashboardEventProvider } from "@/components/dashboard/DashboardEventProvider";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Global event stream — runs across all dashboard routes */}
      <DashboardEventProvider />

      {/* Left sidebar */}
      <DashboardSidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardTopBar />
        {/* Children control their own overflow/scroll */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
