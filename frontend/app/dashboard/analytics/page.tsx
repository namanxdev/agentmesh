import { AnalyticsView } from "@/components/dashboard/AnalyticsView";

export const metadata = {
  title: "Analytics - AgentMesh",
  description: "Pipeline run analytics and performance metrics",
};

export default function AnalyticsPage() {
  return (
    <div className="h-full overflow-hidden">
      <AnalyticsView />
    </div>
  );
}
