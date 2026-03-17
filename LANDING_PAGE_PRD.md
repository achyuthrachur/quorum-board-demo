# SENTINEL — Landing Page Redesign PRD
## Single page. Do not touch any other file.
**File to rewrite:** `src/app/page.tsx`
**New components to create:** `src/components/landing/`
**Owner:** Achyuth Rachur, Crowe AI Innovation Team

---

## SCOPE — Read this before touching anything

This PRD covers ONLY `src/app/page.tsx` and new components in `src/components/landing/`.

Do NOT touch:
- Any other page (`/configure`, `/execute`, `/review`, `/report`, `/build`)
- The store, hooks, API routes, or data files
- Any existing component outside `src/components/landing/`

The only data imports you need:
- `NODE_REGISTRY` from `@/data/nodeRegistry`
- `SCENARIOS` from `@/data/scenarios`

---

## INSTALL THESE COMPONENTS FIRST

Run all of these before writing any code. Use `NODE_TLS_REJECT_UNAUTHORIZED=0` prefix.

```bash
# 3D flip card for agent cards (pokemon card style)
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/aceternity/3d-flip-card"

# Scroll-triggered reveal animations
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/aceternity/reveal-on-scroll"

# Horizontal scrolling card carousel
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/aceternity/card-carousel"

# Animated beam connecting agents (for hero graph)
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/aceternity/animated-beam"
```

**If any of those fail due to SSL, use these fallbacks — all zero-install:**
- 3D flip card → build with CSS `perspective` + `rotateY` transform + `motion/react`
- Scroll reveal → use `useInView` from `motion/react` (already installed)
- Carousel → use `overflow-x: scroll` + `snap-x` Tailwind + motion/react drag
- Animated beam → use SVG `<path>` with `stroke-dashoffset` animation (already used in landing page)

**After attempting installs, check which ones actually succeeded** by looking in `src/components/ui/`. Build fallbacks for any that failed. Do not block progress on failed installs.

---

## PAGE STRUCTURE

The landing page has exactly three sections:

```
┌─────────────────────────────────────────────────────┐
│  SECTION 1: HERO                                    │
│  Full viewport. Shader background.                  │
│  Two CTAs: "Start demo" and "Meet the agents"       │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  SECTION 2: AGENT GALLERY                           │
│  Hidden by default. Revealed when "Meet the         │
│  agents" is clicked. Full width card carousel.      │
│  Each card is a 3D flip card showing agent info.    │
│  Scrolling down from a card reveals its data.       │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  SECTION 3: HOW IT WORKS (existing, keep as-is)     │
└─────────────────────────────────────────────────────┘
```

---

## SECTION 1 — HERO

### Layout
Full viewport height. ShaderBackground behind everything.
Centered content — not two-column like the current page.
The current two-column hero with the animated graph preview is REMOVED.

### Content

```
[Crowe logo — small, top left]

[centered, full width]

SENTINEL                    ← SpecialText component, scramble reveal on load
Board intelligence platform ← subtitle, fades in 400ms after title

Two CTA buttons side by side, centered:

[  Start the demo  →  ]    [  Meet the agents  ↓  ]
 Amber fill, Indigo text     Ghost, white border

Stat strip below buttons (same as current, keep it):
10 agents | 3 meeting types | 1 human review gate | 100% auditable
```

### Behavior

**"Start the demo" button:** `router.push('/configure')` — no change from current.

**"Meet the agents" button:**
- Smooth scroll to Section 2 (the agent gallery)
- Section 2 is ALREADY rendered in the DOM but starts with `opacity: 0` and `transform: translateY(40px)`
- On click: animate Section 2 to `opacity: 1`, `translateY: 0` using motion/react
- Also update the button label to "Hide agents ↑" and clicking again collapses it

### Implementation notes
- Keep ShaderBackground exactly as-is
- Keep SpecialText exactly as-is
- Remove the current `HeroGraphPreview` component entirely — it is replaced by Section 2
- Remove the two-column grid layout — center everything

---

## SECTION 2 — AGENT GALLERY

### Overview
A full-width horizontal card carousel. Each agent from `NODE_REGISTRY` gets one card.
There are 10 agents total. Cards are arranged horizontally and can be scrolled/dragged.

This section is positioned directly below the hero. It starts hidden (opacity 0) and animates in when the "Meet the agents" button is clicked.

### Card Design — Front Face

Each card is a 3D flip card, 280px wide × 380px tall.

**Front face (default view):**
```
┌────────────────────────────┐
│ [type badge top-right]     │
│ [node type color bar 4px]  │  ← left border, full height
│                            │
│  [Icon — 48px, centered]   │
│                            │
│  [Agent label]             │  ← 20px bold, white
│  [Badge: RULES ENGINE etc] │  ← 10px mono, node color
│                            │
│  [Description — 2 lines]   │  ← 12px, muted
│                            │
│  ─────────────────────     │
│  [data source preview]     │  ← 2-3 data source tags
│                            │
│  [  See data  →  ]         │  ← small button, bottom
└────────────────────────────┘
```

Colors:
- Card background: `#002E62` (Crowe Indigo Core) with subtle noise
- Left border: node type color (from `NODE_REGISTRY[id].color`)
- Badge background: node color at 15% opacity
- Text: white / rgba(255,255,255,0.6)

**Back face (shown on hover/flip):**
```
┌────────────────────────────┐
│ [Agent label — top]        │
│                            │
│  MANDATE                   │  ← section label
│  [description paragraph]   │
│                            │
│  DATA SOURCES              │  ← section label
│  • source 1                │
│  • source 2                │
│  • source 3                │
│                            │
│  TYPE                      │
│  [type explanation]        │
│                            │
│  [ Scroll for data ↓ ]     │
└────────────────────────────┘
```

### Card Implementation

Use the installed 3D flip card component if it installed successfully.
If not, implement with:

```tsx
// CSS approach
<div style={{ perspective: '1000px', width: 280, height: 380 }}>
  <motion.div
    style={{
      transformStyle: 'preserve-3d',
      position: 'relative',
      width: '100%',
      height: '100%',
    }}
    animate={{ rotateY: isFlipped ? 180 : 0 }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
  >
    {/* Front */}
    <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}>
      {/* front content */}
    </div>
    {/* Back */}
    <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0, rotateY: 180 }}>
      {/* back content */}
    </div>
  </motion.div>
</div>
```

Flip triggers:
- Mouse hover → flip to back
- Mouse leave → flip to front
- No click needed for the flip

### Carousel Implementation

Horizontal scroll container with snap:

```tsx
<div
  style={{
    display: 'flex',
    gap: 20,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    padding: '20px 48px 40px',
    scrollbarWidth: 'none', // hide scrollbar
  }}
>
  {Object.values(NODE_REGISTRY).map((agent) => (
    <div
      key={agent.id}
      style={{
        flexShrink: 0,
        scrollSnapAlign: 'start',
      }}
    >
      <AgentCard agent={agent} scenario={SCENARIOS[0]} />
    </div>
  ))}
</div>
```

Add left/right arrow buttons that scroll the container programmatically.
Arrow buttons: 40px circles, white background at 10% opacity, positioned at left and right edges of the carousel.

### Scroll-to-Data Behavior

When the user clicks "See data →" on a card front OR "Scroll for data ↓" on the card back:

1. The page scrolls to a DATA PANEL section that appears below the carousel
2. The DATA PANEL shows the synthetic data for the selected agent
3. The transition uses a scroll-triggered reveal animation

The DATA PANEL is a single div below the carousel that updates its content based on which agent is selected. It does NOT open a modal — it is inline on the page.

---

## DATA PANEL — Below the Carousel

This panel lives directly below the carousel. It is hidden by default and appears when an agent card's "See data" button is clicked.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  DATA PANEL — [Agent Name]                           │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  [Left: DATA TABLE or METRICS]  [Right: EXPLANATION] │
│                                                      │
│  [Bottom: WHAT THIS AGENT DOES WITH THIS DATA]       │
└──────────────────────────────────────────────────────┘
```

The panel slides down into view using motion/react:
```tsx
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
>
```

### Data Panel content per agent

Build a `getAgentDataPanel(agentId: string, scenarios: ScenarioData[])` function that returns the right display for each agent. Use the Falcon Board scenario data (SCENARIOS[0]) as the default.

**financial_aggregator:**
Left side — metrics table:
```
Metric          | Actual  | Budget  | Prior   | Variance
NIM             | 3.21%   | 3.40%   | 3.44%   | -0.19% ▼
ROA             | 1.02%   | 1.05%   | 1.00%   | -0.03%
ROE             | 10.8%   | 11.0%   | 10.5%   | -0.20%
Efficiency Ratio| 61.4%   | 59.8%   | 60.4%   | +1.6% ▲
```
Color code: red for adverse variances, green for positive.

Right side — explanation:
"This agent receives the quarterly financials from the core banking system. It calculates variance between actual and budget for each metric, then applies threshold rules to flag anomalies. NIM compression below -5% triggers an amber flag. Efficiency ratio above 60% triggers a flag. No LLM is used — pure arithmetic."

**capital_monitor:**
Left side — ratio gauges (horizontal bar showing actual vs minimum):
```
CET1          ████████████░░ 10.8% (min 4.5%, well-cap 6.5%)
Tier 1        ████████████░░ 11.9% (min 6.0%, well-cap 8.0%)
Total Capital ████████████░░ 13.4% (min 8.0%, well-cap 10.0%)
LCR           ████████████░░ 112%  (min 100%)
NSFR          ████████████░░ 109%  (min 100%)
```

Right side — explanation:
"This agent compares each capital and liquidity ratio against regulatory minimums and well-capitalised thresholds. It flags any ratio within 150bps of its minimum. No LLM involved — deterministic threshold comparison."

**credit_quality:**
Left side — two tables:
Table 1 — Credit metrics:
```
Metric                 | Actual | Prior  | Peer
NPL Ratio              | 1.84%  | 1.41%  | 1.20%
Provision Coverage     | 118%   | 126%   | 132%
NCO Ratio              | 0.42%  | 0.31%  | 0.28%
```

Table 2 — Concentration limits:
```
Segment        | % of Capital | Limit | Status
CRE            | 336%         | 300%  | ⚠ BREACH
C&D            | 86%          | 100%  | OK
C&I            | 142%         | 175%  | OK
```

Right side — explanation:
"This agent uses a weighted scoring algorithm. Each dimension gets a score of -3 to +2 based on where it sits relative to peer medians and policy limits. Scores are weighted: NPL (35%), provision coverage (25%), NCO trend (20%), concentration (20%). A total score of -2 or lower is RED."

**trend_analyzer:**
Left side — sparkline chart showing 5 quarters for NIM and NPL:
```
NIM (Q4'23 → Q4'24): 3.58 → 3.52 → 3.44 → 3.44 → 3.21  ▼ declining
NPL (Q4'23 → Q4'24): 0.98 → 1.12 → 1.28 → 1.41 → 1.84  ▲ rising
```
Render these as simple SVG lines with dots — no chart library needed.

Right side — explanation:
"This is a hybrid agent. It first runs a statistical regression on 5 quarters of data to compute slope (deterministic). If any slope exceeds one standard deviation from the historical mean, it passes those flagged metrics to an LLM to generate a 2-sentence narrative. The math runs first, the AI only writes the interpretation."

**regulatory_digest:**
Left side — MRA table:
```
ID          | Description              | Due Date   | Status
MRA-2024-01 | CECL documentation       | 2025-04-18 | In progress
MRA-2024-02 | BSA/AML SAR timeliness   | 2025-01-05 | OVERDUE ⚠
```
Upcoming exam: OCC — March 17, 2025 — BSA/AML and model risk follow-up

Right side — explanation:
"This is an AI agent. It receives the regulatory data object — open MRAs, their due dates, and the examination schedule — and generates a structured narrative digest. It identifies overdue items and sets an escalation flag that forces the supervisor to include the HITL gate."

**operational_risk:**
Left side — incident table:
```
Date        | Category          | Severity | Affected | Status
2024-Q4     | Vendor data breach| Critical | 1,200    | Resolved
```

Right side — explanation:
"This is an AI agent. It reads the incident log and classifies each event as board-reportable or not. It identifies themes across incidents and flags anything that requires regulatory notification. The vendor data breach is board-reportable because it affected over 1,000 accounts."

**supervisor:**
Left side — decision matrix:
```
Input                  | Value          | Flag
Financial RAG          | AMBER          | —
Capital RAG            | GREEN          | —
Credit RAG             | RED            | ⚠
Regulatory escalation  | TRUE           | ⚠ HITL required
Overdue MRAs           | 1              | ⚠

Decision: PROCEED_TO_HITL
Rationale: Overdue MRA + CRE concentration breach requires CFO review
```

Right side — explanation:
"This is an LLM-based orchestrator. It reads all agent outputs and RAG statuses, then makes a routing decision: proceed to the HITL gate, skip directly to report compilation (if everything is green), loop back to an agent for re-analysis, or escalate. It uses GPT-4o-mini at temperature 0.2 so routing decisions are consistent."

**hitl_gate:**
Left side — what it receives:
```
Draft sections ready: 6
Flags requiring review:
  • MRA-2024-02 past due (18 days)
  • CRE concentration: 336% vs 300% limit
  • NIM: -0.19% vs budget
Awaiting: CFO or CRO approval
```

Right side — explanation:
"This is a human-in-the-loop gate. Execution fully pauses here. The CFO or CRO reviews a summary of all flags and agent findings before the report compiler fires. They can approve — which triggers compilation — or escalate to flag the report for additional board discussion. The approval is recorded as an audit trail entry."

**report_compiler:**
Left side — output structure:
```
Section               | Status    | Words
Executive Summary     | Streaming | ~280
Financial Performance | Streaming | ~420
Capital & Liquidity   | Streaming | ~310
Credit Quality        | Streaming | ~390
Regulatory Status     | Streaming | ~340
Operational Risk      | Streaming | ~220
Forward Outlook       | Streaming | ~180
```

Right side — explanation:
"This is an LLM agent running at temperature 0.4 for natural prose. It receives all structured outputs from previous agents — scores, RAG statuses, MRA lists, trend slopes — and writes the board narrative section by section. Each section streams token by token into the report viewer. It has 'earned the right to write' because all the math was done upstream."

**meta_agent:**
Left side — topology it selected for Falcon Board:
```
Column 1 (Series):    Meta Agent
Column 2 (Parallel):  Financial | Capital | Credit
Column 3 (Parallel):  Trend | Regulatory | Ops Risk
Column 4 (Series):    Supervisor
Column 5 (Series):    HITL Gate
Column 6 (Series):    Report Compiler

Rationale: "Full board quarterly package with overdue MRA
detected — HITL gate required. 10-node graph selected."
```

Right side — explanation:
"This is the orchestrator that runs before any analysis begins. It receives the meeting type and scenario context, then selects which agents to activate and in what order. For a full board package, it activates all 10 nodes. For a risk flash report with clean metrics, it collapses to 3. The graph literally builds itself based on what this agent decides."

---

## AgentCard Component Specification

Create `src/components/landing/AgentCard.tsx`:

```typescript
interface AgentCardProps {
  agent: NodeMeta;
  scenario: ScenarioData;
  onDataRequested: (agentId: string) => void;
}
```

The card:
- 280px × 380px fixed size
- 3D flip on hover
- Front: icon, label, badge, description preview, data source tags, "See data" button
- Back: mandate, data sources list, type explanation, "Scroll for data" button
- Both buttons call `onDataRequested(agent.id)` which scrolls to and reveals the data panel

**Icons per agent** (use Lucide React — already installed):
```typescript
const AGENT_ICONS: Record<string, LucideIcon> = {
  meta_agent:            Network,
  financial_aggregator:  TrendingUp,
  capital_monitor:       Shield,
  credit_quality:        BarChart3,
  trend_analyzer:        Activity,
  regulatory_digest:     FileText,
  operational_risk:      AlertTriangle,
  supervisor:            GitBranch,
  hitl_gate:             UserCheck,
  report_compiler:       BookOpen,
};
```

---

## AgentDataPanel Component Specification

Create `src/components/landing/AgentDataPanel.tsx`:

```typescript
interface AgentDataPanelProps {
  agentId: string | null;  // null = hidden
  scenario: ScenarioData;
}
```

- When `agentId` is null: hidden (height 0, opacity 0)
- When `agentId` changes: animate out old content, animate in new content
- Always uses Falcon Board scenario (SCENARIOS[0]) for data
- Two-column layout: left = data visualization, right = explanation text
- Light background: `#F4F4F4` with white card `#FFFFFF`
- All text in Crowe brand colors

---

## AgentGallery Component Specification

Create `src/components/landing/AgentGallery.tsx`:

```typescript
interface AgentGalleryProps {
  visible: boolean;
}
```

State:
- `selectedAgentId: string | null` — which agent's data panel is showing
- `scrollRef: RefObject<HTMLDivElement>` — the carousel scroll container

The gallery:
1. Carousel of `AgentCard` components
2. `AgentDataPanel` below the carousel, showing selected agent's data
3. Scroll arrows at carousel left/right edges

Scroll behavior when "See data" is clicked:
```typescript
const handleDataRequested = (agentId: string) => {
  setSelectedAgentId(agentId);
  // After state update, scroll the page to the data panel
  setTimeout(() => {
    dataPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
};
```

---

## Complete Page Structure

```tsx
export default function LandingPage() {
  const [showAgents, setShowAgents] = useState(false);

  return (
    <div>
      <ShaderBackground />
      <AppHeader rightContent={<HeaderNav />} />

      {/* SECTION 1: HERO */}
      <HeroSection onMeetAgents={() => {
        setShowAgents(true);
        // scroll to gallery
        galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
      }} />

      {/* SECTION 2: AGENT GALLERY */}
      <motion.div
        ref={galleryRef}
        initial={{ opacity: 0, y: 40 }}
        animate={showAgents ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: showAgents ? 'auto' : 'none' }}
      >
        <AgentGallery visible={showAgents} />
      </motion.div>

      {/* SECTION 3: HOW IT WORKS (keep existing) */}
      <HowItWorksSection />

      {/* FOOTER (keep existing) */}
      <Footer />
    </div>
  );
}
```

---

## Styling Rules

All new components must follow Crowe brand:

**Light surfaces (data panel, carousel background):**
- Background: `#FFFFFF` or `#F4F4F4`
- Body text: `#333333`
- Secondary text: `#4F4F4F`
- Muted text: `#828282`
- Borders: `#E0E0E0` or `#BDBDBD`

**Dark surfaces (agent cards):**
- Background: `#002E62` (Crowe Indigo Core)
- Text: `#FFFFFF`
- Muted text: `rgba(255,255,255,0.55)`
- Borders: `rgba(255,255,255,0.08)`

**Accent:**
- Primary CTA, highlights: `#F5A800` (Crowe Amber)
- Node type colors from `NODE_REGISTRY[id].color`

**Typography:**
- Display/headings: `var(--font-display)` (Syne)
- Body: `var(--font-body)` (IBM Plex Sans)
- Monospace/labels: `var(--font-mono)` (IBM Plex Mono)

---

## What NOT to break

- `ShaderBackground` — keep exactly as-is, just repositioned
- `SpecialText` in the hero title — keep exactly as-is
- `AppHeader` — keep exactly as-is
- The "how it works" section at the bottom — keep exactly as-is
- The footer — keep exactly as-is
- All navigation links (`/configure` etc.) — keep exactly as-is
- The stat strip (10 agents, 3 meeting types...) — keep exactly as-is

Only remove: `HeroGraphPreview` component and the two-column grid layout of the current hero.

---

## Verification Checklist

Before declaring this done:
- [ ] Landing page loads without errors
- [ ] ShaderBackground renders full viewport
- [ ] SpecialText scramble-reveals "SENTINEL" on load
- [ ] "Start the demo" navigates to `/configure`
- [ ] "Meet the agents" smoothly reveals the agent gallery below the hero
- [ ] All 10 agent cards render in a horizontal scrollable carousel
- [ ] Hovering a card flips it to show the back face
- [ ] Clicking "See data" on any card scrolls down and shows that agent's data panel
- [ ] Data panel content is different for each agent (not generic)
- [ ] Data panel shows actual numbers from SCENARIOS[0] (e.g., NIM 3.21%, CET1 10.8%)
- [ ] Clicking a different card updates the data panel
- [ ] Left/right carousel arrows work
- [ ] "How it works" section still visible below the gallery
- [ ] No TypeScript errors
- [ ] Page renders correctly at 1440px and 1920px wide

---

*Landing Page PRD | Crowe AI Innovation Team | March 2026*
*Scope: src/app/page.tsx + src/components/landing/ ONLY*
