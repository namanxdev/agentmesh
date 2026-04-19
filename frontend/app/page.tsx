import { auth } from "@/auth";

import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { MissionControl } from "@/components/landing/MissionControl";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TechStack } from "@/components/landing/TechStack";
import { GitHubCTA } from "@/components/landing/GitHubCTA";
import { Footer } from "@/components/landing/Footer";
import { GlobalMesh } from "@/components/ui/GlobalMesh";

export const metadata = {
  title: "AgentMesh - MCP-Native Multi-Agent Orchestrator",
  description:
    "Orchestrate AI agents that collaborate, hand off tasks, and execute in parallel through the Model Context Protocol.",
};

export default async function Home() {
  const session = await auth();

  return (
    <main className="landing-dark-shell flex min-h-screen flex-col relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <GlobalMesh />
      </div>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.25] mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'256\' height=\'256\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'256\' height=\'256\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />
      <Navbar initialSession={session} />
      <HeroSection />
      <div className="relative z-10 flex flex-col bg-transparent">
        <SocialProof />
        <FeaturesBento />
        <MissionControl />
        <HowItWorks />
        <TechStack />
        <GitHubCTA />
        <Footer />
      </div>
    </main>
  );
}
