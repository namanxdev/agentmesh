import { PipelineWorkbench } from "@/components/dashboard/DashboardLayout";

export const metadata = {
  title: "Pipelines - AgentMesh",
  description: "Visual pipeline builder and real-time multi-agent workflow editor",
};

/**
 * Pipeline editor page.
 * PipelineWorkbench fills the full available height (h-full) provided by the
 * dashboard shell layout, with no page-level scroll.
 */
export default function PipelinesPage() {
  return <PipelineWorkbench />;
}
