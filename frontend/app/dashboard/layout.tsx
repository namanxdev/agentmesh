import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { DashboardEventProvider } from "@/components/dashboard/DashboardEventProvider";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { MobileWorkspaceGuard } from "@/components/dashboard/MobileWorkspaceGuard";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-app flex h-screen w-screen overflow-hidden">
      {/* Global event stream — runs across all dashboard routes */}
      <DashboardEventProvider />

      {/* Left sidebar */}
      <DashboardSidebar />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardTopBar />
        <MobileDashboardNav />
        {/* Children control their own overflow/scroll */}
        <main className="min-h-0 flex-1 overflow-hidden">
          <MobileWorkspaceGuard>{children}</MobileWorkspaceGuard>
        </main>
      </div>
    </div>
  );
}
