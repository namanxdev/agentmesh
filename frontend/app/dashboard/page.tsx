import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DEMO_WORKFLOWS } from "@/lib/demoWorkflows";

// Default to github-code-review workflow for demo
const workflow = DEMO_WORKFLOWS["github-code-review"];

export const metadata = {
  title: "Mission Control — AgentMesh",
  description: "Real-time multi-agent workflow monitoring",
};

export default function DashboardPage() {
  return (
    <DashboardLayout
      agentNames={workflow.agents}
      edges={workflow.edges}
    />
  );
}
