# 🧩 AgentMesh — Component Library

> Frontend component documentation with library mappings for Aceternity UI, Magic UI, HeroUI, shadcn/ui, and Framer Motion.

---

## Table of Contents

- [Component Architecture](#component-architecture)
- [Component Map by Library](#component-map-by-library)
- [Landing Page Components](#landing-page-components)
- [Dashboard Components](#dashboard-components)
- [Shared UI Components](#shared-ui-components)
- [Component File Structure](#component-file-structure)

---

## Component Architecture

```
components/
├── landing/          # Marketing / landing page sections
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── FeaturesBento.tsx
│   ├── HowItWorks.tsx
│   ├── LiveDemo.tsx
│   ├── TechStack.tsx
│   ├── GitHubCTA.tsx
│   └── Footer.tsx
│
├── dashboard/        # Mission Control dashboard views
│   ├── DashboardLayout.tsx
│   ├── DashboardHeader.tsx
│   ├── AgentSidebar.tsx
│   ├── AgentGraph.tsx
│   ├── MessageStream.tsx
│   ├── ToolCallInspector.tsx
│   ├── TokenMonitor.tsx
│   ├── WorkflowTimeline.tsx
│   └── WorkflowControls.tsx
│
├── agents/           # Agent-specific components
│   ├── AgentCard.tsx
│   ├── AgentNode.tsx
│   ├── AgentStatusBadge.tsx
│   ├── AgentDetailPanel.tsx
│   └── AgentAvatar.tsx
│
├── graph/            # Graph visualization components
│   ├── FlowCanvas.tsx
│   ├── AgentFlowNode.tsx
│   ├── AnimatedEdge.tsx
│   ├── GraphControls.tsx
│   └── GraphMinimap.tsx
│
└── ui/               # Shared primitives & design system
    ├── Button.tsx
    ├── Card.tsx
    ├── Badge.tsx
    ├── Input.tsx
    ├── Modal.tsx
    ├── Tooltip.tsx
    ├── GlassPanel.tsx
    ├── StatusDot.tsx
    ├── GradientText.tsx
    ├── SectionNumber.tsx
    ├── AnimatedCounter.tsx
    ├── ScrollReveal.tsx
    ├── ShimmerLoader.tsx
    └── Terminal.tsx
```

---

## Component Map by Library

### Which library provides what

| Component | Library | Specific Component | Customization |
|-----------|---------|-------------------|---------------|
| **Hero background** | Aceternity UI | `BackgroundLines` or `DottedGlowBackground` | Dark theme colors |
| **Hero text reveal** | Aceternity UI | `EncryptedText` | Cyan accent color |
| **Feature bento grid** | Aceternity UI | `BentoGrid` block | Custom col/row spans |
| **Feature cards** | Aceternity UI | `CardSpotlight` | Accent glow color |
| **3D hover cards** | Aceternity UI | `3DCardEffect` | Agent card wrapper |
| **Terminal embed** | Aceternity UI | `Terminal` | Custom commands |
| **Code block** | Aceternity UI | `CodeBlock` | Dark mono theme |
| **Text gradient hover** | Aceternity UI | `TextHoverEffect` | Gradient accent |
| **Apple-style carousel** | Aceternity UI | `AppleCardsCarousel` | Use-case showcase |
| **Noise background** | Aceternity UI | `NoiseBackground` | Dashboard panels |
| **Animated beam** | Magic UI | `AnimatedBeam` | Agent graph edges |
| **Number ticker** | Magic UI | `NumberTicker` | Token counters |
| **Dot pattern** | Magic UI | `DotPattern` | Dashboard background |
| **Orbiting circles** | Magic UI | `OrbitingCircles` | Agent status viz |
| **Particles** | Magic UI | `Particles` | Hero background |
| **Shimmer button** | Magic UI | `ShimmerButton` | Primary CTAs |
| **Border beam** | Magic UI | `BorderBeam` | Active agent card highlight |
| **Marquee** | Magic UI | `Marquee` | Tech stack logos |
| **Typing animation** | Magic UI | `TypingAnimation` | Loading states |
| **Globe** | Magic UI | `Globe` | Landing hero visual |
| **Morphing text** | Magic UI | `MorphingText` | Hero headline animation |
| **Animated list** | Magic UI | `AnimatedList` | Message stream |
| **Bento grid** | Magic UI | `BentoGrid` | Alternative bento |
| **File tree** | Magic UI | `FileTree` | Project structure |
| **Buttons** | HeroUI | `Button` + variants | All buttons base |
| **Input** | HeroUI | `Input` | Form fields |
| **Modal/Drawer** | HeroUI | `Modal`, `Drawer` | Agent details |
| **Tabs** | HeroUI | `Tabs` | Inspector panel |
| **Dropdown** | HeroUI | `Dropdown` | Filter menus |
| **Tooltip** | HeroUI | `Tooltip` | Info tooltips |
| **Avatar** | HeroUI | `Avatar` | Agent avatars |
| **Badge** | HeroUI | `Badge`, `Chip` | Status badges |
| **Skeleton** | HeroUI | `Skeleton` | Loading states |
| **Navbar** | HeroUI | `Navbar` | Top navigation |
| **Dialog** | shadcn/ui | `Dialog` | Confirmation dialogs |
| **Toast** | shadcn/ui | `Sonner` | Notifications |
| **Command** | shadcn/ui | `Command` | Quick actions palette |
| **Sheet** | shadcn/ui | `Sheet` | Side panel overlay |
| **Scroll Area** | shadcn/ui | `ScrollArea` | Message stream |
| **Separator** | shadcn/ui | `Separator` | Visual dividers |

---

## Landing Page Components

### `Navbar.tsx`

```tsx
// Library: HeroUI Navbar + Framer Motion
// Features: Sticky, blur backdrop, animated logo, smooth scroll links
// Design: BaseCreate-inspired clean navigation

import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar";
import { motion } from "framer-motion";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

export function SiteNavbar() {
  return (
    <Navbar 
      className="bg-bg-primary/60 backdrop-blur-xl border-b border-border-subtle"
      maxWidth="xl"
      isBordered={false}
    >
      <NavbarBrand>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-display font-bold text-xl"
        >
          <span className="text-gradient">AgentMesh</span>
        </motion.div>
      </NavbarBrand>
      
      <NavbarContent className="hidden md:flex gap-8" justify="center">
        {["Features", "How it Works", "Demo", "Docs"].map((item, i) => (
          <NavbarItem key={item}>
            <motion.a
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-text-secondary hover:text-text-primary transition-colors"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              {item}
            </motion.a>
          </NavbarItem>
        ))}
      </NavbarContent>
      
      <NavbarContent justify="end">
        <NavbarItem>
          <ShimmerButton className="shadow-2xl">
            <span className="text-sm font-medium">Get Started →</span>
          </ShimmerButton>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
```

### `HeroSection.tsx`

```tsx
// Libraries: Aceternity BackgroundLines + EncryptedText, Magic UI Particles + MorphingText
// Design: STR8FIRE-inspired dark cinematic hero with animated text

import { BackgroundLines } from "@/components/aceternity/background-lines";
import { EncryptedText } from "@/components/aceternity/encrypted-text";
import { Particles } from "@/components/magicui/particles";
import { MorphingText } from "@/components/magicui/morphing-text";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <BackgroundLines className="absolute inset-0 opacity-20">
        <div />
      </BackgroundLines>
      <Particles 
        className="absolute inset-0" 
        quantity={80} 
        color="#00e5ff" 
        size={0.8}
      />
      
      {/* Hero content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Morphing pre-title */}
          <MorphingText 
            texts={["Multi-Agent", "MCP-Native", "Real-Time", "Open Source"]}
            className="text-accent-primary text-lg font-mono mb-6"
          />
          
          {/* Main headline with gradient */}
          <h1 className="text-hero font-display font-extrabold leading-[1.1] mb-6">
            <span className="text-text-primary">Orchestrate AI Agents</span>
            <br />
            <span className="text-gradient">Like Never Before</span>
          </h1>
          
          {/* Encrypted text reveal for subtitle */}
          <EncryptedText
            text="Define agents. Connect MCP servers. Watch them collaborate in real-time."
            className="text-text-secondary text-xl font-body max-w-2xl mx-auto mb-10"
            interval={30}
          />
          
          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-4">
            <ShimmerButton className="h-12 px-8">
              <span className="font-display font-semibold">
                Get Started →
              </span>
            </ShimmerButton>
            <motion.button 
              className="btn-ghost h-12 px-8"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Live Demo
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

### `FeaturesBento.tsx`

```tsx
// Libraries: Aceternity BentoGrid + CardSpotlight, Magic UI BorderBeam
// Design: Asymmetric grid showing 6 core features (see FEATURES.md)

import { CardSpotlight } from "@/components/aceternity/card-spotlight";
import { BorderBeam } from "@/components/magicui/border-beam";
import { motion } from "framer-motion";

const features = [
  {
    title: "Agent Definition Layer",
    description: "Define agents in Python with roles, prompts, and MCP bindings",
    icon: "🧠",
    span: "col-span-1 row-span-1",
  },
  {
    title: "MCP Integration",
    description: "Connect to any MCP server — filesystem, GitHub, web search",
    icon: "🔌",
    span: "col-span-2 row-span-1",
  },
  {
    title: "LangGraph Orchestration",
    description: "State machine workflows with conditional routing",
    icon: "🔄",
    span: "col-span-1 row-span-1",
  },
  {
    title: "Mission Control",
    description: "Real-time dashboard with live agent graph, message flow, tool calls",
    icon: "🛰️",
    span: "col-span-2 row-span-1",
  },
  {
    title: "Real-Time Events",
    description: "WebSocket event bus streaming every agent action",
    icon: "📡",
    span: "col-span-1 row-span-1",
  },
  {
    title: "Free LLM Tier",
    description: "Powered by Gemini + Groq free APIs — no credit card needed",
    icon: "💎",
    span: "col-span-1 row-span-1",
  },
];

export function FeaturesBento() {
  return (
    <section className="py-32 px-8 relative" id="features">
      {/* Section number — STR8FIRE style */}
      <div className="section-number absolute -top-8 left-8 opacity-5">01</div>
      
      <div className="max-w-6xl mx-auto">
        <h2 className="text-h2 font-display font-bold text-text-primary mb-4">
          Everything you need
        </h2>
        <p className="text-text-secondary text-lg mb-16 max-w-xl">
          A complete toolkit for building, orchestrating, and monitoring 
          multi-agent AI systems.
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className={feature.span}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <CardSpotlight className="h-full">
                <div className="relative z-10 p-6">
                  <span className="text-3xl mb-4 block">{feature.icon}</span>
                  <h3 className="text-h4 font-display font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {feature.description}
                  </p>
                </div>
                <BorderBeam size={200} duration={8} delay={i * 2} />
              </CardSpotlight>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### `HowItWorks.tsx`

```tsx
// Libraries: Magic UI AnimatedBeam, Framer Motion
// Design: Numbered steps (STR8FIRE-style) with animated connections

import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Define Agents",
    description: "Create specialized agents with roles, system prompts, and MCP server connections in Python.",
    code: `agent = Agent(name="Reviewer", mcp_servers=["github"])`,
  },
  {
    number: "02",
    title: "Build Workflow",
    description: "Wire agents into a LangGraph state machine with conditional handoffs.",
    code: `workflow = Workflow(agents=[a1, a2], graph={...})`,
  },
  {
    number: "03",
    title: "Execute & Monitor",
    description: "Run your workflow and watch every step in real-time Mission Control.",
    code: `result = await workflow.run("Review PR #42")`,
  },
];

export function HowItWorks() {
  return (
    <section className="py-32 px-8 relative" id="how-it-works">
      <div className="section-number absolute -top-8 left-8 opacity-5">02</div>
      
      <div className="max-w-5xl mx-auto">
        <h2 className="text-h2 font-display font-bold text-text-primary mb-16">
          How it works
        </h2>
        
        <div className="space-y-24">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="grid grid-cols-[80px_1fr_1fr] gap-8 items-center"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              {/* Large step number */}
              <span className="text-[80px] font-display font-black text-accent-primary/20">
                {step.number}
              </span>
              
              {/* Description */}
              <div>
                <h3 className="text-h3 font-display font-bold text-text-primary mb-3">
                  {step.title}
                </h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
              
              {/* Code snippet */}
              <div className="bg-bg-secondary border border-border-subtle rounded-lg p-4 font-mono text-mono-sm text-accent-primary">
                {step.code}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### `TechStack.tsx`

```tsx
// Libraries: Magic UI Marquee + IconCloud
// Design: MewsUnfold-style logo grid with marquee animation

import { Marquee } from "@/components/magicui/marquee";

const techStack = [
  { name: "Python", icon: "/icons/python.svg" },
  { name: "FastAPI", icon: "/icons/fastapi.svg" },
  { name: "LangGraph", icon: "/icons/langgraph.svg" },
  { name: "Next.js", icon: "/icons/nextjs.svg" },
  { name: "React", icon: "/icons/react.svg" },
  { name: "WebSocket", icon: "/icons/websocket.svg" },
  { name: "Gemini", icon: "/icons/gemini.svg" },
  { name: "Groq", icon: "/icons/groq.svg" },
  { name: "Vercel", icon: "/icons/vercel.svg" },
  { name: "Framer Motion", icon: "/icons/framer.svg" },
];

export function TechStack() {
  return (
    <section className="py-24 relative overflow-hidden" id="tech-stack">
      <div className="section-number absolute -top-8 left-8 opacity-5">04</div>
      
      <h2 className="text-h2 font-display font-bold text-text-primary text-center mb-12">
        Built with the best
      </h2>
      
      <Marquee pauseOnHover className="[--duration:30s]">
        {techStack.map((tech) => (
          <div 
            key={tech.name}
            className="flex items-center gap-3 mx-8 px-6 py-3 bg-bg-secondary rounded-full border border-border-subtle hover:border-accent-primary transition-colors"
          >
            <img src={tech.icon} alt={tech.name} className="w-6 h-6" />
            <span className="text-text-secondary font-medium">{tech.name}</span>
          </div>
        ))}
      </Marquee>
    </section>
  );
}
```

---

## Dashboard Components

### `DashboardLayout.tsx`

```tsx
// The root layout for Mission Control — CSS Grid bento
// Libraries: Framer Motion (layout animations)

import { motion } from "framer-motion";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-grid h-screen bg-bg-primary text-text-primary">
      {children}
    </div>
  );
}

// CSS (in globals.css):
// .dashboard-grid {
//   display: grid;
//   grid-template-columns: 280px 1fr 320px;
//   grid-template-rows: 56px 1fr 260px;
//   grid-template-areas:
//     "header   header    header"
//     "agents   graph     inspector"
//     "agents   timeline  inspector";
//   gap: 8px;
//   padding: 8px;
// }
```

### `AgentGraph.tsx`

```tsx
// Agent workflow graph — interactive node visualization
// Libraries: React Flow + Magic UI AnimatedBeam + Framer Motion

import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import { useEventStore } from '@/stores/eventStore';

// Custom nodes and edges
import { AgentFlowNode } from './AgentFlowNode';
import { AnimatedFlowEdge } from './AnimatedFlowEdge';

const nodeTypes = { agentNode: AgentFlowNode };
const edgeTypes = { animatedEdge: AnimatedFlowEdge };

export function AgentGraph() {
  const { agents, events } = useEventStore();
  
  // Convert agent data to React Flow nodes
  const nodes = Object.entries(agents).map(([name, state], i) => ({
    id: name,
    type: 'agentNode',
    position: calculatePosition(i, Object.keys(agents).length),
    data: { name, ...state },
  }));
  
  // Build edges from handoff rules
  const edges = buildEdgesFromConfig(agents);
  
  return (
    <div className="graph-area bg-bg-secondary rounded-xl border border-border-subtle overflow-hidden"
         style={{ gridArea: 'graph' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={20} size={1} color="hsl(225, 15%, 15%)" />
        <Controls className="!bg-bg-tertiary !border-border-subtle !text-text-secondary" />
        <MiniMap 
          nodeColor={(n) => getAgentColor(n.id)}
          className="!bg-bg-secondary !border-border-subtle"
        />
      </ReactFlow>
    </div>
  );
}
```

### `AgentFlowNode.tsx`

```tsx
// Custom React Flow node representing an agent
// Libraries: HeroUI Avatar + Badge, Magic UI BorderBeam, Framer Motion

import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { BorderBeam } from "@/components/magicui/border-beam";
import { motion } from "framer-motion";
import { Handle, Position } from '@xyflow/react';

export function AgentFlowNode({ data }) {
  const isActive = data.status === 'active';
  const isThinking = data.status === 'thinking';
  
  return (
    <motion.div
      className={`
        relative px-5 py-4 rounded-xl border min-w-[160px]
        bg-bg-secondary
        ${isActive ? 'border-status-active shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-border-subtle'}
        ${isThinking ? 'border-status-thinking' : ''}
      `}
      animate={isActive ? { scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent-primary !w-2 !h-2" />
      
      <div className="flex items-center gap-3">
        <Avatar 
          size="sm" 
          name={data.name[0]} 
          classNames={{ base: `bg-agent-color-${data.colorIndex}` }}
        />
        <div>
          <p className="text-sm font-semibold text-text-primary">{data.name}</p>
          <p className="text-xs text-text-tertiary">{data.role}</p>
        </div>
        <StatusDot status={data.status} />
      </div>
      
      {isActive && <BorderBeam size={120} duration={4} colorFrom="#22c55e" colorTo="#00e5ff" />}
      
      <Handle type="source" position={Position.Right} className="!bg-accent-primary !w-2 !h-2" />
    </motion.div>
  );
}
```

### `MessageStream.tsx`

```tsx
// Real-time scrolling message feed
// Libraries: Magic UI AnimatedList, shadcn/ui ScrollArea, Framer Motion

import { AnimatedList } from "@/components/magicui/animated-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@heroui/badge";
import { useEventStore } from "@/stores/eventStore";

export function MessageStream() {
  const events = useEventStore((s) => s.events);
  
  const messageEvents = events.filter(e => 
    ['agent.activated', 'agent.completed', 'agent.handoff', 'tool.called', 'tool.result'].includes(e.type)
  );
  
  return (
    <div className="timeline-area bg-bg-secondary rounded-xl border border-border-subtle overflow-hidden"
         style={{ gridArea: 'timeline' }}>
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Activity Stream</h3>
        <Badge size="sm" variant="flat" color="success">
          {messageEvents.length} events
        </Badge>
      </div>
      
      <ScrollArea className="h-[calc(100%-44px)]">
        <AnimatedList>
          {messageEvents.map((event) => (
            <MessageEntry key={event.id} event={event} />
          ))}
        </AnimatedList>
      </ScrollArea>
    </div>
  );
}

function MessageEntry({ event }) {
  const timeStr = new Date(event.timestamp * 1000).toLocaleTimeString();
  
  return (
    <div className="px-4 py-2 hover:bg-bg-hover transition-colors border-b border-border-subtle/50">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-text-tertiary font-mono">{timeStr}</span>
        <Badge 
          size="sm" 
          variant="flat" 
          color={getEventColor(event.type)}
          className="font-mono text-[10px]"
        >
          {event.type}
        </Badge>
        {event.agentName && (
          <span className="text-text-secondary font-medium">{event.agentName}</span>
        )}
      </div>
      {event.tool && (
        <p className="text-xs text-accent-primary font-mono mt-1 pl-4">
          → {event.tool}({JSON.stringify(event.args).slice(0, 60)}...)
        </p>
      )}
    </div>
  );
}
```

### `TokenMonitor.tsx`

```tsx
// Live token usage counter per agent
// Libraries: Magic UI NumberTicker, HeroUI Progress, Framer Motion

import { NumberTicker } from "@/components/magicui/number-ticker";
import { Progress } from "@heroui/progress";
import { useEventStore } from "@/stores/eventStore";

export function TokenMonitor() {
  const tokenUsage = useEventStore((s) => s.tokenUsage);
  
  const totalTokens = Object.values(tokenUsage)
    .reduce((sum, u) => sum + u.input + u.output, 0);
  
  return (
    <div className="p-4 bg-bg-secondary rounded-xl border border-border-subtle">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Token Usage</h3>
      
      {/* Total counter */}
      <div className="text-center mb-6">
        <p className="text-text-tertiary text-xs uppercase tracking-wider mb-1">Total Tokens</p>
        <NumberTicker
          value={totalTokens}
          className="text-3xl font-display font-bold text-accent-primary"
        />
      </div>
      
      {/* Per-agent breakdown */}
      <div className="space-y-3">
        {Object.entries(tokenUsage).map(([agent, usage]) => {
          const agentTotal = usage.input + usage.output;
          const pct = totalTokens > 0 ? (agentTotal / totalTokens) * 100 : 0;
          
          return (
            <div key={agent}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">{agent}</span>
                <span className="text-text-tertiary font-mono">
                  {agentTotal.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={pct} 
                size="sm"
                classNames={{
                  indicator: "bg-gradient-to-r from-accent-primary to-accent-secondary"
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Shared UI Components

### `GradientText.tsx`

```tsx
// Gradient text utility — used in hero headlines
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  to?: string;
}

export function GradientText({ 
  children, 
  className,
  from = "hsl(185, 100%, 50%)", 
  to = "hsl(270, 85%, 65%)" 
}: GradientTextProps) {
  return (
    <span
      className={cn("bg-clip-text text-transparent", className)}
      style={{
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {children}
    </span>
  );
}
```

### `SectionNumber.tsx`

```tsx
// STR8FIRE-inspired large section numbers
import { motion } from "framer-motion";

export function SectionNumber({ number }: { number: string }) {
  return (
    <motion.span
      className="absolute -top-8 left-0 text-[120px] font-display font-black leading-none select-none pointer-events-none"
      style={{ color: "hsl(225, 15%, 10%)" }}
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 0.08, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      {number}
    </motion.span>
  );
}
```

### `GlassPanel.tsx`

```tsx
// Glassmorphism overlay panel
import { cn } from "@/lib/utils";

export function GlassPanel({ 
  children, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-bg-secondary/60 backdrop-blur-xl border border-border-subtle/40 rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

### `StatusDot.tsx`

```tsx
// Animated status indicator dot
import { cn } from "@/lib/utils";

const statusColors = {
  active: "bg-status-active",
  idle: "bg-status-idle",
  error: "bg-status-error",
  thinking: "bg-status-thinking",
};

export function StatusDot({ status }: { status: keyof typeof statusColors }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {(status === "active" || status === "error") && (
        <span className={cn(
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          statusColors[status]
        )} />
      )}
      <span className={cn(
        "relative inline-flex rounded-full h-2.5 w-2.5",
        statusColors[status]
      )} />
    </span>
  );
}
```

### `ScrollReveal.tsx`

```tsx
// Scroll-triggered reveal animation wrapper
import { motion } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const directionMap = {
  up: { y: 30 },
  down: { y: -30 },
  left: { x: 30 },
  right: { x: -30 },
};

export function ScrollReveal({ children, delay = 0, direction = "up" }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

---

## Component File Structure

```
frontend/
├── components/
│   ├── landing/
│   │   ├── Navbar.tsx              # HeroUI Navbar + blur bg
│   │   ├── HeroSection.tsx         # Aceternity Lines/Particles + EncryptedText
│   │   ├── FeaturesBento.tsx       # Aceternity CardSpotlight + Magic BorderBeam
│   │   ├── HowItWorks.tsx          # Numbered steps + Magic AnimatedBeam
│   │   ├── LiveDemo.tsx            # Aceternity Terminal component
│   │   ├── TechStack.tsx           # Magic UI Marquee
│   │   ├── GitHubCTA.tsx           # shadcn/ui + ShimmerButton
│   │   └── Footer.tsx              # Clean minimal footer
│   │
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx     # CSS Grid bento layout
│   │   ├── DashboardHeader.tsx     # Status bar + controls
│   │   ├── AgentSidebar.tsx        # Agent list panel
│   │   ├── AgentGraph.tsx          # React Flow + AnimatedBeam
│   │   ├── MessageStream.tsx       # Magic AnimatedList + ScrollArea
│   │   ├── ToolCallInspector.tsx   # Tabbed tool call viewer
│   │   ├── TokenMonitor.tsx        # Magic NumberTicker + Progress
│   │   ├── WorkflowTimeline.tsx    # Gantt-style timeline
│   │   └── WorkflowControls.tsx    # Start/pause/reset buttons
│   │
│   ├── agents/
│   │   ├── AgentCard.tsx           # HeroUI Card + StatusDot
│   │   ├── AgentNode.tsx           # React Flow custom node
│   │   ├── AgentStatusBadge.tsx    # HeroUI Badge
│   │   ├── AgentDetailPanel.tsx    # HeroUI Drawer with tabs
│   │   └── AgentAvatar.tsx         # HeroUI Avatar with color
│   │
│   ├── graph/
│   │   ├── FlowCanvas.tsx          # React Flow wrapper
│   │   ├── AgentFlowNode.tsx       # Custom agent node
│   │   ├── AnimatedEdge.tsx        # Animated beam edge
│   │   ├── GraphControls.tsx       # Zoom/fit controls
│   │   └── GraphMinimap.tsx        # Minimap panel
│   │
│   ├── ui/                         # Shared design system primitives
│   │   ├── Button.tsx              # HeroUI Button wrapper
│   │   ├── Card.tsx                # Base card with spotlight
│   │   ├── Badge.tsx               # HeroUI Badge wrapper
│   │   ├── Input.tsx               # HeroUI Input wrapper
│   │   ├── Modal.tsx               # HeroUI Modal wrapper
│   │   ├── Tooltip.tsx             # HeroUI Tooltip
│   │   ├── GlassPanel.tsx          # Glassmorphism panel
│   │   ├── StatusDot.tsx           # Status indicator
│   │   ├── GradientText.tsx        # Gradient text
│   │   ├── SectionNumber.tsx       # STR8FIRE-style numbers
│   │   ├── AnimatedCounter.tsx     # Counting animation
│   │   ├── ScrollReveal.tsx        # Scroll animation wrapper
│   │   ├── ShimmerLoader.tsx       # Loading skeleton
│   │   └── Terminal.tsx            # Terminal component
│   │
│   ├── aceternity/                 # Installed Aceternity components
│   │   ├── background-lines.tsx
│   │   ├── card-spotlight.tsx
│   │   ├── encrypted-text.tsx
│   │   ├── terminal.tsx
│   │   ├── noise-background.tsx
│   │   ├── text-hover-effect.tsx
│   │   ├── code-block.tsx
│   │   └── apple-cards-carousel.tsx
│   │
│   └── magicui/                    # Installed Magic UI components
│       ├── animated-beam.tsx
│       ├── animated-list.tsx
│       ├── border-beam.tsx
│       ├── dot-pattern.tsx
│       ├── marquee.tsx
│       ├── morphing-text.tsx
│       ├── number-ticker.tsx
│       ├── particles.tsx
│       ├── shimmer-button.tsx
│       └── typing-animation.tsx
```

---

## Installation Commands

```bash
# shadcn/ui (base primitives)
npx shadcn@latest init
npx shadcn@latest add dialog toast command sheet scroll-area separator

# HeroUI
npm install @heroui/react framer-motion

# Aceternity UI (copy-paste components — install individually)
# Follow: https://ui.aceternity.com/docs/installation

# Magic UI (copy-paste components — install individually)  
# Follow: https://magicui.design/docs/installation

# React Flow (agent graph)
npm install @xyflow/react

# Zustand (state management)
npm install zustand

# Additional
npm install clsx tailwind-merge
```
