import { RunsPage } from "@/components/runs/RunsPage";

export const metadata = {
  title: "Runs - AgentMesh",
  description: "Pipeline run history and execution logs",
};

export default function RunsPageRoute() {
  return <RunsPage />;
}
