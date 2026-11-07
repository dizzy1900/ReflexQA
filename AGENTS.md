# AGENTS.md

Frontend conventions for ReflexQA. These rules apply to every file in this repository. Follow them exactly.

## Tech Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (`strict: true`) |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Animation | Framer Motion |
| State | Zustand |
| Rendering (high-frequency visuals) | Canvas API |

Rules:

- Use the App Router only (`/app`). Do not add a `/pages` directory.
- Components are Server Components by default. Add `"use client"` only to files that use state, effects, browser APIs, Framer Motion, or Zustand.
- Do not add other UI, icon, animation, or state libraries without approval.
- Do not use `any`. Prefer `unknown` plus narrowing, and export shared types from the module that owns them.
- Use Lucide React for every icon. Do not use emoji or inline SVG as icons.
- Use the Canvas API for anything that redraws per frame or per event stream (screenshots overlays, bounding boxes, trace timelines). Do not model those as large DOM trees.

## Visual Standard

### Theme

Ultra-dark, in the spirit of Linear and Vercel. There is no light mode.

| Token | Value |
| --- | --- |
| Background | `#070709` |
| Card surface | `#0f0f13` |
| Card border | `rgba(255,255,255,0.07)` |

- Define these as design tokens in `tailwind.config.ts` (and CSS variables in `app/globals.css`). Reference the tokens in components. Do not scatter raw hex values through JSX.
- Text uses a white-to-zinc scale on the dark background. Keep body text at WCAG AA contrast or better.
- Use one accent family for focus and glow, plus semantic colors for status (success, warning, danger, info). Define them as tokens too.
- Borders are always 1px at the card border token. Raise to a brighter alpha on hover or focus, never to a solid color.

### Typography

- Body and UI text: Inter or Geist (pick one and use it everywhere, loaded via `next/font`).
- Metrics, IDs, timestamps, coordinates, logs, and code: Geist Mono or JetBrains Mono (loaded via `next/font`).
- Apply `tabular-nums` to **all dynamic data**: counters, timers, percentages, latencies, coordinates, step numbers, and anything that updates live. This prevents layout jitter.

### Component Architecture

Strict separation by domain. Do not import across domains except through the shared store and shared types.

```
/components
  /target        # The app/page under test: viewport, frame, and overlays on it
  /meta-vision   # Perception layer: what the agent sees (detections, annotations, canvas overlays)
  /subq-hud      # Sub-question / sub-task HUD: progress, status, step metrics
  /director      # Orchestration controls: run/pause/stop, goal input, step control
/store
  useAgentStore.ts   # Single Zustand store for shared agent state
```

Rules:

- Each domain folder owns its components, local hooks, and local types. Keep one component per file, named in PascalCase, with an `index.ts` only if the folder needs a public surface.
- Components never import from sibling domain folders. If two domains need the same data, it lives in `useAgentStore`.
- `/store/useAgentStore.ts` is the only global store. Do not create additional global stores or React context for agent state.
- Select narrowly from the store (`useAgentStore((s) => s.field)`). Never subscribe to the whole store.
- Actions live in the store. Components call actions, they do not reimplement state transitions.
- Truly generic primitives (Button, Badge, Card, Glow) go in `/components/ui` and must follow the interaction rules below. They are domain-neutral and must not read the store.

## Critical Rule: No Unstyled Primitives

Never use generic unstyled `div`s as UI, and never use basic alert boxes.

- Banned: `window.alert`, `window.confirm`, `window.prompt`, and any browser-default dialog or unstyled notification. Use styled in-app modals, toasts, or inline callouts instead.
- Banned: bare `<div>` as a visual element (card, panel, badge, button, row). Wrap content in a styled component from `/components/ui` or a domain component that applies the theme tokens.
- Use semantic elements where they apply (`button`, `nav`, `section`, `ul`, `dialog`, etc.). Plain layout `div`s are allowed only as structural wrappers that carry no visual meaning, and they must still use theme-aware classes.
- No browser-default buttons, inputs, scrollbars, or focus rings. Style all of them to the theme.

### Interaction and Motion Requirements

Every interactive state, button hover, and status badge must have all three of the following:

1. **Subtle transitions.** Color, border, opacity, and shadow changes animate (150-250ms, ease-out). Nothing snaps.
2. **Custom glow shadows.** Hover, focus, active, and status states use a tinted, low-opacity glow (for example `shadow-[0_0_24px_-4px_rgba(<accent>,0.45)]`), not default Tailwind drop shadows.
3. **Spring animations.** Use Framer Motion springs for entrances, exits, hover/tap feedback, layout changes, and badge state changes.

Reference spring (tune per component, keep it snappy and not bouncy):

```ts
export const spring = { type: "spring", stiffness: 400, damping: 30, mass: 0.8 } as const;
```

Share springs and variants from a single module (for example `/lib/motion.ts`) rather than redefining them per component.

Requirements by element:

- **Buttons:** hover (glow + border brighten), `whileTap` scale-down, visible `focus-visible` ring with glow, and distinct disabled and loading states.
- **Status badges:** each status (idle, running, passed, failed, warning) has its own color and glow. Changes between statuses animate via spring, not a hard swap. Running states may pulse subtly.
- **Cards and panels:** animate in with a spring (fade plus small translate). Hover on interactive cards brightens the border and adds glow.
- **Lists and HUD items:** use `AnimatePresence` and `layout` so items enter, exit, and reorder with springs.
- **Inputs:** focus animates the border and glow.

### Accessibility and Performance

- Respect `prefers-reduced-motion`: use Framer Motion's `useReducedMotion` or `MotionConfig reducedMotion="user"` and drop springs and pulses to simple fades.
- Every interactive element is keyboard reachable with a visible focus state.
- Icon-only buttons need an `aria-label`.
- Animate only `transform` and `opacity` where possible. Keep Canvas draw loops on `requestAnimationFrame`, size the canvas for `devicePixelRatio`, and clean up listeners and frames on unmount.

## Definition of Done

Before finishing any frontend change:

- It uses only the tokens, fonts, and libraries above.
- Code sits in the correct domain folder and respects the import rules.
- Every dynamic number uses `tabular-nums` and a mono font where it is a metric.
- Every interactive element and status badge has a transition, a glow, and a spring.
- No banned browser dialogs or unstyled `div` primitives were introduced.
- `tsc --noEmit` and `next lint` pass, and `next build` succeeds.
