# 🎨 AgentMesh — Design System & Visual Language

> UI/UX design system documentation for the Mission Control dashboard.  
> Inspired by [BaseCreate](https://www.basecreate.com/en), [MewsUnfold](https://mewsunfold.com/), [STR8FIRE](https://www.str8fire.io/) and Awwwards-level design patterns.

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Visual References & Inspiration](#visual-references--inspiration)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Component Design Tokens](#component-design-tokens)
- [Animation & Motion](#animation--motion)
- [Page-by-Page Design](#page-by-page-design)
- [Responsive Strategy](#responsive-strategy)
- [Accessibility](#accessibility)

---

## Design Philosophy

AgentMesh's design follows four core principles drawn from award-winning web experiences:

### 1. 🌑 Dark-First, Command Center Aesthetic
The Mission Control dashboard uses a deep dark theme inspired by real aerospace mission control rooms and STR8FIRE's dark cinematic palette. Dark backgrounds make data visualization pop, reduce eye strain during monitoring, and convey a premium, technical feel.

### 2. 🌊 Fluid Motion = Living Interface  
Inspired by BaseCreate's smooth page transitions and MewsUnfold's scroll-driven reveals. Every state change — agent activation, message flow, tool calls — should feel alive through purposeful micro-animations. The interface should breathe.

### 3. 📐 Dense but Organized (Information Architecture)  
Mission Control must show a lot of data simultaneously: agent graphs, message streams, token counters, tool calls. We use a bento grid layout (inspired by Aceternity UI's bento grids) with clear visual hierarchy and progressive disclosure.

### 4. ✨ Premium Minimalism  
Clean lines, generous whitespace within dense layouts, and a restrained color palette. Bold typography for headings, monospace for data. No visual clutter — every pixel earns its place.

---

## Visual References & Inspiration

### Website References

| Site | Inspiration Taken |
|------|-------------------|
| **[BaseCreate](https://basecreate.com)** | Elegant transitions, premium typography, scroll-driven animations, testimonial carousels, clean navigation with hover reveals |
| **[MewsUnfold](https://mewsunfold.com)** | Bold hero sections, event-driven layout, speaker grid cards, immersive scrollytelling, gradient overlays |
| **[STR8FIRE](https://str8fire.io)** | Dark cinematic design, numbered section navigation, layered architecture diagrams, roadmap timeline, loading transitions, tokenized counting animations |

### Design Patterns Borrowed

| Pattern | Source | Applied To |
|---------|--------|------------|
| Numbered section markers (`01`, `02`, `03`) | STR8FIRE | Dashboard panel numbering |
| Scroll-driven reveal animations | BaseCreate | Landing page sections |
| Speaker/card grid with hover states | MewsUnfold | Agent cards in dashboard |
| Loading percentage animation | STR8FIRE | Workflow progress indicator |
| 4-layer architecture diagram | STR8FIRE | System architecture section |
| Testimonial carousel | BaseCreate | Use-case showcase |
| Bold counter animations | STR8FIRE | Token usage, active agents |

---

## Color System

### Primary Palette

```css
:root {
  /* ── Background layers ── */
  --bg-primary:         hsl(225, 25%, 6%);      /* #0d0f14 — deepest layer */
  --bg-secondary:       hsl(225, 20%, 10%);     /* #151821 — card surfaces */
  --bg-tertiary:        hsl(225, 18%, 14%);     /* #1e2130 — elevated panels */
  --bg-hover:           hsl(225, 15%, 18%);     /* #272b3a — hover states */

  /* ── Accent — Electric Cyan ── */
  --accent-primary:     hsl(185, 100%, 50%);    /* #00e5ff — primary action */
  --accent-glow:        hsl(185, 100%, 50%, 0.15);  /* glow effect */
  --accent-muted:       hsl(185, 60%, 35%);     /* subdued accent */

  /* ── Secondary Accent — Violet ── */
  --accent-secondary:   hsl(270, 85%, 65%);     /* #8b5cf6 — secondary highlights */
  --accent-secondary-glow: hsl(270, 85%, 65%, 0.15);

  /* ── Status Colors ── */
  --status-active:      hsl(142, 71%, 45%);     /* #22c55e — agent active */
  --status-idle:        hsl(220, 15%, 45%);     /* #636b83 — agent idle */
  --status-error:       hsl(0, 84%, 60%);       /* #ef4444 — errors */
  --status-warning:     hsl(38, 92%, 50%);      /* #f59e0b — warnings */
  --status-thinking:    hsl(45, 100%, 60%);     /* #facc15 — agent thinking */

  /* ── Text ── */
  --text-primary:       hsl(0, 0%, 95%);        /* #f2f2f2 — headings */
  --text-secondary:     hsl(220, 15%, 65%);     /* #9ca3af — body text */
  --text-tertiary:      hsl(220, 10%, 45%);     /* #6b7280 — labels */
  --text-accent:        var(--accent-primary);   /* accent-colored text */

  /* ── Borders ── */
  --border-subtle:      hsl(225, 15%, 18%);     /* barely visible */
  --border-default:     hsl(225, 12%, 25%);     /* standard borders */
  --border-accent:      var(--accent-primary);   /* highlighted borders */

  /* ── Gradients ── */
  --gradient-hero:      linear-gradient(135deg, hsl(225, 25%, 6%) 0%, hsl(250, 30%, 12%) 50%, hsl(225, 25%, 6%) 100%);
  --gradient-card:      linear-gradient(180deg, hsl(225, 20%, 12%) 0%, hsl(225, 20%, 8%) 100%);
  --gradient-accent:    linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  --gradient-glow:      radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%);
}
```

### Agent Identity Colors

Each agent gets a unique identity color for visual distinction in the graph and message stream:

```css
:root {
  --agent-color-1:  hsl(185, 100%, 50%);  /* Cyan */
  --agent-color-2:  hsl(270, 85%, 65%);   /* Violet */
  --agent-color-3:  hsl(142, 71%, 45%);   /* Emerald */
  --agent-color-4:  hsl(330, 80%, 60%);   /* Rose */
  --agent-color-5:  hsl(38, 92%, 50%);    /* Amber */
  --agent-color-6:  hsl(200, 90%, 55%);   /* Sky */
  --agent-color-7:  hsl(15, 85%, 55%);    /* Orange */
  --agent-color-8:  hsl(160, 60%, 45%);   /* Teal */
}
```

---

## Typography

### Font Stack

```css
:root {
  /* Primary — headings and UI labels */
  --font-display: 'Outfit', 'Inter', -apple-system, sans-serif;
  
  /* Secondary — body text */
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Mono — code, data, terminal output */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
}
```

> **Google Fonts import:**
> ```html
> <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
> ```

### Type Scale

| Token | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| `--text-hero` | 72px / 4.5rem | 800 | Outfit | Landing hero headline |
| `--text-h1` | 48px / 3rem | 700 | Outfit | Page titles |
| `--text-h2` | 36px / 2.25rem | 600 | Outfit | Section headers |
| `--text-h3` | 24px / 1.5rem | 600 | Outfit | Subsection headers |
| `--text-h4` | 18px / 1.125rem | 600 | Inter | Card titles |
| `--text-body` | 16px / 1rem | 400 | Inter | Body text |
| `--text-body-sm` | 14px / 0.875rem | 400 | Inter | Compact body text |
| `--text-caption` | 12px / 0.75rem | 500 | Inter | Labels, timestamps |
| `--text-mono` | 14px / 0.875rem | 400 | JetBrains Mono | Code, data values |
| `--text-mono-sm` | 12px / 0.75rem | 400 | JetBrains Mono | Terminal, tool calls |

### Special Typographic Treatments

```css
/* Gradient text — for hero headlines (STR8FIRE-inspired) */
.text-gradient {
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Encrypted / reveal text — for loading states */
.text-encrypted {
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  animation: textScramble 2s ease-in-out;
}

/* Numbered section markers (01, 02, 03) — STR8FIRE-style */
.section-number {
  font-family: var(--font-display);
  font-size: 120px;
  font-weight: 900;
  color: hsl(225, 15%, 12%);
  line-height: 1;
  user-select: none;
}
```

---

## Spacing & Layout

### Spacing Scale

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;
}
```

### Grid System

```css
/* Landing page — full-width sections with max-width content */
.landing-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-8);
}

/* Dashboard — CSS Grid bento layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: 300px 1fr 350px;
  grid-template-rows: 64px 1fr 280px;
  grid-template-areas:
    "header   header    header"
    "agents   graph     inspector"
    "agents   timeline  inspector";
  gap: var(--space-3);
  height: 100vh;
  padding: var(--space-3);
  background: var(--bg-primary);
}
```

### Border Radius

```css
:root {
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-full: 9999px;
}
```

---

## Component Design Tokens

### Cards

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: var(--border-accent);
  box-shadow: 0 0 30px var(--accent-glow);
  transform: translateY(-2px);
}
```

### Glassmorphism Panels (for floating overlays)

```css
.glass-panel {
  background: hsl(225, 20%, 10%, 0.6);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid hsl(225, 15%, 20%, 0.4);
  border-radius: var(--radius-lg);
}
```

### Buttons

```css
/* Primary action — glowing cyan */
.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  padding: 12px 28px;
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-primary::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: var(--accent-primary);
  filter: blur(12px);
  opacity: 0.4;
  z-index: -1;
  transition: opacity 0.3s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 40px var(--accent-glow);
}

.btn-primary:hover::after {
  opacity: 0.6;
}

/* Ghost / outline button */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  font-family: var(--font-display);
  font-weight: 500;
  padding: 12px 28px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-ghost:hover {
  color: var(--text-primary);
  border-color: var(--accent-primary);
  background: hsl(185, 100%, 50%, 0.05);
}
```

### Status Indicators

```css
/* Pulsing dot for active agents */
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
}

.status-dot--active {
  background: var(--status-active);
  animation: pulse 2s infinite;
}

.status-dot--idle {
  background: var(--status-idle);
}

.status-dot--error {
  background: var(--status-error);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; }
  50% { box-shadow: 0 0 0 6px transparent; }
}
```

---

## Animation & Motion

### Motion Principles

1. **Purposeful** — Every animation communicates a state change
2. **Fast** — UI transitions complete in 200-400ms; data transitions in 300-600ms
3. **Eased** — Use custom cubic-bezier curves, never `linear`
4. **Staggered** — Lists and grids animate children with delay cascades

### Easing Curves

```css
:root {
  --ease-out:        cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:     cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-bounce:     cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
```

### Framer Motion Defaults

```typescript
// Default animation config for Framer Motion
export const motionDefaults = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: {
    duration: 0.4,
    ease: [0.16, 1, 0.3, 1],
  },
};

// Staggered children (for lists, grids)
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Animated counter (for token usage — STR8FIRE-inspired)
export const counterAnimation = {
  from: 0,
  duration: 1.5,
  ease: [0.16, 1, 0.3, 1],
};
```

### Key Animations

| Element | Animation | Duration | Trigger |
|---------|-----------|----------|---------|
| Agent node activation | Scale 1→1.05 + glow ring | 400ms | Agent starts processing |
| Message flow edge | Animated dash-line along path | 600ms | Message sent between agents |
| Tool call badge | Slide-in from right + fade | 300ms | Tool invocation |
| Token counter | Counting up animation | 1.5s | Token count updated |
| Panel open/close | Height expand + fade children | 400ms | User toggle |
| New log entry | Slide down + fade in | 250ms | Event received |
| Error shake | Horizontal shake (3px) | 400ms | Error event |
| Loading skeleton | Shimmer gradient sweep | 1.5s loop | Data loading |
| Page transition | Slide + crossfade | 500ms | Route change |

---

## Page-by-Page Design

### Page 1: Landing / Marketing Page

**Layout:** Full-width sections, vertically stacked, scroll-driven reveals.

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR (sticky, blur-bg, logo + links + CTA)       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  HERO SECTION                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  "Orchestrate AI Agents                     │   │
│  │   Like Never Before"                        │   │
│  │                                             │   │
│  │  [Get Started →]  [View Demo]               │   │
│  │                                             │   │
│  │  ░░░░ Animated agent graph preview ░░░░      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  01 ── FEATURES BENTO GRID                         │
│  ┌────────┬──────────────────────┬─────────┐       │
│  │ Agent  │    Orchestration     │  MCP    │       │
│  │ Defn   │    Engine            │  Integ  │       │
│  ├────────┴───────┬──────────────┴─────────┤       │
│  │  Mission       │     Real-time          │       │
│  │  Control       │     Events             │       │
│  └────────────────┴────────────────────────┘       │
│                                                     │
│  02 ── HOW IT WORKS (numbered steps with animations)│
│                                                     │
│  03 ── LIVE DEMO EMBED (interactive terminal)       │
│                                                     │
│  04 ── TECH STACK (icon grid with hover details)    │
│                                                     │
│  05 ── GITHUB CTA (stargazer count, clone command)  │
│                                                     │
│  FOOTER                                             │
└─────────────────────────────────────────────────────┘
```

**Key design elements:**
- **Hero:** Dark gradient bg with animated particle/dot background, large gradient text headline + encrypted text reveal effect (Aceternity `EncryptedText`)
- **Bento grid:** Aceternity `BentoGrid` or Magic UI `BentoGrid` — asymmetric card grid with hover spotlight (Aceternity `CardSpotlight`)
- **Numbered sections:** Large faded `01`, `02`, `03` numbers behind each section (STR8FIRE-style)
- **Terminal embed:** Aceternity `Terminal` component showing a live code example
- **Smooth scroll:** Framer Motion `useScroll` + `useTransform` for parallax effects

### Page 2: Mission Control Dashboard

**Layout:** Full-viewport CSS Grid bento layout, no scrolling.

```
┌──────────────────────────────────────────────────────────┐
│  HEADER BAR (workflow name · status badge · timer · menu)│
├────────────┬─────────────────────────┬───────────────────┤
│            │                         │                   │
│  AGENT     │     GRAPH VIEW          │   INSPECTOR       │
│  LIST      │  ┌──→ ○ ──→ ○ ──┐      │   PANEL           │
│            │  │               │      │                   │
│  ○ Agent1  │  ○ ──→ ○ ──→ ○──┘      │  ┌─────────────┐ │
│  ○ Agent2  │                         │  │ Agent Detail │ │
│  ○ Agent3  │     (interactive node   │  │ Tool Calls   │ │
│  ○ Agent4  │      graph with         │  │ Messages     │ │
│            │      animated edges)     │  │ Token Usage  │ │
│            │                         │  └─────────────┘ │
├────────────┴─────────────────────────┤                   │
│                                      │                   │
│  TIMELINE / MESSAGE STREAM           │                   │
│  ┌──────────────────────────────┐    │                   │
│  │ 13:42:01  Agent1 → Agent2   │    │                   │
│  │ 13:42:03  Agent2 called tool │    │                   │
│  │ 13:42:05  Agent2 → Agent3   │    │                   │
│  └──────────────────────────────┘    │                   │
└──────────────────────────────────────┴───────────────────┘
```

**Key design elements:**
- **Agent graph:** React Flow or custom SVG with animated beam edges (Magic UI `AnimatedBeam`)
- **Agent list:** Cards with status dots, hover to highlight node in graph
- **Inspector:** Slide-out panel with tabbed content (agent details, tool calls, messages)
- **Timeline:** Auto-scrolling message feed with agent-colored badges
- **Counters:** Magic UI `NumberTicker` for live token counts
- **Background:** Subtle dot pattern (Magic UI `DotPattern`) underneath the graph

---

## Responsive Strategy

### Breakpoints

```css
/* Mobile-first breakpoints */
--bp-sm:   640px;   /* Phones landscape */
--bp-md:   768px;   /* Tablets */
--bp-lg:   1024px;  /* Laptops */
--bp-xl:   1280px;  /* Desktops */
--bp-2xl:  1536px;  /* Large monitors */
```

### Dashboard Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| **≥1280px** | Full 3-column grid (agents \| graph \| inspector) |
| **1024–1279px** | 2-column (agents+graph \| inspector as overlay) |
| **768–1023px** | Single column with tab navigation |
| **<768px** | Mobile — simplified agent list + message stream, no graph |

### Landing Page Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **≥1024px** | Full bento grid, horizontal nav, large hero text |
| **768–1023px** | 2-col bento grid, hero text scaled down |
| **<768px** | Stacked cards, hamburger menu, compact hero |

---

## Accessibility

### Requirements

| Area | Standard |
|------|----------|
| **Color contrast** | WCAG 2.1 AA (4.5:1 body text, 3:1 large text) |
| **Focus indicators** | Visible focus rings on all interactive elements |
| **Reduced motion** | `prefers-reduced-motion` disables all animations |
| **Screen readers** | ARIA labels on all graph nodes, status indicators, live regions |
| **Keyboard nav** | Full keyboard navigation in dashboard |

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### ARIA for Live Data

```html
<!-- Token counter with live updates -->
<div role="status" aria-live="polite" aria-label="Total tokens used">
  <span class="sr-only">Total tokens:</span>
  <span id="token-counter">12,847</span>
</div>

<!-- Agent status change -->
<div role="log" aria-live="polite" aria-label="Agent activity log">
  <!-- Auto-scrolling messages -->
</div>
```
