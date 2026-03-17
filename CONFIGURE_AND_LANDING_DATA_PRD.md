# SENTINEL — Configure Page + Landing Page Data Update PRD
## File: CONFIGURE_AND_LANDING_DATA_PRD.md
**Owner:** Achyuth Rachur, Crowe AI Innovation Team
**Codebase:** `C:\Users\RachurA\AI Coding Projects\Crowe-Sentinel`

---

## READ THIS ENTIRE FILE BEFORE WRITING A SINGLE LINE OF CODE

This PRD covers two things that must both be completed:

1. **Landing page data update** — the agent data panels already built in `src/components/landing/` need to be upgraded to use the comprehensive raw input data files written since that page was built. This is a data-layer swap, not a layout change.

2. **Configure page rebuild** — a full rebuild of `src/app/configure/page.tsx` and `src/components/configure/` covering three modes: Preset, AI Chat, and Custom Builder.

**Do these in order. Complete the landing page data update first because it is small and confirms the data files work correctly before you build the larger configure page on top of them.**

---

## DATA FILES — Read these before touching any component

Two data files have been written for you. Both are in `src/data/`. Do not regenerate, do not modify, do not add to them. Import from them.

### File 1: `src/data/agentDisplayData.ts`
Contains processed/output display data for each agent — tables of computed results, gauge values, sparkline points, decision matrices, and explanations. This is the "after processing" view.

Export to use: `getAgentDisplayData(agentId: string): AgentPanel | null`

### File 2: `src/data/agentRawInputData.ts`
Contains the raw source data each agent ingests BEFORE any processing — full GL extracts, loan tapes, capital schedules, regulatory registers, incident logs, regression outputs. This is the "before processing" view. This is the comprehensive data. Every table has 5–20 rows of real-looking banking data.

Export to use: `getAgentRawInput(agentId: string): AgentRawInput | null`

**Key types from `agentRawInputData.ts` you will use constantly:**

```typescript
interface RawDataCell {
  value: string;
  status?: 'normal' | 'flag' | 'breach' | 'overdue' | 'ok' | 'dim';
  indent?: number;       // 0 = normal, 1 = sub-row, 2 = sub-sub-row
  bold?: boolean;
  mono?: boolean;        // render in monospace font
}

interface RawDataRow {
  cells: RawDataCell[];
  separator?: boolean;      // thin top border on this row
  sectionHeader?: boolean;  // full-width grey header row
}

interface RawDataTable {
  id: string;
  title: string;
  sourceLabel: string;   // e.g. "HORIZON Core Banking v9.2"
  asOfDate: string;
  headers: string[];
  rows: RawDataRow[];
  footnote?: string;
}

interface AgentRawInput {
  agentId: string;
  sourceSystem: string;
  extractTimestamp: string;
  tables: RawDataTable[];
  keyFields?: { label: string; value: string; status?: CellStatus }[];
}
```

---

## PART 1 — LANDING PAGE DATA UPDATE

### Scope
Files to touch: `src/components/landing/AgentDataPanel.tsx` (and any sub-components it uses for rendering data).

Files to NOT touch: `src/app/page.tsx`, `src/components/landing/AgentCard.tsx`, `src/components/landing/AgentGallery.tsx`, shader background, hero section, how-it-works section, footer.

### What currently exists
The landing page already has an `AgentDataPanel` component that shows a two-column layout (left: data, right: explanation) when a user clicks "See data" on an agent card. The current implementation uses `getAgentDisplayData` from `agentDisplayData.ts` which has compact processed data (a few rows per agent).

### What needs to change
Replace the data content inside `AgentDataPanel` with a **tabbed interface** that shows both data files:

```
┌──────────────────────────────────────────────────────────────────┐
│  [Agent Name] — [Type badge]                                     │
│                                                                  │
│  [ Raw Input Data ]  [ Processed Output ]                        │  ← two tabs
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  [active tab content — see below]                                │
│                                                                  │
│  [explanation paragraph — from agentDisplayData.explanation]    │
└──────────────────────────────────────────────────────────────────┘
```

**Tab 1: Raw Input Data** (from `agentRawInputData.ts`)
Shows `AgentRawInput` for the selected agent:
- Key fields strip at top (source system, extract timestamp, 4 key stats)
- Each `RawDataTable` rendered as a full table with title, source label, and as-of date
- Table rendering rules (apply these exactly):
  - `sectionHeader: true` row → full-width grey background `#F4F4F4`, text `#828282`, 11px uppercase mono, no individual cell borders
  - `separator: true` → `borderTop: '1px solid #BDBDBD'` on the row
  - Cell `status: 'breach'` → background `#FDEEF3`, text `#992A5C`, font-weight 700
  - Cell `status: 'flag'` → background `#FFF5D6`, text `#D7761D`
  - Cell `status: 'ok'` → background `#E1F5EE`, text `#0C7876`
  - Cell `status: 'overdue'` → background `#FDEEF3`, text `#992A5C`, font-weight 700
  - Cell `status: 'dim'` → text `#BDBDBD`
  - Cell `indent: 1` → `paddingLeft: 24px`
  - Cell `indent: 2` → `paddingLeft: 44px`
  - Cell `bold: true` → `fontWeight: 700`
  - Cell `mono: true` → `fontFamily: var(--font-mono)`
  - Header row: `background: #011E41`, `color: #FFFFFF`, 11px uppercase mono
  - Even data rows: `background: #FFFFFF`
  - Odd data rows: `background: #FAFAFA`
  - Footnote: 11px, `color: #828282`, italic, padding top 8px, border top `1px solid #E0E0E0`
- Tables scroll horizontally if they are wider than the container (use `overflow-x: auto` on a wrapper)
- If an agent has multiple tables, show them stacked with 24px gap between them and a section title above each

**Tab 2: Processed Output** (from `agentDisplayData.ts`)
This is what was already showing. Keep the existing rendering — tables with RAG highlights, gauges, sparklines, decision matrix. No changes needed here except wrapping it in the Tab 2 container.

**Tab styling:**
- Active tab: underline `2px solid #F5A800` (amber), text `#011E41`, font-weight 700
- Inactive tab: no underline, text `#828282`
- Tab bar: `borderBottom: '1px solid #E0E0E0'`, `marginBottom: 20px`

### RawDataTable renderer component

Create `src/components/landing/RawDataTableRenderer.tsx`. This is a standalone component that takes one `RawDataTable` and renders it. It will be reused on the configure page too.

```typescript
interface RawDataTableRendererProps {
  table: RawDataTable;
  compact?: boolean;  // if true, use smaller font sizes (for agent drawer in configure)
}
```

Full size (landing page): header 12px, cells 12px
Compact size (configure drawer): header 11px, cells 11px

### Verification for Part 1
Before moving to Part 2:
- [ ] Click "See data" on Financial Aggregator card → panel opens with two tabs
- [ ] Raw Input Data tab shows the full GL extract table — 20+ rows with account numbers, actuals, budgets, variances
- [ ] Cells with `status: 'breach'` render with red background
- [ ] `sectionHeader` rows render full-width grey
- [ ] `indent: 1` cells are indented correctly
- [ ] Processed Output tab shows the existing compact RAG table (no regression)
- [ ] Tab switching animates smoothly (fade, 150ms)
- [ ] Tables wider than the panel scroll horizontally without breaking layout
- [ ] Footnotes render below each table
- [ ] Source label and as-of date render above each table in grey mono text
- [ ] Click "See data" on Credit Quality → Raw Input tab shows loan tape with watchlist borrower names and LTV ratios
- [ ] Click "See data" on Trend Analyzer → shows 5-quarter regression table with flagged slopes
- [ ] Click "See data" on Regulatory Digest → shows MRA table with overdue row highlighted red
- [ ] Click "See data" on Operational Risk → shows incident register + full vendor breach detail card

---

## PART 2 — CONFIGURE PAGE REBUILD

### Scope
Files to touch:
- `src/app/configure/page.tsx` — full rewrite
- `src/components/configure/` — extend with new components listed below

Files to NOT touch:
- `src/components/layout/AppHeader.tsx` and `StepNav.tsx`
- `src/store/executionStore.ts`
- `src/app/api/` routes
- `src/data/` files
- Any other page

### Install these before building
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/aceternity/animated-beam"
```

If `animated-beam` SSL fails: build with SVG `<path>` + `stroke-dashoffset` animation using `motion/react`. Do not block on it.

---

## CONFIGURE PAGE ARCHITECTURE

Three modes, one page. Left panel (280px) is always visible. Right panel fills all remaining width.

```
┌─────────────────────────────────────────────────────────────────────┐
│  AppHeader (64px, fixed)  — step nav in center                      │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                       │
│  LEFT PANEL  │  RIGHT PANEL (fills all remaining width)             │
│  280px       │                                                       │
│  fixed       │  MODE A: Full-screen orchestration graph             │
│              │  MODE B: Full-screen chat window                     │
│              │  MODE C: Drag-and-drop canvas                        │
│              │                                                       │
│  [mode tabs] │                                                       │
│  [controls]  │                                                       │
│  [Execute →] │                                                       │
└──────────────┴──────────────────────────────────────────────────────┘
```

### Page-level state

```typescript
type ConfigureMode = 'preset' | 'chat' | 'custom';

const [mode, setMode] = useState<ConfigureMode>('preset');
const [selectedScenarioId, setSelectedScenarioId] = useState<string>('falcon-board');
const [openDrawerAgentId, setOpenDrawerAgentId] = useState<string | null>(null);
const [customAgents, setCustomAgents] = useState<string[]>([]);
const [chatAgents, setChatAgents] = useState<string[]>([]);
const [isBuilding, setIsBuilding] = useState(false);
const [error, setError] = useState<string | null>(null);
```

---

## LEFT PANEL (all modes)

Background: `#011E41`. Full height. 280px wide. Fixed.

```
SENTINEL                         ← 11px amber mono label
Configure your package           ← heading 22px white bold

┌──────────┬───────────┬────────┐
│  Preset  │  AI Chat  │ Custom │  ← mode tabs
└──────────┴───────────┴────────┘

[mode-specific content here]

[spacer]

[error banner — coral, if error]
[Execute → button — amber fill]
[caption: scenario · N agents · HITL]
```

**Mode tab styling:**
- Active: `background: #F5A800`, `color: #011E41`, font-weight 700, border-radius 4px
- Inactive: transparent, `color: rgba(255,255,255,0.5)`, border `1px solid rgba(255,255,255,0.12)`
- All three tabs equal width, 32px height, 10px mono uppercase text

**Execute button:**
- Width 100%, height 48px
- `background: #F5A800`, `color: #011E41`, font-weight 700, 14px uppercase
- Disabled state: `background: rgba(245,168,0,0.35)`, cursor not-allowed
- Loading state: spinner + "Assembling graph…"
- `canExecute`: preset always true; chat: chatAgents.length >= 2; custom: customAgents.length >= 2

---

## MODE A — PRESET

### Left panel content (Mode A)
Below mode tabs, show the three scenario tiles using the existing `ScenarioTile` component. All three visible without scrolling, no modification to ScenarioTile needed.

### Right panel (Mode A) — Full orchestration graph

The graph fills 100% of the right panel width and height. Use the existing `ScenarioPreviewGraph` component as a base but make these changes:

**Node size:** Increase to 200px wide × 90px tall (currently 160px × 72px). The graph needs to fill the space at a readable size.

**Node click:** Add `onClick` on every node that calls `setOpenDrawerAgentId(nodeId)`. This opens the Agent Detail Drawer.

**Column headers:** Above each column of nodes, show a stage label. These come from the scenario's `visualColumns` — compute them:
- Column with 1 node named `meta_agent` → "Stage 01 — Orchestration"
- Column with 2+ nodes → "Stage 0N — [stage name] · [count] parallel"
- Stage names: `['Orchestration', 'Data Collection', 'Synthesis', 'Review', 'Human Gate', 'Compilation']`

**Parallel indicator:** For columns with 2+ nodes, add a subtle bracket or background rect behind the nodes in that column (use a low-opacity background rectangle, `rgba(255,255,255,0.03)`, to group them visually).

**Legend:** Add a compact legend at the bottom-left of the graph panel showing the 6 node type colors. This already exists in the execute page sidebar — copy the pattern, not the sidebar.

### Agent Detail Drawer (Mode A)

Create `src/components/configure/AgentDetailDrawer.tsx`.

Slide-in from the right side of the right panel. Width 440px. Overlays the graph (does not push it). `position: absolute`, `right: 0`, `top: 0`, `bottom: 0`.

```typescript
interface AgentDetailDrawerProps {
  agentId: string | null;
  onClose: () => void;
}
```

Animation:
```tsx
<motion.div
  initial={{ x: 440, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 440, opacity: 0 }}
  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
/>
```

Wrap with `<AnimatePresence>` so exit animation plays.

**Drawer structure:**

```
┌─────────────────────────────────────────────┐
│ [← Back]              [Agent badge]  [✕]    │ ← fixed header
│ ─────────────────────────────────────────── │
│ [Agent Name — 20px bold white]              │
│ [subtitle — 12px muted]                     │
├─────────────────────────────────────────────┤
│                                             │ ← scrollable content
│ [ Raw Source Data ] [ Processed Output ]    │ ← SAME TWO TABS as landing page
│                                             │
│ [tab content — see data rendering below]    │
│                                             │
│ ─────────────────────────────────────────── │
│ [explanation text — agentDisplayData        │
│  .explanation field, 13px, #FFFFFF at 75%]  │
│                                             │
│ [note — agentDisplayData.note, 11px mono    │
│  amber, bottom of scroll]                   │
└─────────────────────────────────────────────┘
```

**Drawer background:** `#001833`. Left border: `1px solid rgba(255,255,255,0.08)`.

**Tab 1 — Raw Source Data:**
Use `getAgentRawInput(agentId)` from `@/data/agentRawInputData`.
Render using `RawDataTableRenderer` built in Part 1 with `compact={true}`.
Show `keyFields` strip above the tables: 2-column grid, label in muted mono, value in white.

**Tab 2 — Processed Output:**
Use `getAgentDisplayData(agentId)` from `@/data/agentDisplayData`.

Render all fields that are present. Apply these rendering rules:

**`tableRows` + `tableHeaders`:**
- Header row: `background: #011E41`, white text, 11px uppercase mono
- Data rows: alternating `rgba(255,255,255,0.04)` / `rgba(255,255,255,0.02)`
- Text: `rgba(255,255,255,0.75)` for body, node type color for status cells
- `highlight: 'red'` → cell background `rgba(229,55,107,0.15)`, text `#E5376B`
- `highlight: 'amber'` → cell background `rgba(245,168,0,0.12)`, text `#F5A800`
- `highlight: 'green'` → cell background `rgba(5,171,140,0.12)`, text `#05AB8C`
- `bold: true` → font-weight 700, text `rgba(255,255,255,0.95)`

**`gauges`:**
Bar height 8px. Container background `rgba(255,255,255,0.08)`. Fill color from `status`. Label above bar, value right-aligned. Minimum and well-cap markers as tiny vertical ticks on the bar.

**`sparkLines`:**
SVG line chart. Width: 100% of container. Height: 64px. 5 data points. Dots at each point (3px circles). Quarter labels below x-axis in 9px mono. Trend label in sparkLine.color.

**`decisionRows`:**
Two-column rows: input name left, value right. Flag icons:
- `'critical'` → amber background chip with `⚠⚠` in coral
- `'warning'` → amber background chip with `⚠`
- `'ok'` → teal background chip with `✓`
Decision box below rows: amber border, `rgba(245,168,0,0.08)` background, decision label large and bold.

**`topologyColumns`:**
Horizontal row of column boxes connected by arrows. Each box shows column label and stacked agent names.

**`outputStructure`:**
Simple list with monospace section names and status badges.

**`watchlistLoans`** (credit quality):
Table with direction arrow `↓` in coral for downgrades.

**`escalationFlag`** (regulatory digest):
Alert box: coral left border, `rgba(229,55,107,0.08)` background, `⚠ ESCALATION FLAG SET` header.

**`incidentDetail`** (operational risk):
Key-value card, each field on its own row.

**`compilationInputs`** (report compiler):
Bulleted list in mono, `rgba(255,255,255,0.6)`.

**`scenarioComparisons`** (meta agent):
3-row table with node count and HITL badge per scenario.

---

## MODE B — AI CHAT

### Left panel content (Mode B)
Below mode tabs:

```
ADDED AGENTS (0)
[agent chip] [agent chip]   ← chips appear as agents are added
                             ← each chip: color dot, name, ✕ to remove

─────────────────────────
Tip: Describe your meeting and
I'll recommend agents one by one
```

Agent chip style: `height: 26px`, `padding: 0 10px`, `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(255,255,255,0.12)`, `borderRadius: 100px`, `color: rgba(255,255,255,0.7)`, `fontSize: 11px`. Dot: 6px circle in node type color.

### Right panel (Mode B) — Full-screen chat

Background `#FFFFFF`. Full height.

```
┌────────────────────────────────────────────────────────────────┐
│  Sentinel Agent                               ● Ready          │  ← strip, white bg, border-bottom
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [messages area — fills all space, scrollable]                 │
│                                                                │
│  [inline agent card appears here when Sentinel recommends]     │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  [suggested question chips — visible until 2+ user messages]   │
│  [text input]                         [↑ send]                 │
└────────────────────────────────────────────────────────────────┘
```

Use the existing `SentinelChat` component (`src/components/configure/SentinelChat.tsx`) as the base. Extend it rather than rewriting it. Changes needed:

1. Increase the component to fill the full right panel instead of being squeezed into the sidebar
2. Add `recommendedAgentId` parsing from API response
3. When `recommendedAgentId` is returned, render `InlineChatAgentCard` inside the Sentinel message bubble

**Suggested question chips:**
Show these as clickable chips when conversation has fewer than 2 user messages. Clicking auto-populates and sends:
```typescript
const SUGGESTED = [
  "Full board quarterly package — we have open MRAs",
  "Audit committee focused on BSA/AML findings",
  "Quick risk flash report — just capital and credit",
  "What agents do I need if we have a CRE concentration issue?",
  "Explain the difference between the AI agents and the rules engines",
];
```

Chip style: `height: 30px`, `padding: 0 14px`, `border: 1px solid #BDBDBD`, `borderRadius: 100px`, `fontSize: 12px`, `color: #4F4F4F`, `background: #FFFFFF`, hover: `background: #F4F4F4`, cursor pointer.

**Message bubble colors (light mode):**
- Sentinel messages: `background: #F4F4F4`, `border: 1px solid #E0E0E0`, `color: #333333`
- User messages: `background: #EEF3FA`, `border: 1px solid #BFCFE8`, `color: #011E41`
- Border radius: sentinel `0 8px 8px 8px`, user `8px 0 8px 8px`

### InlineChatAgentCard component

Create `src/components/configure/InlineChatAgentCard.tsx`.

Flat card (NOT the 3D flip), 300px wide × auto height. Rendered inline inside Sentinel message bubbles.

```
┌─────────────────────────────────────────────┐
│ [8px dot]  [BADGE]  [Agent Name — bold]      │ ← top row, border-bottom
│ ─────────────────────────────────────────── │
│ [description — 2 lines max, 12px]            │
│                                              │
│ Data sources:                                │
│ • [source from NODE_REGISTRY or scenarios]   │
│ • [source]                                   │
│                                              │
│  [ ✓ Add to graph ]    [ Skip ]              │ ← if not decided
│  [ ✓ Added ]                                 │ ← if already added
└─────────────────────────────────────────────┘
```

```typescript
interface InlineChatAgentCardProps {
  agentId: string;
  onAdd: (id: string) => void;
  onSkip: (id: string) => void;
  alreadyAdded: boolean;
}
```

Card background: `#FFFFFF`. Border: `1px solid #E0E0E0`, left border 3px in node type color. Border-radius 8px.

`Add to graph` button: `background: #011E41`, `color: #FFFFFF`, `height: 32px`, `padding: 0 16px`, `borderRadius: 4px`, font-weight 700.
`Skip` button: transparent, `border: 1px solid #BDBDBD`, `color: #828282`.

When Add is clicked:
1. Button becomes green `✓ Added` chip (disabled, `background: #E1F5EE`, `color: #0C7876`)
2. Agent chip appears in left panel
3. Chat sends follow-up: `"[Agent name] added. Tell me more about your meeting or say 'done, configure my graph' when ready."`

### Graph rebuild animation (Mode B → Execute press)

When Execute is clicked in Mode B with chatAgents.length >= 2:
1. Right panel transitions from chat to orchestration graph in ~1.5s
2. Nodes fade in column by column left to right, each node with `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
3. Stagger: `delay: colIndex * 0.2 + rowIndex * 0.1`
4. Edges draw after their source column appears using `stroke-dashoffset` 0 → pathLength transition
5. After animation completes, Execute button becomes active and the API call fires

### API update for Mode B

Read `src/app/api/chat/route.ts`. Update the system prompt to include:

```typescript
const systemPrompt = `You are Sentinel, an AI system for bank board reporting.

When a user describes their meeting, recommend agents one at a time. For each recommendation:
1. Explain in one sentence why this agent is needed for their situation
2. Include the agent ID in your JSON response as "recommendedAgentId"

Available agents:
${Object.values(NODE_REGISTRY).map(n => `- ${n.id}: ${n.label} (${n.badgeLabel}) — ${n.description}`).join('\n')}

Respond in JSON format:
{
  "reply": "Your conversational response here",
  "recommendedAgentId": "agent_id_here_or_null"
}

Always recommend meta_agent and report_compiler as the first and last agents respectively.
Recommend agents based on what the user describes:
- Financial metrics concerns → financial_aggregator, capital_monitor
- CRE or credit issues → credit_quality, trend_analyzer  
- Regulatory, MRA, exam concerns → regulatory_digest
- Incidents, fraud, vendor issues → operational_risk
- Full board package → all agents
- When user says done/configure/ready → set recommendedAgentId to null and confirm their graph`;
```

---

## MODE C — CUSTOM BUILDER

### Left panel content (Mode C)
Below mode tabs, an agent palette:

```
AGENT PALETTE

[draggable: ⬡ Meta Agent]
[draggable: ⚙ Financial]
[draggable: ⚙ Capital]
[draggable: ◈ Credit]
[draggable: ◎ Trend]
[draggable: ◉ Regulatory]
[draggable: ◉ Operational]
[draggable: ⬡ Supervisor]
[draggable: ◎ HITL Gate]
[draggable: ◉ Report Compiler]

Drag agents to canvas →
```

Each palette item: `height: 36px`, flex row, 8px color dot, agent label 13px. Dimmed (`opacity: 0.3`) once placed on canvas.

### Right panel (Mode C) — Drop canvas

Background `#011E41`. Dot grid pattern (same as execute page). Full height.

**Empty state:** Centered dashed border box with "Drag agents here to build your graph" text in `rgba(255,255,255,0.2)`.

**Drag and drop:** Use `@dnd-kit/core`. Palette items are `<Draggable>`. Canvas is `<Droppable>`.

**On drop:**
- Node appears at drop position
- Entrance: `scale 0.85 → 1`, `opacity 0 → 1`, spring 0.3s
- Palette item dims

**Node on canvas (200px × 90px):**
Same visual as Mode A graph nodes. Add `<GripVertical size={12} />` drag handle in top-right corner of each placed node.

**Auto-connection:**
When node count on canvas ≥ 2, draw edge from penultimate to latest dropped node. Edge animates in with `stroke-dashoffset`. Simple rule — connect in drop order.

**Reset button:**
Top-right of canvas: "↺ Reset canvas" in 11px mono, `color: rgba(255,255,255,0.4)`, `border: 1px solid rgba(255,255,255,0.12)`. Clicking clears all dropped nodes and re-enables all palette items.

---

## AGENT DETAIL DRAWER — DATA RENDERING COMPONENT

Create `src/components/configure/AgentDataContent.tsx`.

This is the single component that handles ALL data rendering for both tabs in the drawer. It is called by `AgentDetailDrawer` and also by `AgentDataPanel` on the landing page (the landing page version uses `RawDataTableRenderer` directly, but the drawer uses this for the Processed Output tab).

```typescript
interface AgentDataContentProps {
  panel: AgentPanel;             // from agentDisplayData.ts
  darkMode?: boolean;            // true for drawer (dark bg), false for landing (light bg)
}
```

Render each field type conditionally based on what's present in `panel`. If `darkMode: true`, use the dark table colors defined above. If `darkMode: false`, use light table colors (white/grey backgrounds, dark text).

---

## EXECUTE HANDLER (all modes)

```typescript
const handleExecute = async () => {
  if (!canExecute || isBuilding) return;
  setIsBuilding(true);
  setError(null);

  // Determine which scenario to use
  let scenarioId = selectedScenarioId; // default: preset selection

  if (mode === 'chat' && chatAgents.length >= 2) {
    scenarioId = matchScenario(chatAgents);
  }
  if (mode === 'custom' && customAgents.length >= 2) {
    scenarioId = matchScenario(customAgents);
  }

  try {
    resetAll();
    setScenario(scenarioId);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    const data = await res.json() as { run_id: string };
    startRun(data.run_id);
    setAppPhase('build');
    router.push('/build');
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Failed to start analysis');
    setIsBuilding(false);
  }
};

// Match chatAgents or customAgents to closest scenario
function matchScenario(agentIds: string[]): string {
  if (agentIds.includes('financial_aggregator') || agentIds.includes('hitl_gate')) {
    return 'falcon-board';
  }
  if (agentIds.includes('regulatory_digest') && !agentIds.includes('financial_aggregator')) {
    return 'audit-committee';
  }
  return 'risk-flash';
}
```

---

## CROWE BRAND RULES

These apply to every new component:

**Dark surfaces** (left panel, graph canvas, drawer):
- Background: `#011E41` or `#001833`
- Body text: `#FFFFFF`, muted `rgba(255,255,255,0.55)`
- Borders: `rgba(255,255,255,0.08)`
- Section labels: 10px uppercase mono `rgba(255,255,255,0.3)` letterSpacing 0.1em

**Light surfaces** (chat window, inline cards, data tables in light mode):
- Background: `#FFFFFF` or `#F4F4F4`
- Body text: `#333333`
- Secondary: `#4F4F4F`
- Muted: `#828282`
- Borders: `#E0E0E0` or `#BDBDBD`

**Accent:** `#F5A800` (amber) for CTAs, active tabs, highlights
**Node type colors:** always from `NODE_REGISTRY[id].color`
**Typography:** `var(--font-mono)` for badges/labels/code, `var(--font-body)` for prose

---

## DO NOT BREAK THESE

- `AppHeader` + `StepNav` — do not modify
- `ScenarioTile` — do not modify, just import
- `SentinelChat` — extend only, do not rewrite
- `ScenarioPreviewGraph` — extend node size + click handler, do not rewrite
- All store methods and navigation patterns — import and use as-is
- Route: after successful `/api/analyze` call always `router.push('/build')`

---

## FINAL VERIFICATION CHECKLIST

### Landing page (Part 1)
- [ ] Agent data panels show two tabs: Raw Input Data and Processed Output
- [ ] Raw Input Data tab shows full tables from `agentRawInputData.ts` (20+ rows for financial)
- [ ] All cell status styles render correctly (red/amber/green/mono/indent/bold)
- [ ] Section header rows render full-width grey
- [ ] Separator rows have top border
- [ ] Tables wider than panel scroll horizontally
- [ ] Footnotes render correctly
- [ ] Processed Output tab unchanged from before
- [ ] Tab switching is smooth

### Configure — Mode A (Part 2)
- [ ] All 3 scenario tiles visible, clicking changes graph
- [ ] Graph fills full right panel at readable size
- [ ] Column headers visible above parallel node columns
- [ ] Clicking a node opens Agent Detail Drawer with slide-in animation
- [ ] Drawer Raw Source Data tab shows tables from `agentRawInputData.ts`
- [ ] Drawer Processed Output tab shows data from `agentDisplayData.ts`
- [ ] All rendering rules applied (dark mode colors, breach/flag/ok cell styles)
- [ ] Drawer close animation plays
- [ ] Drawer does not push the graph — it overlays

### Configure — Mode B (Part 2)
- [ ] Right panel becomes a full-size white chat window
- [ ] Suggested question chips visible initially, disappear after 2 user messages
- [ ] Chat messages render in correct colors (light mode)
- [ ] API response with `recommendedAgentId` triggers inline agent card
- [ ] Inline card Add button adds chip to left panel
- [ ] Skip grays out card
- [ ] chatAgents.length >= 2 enables Execute button
- [ ] Execute → graph rebuild animation → then API call → router.push('/build')

### Configure — Mode C (Part 2)
- [ ] Palette chips in left panel are draggable
- [ ] Dropping an agent creates an animated node on canvas
- [ ] Palette chip dims after drop
- [ ] Dropping second agent draws animated connecting edge
- [ ] Canvas nodes are repositionable
- [ ] Reset canvas restores all palette chips
- [ ] customAgents.length >= 2 enables Execute button

### All modes
- [ ] Mode tabs switch correctly
- [ ] Execute button calls /api/analyze with correct scenario_id
- [ ] Error banner shows on failure
- [ ] No TypeScript errors
- [ ] No layout jumps when switching modes

---

## KICKOFF PROMPT FOR CLAUDE CODE

Use exactly this to start:

> Read `CONFIGURE_AND_LANDING_DATA_PRD.md` fully before writing anything.
>
> Start with Part 1 — the landing page data update. The two data files are already written at `src/data/agentRawInputData.ts` and `src/data/agentDisplayData.ts`. Import from them, do not regenerate them.
>
> Build `src/components/landing/RawDataTableRenderer.tsx` first — it is the shared table renderer used by both parts. Verify it works on the landing page with the Financial Aggregator and Credit Quality agents before moving to Part 2.
>
> After Part 1 verification passes, begin Part 2 with Mode A (preset + Agent Detail Drawer). Do not start Mode B or Mode C until Mode A and the drawer are working correctly.

---

*SENTINEL Configure + Landing Data PRD | Crowe AI Innovation Team | March 2026*
*Data files already written: src/data/agentDisplayData.ts + src/data/agentRawInputData.ts*
*Do not regenerate data. Do not modify data files. Import only.*
