# Frontend Foundation & Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install deps, set up the design system, and build the full AgentMesh landing/marketing page.

**Architecture:** Server-rendered Next.js 16 App Router page that imports client components for animations. Framer Motion for scroll-driven reveals. All design tokens from DESIGN.md live in `globals.css` as CSS custom properties.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Framer Motion, Zustand, clsx, tailwind-merge, TypeScript

---

## File Structure

**Create:**
- `frontend/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `frontend/lib/motion.ts` — Framer Motion animation presets
- `frontend/lib/demoWorkflows.ts` — demo workflow configs (agent names + edges) shared with dashboard
- `frontend/types/events.ts` — AgentMeshEvent union type + AgentStatus
- `frontend/types/agents.ts` — Agent, TokenUsage, AGENT_COLORS, getAgentColor
- `frontend/types/workflows.ts` — WorkflowDefinition, WorkflowRun, WorkflowStatus
- `frontend/components/ui/GlassPanel.tsx` — glassmorphism container
- `frontend/components/ui/StatusDot.tsx` — pulsing status indicator dot
- `frontend/components/ui/GradientText.tsx` — cyan→violet gradient text
- `frontend/components/ui/Button.tsx` — primary/ghost/outline button variants
- `frontend/components/ui/Badge.tsx` — small label badge
- `frontend/components/ui/SectionNumber.tsx` — faded large section number (STR8FIRE style)
- `frontend/components/ui/ScrollReveal.tsx` — scroll-triggered fade+slide reveal
- `frontend/components/ui/AnimatedCounter.tsx` — counting-up number animation
- `frontend/components/landing/Navbar.tsx` — sticky nav with logo + links + CTA
- `frontend/components/landing/HeroSection.tsx` — full-viewport hero with headline + CTAs
- `frontend/components/landing/FeaturesBento.tsx` — bento grid of 5 feature cards
- `frontend/components/landing/HowItWorks.tsx` — numbered steps section
- `frontend/components/landing/TechStack.tsx` — tech stack icon grid
- `frontend/components/landing/GitHubCTA.tsx` — GitHub clone CTA section
- `frontend/components/landing/Footer.tsx` — simple footer

**Modify:**
- `frontend/app/globals.css` — full design token system
- `frontend/app/layout.tsx` — Outfit/Inter/JetBrains Mono fonts + dark theme metadata
- `frontend/app/page.tsx` — compose all landing sections

---

### Task 1: Install dependencies + update design foundation

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/app/layout.tsx`
- Create: `frontend/lib/utils.ts`
- Create: `frontend/lib/motion.ts`

- [ ] **Step 1: Install dependencies**

Run from the `frontend/` directory:
```bash
cd frontend && npm install framer-motion zustand clsx tailwind-merge
```
Expected: packages added to node_modules, package-lock.json updated.

- [ ] **Step 2: Replace globals.css with full design token system**

Write `frontend/app/globals.css`:
```css
@import "tailwindcss";

/* ── Design Tokens ── */
:root {
  /* Background layers */
  --bg-primary:         hsl(225, 25%, 6%);
  --bg-secondary:       hsl(225, 20%, 10%);
  --bg-tertiary:        hsl(225, 18%, 14%);
  --bg-hover:           hsl(225, 15%, 18%);

  /* Accent — Electric Cyan */
  --accent-primary:     hsl(185, 100%, 50%);
  --accent-glow:        hsl(185deg 100% 50% / 0.15);
  --accent-muted:       hsl(185, 60%, 35%);

  /* Secondary Accent — Violet */
  --accent-secondary:   hsl(270, 85%, 65%);
  --accent-secondary-glow: hsl(270deg 85% 65% / 0.15);

  /* Status Colors */
  --status-active:      hsl(142, 71%, 45%);
  --status-idle:        hsl(220, 15%, 45%);
  --status-error:       hsl(0, 84%, 60%);
  --status-warning:     hsl(38, 92%, 50%);
  --status-thinking:    hsl(45, 100%, 60%);

  /* Text */
  --text-primary:       hsl(0, 0%, 95%);
  --text-secondary:     hsl(220, 15%, 65%);
  --text-tertiary:      hsl(220, 10%, 45%);
  --text-accent:        var(--accent-primary);

  /* Borders */
  --border-subtle:      hsl(225, 15%, 18%);
  --border-default:     hsl(225, 12%, 25%);
  --border-accent:      var(--accent-primary);

  /* Gradients */
  --gradient-hero:      linear-gradient(135deg, hsl(225, 25%, 6%) 0%, hsl(250, 30%, 12%) 50%, hsl(225, 25%, 6%) 100%);
  --gradient-card:      linear-gradient(180deg, hsl(225, 20%, 12%) 0%, hsl(225, 20%, 8%) 100%);
  --gradient-accent:    linear-gradient(135deg, hsl(185, 100%, 50%) 0%, hsl(270, 85%, 65%) 100%);

  /* Agent Identity Colors */
  --agent-color-1: hsl(185, 100%, 50%);
  --agent-color-2: hsl(270, 85%, 65%);
  --agent-color-3: hsl(142, 71%, 45%);
  --agent-color-4: hsl(330, 80%, 60%);
  --agent-color-5: hsl(38, 92%, 50%);
  --agent-color-6: hsl(200, 90%, 55%);
  --agent-color-7: hsl(15, 85%, 55%);
  --agent-color-8: hsl(160, 60%, 45%);

  /* Typography — set after Next.js font variables are injected */
  --font-display: var(--font-outfit, 'Outfit', -apple-system, sans-serif);
  --font-body:    var(--font-inter, 'Inter', -apple-system, sans-serif);
  --font-mono:    var(--font-jetbrains-mono, 'JetBrains Mono', monospace);

  /* Border Radius */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;

  /* Easing */
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

@theme inline {
  --font-sans: var(--font-outfit);
  --font-mono: var(--font-jetbrains-mono);
  --color-background: var(--bg-primary);
  --color-foreground: var(--text-primary);
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  50%       { box-shadow: 0 0 0 6px transparent; opacity: 0.8; }
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
```

- [ ] **Step 3: Update layout.tsx with Outfit/Inter/JetBrains Mono fonts**

Write `frontend/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Outfit, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create lib/utils.ts**

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Create lib/motion.ts**

```ts
import type { Variants } from "framer-motion";

export const motionDefaults = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
};
```

- [ ] **Step 6: Verify dev server starts**

```bash
cd frontend && npm run dev
```
Expected: server starts on http://localhost:3000 with a blank dark page (no errors). Ctrl+C to stop.

- [ ] **Step 7: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: install deps and set up design system foundation"
```

---

### Task 2: Create TypeScript type definitions

**Files:**
- Create: `frontend/types/events.ts`
- Create: `frontend/types/agents.ts`
- Create: `frontend/types/workflows.ts`
- Create: `frontend/lib/demoWorkflows.ts`

- [ ] **Step 1: Create types/events.ts**

```ts
export type AgentStatus = "idle" | "active" | "thinking" | "completed" | "error";

export interface BaseEvent {
  id: string;
  type: string;
  timestamp: number;
  workflow_id: string;
}

export interface WorkflowStartedEvent extends BaseEvent {
  type: "workflow.started";
  agents: string[];
  task: string;
}

export interface WorkflowCompletedEvent extends BaseEvent {
  type: "workflow.completed";
  result: Record<string, unknown>;
  totalTokens: number;
  duration: number;
}

export interface WorkflowErrorEvent extends BaseEvent {
  type: "workflow.error";
  error: string;
  failedAgent: string;
}

export interface AgentActivatedEvent extends BaseEvent {
  type: "agent.activated";
  agentName: string;
  role: string;
  taskDescription: string;
}

export interface AgentThinkingEvent extends BaseEvent {
  type: "agent.thinking";
  agentName: string;
  partialResponse: string;
}

export interface AgentCompletedEvent extends BaseEvent {
  type: "agent.completed";
  agentName: string;
  output: string;
  tokenUsage: { input: number; output: number };
}

export interface AgentHandoffEvent extends BaseEvent {
  type: "agent.handoff";
  from: string;
  to: string;
  reason: string;
}

export interface ToolCalledEvent extends BaseEvent {
  type: "tool.called";
  agentName: string;
  server: string;
  tool: string;
  args: Record<string, unknown>;
}

export interface ToolResultEvent extends BaseEvent {
  type: "tool.result";
  agentName: string;
  server: string;
  tool: string;
  result: Record<string, unknown>;
  duration_ms: number;
}

export interface ToolErrorEvent extends BaseEvent {
  type: "tool.error";
  agentName: string;
  server: string;
  tool: string;
  error: string;
}

export interface TokenUsageEvent extends BaseEvent {
  type: "token.usage";
  agentName: string;
  input: number;
  output: number;
  total: number;
}

export type AgentMeshEvent =
  | WorkflowStartedEvent
  | WorkflowCompletedEvent
  | WorkflowErrorEvent
  | AgentActivatedEvent
  | AgentThinkingEvent
  | AgentCompletedEvent
  | AgentHandoffEvent
  | ToolCalledEvent
  | ToolResultEvent
  | ToolErrorEvent
  | TokenUsageEvent;
```

- [ ] **Step 2: Create types/agents.ts**

```ts
export type AgentStatus = "idle" | "active" | "thinking" | "completed" | "error";

export interface TokenUsage {
  input: number;
  output: number;
}

export interface Agent {
  name: string;
  role: string;
  status: AgentStatus;
  model: string;
  mcp_servers: string[];
  available_tools: string[];
  current_task?: string;
  token_usage_total: TokenUsage;
}

export const AGENT_COLORS = [
  "hsl(185, 100%, 50%)",
  "hsl(270, 85%, 65%)",
  "hsl(142, 71%, 45%)",
  "hsl(330, 80%, 60%)",
  "hsl(38, 92%, 50%)",
  "hsl(200, 90%, 55%)",
  "hsl(15, 85%, 55%)",
  "hsl(160, 60%, 45%)",
] as const;

export function getAgentColor(index: number): string {
  return AGENT_COLORS[index % AGENT_COLORS.length];
}
```

- [ ] **Step 3: Create types/workflows.ts**

```ts
export type WorkflowStatus = "idle" | "running" | "completed" | "error";

export interface WorkflowDefinition {
  name: string;
  description: string;
  agents: string[];
  estimated_duration: string;
}

export interface WorkflowProgress {
  completed_agents: string[];
  active_agent: string | null;
  remaining_agents: string[];
}

export interface WorkflowRun {
  workflow_id: string;
  status: WorkflowStatus;
  workflow_name?: string;
  current_agent?: string;
  progress?: WorkflowProgress;
  token_usage?: Record<string, { input: number; output: number }>;
  elapsed_seconds?: number;
  result?: Record<string, unknown>;
  total_tokens?: number;
  duration_seconds?: number;
  completed_at?: string;
  started_at?: string;
}
```

- [ ] **Step 4: Create lib/demoWorkflows.ts**

```ts
export interface WorkflowConfig {
  name: string;
  description: string;
  agents: string[];
  edges: Array<{ from: string; to: string }>;
}

export const DEMO_WORKFLOWS: Record<string, WorkflowConfig> = {
  "github-code-review": {
    name: "github-code-review",
    description: "Multi-agent code review pipeline",
    agents: ["Fetcher", "Reviewer", "SecurityScanner", "Summarizer"],
    edges: [
      { from: "Fetcher", to: "Reviewer" },
      { from: "Reviewer", to: "SecurityScanner" },
      { from: "SecurityScanner", to: "Summarizer" },
    ],
  },
  "research-synthesis": {
    name: "research-synthesis",
    description: "Web research + synthesis pipeline",
    agents: ["Searcher", "Extractor", "Analyst", "Writer"],
    edges: [
      { from: "Searcher", to: "Extractor" },
      { from: "Extractor", to: "Analyst" },
      { from: "Analyst", to: "Writer" },
    ],
  },
};
```

- [ ] **Step 5: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add TypeScript type definitions and demo workflow configs"
```

---

### Task 3: Create shared UI primitives

**Files:**
- Create: `frontend/components/ui/GlassPanel.tsx`
- Create: `frontend/components/ui/StatusDot.tsx`
- Create: `frontend/components/ui/GradientText.tsx`
- Create: `frontend/components/ui/Button.tsx`
- Create: `frontend/components/ui/Badge.tsx`
- Create: `frontend/components/ui/SectionNumber.tsx`
- Create: `frontend/components/ui/ScrollReveal.tsx`
- Create: `frontend/components/ui/AnimatedCounter.tsx`

- [ ] **Step 1: Create components/ui/GlassPanel.tsx**

```tsx
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassPanel({ children, className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(className)}
      style={{
        background: "hsl(225 20% 10% / 0.6)",
        backdropFilter: "blur(20px) saturate(150%)",
        WebkitBackdropFilter: "blur(20px) saturate(150%)",
        border: "1px solid hsl(225 15% 20% / 0.4)",
        borderRadius: "var(--radius-lg)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create components/ui/StatusDot.tsx**

```tsx
import type { AgentStatus } from "@/types/agents";

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle:      "var(--status-idle)",
  active:    "var(--status-active)",
  thinking:  "var(--status-thinking)",
  completed: "var(--accent-primary)",
  error:     "var(--status-error)",
};

const PULSING: Set<AgentStatus> = new Set(["active", "thinking", "error"]);

interface StatusDotProps {
  status: AgentStatus;
  size?: number;
}

export function StatusDot({ status, size = 8 }: StatusDotProps) {
  return (
    <span
      role="img"
      aria-label={status}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: STATUS_COLORS[status],
        animation: PULSING.has(status) ? "pulse 2s infinite" : "none",
        flexShrink: 0,
      }}
    />
  );
}
```

- [ ] **Step 3: Create components/ui/GradientText.tsx**

```tsx
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientText({ children, className }: GradientTextProps) {
  return (
    <span
      className={cn(className)}
      style={{
        background: "var(--gradient-accent)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Create components/ui/Button.tsx**

```tsx
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
  asChild?: boolean;
}

const STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "var(--accent-primary)",
    color: "var(--bg-primary)",
    border: "none",
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: "var(--radius-full)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-default)",
    fontFamily: "var(--font-display)",
    fontWeight: 500,
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: "var(--radius-full)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  outline: {
    background: "transparent",
    color: "var(--accent-primary)",
    border: "1px solid var(--accent-primary)",
    fontFamily: "var(--font-display)",
    fontWeight: 500,
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: "var(--radius-full)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};

export function Button({ variant = "primary", children, className, style, ...props }: ButtonProps) {
  return (
    <button
      className={cn("inline-flex items-center justify-center gap-2 hover:-translate-y-px", className)}
      style={{ ...STYLES[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 5: Create components/ui/Badge.tsx**

```tsx
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = "var(--accent-primary)", className }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full", className)}
      style={{
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
        color,
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 6: Create components/ui/SectionNumber.tsx**

```tsx
interface SectionNumberProps {
  num: string;
}

export function SectionNumber({ num }: SectionNumberProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(80px, 10vw, 120px)",
        fontWeight: 900,
        color: "hsl(225, 15%, 12%)",
        lineHeight: 1,
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {num}
    </span>
  );
}
```

- [ ] **Step 7: Create components/ui/ScrollReveal.tsx**

```tsx
"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}

export function ScrollReveal({ children, className, delay = 0, direction = "up" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const initialY = direction === "up" ? 30 : direction === "none" ? 0 : 0;
  const initialX = direction === "left" ? -30 : direction === "right" ? 30 : 0;

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial={{ opacity: 0, y: initialY, x: initialX }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 8: Create components/ui/AnimatedCounter.tsx**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({
  target,
  duration = 1.5,
  suffix = "",
  prefix = "",
  className,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const startTime = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const update = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      setCount(Math.floor(easeOut(progress) * target));
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className={cn(className)}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
```

- [ ] **Step 9: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add shared UI primitives (GlassPanel, StatusDot, GradientText, Button, Badge, SectionNumber, ScrollReveal, AnimatedCounter)"
```

---

### Task 4: Create Navbar and HeroSection

**Files:**
- Create: `frontend/components/landing/Navbar.tsx`
- Create: `frontend/components/landing/HeroSection.tsx`

- [ ] **Step 1: Create components/landing/Navbar.tsx**

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#tech-stack", label: "Tech Stack" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        background: scrolled ? "hsl(225 25% 6% / 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          color: "var(--text-primary)",
          textDecoration: "none",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent-primary)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 900,
            color: "var(--bg-primary)",
          }}
        >
          A
        </span>
        AgentMesh
      </Link>

      {/* Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {NAV_LINKS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: 14,
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)"; }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/dashboard"
        style={{
          background: "var(--accent-primary)",
          color: "var(--bg-primary)",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 14,
          padding: "10px 24px",
          borderRadius: "var(--radius-full)",
          textDecoration: "none",
          transition: "all 0.2s ease",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Mission Control
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </nav>
  );
}
```

- [ ] **Step 2: Create components/landing/HeroSection.tsx**

```tsx
"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { GradientText } from "@/components/ui/GradientText";
import { Badge } from "@/components/ui/Badge";

export function HeroSection() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: "var(--gradient-hero)",
      }}
    >
      {/* Dot grid background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.25,
          backgroundImage: "radial-gradient(circle, hsl(225, 15%, 30%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow orb */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, hsl(185deg 100% 50% / 0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "120px 32px 80px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}
        >
          {/* Badge */}
          <motion.div variants={staggerItem}>
            <Badge>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--status-active)",
                  display: "inline-block",
                  animation: "pulse 2s infinite",
                }}
              />
              MCP-Native · Multi-Agent · Real-Time
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={staggerItem}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(48px, 8vw, 88px)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 900,
              margin: 0,
            }}
          >
            <span style={{ color: "var(--text-primary)" }}>Orchestrate</span>{" "}
            <GradientText>AI Agents</GradientText>
            <br />
            <span style={{ color: "var(--text-primary)" }}>Like Never Before</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={staggerItem}
            style={{
              maxWidth: 560,
              fontSize: 18,
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              margin: 0,
            }}
          >
            A Python framework for building multi-agent systems powered by MCP servers,
            with real-time Mission Control for live workflow monitoring.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={staggerItem}
            style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}
          >
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: "var(--radius-full)",
                background: "var(--accent-primary)",
                color: "var(--bg-primary)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                transition: "all 0.3s ease",
                boxShadow: "0 0 40px hsl(185deg 100% 50% / 0.25)",
              }}
            >
              Open Mission Control
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: "var(--radius-full)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 15,
                textDecoration: "none",
                border: "1px solid var(--border-default)",
                transition: "all 0.3s ease",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              View on GitHub
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={staggerItem}
            style={{ display: "flex", gap: 48, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}
          >
            {[
              { value: "∞", label: "MCP Servers" },
              { value: "2+", label: "LLM Providers" },
              { value: "11", label: "Event Types" },
              { value: "0", label: "Config Files" },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--accent-primary)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 24,
            height: 40,
            borderRadius: 12,
            border: "1px solid var(--border-default)",
            display: "flex",
            justifyContent: "center",
            paddingTop: 6,
          }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 4, height: 8, borderRadius: 2, background: "var(--accent-primary)" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add Navbar and HeroSection landing components"
```

---

### Task 5: Create FeaturesBento and HowItWorks

**Files:**
- Create: `frontend/components/landing/FeaturesBento.tsx`
- Create: `frontend/components/landing/HowItWorks.tsx`

- [ ] **Step 1: Create components/landing/FeaturesBento.tsx**

```tsx
"use client";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionNumber } from "@/components/ui/SectionNumber";
import { staggerContainer, staggerItem } from "@/lib/motion";

const FEATURES = [
  {
    icon: "🧠",
    title: "Agent Definition Layer",
    description:
      "Define specialized AI agents as first-class Python objects. Assign roles, system prompts, MCP servers, and declarative handoff rules.",
    wide: false,
    tall: true,
  },
  {
    icon: "🔌",
    title: "MCP Integration",
    description:
      "Connect agents to any Model Context Protocol server — GitHub, filesystem, web search, databases, and custom tools.",
    wide: true,
    tall: false,
  },
  {
    icon: "⚡",
    title: "Orchestration Engine",
    description: "Sequential workflow execution with intelligent agent handoffs, error recovery, and timeout guards.",
    wide: false,
    tall: false,
  },
  {
    icon: "🛰️",
    title: "Mission Control Dashboard",
    description:
      "Real-time interactive visualization of your agent workflows with animated node graphs and live event streaming.",
    wide: true,
    tall: false,
  },
  {
    icon: "📡",
    title: "Real-Time Event System",
    description: "WebSocket-powered event bus broadcasting 11 typed event types — agent activations, tool calls, token usage.",
    wide: false,
    tall: false,
  },
];

function FeatureCard({
  icon,
  title,
  description,
  wide,
  tall,
}: (typeof FEATURES)[0]) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ borderColor: "var(--accent-primary)", y: -3 }}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "28px",
        cursor: "default",
        transition: "border-color 0.3s ease, transform 0.3s ease",
        gridColumn: wide ? "span 2" : "span 1",
        gridRow: tall ? "span 2" : "span 1",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle inner glow on hover — CSS only */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 30% 30%, hsl(185deg 100% 50% / 0.04), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <span style={{ fontSize: 32 }}>{icon}</span>
      <h3
        style={{
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 18,
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 14,
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {description}
      </p>
    </motion.div>
  );
}

export function FeaturesBento() {
  return (
    <section id="features" style={{ background: "var(--bg-primary)", padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <ScrollReveal style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 64 }}>
          <SectionNumber num="01" />
          <div>
            <h2
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Everything You Need
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 10, fontSize: 16, lineHeight: 1.6 }}>
              A complete platform for building and monitoring multi-agent AI systems.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "auto auto",
            gap: 16,
          }}
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create components/landing/HowItWorks.tsx**

```tsx
"use client";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionNumber } from "@/components/ui/SectionNumber";
import { staggerContainer, staggerItem } from "@/lib/motion";

const STEPS = [
  {
    num: "01",
    title: "Define Your Agents",
    description:
      "Create specialized agents with Python. Give each one a role, a system prompt, the MCP servers it needs, and handoff rules for passing work.",
    code: `agent = Agent(\n  name="Reviewer",\n  role="Code Reviewer",\n  mcp_servers=["github"],\n  handoff_rules={"on_complete": "Summarizer"}\n)`,
  },
  {
    num: "02",
    title: "Connect MCP Servers",
    description:
      "Register any MCP-compatible server. AgentMesh discovers tools automatically and namespaces them per server (server__tool).",
    code: `registry.register("github",\n  transport="stdio",\n  command="mcp-server-github"\n)`,
  },
  {
    num: "03",
    title: "Run Your Workflow",
    description:
      "Start a workflow with a task description. The orchestrator chains agents sequentially, passing context and results between them.",
    code: `result = await orchestrator.run(\n  workflow_name="code-review",\n  task="Review PR #42"\n)`,
  },
  {
    num: "04",
    title: "Monitor in Real-Time",
    description:
      "Open Mission Control to watch every agent activation, tool call, and handoff happen live. WebSocket events update the graph instantly.",
    code: `ws://localhost:8000/ws/events\n→ agent.activated: Reviewer\n→ tool.called: github__read_file\n→ agent.handoff: Reviewer → Summarizer`,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        background: "var(--bg-secondary)",
        padding: "120px 0",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <ScrollReveal style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 80 }}>
          <SectionNumber num="02" />
          <div>
            <h2
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              How It Works
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 10, fontSize: 16 }}>
              From agent definition to live monitoring in four steps.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          style={{ display: "flex", flexDirection: "column", gap: 48 }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              variants={staggerItem}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 1fr",
                gap: 40,
                alignItems: "start",
              }}
            >
              {/* Step number */}
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 48,
                  fontWeight: 900,
                  color: "var(--accent-primary)",
                  lineHeight: 1,
                  opacity: 0.7,
                }}
              >
                {step.num}
              </div>

              {/* Text */}
              <div>
                <h3
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 22,
                    marginBottom: 12,
                    marginTop: 0,
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                  {step.description}
                </p>
              </div>

              {/* Code block */}
              <div
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px 20px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  whiteSpace: "pre",
                  overflow: "auto",
                }}
              >
                {step.code}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add FeaturesBento and HowItWorks landing sections"
```

---

### Task 6: Create TechStack, GitHubCTA, and Footer

**Files:**
- Create: `frontend/components/landing/TechStack.tsx`
- Create: `frontend/components/landing/GitHubCTA.tsx`
- Create: `frontend/components/landing/Footer.tsx`

- [ ] **Step 1: Create components/landing/TechStack.tsx**

```tsx
"use client";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionNumber } from "@/components/ui/SectionNumber";
import { staggerContainer, staggerItem } from "@/lib/motion";

const TECH = [
  { name: "Python", role: "Agent Framework", color: "hsl(53, 90%, 55%)" },
  { name: "FastAPI", role: "REST + WebSocket API", color: "hsl(160, 60%, 50%)" },
  { name: "FastMCP", role: "MCP Client", color: "hsl(185, 100%, 50%)" },
  { name: "Gemini", role: "LLM Provider", color: "hsl(200, 80%, 60%)" },
  { name: "Groq", role: "LLM Provider", color: "hsl(270, 80%, 65%)" },
  { name: "Next.js", role: "Frontend Framework", color: "hsl(0, 0%, 90%)" },
  { name: "React Flow", role: "Graph Visualization", color: "hsl(330, 80%, 60%)" },
  { name: "Framer Motion", role: "Animations", color: "hsl(38, 92%, 55%)" },
  { name: "Zustand", role: "State Management", color: "hsl(15, 85%, 55%)" },
  { name: "TypeScript", role: "Type Safety", color: "hsl(210, 80%, 60%)" },
  { name: "Tailwind CSS", role: "Styling", color: "hsl(185, 80%, 50%)" },
  { name: "Pydantic", role: "Data Validation", color: "hsl(142, 71%, 45%)" },
];

export function TechStack() {
  return (
    <section id="tech-stack" style={{ background: "var(--bg-primary)", padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <ScrollReveal style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 64 }}>
          <SectionNumber num="03" />
          <div>
            <h2
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Built With the Best
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 10, fontSize: 16 }}>
              Best-in-class tools across the full stack.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {TECH.map(({ name, role, color }) => (
            <motion.div
              key={name}
              variants={staggerItem}
              whileHover={{ y: -4, borderColor: color }}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                cursor: "default",
                transition: "border-color 0.2s ease, transform 0.2s ease",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 15,
                  marginBottom: 4,
                }}
              >
                {name}
              </div>
              <div style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{role}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create components/landing/GitHubCTA.tsx**

```tsx
"use client";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { GradientText } from "@/components/ui/GradientText";

export function GitHubCTA() {
  return (
    <section
      style={{
        background: "var(--bg-secondary)",
        padding: "120px 0",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "0 32px",
          textAlign: "center",
        }}
      >
        <ScrollReveal>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(32px, 5vw, 56px)",
              lineHeight: 1.15,
              margin: "0 0 20px",
            }}
          >
            <span style={{ color: "var(--text-primary)" }}>Open Source &amp;</span>
            <br />
            <GradientText>Ready to Use</GradientText>
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 17,
              lineHeight: 1.7,
              marginBottom: 48,
            }}
          >
            Clone the repo, install dependencies, and start orchestrating agents in minutes.
            No API keys required for the framework itself.
          </p>

          {/* Clone command */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 32,
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              textAlign: "left",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--accent-primary)" }}>$</span> git clone
              https://github.com/your-org/agentmesh && cd agentmesh
            </span>
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  "git clone https://github.com/your-org/agentmesh && cd agentmesh"
                )
              }
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                cursor: "pointer",
                transition: "color 0.2s",
                flexShrink: 0,
              }}
            >
              Copy
            </button>
          </div>

          <motion.a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 32px",
              borderRadius: "var(--radius-full)",
              background: "var(--text-primary)",
              color: "var(--bg-primary)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              transition: "all 0.3s ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Star on GitHub
          </motion.a>
        </ScrollReveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create components/landing/Footer.tsx**

```tsx
import Link from "next/link";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "https://github.com", label: "GitHub", external: true },
];

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-primary)",
        borderTop: "1px solid var(--border-subtle)",
        padding: "40px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "var(--accent-primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 900,
              color: "var(--bg-primary)",
            }}
          >
            A
          </span>
          <span
            style={{
              color: "var(--text-tertiary)",
              fontSize: 14,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
            }}
          >
            AgentMesh
          </span>
          <span style={{ color: "var(--text-tertiary)", fontSize: 13, marginLeft: 8 }}>
            © {new Date().getFullYear()} — MIT License
          </span>
        </div>

        <nav style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {LINKS.map(({ href, label, external }) =>
            external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--text-tertiary)",
                  textDecoration: "none",
                  fontSize: 14,
                  transition: "color 0.2s",
                }}
              >
                {label}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                style={{
                  color: "var(--text-tertiary)",
                  textDecoration: "none",
                  fontSize: 14,
                  transition: "color 0.2s",
                }}
              >
                {label}
              </Link>
            )
          )}
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add TechStack, GitHubCTA, and Footer landing sections"
```

---

### Task 7: Compose full landing page

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Replace app/page.tsx with full landing page composition**

```tsx
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TechStack } from "@/components/landing/TechStack";
import { GitHubCTA } from "@/components/landing/GitHubCTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesBento />
        <HowItWorks />
        <TechStack />
        <GitHubCTA />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Run dev server and visually verify the landing page**

```bash
cd frontend && npm run dev
```

Open http://localhost:3000. Verify:
- Dark background with electric cyan accents
- Navbar is sticky with blur effect on scroll
- Hero section has gradient headline and CTA buttons
- Features bento grid renders 5 cards in correct layout
- HowItWorks shows 4 numbered steps with code snippets
- TechStack shows 12 tech cards
- GitHubCTA shows clone command
- Footer renders with links

Expected: No console errors about missing modules. Ctrl+C to stop.

- [ ] **Step 3: Verify TypeScript — no type errors**

```bash
cd frontend && npx tsc --noEmit
```
Expected: Exit code 0, no output.

- [ ] **Step 4: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: compose full AgentMesh landing page"
```
