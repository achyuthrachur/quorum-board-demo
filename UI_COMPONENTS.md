# SENTINEL — UI Components and Page Architecture
## All pulled components, install commands, and page routing decisions
**Companion to:** `SENTINEL_PRD_v3.md`, `SENTINEL_KICKOFF_PROMPTS.md`, `UI_DECISIONS.md`
**Owner:** Achyuth Rachur, Crowe AI Innovation Team

---

## CRITICAL ARCHITECTURE DECISION — READ THIS FIRST

### Do NOT cram everything onto one page. Build separate routes for every major view.

The previous PRD draft described a single-page app with three panels crammed side by side.
That approach is wrong for this demo. Here is why and what to do instead:

**Why multi-page is better for this demo:**
- Each component gets full breathing room to show what it can do
- The presenter can navigate between views deliberately — each transition is a moment
- C-suite audiences follow a linear story, not a dashboard they have to scan
- Each page can use its hero component at full scale rather than squeezed into a panel
- The orbiting animation, radial orbital timeline, and shader background are all
  full-viewport components — they die at 320px panel width

**The routing philosophy:**
Every major step in the workflow is its own page with its own URL.
Navigation between pages is explicit — a button click, not a tab switch.
The only exception is the execution screen (Screen 03) where the live state panel
and execution log genuinely belong together.

---

## Page Routes — Full App Structure

```
/                          → Screen 01: Landing page
/configure                 → Screen 02: Meeting type selection + chat
/build                     → Screen 02b: Graph construction (orbiting animation)
/execute                   → Screen 03: Live graph execution
/review                    → Screen 03b: HITL CFO review gate (full page, not modal)
/report                    → Screen 04: Report output + download
/report/[section]          → Screen 04b: Individual section deep-dive (optional Phase 3)
```

**Navigation flow:**
```
Landing → Configure → Build → Execute → Review → Report
   /         /configure   /build   /execute   /review   /report
```

Each page transition should feel intentional. Use Next.js App Router with
`next/navigation` `router.push()` for programmatic navigation after each step completes.

---

## Page-by-Page Component Assignment

---

### Page 1 — `/` — Landing Page

**Purpose:** Hero introduction. Make the product feel serious and premium before
anyone clicks anything. First impression for the CFO/CRO audience.

**Layout:** Full viewport. No panels. Generous whitespace.

**Components used on this page:**

| Component | Role | Install |
|-----------|------|---------|
| ShaderBackground | Full-viewport animated hero background — plasma lines, depth | `npx shadcn@latest add https://21st.dev/r/minhxthanh/shader-background` |
| SpecialText | SENTINEL wordmark scramble-reveal on load | `npx shadcn@latest add https://21st.dev/r/tom_ui/special-text` |
| Header (header-3) | Sticky nav with dropdown menus, scroll-aware blur | `npx shadcn@latest add https://21st.dev/r/sshahaider/header-3` |
| ProcessSection | "How it works" four-step strip below the hero | `npx shadcn@latest add https://21st.dev/r/ravikatiyar162/how-we-do-it-process-overview` |
| AnimatedCounter | Stat strip — 8 agents, 3 meeting types, 100% auditable | `npx shadcn@latest add https://21st.dev/r/builduilabs/animated-counter` |

**NOTE on ShaderBackground:** The shader runs in WebGL on a fixed canvas behind
all other content. Layer the hero text, stats, and CTA over it using `z-10` and above.
The shader's default colors (purple/blue plasma) must be recolored to Crowe brand:
- Replace `bgColor1 = vec4(0.1, 0.1, 0.3, 1.0)` with indigo dark tones
- Replace `lineColor = vec4(0.4, 0.2, 0.8, 1.0)` with amber/indigo values
- This is a GLSL shader — changes go inside the `fsSource` string in the component

**NOTE on header-3:** Replace the WordmarkIcon SVG with the Crowe logo. The component
uses a custom SVG wordmark — swap it for a plain `<img>` tag pointing to
`crowe-logo-white-wordmark.png`. Header background must be Indigo Dark `#011E41`.

---

### Page 2 — `/configure` — Meeting Type Selection

**Purpose:** The presenter selects a meeting type or describes their context in chat.
The system recommends which agents to activate. This page gives the chat interface
and action search bar full space to breathe.

**Layout:** Two-column split. Left: meeting type cards. Right: chat interface.

**Components used on this page:**

| Component | Role | Install |
|-----------|------|---------|
| ActionSearchBar | Agent/scenario search and selection | `npx shadcn@latest add https://21st.dev/r/kokonutd/action-search-bar` |
| ClaudeChatInput | AI chat for describing meeting context | `npx shadcn@latest add https://21st.dev/r/suraj-xd/claude-style-ai-input` |
| SpotlightCard | Meeting type selector cards (3 cards) | `npx shadcn@latest add "https://21st.dev/r/DavidHDev/spotlight-card"` |
| Header (header-3) | Same sticky header as landing | Already installed |

**SpotlightCard config:**
```tsx
spotlightColor="rgba(245, 168, 0, 0.12)"  // Crowe amber spotlight
className="bg-white border border-[#BDBDBD] rounded-lg p-6 cursor-pointer"
```

**ClaudeChatInput color changes needed:**
- `bg-[#30302E]` → `bg-white`
- `border-zinc-700` → `border-[#BDBDBD]`
- `text-zinc-100` → `text-[#333333]`
- `placeholder:text-zinc-500` → `placeholder:text-[#828282]`
- Send button: `bg-amber-600` → `bg-[#011E41]`
- Remove the model selector dropdown entirely — not needed for SENTINEL

**ActionSearchBar:** Used for the scenario quick-select at the top of the left column.
Replace the example actions with the three SENTINEL scenarios:
- Falcon Board (8 agents)
- Audit Committee Brief (5 agents)
- Risk Flash (3 agents)

---

### Page 3 — `/build` — Graph Construction

**Purpose:** The meta-agent fires. Sub-agents orbit while the graph assembles.
This is the theatrical moment before execution begins. Gives the audience time
to understand what is being built before they watch it run.

**Layout:** Full viewport. Dark (Indigo Dark — data viz exception). Centred animation.

**Components used on this page:**

| Component | Role | Install |
|-----------|------|---------|
| OrbitingSkills | Sub-agents orbiting the meta-agent during graph construction | `npx shadcn@latest add https://21st.dev/r/olovajs/orbiting-skills` |
| SpecialText | "Assembling 8-node investigation graph" announcement text | Already installed |
| Header (header-3) | Minimal header, white logo on indigo | Already installed |

**OrbitingSkills config changes needed:**
- Replace the 6 tech skill icons with the 8 SENTINEL agent icons using Lucide React:
  - Inner orbit (3 nodes): `Settings2` (Financial), `Settings2` (Capital), `BarChart3` (Credit)
  - Outer orbit (5 nodes): `Sparkles` (Regulatory), `Sparkles` (Operational), `Layers` (Trend), `B14FC5` violet (Supervisor), `E5376B` coral (HITL)
- Replace `glow cyan/purple` with Crowe brand colors:
  - Inner orbit glow: `#0075C9` (Crowe Blue)
  - Outer orbit glow: `#B14FC5` (Crowe Violet)
- Central node: replace the code SVG with the Crowe logo or a network/grid icon
- Background: `bg-[#011E41]` — this page stays dark (it is a data visualization)
- Orbit paths: use `rgba(0,117,201,0.3)` and `rgba(177,79,197,0.3)` for ring glow

**Page flow:** This page auto-advances to `/execute` once the meta-agent returns
its topology. Show a "Graph ready — 8 nodes" message, then a "Begin analysis"
button, or auto-advance after 3 seconds with a countdown.

---

### Page 4 — `/execute` — Live Graph Execution

**Purpose:** The main execution screen. The graph runs node by node in real time.
This is the most technically complex page and the core of the demo.

**Layout:** Three columns — left controls, center graph, right state inspector.
Plus a fixed footer execution log. This is the one page that stays multi-panel
because all three pieces need to be visible simultaneously.

**Components used on this page:**

| Component | Role | Install |
|-----------|------|---------|
| RadialOrbitalTimeline | Clickable orbital node view — alternative to ReactFlow for presenting agent details | `npx shadcn@latest add https://21st.dev/r/jatin-yadav05/radial-orbital-timeline` |
| InteractiveLogsTable | Execution log footer — expandable log entries with filter | `npx shadcn@latest add https://21st.dev/r/moumensoliman/interactive-logs-table-shadcnui` |
| AnimatedCounter | Credit score, metric values in Live State panel | `npx shadcn@latest add https://21st.dev/r/builduilabs/animated-counter` |
| StatsCard (stats-card-2) | Financial metric cards in Live State panel with sparkline | `npx shadcn@latest add https://21st.dev/r/ravikatiyar162/stats-card-2` |
| @xyflow/react | ReactFlow graph canvas — the primary execution graph | `npm install @xyflow/react` |
| @dagrejs/dagre | Auto-layout for ReactFlow nodes | `npm install @dagrejs/dagre` |

**Two graph view modes — add a toggle:**
- MODE A: ReactFlow canvas (default) — shows the graph as a directed flow diagram
  with live edge animations and node state highlighting
- MODE B: RadialOrbitalTimeline — shows the same agents as clickable orbital nodes
  where each can be expanded to show its capabilities, type, and current output

This toggle is the key differentiator. Mode A is for technical audiences who
understand directed graphs. Mode B is for executive audiences who want to click
into each agent and understand what it does.

**RadialOrbitalTimeline config changes:**
- Background `bg-black` → `bg-[#011E41]` (Crowe Indigo Dark — data viz standard)
- Node expansion cards: change `bg-black/90` → `bg-[#002E62]`, borders to `rgba(255,255,255,0.1)`
- Status badges: map SENTINEL node states to the component's done/in-progress/pending
- Each `TimelineItem` maps to one SENTINEL agent node with:
  - `title`: node label (e.g. "Financial performance")
  - `content`: what the node is doing right now or its last output
  - `category`: node type (Rules engine / ML scoring / AI agent / etc.)
  - `status`: idle → pending, active → in-progress, completed → done
  - `energy`: completion percentage (0–100)
  - `relatedIds`: connected nodes in the graph topology

**InteractiveLogsTable config changes:**
- Background `bg-background` → `bg-white`
- Log level colors: map info/warning/error to Crowe semantic colors
- Used in the fixed 120px footer — set `h-screen` override to `h-[120px]`

---

### Page 5 — `/review` — HITL CFO Review Gate

**Purpose:** Execution has paused. The CFO reviews the assembled draft before
the report compiler fires. This is a FULL PAGE — not a modal overlay on the
execution screen. The gravity of the moment deserves its own page.

**Layout:** Centered card on a light background. No distractions.

**Components used on this page:**

| Component | Role | Install |
|-----------|------|---------|
| BasicModal (as full-page card) | The review card structure — backdrop, spring entrance | `npx shadcn@latest add https://21st.dev/r/larsen66/basic-modal` |
| Timeline | Step-by-step summary of what each completed agent found | `npx shadcn@latest add https://21st.dev/r/nyxbui/timeline` |
| Header (header-3) | Minimal header | Already installed |

**NOTE on BasicModal:** On this page, use BasicModal's card structure but render
it as a full-page centered layout rather than a portal overlay. The backdrop and
spring animation are still useful. Set `size="xl"` for a wide review card.

**Timeline usage on this page:**
Show a summary timeline of completed agents before the CFO approves:
```
✓ Financial performance — NIM compressed, efficiency ratio rising — AMBER
✓ Capital and liquidity — All ratios above well-capitalised — GREEN
✓ Credit quality — CRE concentration breach — RED
✓ Trend analyzer — NIM declining 4 consecutive quarters
✓ Regulatory digest — 1 overdue MRA flagged for escalation
✓ Operational risk — Vendor breach is board-reportable
```

**Page flow:** Two buttons at the bottom:
- "Approve — compile final package" → navigates to `/report`
- "Escalate to board" → navigates to `/report` with escalation flag in state

---

### Page 6 — `/report` — Board Package Output

**Purpose:** The final compiled report. Full document view. Download options.
Agent execution trace on the right. This page is what the CFO hands to the board.

**Layout:** Three columns — left TOC, center document, right agent trace.

**Components used on this page:**

| Component | Role | Install |
|-----------|------|---------|
| Timeline | Agent execution trace — right panel | Already installed |
| AnimatedCounter | Run stats in header — nodes executed, time elapsed | Already installed |
| Header (header-3) | Header with download button | Already installed |

**Timeline usage in agent trace:**
Each agent is a timeline item showing: name, type, duration, and 1-line output summary.
Use `status="done"` for all completed agents, `status="error"` for any that failed.

**Direct npm installs for this page:**
```bash
npm install docx
npm install file-saver
npm install @types/file-saver
```

---

## Complete Install Command List

Run all of these before starting Phase 2. Use `NODE_TLS_REJECT_UNAUTHORIZED=0`
prefix for all 21st.dev installs on the Crowe corporate network.

### 21st.dev / shadcn registry installs

```bash
# Screen 01 — Landing
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/minhxthanh/shader-background

# Screen 01 + Screen 03 build — Text animation
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/tom_ui/special-text

# All screens — Header navigation
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/sshahaider/header-3

# Screen 01 — How it works strip
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/ravikatiyar162/how-we-do-it-process-overview

# Screen 01 — Stat strip counter
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/builduilabs/animated-counter

# Screen 02 — Scenario selector cards
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/DavidHDev/spotlight-card"

# Screen 02 — AI chat input
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/suraj-xd/claude-style-ai-input

# Screen 02 — Action search bar
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/kokonutd/action-search-bar

# Screen 03 build — Orbiting agents animation
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/olovajs/orbiting-skills

# Screen 04 execute — Radial orbital agent view
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/jatin-yadav05/radial-orbital-timeline

# Screen 04 execute — Execution log footer
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/moumensoliman/interactive-logs-table-shadcnui

# Screen 04 execute — Financial metric cards with sparkline
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/ravikatiyar162/stats-card-2

# Screen 05 review — HITL modal card
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/larsen66/basic-modal

# Screen 05 + 06 — Agent execution trace timeline
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://21st.dev/r/nyxbui/timeline
```

### Direct npm installs

```bash
# Graph canvas and auto-layout
npm install @xyflow/react
npm install @dagrejs/dagre

# Document generation and download
npm install docx
npm install file-saver
npm install @types/file-saver

# Animation (if not already installed)
npm install motion
npm install animejs

# Modal click-outside handler (BasicModal dependency)
npm install usehooks-ts
```

### shadcn primitives (run these during Phase 0 scaffold)

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add tabs
npx shadcn@latest add textarea
npx shadcn@latest add separator
npx shadcn@latest add tooltip
npx shadcn@latest add progress
npx shadcn@latest add scroll-area
npx shadcn@latest add input
npx shadcn@latest add navigation-menu
```

---

## Color Changes Required Per Component

Every component above ships with dark zinc/gray or generic colors.
All must be updated to Crowe brand before use. Here is the full map:

| Component | Original color | Crowe replacement |
|-----------|---------------|-------------------|
| ShaderBackground | `vec4(0.1,0.1,0.3)` bg | Indigo Dark tones in GLSL |
| ShaderBackground | `vec4(0.4,0.2,0.8)` lines | `vec4(0.96,0.66,0.0)` amber |
| ClaudeChatInput | `bg-[#30302E]` | `bg-white` |
| ClaudeChatInput | `border-zinc-700` | `border-[#BDBDBD]` |
| ClaudeChatInput | Send btn amber | `bg-[#011E41]` |
| SpotlightCard | Default spotlight | `rgba(245,168,0,0.12)` amber |
| OrbitingSkills | `bg-gray-800` node cards | `bg-[#002E62]` |
| OrbitingSkills | Cyan/purple glow | `#0075C9` / `#B14FC5` |
| RadialOrbitalTimeline | `bg-black` | `bg-[#011E41]` |
| RadialOrbitalTimeline | Card `bg-black/90` | `bg-[#002E62]` |
| BasicModal | `bg-zinc-900` | `bg-white` |
| BasicModal | `border-zinc-800` | `border-[#BDBDBD]` |
| BasicModal | `text-zinc-100` | `text-[#333333]` |
| InteractiveLogsTable | `bg-background` dark | `bg-white` |
| StatsCard | `bg-card` generic | `bg-white border-[#BDBDBD]` |
| Timeline | `text-primary` | `color: #011E41` |
| header-3 | WordmarkIcon SVG | Replace with Crowe logo img |
| header-3 | Header bg transparent | `bg-[#011E41]` always |
| AnimatedCounter | `bg-card` | `bg-white` |
| ProcessSection | Generic primary | Amber `#F5A800` |

**Typography rule for all components:**
Replace any instance of `font-mono` used for labels with `IBM Plex Mono`.
Replace any instance of display headings with `IBM Plex Sans` bold.
Remove any `font-serif` usage — not in Crowe brand.

---

## Framer Motion vs Motion/React — Important

Several components use `framer-motion` (the old package name).
SENTINEL uses `motion` (the new package, `motion/react` import path).
They are different packages. When you encounter `import { motion } from "framer-motion"`
in any pulled component, change it to `import { motion } from "motion/react"`.

Components that need this fix:
- `stats-card-2` (SparkLineChart uses framer-motion)
- `basic-modal` (uses framer-motion)
- `animated-counter` (uses framer-motion)

If both packages end up installed, that is fine — they can coexist. But prefer
`motion/react` for any new code you write.

---

## Page Transition Notes for Claude Code

When building the routing:

1. Use Next.js App Router. Each page above is a folder under `src/app/`.
2. Pass state between pages via URL params or Zustand store — not component props.
   The `runId`, `scenarioId`, `graphTopology`, and `hitlDecision` all need to
   survive page transitions.
3. The Zustand store (`executionStore`) must persist across page navigations.
   Use `persist` middleware with `sessionStorage` so state survives a page push
   but is cleared when the session ends.
4. SSE connection (`/api/stream/[runId]`) must remain open across the transition
   from `/execute` to `/review`. Do not close the stream on page unmount during
   the HITL pause — only close it on `execution_complete` event or explicit reset.
5. The `/build` page is a loading/transition screen. It should auto-advance.
   Do not let the user get stuck on it — always provide a manual "skip" button
   in case the meta-agent takes longer than expected.
6. Add a `useEffect` on each page that checks Zustand state on mount —
   if required state is missing (e.g. arriving at `/execute` without a `runId`),
   redirect back to `/configure` automatically.

---

## File Locations

All pulled components land in `src/components/ui/` after the shadcn CLI installs them.
Do not move them. Import from `@/components/ui/[component-name]`.

---

*UI Components Reference v1.0 | Crowe AI Innovation Team | March 2026*
*Companion to SENTINEL_PRD_v3.md — use with SENTINEL_KICKOFF_PROMPTS.md and UI_DECISIONS.md*
