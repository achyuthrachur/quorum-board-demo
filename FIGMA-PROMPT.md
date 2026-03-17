# Figma Design Brief — Sentinel Board Intelligence Platform
> Paste this entire document into Figma AI / Make Designs as your design prompt.
> Goal: generate polished UI concepts for each screen that can be turned into a Claude Code build spec.

---

## What This Application Is

**Sentinel** is a multi-agent AI platform built by Crowe LLP's AI Innovation Team. It helps bank executives (CFOs, board members, risk officers) generate board-ready intelligence packages — financial performance summaries, capital ratios, credit quality analysis, regulatory status, and operational risk — all compiled by a graph of specialized AI and rules-engine agents.

The platform is a 5-step workflow:
1. **Configure** — User picks a meeting type (Full Board, Audit Committee, Risk Flash) and optionally chats with an AI assistant to configure the agent graph
2. **Build** — A meta-agent assembles the right set of nodes into an execution graph (animated loading/transition screen)
3. **Execute** — The agent graph runs live. The user watches nodes activate, complete, and stream results in real time
4. **Review** — If a HITL (Human-in-the-Loop) gate is enabled, execution pauses for CFO approval before the final report is compiled
5. **Report** — The finished board intelligence package is displayed, with export to DOCX

This is a **professional enterprise tool** — think Bloomberg Terminal meets Cursor IDE, not a consumer SaaS product.

---

## Brand System

### Colors
| Token | Hex | Usage |
|---|---|---|
| **Indigo Dark** | `#011E41` | Primary background, header, dark panels |
| **Surface** | `#002E62` | Elevated surfaces on dark backgrounds |
| **Surface Raised** | `#003F9F` | Cards/panels on dark backgrounds |
| **Amber** | `#F5A800` | Primary accent — CTAs, active states, highlights |
| **Amber Bright** | `#FFD231` | Hover state for amber |
| **Teal** | `#05AB8C` | Success, completed, "live" indicator |
| **Cyan** | `#54C0E8` | Hybrid nodes, secondary accent, sparklines |
| **Coral** | `#E5376B` | Error, HITL/human review, destructive |
| **Violet** | `#B14FC5` | Orchestrator nodes |
| **Blue** | `#0075C9` | Deterministic/rules engine nodes |
| **Text Primary (dark bg)** | `#FFFFFF` | Primary text on dark |
| **Text Muted (dark bg)** | `rgba(255,255,255,0.5)` | Secondary text on dark |
| **Text Muted (dark bg) cyan tint** | `#8FE1FF` | Labels, section headers on dark |
| **Text Primary (light bg)** | `#333333` | Primary text on white |
| **Text Secondary (light bg)** | `#4F4F4F` | Body copy on white |
| **Text Muted (light bg)** | `#828282` | Labels on white |
| **Panel White** | `#FFFFFF` | Light panel backgrounds |
| **Page Gray** | `#F4F4F4` | Page background for light sections |
| **Border (light)** | `#BDBDBD` | Borders on light panels |
| **Border (dark)** | `rgba(255,255,255,0.08)` | Borders on dark panels |
| **Border Active** | `rgba(245,168,0,0.4)` | Active/selected border (amber glow) |

### Typography
- **Display / Wordmark**: Syne — weight 700–800. Used for SENTINEL wordmark, major headings
- **Body**: IBM Plex Sans — weight 400–700. Used for all UI text, labels, descriptions
- **Mono**: IBM Plex Mono — weight 400–700. Used for badges, data values, timestamps, status labels, step indicators, technical metadata

### Design Language
- **Dense, information-rich** — This is a professional tool. Every pixel should carry meaning.
- **Dark-primary** — The application lives in dark indigo. Light-mode panels are used selectively for document-style content (reports, review cards).
- **Amber as the action color** — The amber `#F5A800` is the singular primary action color. All CTAs, active node borders, selected states use amber.
- **Colored left-border accents** — Cards, panels, and nodes use a 3-4px colored left border as the primary type indicator, not icon colors.
- **Mono for metadata** — Anything technical: timestamps, IDs, status strings, badges, step numbers → IBM Plex Mono.
- **No rounded-corner excess** — Sharp or mildly rounded (4-8px). This is not a consumer app.
- **Glow effects on active nodes** — When an agent node is running, it glows in its type color. This is a signature visual.

### Node Type Color System
Every agent node has a type, and types have canonical colors used consistently:
| Type | Color | Label |
|---|---|---|
| Orchestrator | `#B14FC5` (violet) | ORCHESTRATOR |
| Deterministic / Rules Engine | `#0075C9` (blue) | RULES ENGINE |
| Algorithmic / ML Scoring | `#05AB8C` (teal) | ML SCORING |
| Hybrid | `#54C0E8` (cyan) | HYBRID |
| LLM / AI Agent | `#F5A800` (amber) | AI AGENT |
| Human / HITL | `#E5376B` (coral) | HUMAN REVIEW |

---

## The 10 Agents (Node Registry)

These are all the agents that can appear in a graph:

| ID | Label | Type | What it does |
|---|---|---|---|
| `meta_agent` | Meta Agent | Orchestrator | Constructs the dynamic execution graph |
| `financial_aggregator` | Financial Aggregator | Rules Engine | Computes NIM, ROA, ROE, efficiency ratio from raw data |
| `capital_monitor` | Capital Monitor | Rules Engine | Evaluates CET1, Tier 1, Total Capital, LCR, NSFR vs thresholds |
| `credit_quality` | Credit Quality | ML Scoring | Scores credit health: NPL, provision coverage, NCO, HHI concentration |
| `trend_analyzer` | Trend Analyzer | Hybrid | 5-quarter rolling trends + narrative interpretation |
| `regulatory_digest` | Regulatory Digest | AI Agent | Synthesizes open MRAs, overdue items, upcoming exams |
| `operational_risk` | Operational Risk | AI Agent | Analyzes incidents, control gaps, escalation flags |
| `supervisor` | Supervisor | Orchestrator | Reviews all outputs, decides loop-back or proceed |
| `hitl_gate` | HITL Gate | Human Review | Pauses execution for human approval |
| `report_compiler` | Report Compiler | AI Agent | Assembles final board intelligence report |

---

## The 3 Scenarios

| ID | Label | Meeting Type | Nodes | HITL? |
|---|---|---|---|---|
| `falcon-board` | Falcon Board Q4 | Full Board of Directors | All 10 agents | Yes — CFO must approve before compilation |
| `audit-committee` | Audit Committee Mid-Cycle | Audit Committee | Meta + Regulatory + Operational Risk + Supervisor + Compiler | No |
| `risk-flash` | Risk Flash | Risk Committee | Meta + Capital + Credit + Compiler | No — auto-compiles if all green |

---

## Current Screen Inventory & Problems

### Screen 1: Landing Page (`/`)

**What exists:**
- Full-height dark hero with shader animation background
- "From fragmented data to a board-ready package" headline (52px Syne)
- Two CTAs: "Start a board package" (amber) and "Watch the demo" (ghost)
- Animated stat strip: 8 agents / 3 meeting types / 1 human review gate / 100% auditable
- Right side: a diagram card showing 6 agent nodes with colored left borders
- White "How it works" section below with 4 step cards in a 4-column grid
- Simple indigo footer

**Problems:**
- The hero right-side diagram card is static — just a list, not truly diagrammatic
- The "How it works" section is plain and doesn't visually convey the multi-agent graph concept
- No visual demonstration of what the product actually produces (no mockup of the graph canvas or report)
- Stat strip numbers are small — 40px — could be more dramatic
- The CTA buttons are functional but not memorable

**What to redesign:**
- Hero: Make the right side a more compelling visual — show an actual animated graph preview or a mockup of the execute screen
- "How it works": Replace the static 4-column text grid with a more visual flow diagram
- Add a third section that shows a preview of the actual board report output
- Make the page feel like a premium B2B intelligence tool, not a standard SaaS homepage

---

### Screen 2: Configure Page (`/configure`)

**What exists:**
- Fixed 64px dark indigo header (always present)
- Step progress indicator in the header center: 1 Configure → 2 Build Graph → 3 Execute → 4 Review & Export
- Two-column layout below header: left panel (white, 1fr) + right chat panel (fixed 420px)
- **Left panel:** Action search bar at top, then "Step 1 — Meeting type" heading, three clickable scenario cards, an "OR" divider, and a large "Build agent graph" CTA button at the bottom
- **Right panel:** Chat interface with Sentinel AI that can recommend scenarios; shows active agent pills (colored node type badges); chat message bubbles (Sentinel vs User); text input with send button
- Scenario cards: show meeting type, title, description, colored agent type pills (e.g. META › FIN › CAP › CRD › REG › HITL), and agent count/HITL badges

**Current problems:**
- The left panel has a white (#FFFFFF) background that clashes jarringly with the dark indigo header — looks like two separate applications
- NodePill text (agent type badges like "FIN", "CAP", "CRD") is only 9px — unreadable
- The scenario cards look like plain form elements with no depth or visual hierarchy
- The "OR describe what you need in the chat →" divider feels like an afterthought
- No loading state while the API call builds the graph — just a disabled button
- The chat panel is functional but minimal — no sense of AI intelligence or sophistication

**What to redesign:**
- The overall page should feel like one cohesive dark application, not a white web form with a dark header stuck on top
- Consider a full dark-mode layout: dark background, semi-transparent panels with glassmorphism effect for scenario cards
- The scenario cards should feel premium — perhaps larger with more visual distinction, or displayed as a horizontal selector with a preview panel
- The agent type pills need to be legible and distinctive
- The chat panel should feel like an intelligent assistant, not a bare chat input
- The "Build agent graph" button should be the most prominent element, with a clear loading state
- Step indicators in the header should be more prominent and visually guide the user through the workflow

**Key interactions:**
- Clicking a scenario card selects it (amber left border + subtle background change)
- The chat can auto-select a scenario based on user description
- Clicking "Build agent graph" starts the pipeline → navigates to Build screen

---

### Screen 3: Build Page (`/build`)

**What exists:**
- Full-screen dark indigo background
- Orbiting animation in the center (OrbitingSkills component): inner orbit with 3 deterministic agents, outer orbit with 5 LLM/human agents, all orbiting a center icon
- Text below animation: "Building investigation graph" → then changes to "Investigation graph assembled" with node count
- 3-second countdown then auto-advances to Execute
- "Begin analysis →" amber button and "Skip → go to execute" ghost button

**Current problems:**
- The orbiting animation is decorative but doesn't communicate which specific nodes were selected by the meta-agent
- The text has encoding bugs (corrupted unicode characters show as `?+"`, `A·`, `?+'`)
- 3-second countdown is too fast — users can't read what was assembled
- No clear display of the meta-agent's rationale (why these agents?)
- The page feels more like a loading screen than a meaningful "graph assembly" moment

**What to redesign:**
- This screen is a key narrative beat — the meta-agent just decided which agents to use. Show that decision visually.
- Consider displaying the selected nodes as an emerging graph diagram (nodes appear one by one as the meta-agent "selects" them)
- Show the meta-agent's reasoning/rationale (1-2 sentences about why this topology was chosen)
- The countdown should be longer (5 seconds) and more visible
- The transition into the execute screen should feel purposeful — a graph "snapping into formation"

---

### Screen 4: Execute Page (`/execute`)

**What exists:**
- Fixed dark header with: scenario name chip, running status (X of Y nodes), GRID/ORBIT view toggle, Compare button, Reset button
- **Three-column layout** (below header, above log footer):
  - Left sidebar (300px, white): Scenario switcher chips, Speed controls (Slow/Normal/Fast), Reset button, Node type legend
  - Center canvas (dark indigo `#011E41`): ReactFlow graph with custom nodes. Nodes are 200×88px dark navy cards with colored 4px left borders. Active nodes glow and animate. Edges animate with dots traveling along them. Animated grid pattern overlaid.
  - Right panel (380px): StatePanel with 3 tabs — "Live State", "Report", "Download"
- **Footer log bar (120px, fixed)**: "Agent log" vertical label on dark indigo sidebar, then an interactive logs table showing agent execution entries
- **Live State tab** content (dark themed — white text on dark): animated counter of completed agents, sparkline trend charts (NIM/ROA/ROE), financial metric rows with variance badges, capital ratio bars, credit health ring chart

**Critical current problem:**
The right panel container is white (#FFFFFF) but the LiveStateTab content uses dark theme styles (white text, dark card backgrounds). The result: **all the live metric data is invisible — white text on white background.**

**Other problems:**
- 300px + 380px sidebars leave only ~686px for the graph canvas on a 1366px screen
- 120px footer is too shallow — only shows 2 log rows
- Left sidebar fonts: 10px section labels, 10px speed buttons — too small
- No error state when execution fails — graph just freezes indefinitely
- The GRID/ORBIT view toggle exists but the orbit view (RadialOrbitalTimeline) is large and doesn't fit well in the center panel

**What to redesign:**
- The right panel MUST be dark — it contains dark-themed content
- Give the overall layout more breathing room — consider collapsible sidebars
- The main graph canvas should dominate the screen (it's the hero visual of this screen)
- The log footer should be more useful — consider a slide-up panel or tabbed interface
- The live state metrics should feel like a real-time financial dashboard
- Add a clear error state with recovery action when execution fails
- The node cards in the graph: consider making them slightly larger and more readable
- Active node animation (glow + border beam) is good — preserve this

**Node execution states:**
- `idle` — faded, 42% opacity
- `active` — full opacity, glowing in type color, pulsing border beam animation, spinning processing dot top-right
- `completed` — full brightness flash, type-color checkmark badge top-right
- `paused` (HITL gate only) — coral glow, amber pulsing

**Graph edge types:**
- Default edges: animated dots traveling from source to target
- Conditional edges (supervisor → HITL or compiler): labeled "PROCEED" or "SKIP_HITL"

---

### Screen 5: Review Page (`/review`)

**What exists:**
- Dark header with coral-tinted status chip: "Execution paused — CFO review required"
- Light gray (`#F4F4F4`) page background
- A centered white modal card (max-width 720px) with:
  - Red top border
  - "CFO review gate · HITL" badge in coral
  - "Agent analysis complete — review before compilation" headline
  - Explanation paragraph
  - Timeline showing each agent's key finding with RAG status badge (GREEN/AMBER/RED)
  - Two action buttons: "Approve — compile final package" (amber, full-width) and "Escalate to board — flag for additional review" (ghost)

**Current problems:**
- The page has a double-padding bug (paddingTop: 64 then padding: '80px 24px' — the first is overridden, causing the card to not properly clear the header on short viewports)
- The page background is a flat light gray that feels disconnected from the dark header
- The modal card is functional but feels like a generic dialog, not a high-stakes decision moment
- No display of the actual draft content — just finding summaries. The CFO can't preview what they're approving.

**What to redesign:**
- This is the highest-stakes interaction in the app — the CFO is deciding whether to release a board report. Make it feel like it.
- Consider a split-panel layout instead of a centered modal: left shows the agent findings summary (current modal content), right shows a preview of the draft report sections
- The APPROVE action should be unambiguous and prominent — it should feel serious, not just a yellow button
- The ESCALATE action should have a text input where the CFO can add a note
- The coral/warning treatment should be more atmospheric — this is a pause state, which is notable
- RAG traffic light indicators (GREEN/AMBER/RED) should be more visually dominant — consider a RAG summary row at the top showing the overall risk posture

---

### Screen 6: Report Page (`/report`)

**What exists:**
- Dark header with: "Package complete" teal badge, animated node count, "Demo content" badge, CFO approval status badge, Download DOCX button (amber), Copy markdown button, New package button
- **Three-column layout:**
  - Left TOC (240px, white): Table of contents with section list, RAG indicator dots, agent run-time breakdown at the bottom
  - Center document (light gray page, scrollable): White document card (max-width 700px) with institution name header, meeting type/date, "Prepared by Sentinel · Crowe AI" attribution, "Confidential" badge, then all report sections
  - Right trace panel (300px, white): "Agent execution trace" with a timeline showing each agent's contribution

**Current problems:**
- All three panels are white/light — the page has no visual anchor to the dark Sentinel brand
- The report document renders well as a document but feels like a plain HTML page
- The right agent trace timeline is functional but could better tell the story of how the report was assembled
- The TOC left panel at 240px is narrow for longer section names
- No visual highlighting when scrolling to a section in the TOC
- The download button is the most important action but it's in the header competing with 3 other buttons

**What to redesign:**
- The left TOC and right trace panel should potentially be dark-themed (indigo) to frame the white document in the center
- This creates a "book on a desk" aesthetic — the document is the hero, dark panels provide contrast
- The TOC should have better visual hierarchy — section numbers prominent, titles readable, RAG dots clearly communicating risk
- The right trace panel should feel more like a "making of" — show which agent produced which section
- The download CTA should be more prominent — perhaps a sticky action bar at the bottom of the page
- Consider adding a "RAG summary strip" at the top of the document showing overall package health at a glance
- The "Confidential" badge and attribution should look like a real document header

---

## Screen-by-Screen Design Priorities (for Figma concepts)

Generate UI concepts for all 6 screens. For each screen, the priority constraints are:

### Universal constraints across all screens:
1. **IBM Plex Sans** for all body text. **Syne** for headlines and the SENTINEL wordmark. **IBM Plex Mono** for all badges, status labels, timestamps, data values, step indicators.
2. **Minimum font size: 12px** for any visible UI text. Badges and mono labels can go to 11px. Nothing below 11px.
3. **Amber (#F5A800) is the only primary CTA color.** Secondary actions use ghost/outline style with white or gray text.
4. **Left-border accent pattern** — panels, cards, and nodes use a colored left border (3-4px) as the primary type indicator.
5. **The application is primarily dark.** Light panels are used only for document content (reports, forms). Mixed-mode screens should feel intentional, not accidental.

### Configure screen priority:
- **Cohesion** — Dark background or dark header that flows naturally into the panel below it. No jarring white-on-dark switch.
- **Scenario cards must feel selectable** — This is the primary decision point. The cards should feel like high-quality choice tiles, not form radio buttons.
- **Agent pills must be legible** — The colored node type sequence (META › FIN › CAP › etc.) is important product information. Minimum 11px, good contrast.

### Execute screen priority:
- **Right panel must be dark** — The live metrics (NIM/ROA/ROE sparklines, capital bars, credit ring) are dark-themed and must sit on dark background.
- **Graph canvas must dominate** — The animated ReactFlow graph is the hero visual. Sidebars should support it, not compete.
- **Readable metrics** — The live state panel is essentially a real-time financial dashboard. Design it accordingly.

### Report screen priority:
- **Document-first** — The white report document is the hero. Everything else frames it.
- **Download CTA prominence** — The #1 job of this screen is to get the user to download the DOCX. Make that action impossible to miss.

---

## Specific UI Patterns to Design

These are reusable components that appear across multiple screens. Design them once and use consistently:

### 1. Node Card (used in Execute graph canvas)
- 200×88px minimum
- Dark navy background (`rgba(0,46,98,0.85)`)
- 4px colored left border (node type color)
- Interior: badge label (type, all caps, mono, 10px), agent name (13px bold, white), status indicator (idle/active/completed/paused)
- Active state: pulsing glow + border beam animation + pulsing colored dot top-right
- Completed state: brightness flash + checkmark badge top-right in type color
- Paused state (HITL only): coral pulsing glow

### 2. RAG Badge
- Inline badge: pill shape, background color at 15% opacity, border at 30% opacity, bold mono text
- GREEN: teal tones
- AMBER: amber tones
- RED: coral tones
- Used in: report sections, review timeline, live state panel

### 3. Step Indicator (header center on Configure)
- 4 steps: Configure → Build Graph → Execute → Review & Export
- Active step: filled amber circle with number, white text label
- Inactive step: outlined dim circle with number, muted text label
- Connected by thin chevron/arrow separators
- Compact enough to fit in the 64px header

### 4. Scenario Card
- Bordered card (1.5px border, amber when selected, light gray otherwise)
- 4px amber left border when selected, transparent when not (maintains layout)
- Header: meeting type tag (mono, amber, 11px), scenario title (16px bold), description (13px)
- Footer: agent type pill sequence + count/HITL badges

### 5. Agent Type Pill
- Compact badge: type color background at 15%, type color border at 30%, type color dot (4px), 3-letter code (e.g. FIN, CAP, REG)
- Font: IBM Plex Mono, 11px, bold
- Used in scenario cards, chat panel agent strip

### 6. Live Metric Row (State Panel)
- Dark card: `rgba(0,0,0,0.15)` background, `rgba(255,255,255,0.06)` border
- Label: uppercase mono, 11px, `#8FE1FF`
- Value: 17-18px semi-bold, white
- Prior period: 12px, muted
- Variance badge: inline colored pill (green if positive, amber if slightly negative, red if significantly negative)

### 7. Execution Log Row (footer table)
- Agent name, node type badge, timestamp, duration, status
- Alternating subtle row backgrounds on dark
- Human/HITL rows should be visually distinct (coral accent)

---

## The "Moments" to Capture

These are the 3 key emotional beats of the user journey. Design them to feel distinct:

**Moment 1 — The Selection** (Configure screen): The user is about to trust AI to assemble their board package. The screen should communicate intelligence, precision, and control. The scenario cards are a high-stakes choice.

**Moment 2 — The Graph Running** (Execute screen): Agents are firing. Numbers are streaming in. The CFO is watching the AI work. This is the "wow" moment. The graph canvas with glowing, animating nodes should feel like watching a team of specialists analyze their bank in real time.

**Moment 3 — The Approval** (Review screen): The AI has done its work. The human is in control now. This is a serious, high-stakes review. The screen should feel like opening a briefing document, not clicking through a form.

---

## Output Format Request

Please generate:

1. **6 full-page UI concepts** (one per screen: Landing, Configure, Build, Execute, Review, Report)
2. **1 component sheet** showing all the reusable UI patterns (Node Card variants, RAG badges, Step Indicator, Scenario Card, Agent Type Pill, Live Metric Row)
3. For each full-page concept, show both the **default state** and at least one **active/in-progress state** (e.g. Execute with a node actively running, Configure with a scenario selected and chat active)

Design style: **Enterprise dark SaaS** — reference Linear, Vercel dashboard, Railway, Retool, or DataDog for the density and precision. Not Notion, not Figma itself, not a consumer app. The product is for bank executives and Crowe advisors; it should feel like it belongs in a boardroom, not on Product Hunt.

---

## Technical Context (for the build spec handoff to Claude Code)

The application is built with:
- **Next.js 14 App Router** (`src/` directory structure)
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **shadcn/ui** for base components
- **@xyflow/react v12** for the agent graph canvas (ReactFlow)
- **Zustand** for client state
- **motion/react** (NOT framer-motion) for animations
- **animejs v4** (NOT v3 — v4 is a complete rewrite)

When Figma concepts are ready, they will be given to Claude Code as a build spec. The spec should include:
- Exact colors (hex values from the brand system above — no guessing)
- Font sizes (minimum 11px for all visible text)
- Layout specifications (column widths, panel heights, grid structures)
- Interactive states for every interactive element
- Component hierarchy and reuse patterns

All animations should be expressed as `motion/react` equivalents (not CSS animations where possible).
