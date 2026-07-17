# DESIGN.md

## Theme
Dark only. Scene: an engineer watching a multi-agent run stream in at night in a dim room, next to their editor and terminal. Surfaces stay near-black so the animated execution state carries the light.

## Color
- Base surfaces: Tailwind neutral scale, tinted not pure: `bg-neutral-950` (app), `bg-neutral-900` (raised), `border-neutral-800` (all borders).
- Text: `text-neutral-100` primary, `text-neutral-400` secondary, `text-neutral-500` muted.
- Accent: indigo-500, flat fills only. Primary actions, active nav, selection outlines. Never glows, never gradients.
- State: emerald-500 success/connected, amber-500 warning/retry, red-400 error. Used only for state, at small sizes (dots, thin outlines, status text).
- Node identity colors (per node-kind accent in canvas nodes/palette) are established and stay.

## Depth & shape
- Radii: `rounded-md` controls, `rounded-lg` panels. Nothing larger.
- Elevation: 1px `border-neutral-800` borders plus `shadow-sm` maximum. No glow shadows, no glass/blur beyond `backdrop-blur-sm` on overlays, no decorative gradients, no rings.

## Typography
- UI: app default sans, 13–14px body in panels; 11px `font-mono` uppercase tracking-wide reserved for meta labels (counts, timestamps, section tags).
- Hierarchy via size + weight, not color or borders.

## Motion
- 80–180ms ease-out for hover/selection/panel transitions. Continuous subtle motion only for live execution (edge flow, status pulse). No bounce, no overshoot, no scale-pop on hover.

## Components
- Panels: `rounded-lg border border-neutral-800 bg-neutral-950`, header row `px-4 py-3 border-b border-neutral-800`.
- Buttons: `rounded-md`; primary = flat indigo-500; secondary = `border-neutral-800 hover:bg-neutral-900`.
- Inputs/selects: `rounded-md bg-neutral-900 border-neutral-800`, focus `border-neutral-600`, no focus rings in color.
- Status dots: 6–8px solid circles, no glow.
