import type { Metadata } from "next";
import { Outfit, Inter, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AgentMesh — MCP-Native Multi-Agent Orchestrator",
  description: "Orchestrate AI agents across MCP servers with real-time Mission Control dashboard.",
  icons: {
    icon: "/agentmesh_logo.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", outfit.variable, inter.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
