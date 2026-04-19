import { auth } from "@/auth";
import { V2Layout } from "@/components/landing/V2Layout";

export const metadata = {
  title: "AgentMesh - MCP-Native Multi-Agent Orchestrator",
  description:
    "Orchestrate AI agents that collaborate, hand off tasks, and execute in parallel through the Model Context Protocol.",
};

export default async function Home() {
  const session = await auth();

  return (
    <main>
      <V2Layout session={session} />
    </main>
  );
}
