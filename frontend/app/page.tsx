import { auth } from "@/auth";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TechStack } from "@/components/landing/TechStack";
import { GitHubCTA } from "@/components/landing/GitHubCTA";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "AgentMesh - MCP-Native Multi-Agent Orchestrator",
  description:
    "Orchestrate AI agents that collaborate, hand off tasks, and execute in parallel through the Model Context Protocol.",
};

export default async function Home() {
  const session = await auth();

  return (
    <main className="landing-shell flex min-h-screen flex-col text-[var(--text-primary)]">
      <Navbar initialSession={session} />
      <HeroSection />
      <FeaturesBento />
      <HowItWorks />
      <TechStack />
      <GitHubCTA />
      <Footer />
    </main>
  );
}
