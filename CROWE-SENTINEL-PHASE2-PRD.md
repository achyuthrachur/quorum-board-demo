# Crowe Sentinel — Phase 2 Product Requirements Document
> Build spec for Claude Code. Work through phases in order. Each phase is independently deployable.
> Stack: Next.js 14 App Router · TypeScript strict · Tailwind v4 · shadcn/ui · @xyflow/react v12 · Zustand · motion/react · LangGraph.js

---

## Vision Summary

The Phase 2 goal is to transform Sentinel from a working proof-of-concept into a production-quality demonstration of what AI-powered board intelligence actually looks like. Specifically:

1. **Show the orchestration** — The agent graph must look like real parallel/series workflow, not a linear pipe
2. **Show the agents working** — Click any node during execution to see its data, rules, mandate, and real-time processing steps
3. **Show real generation** — The board memo must visibly stream into existence section by section
4. **Fix navigation** — Navigation is broken throughout and must be replaced with a persistent, always-visible step system
5. **Make it legible** — No text below 12px anywhere; dark panels stay dark

---

## Current Architecture Reference

```
/                        → Landing page
/configure               → Step 1: scenario selection + AI chat (outside (demo) route group)
/(demo)/build            → Step 2: graph assembly transition
/(demo)/execute          → Step 3: live graph execution
/(demo)/review           → Step 4: HITL approval gate
/(demo)/report           → Step 5: final board package

SSE flow:
  POST /api/analyze      → triggers graph build + fire-and-forget execution
  GET  /api/stream/:id   → SSE stream of node events
  POST /api/hitl         → HITL decision (approve/revise)
  POST /api/chat         → Sentinel AI conversation

State: Zustand + sessionStorage persistence
Graph: LangGraph.js sequential execution, ReactFlow visualization
```

---

## Phase 2A — Critical Baseline Fixes
> Do this first. These are blockers for everything else.

### A1 — Fix Broken Model Name

**File: `.env.local`**

Change:
```
OPENAI_MODEL=gpt-5
```
To:
```
OPENAI_MODEL=gpt-4o
```

`gpt-5` is not a valid OpenAI model name. This causes every LLM node to fail with a 404 on every run.

### A2 — Fix StatePanel Visibility (Dark on White)

**File: `src/app/(demo)/execute/page.tsx`**

The right panel container uses `background: '#FFFFFF'` but `LiveStateTab` renders entirely in dark-theme styles (white text, `bg-black/10` cards). Result: everything is invisible.

Find the right panel div:
```jsx
<div style={{ background: '#FFFFFF', borderLeft: '1px solid #BDBDBD', ... }}>
  <StatePanel />
</div>
```

Change to:
```jsx
<div style={{ background: '#011E41', borderLeft: '1px solid rgba(255,255,255,0.08)', ... }}>
  <StatePanel />
</div>
```

### A3 — Fix Build Page Encoding Corruption

**File: `src/app/(demo)/build/page.tsx`**

The file has corrupted unicode. Replace:
- All instances of `?+"` → `—`
- All instances of `A·` → `·`
- All instances of `?+'` or `A?` → `→`
- Increase auto-advance countdown: `useState(3)` → `useState(5)`

### A4 — Fix Review Page Padding Bug

**File: `src/app/(demo)/review/page.tsx`**

The outer wrapper has both `paddingTop: 64` and `padding: '80px 24px'` — the shorthand overrides the first.

Replace:
```jsx
style={{
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minHeight: 'calc(100vh - 64px)',
  paddingTop: 64,
  padding: '80px 24px',
}}
```
With:
```jsx
style={{
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minHeight: 'calc(100vh - 64px)',
  marginTop: 64,
  padding: '40px 24px',
}}
```

---

## Phase 2B — Navigation System (Fix Broken Nav Throughout)

### What's broken
Navigation between screens is done by individual `router.push()` calls scattered across 5 pages. There is no persistent step indicator, no back navigation, no way to understand where you are in the workflow. The step indicator that exists on `/configure` is not present on any other page.

### What to build

**New file: `src/components/layout/StepNav.tsx`**

A persistent step progress bar that renders inside `AppHeader` across all workflow screens. Replace the per-page centerContent with this shared component.

```typescript
// Steps and their route paths
const WORKFLOW_STEPS = [
  { num: 1, label: 'Configure',     key: 'configure', path: '/configure' },
  { num: 2, label: 'Build graph',   key: 'build',     path: '/build' },
  { num: 3, label: 'Execute',       key: 'execute',   path: '/execute' },
  { num: 4, label: 'Review',        key: 'review',    path: '/review' },
  { num: 5, label: 'Report',        key: 'report',    path: '/report' },
];
```

**Visual spec:**
- Container: `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(255,255,255,0.1)`, `borderRadius: 100`, `padding: 4px 16px`
- Each step: a filled circle (amber `#F5A800` with dark number for active/completed, `rgba(255,255,255,0.2)` outline for future)
- Active step: amber filled circle + white label at full opacity
- Completed step: amber filled circle with `✓` + white label at 60% opacity + cursor pointer (clickable to go back)
- Future step: outlined dim circle + label at 30% opacity (not clickable)
- Separator: `›` at 30% opacity between steps
- Minimum font: 12px for labels, 10px for step numbers (IBM Plex Mono)

**Back navigation rule:**
- Completed steps are clickable. Clicking a completed step navigates back after showing a `confirm()` dialog: "Return to [step]? Current execution progress will be preserved."
- Only navigate back if `isRunning` is false. If running, show "Execution in progress — pause before navigating back."

**Update `AppHeader.tsx`:**
Remove the `centerContent` prop usage from each individual page. Instead, render `<StepNav />` directly in `AppHeader` when the current route is within the workflow (detect via `usePathname()`).

**Update each page to remove their centerContent step indicator:**
- `src/app/configure/page.tsx` — remove the manually built step indicator from `centerContent`
- `src/app/(demo)/execute/page.tsx` — remove `ExecuteHeaderCenter` from `centerContent`
- `src/app/(demo)/review/page.tsx` — remove the "Execution paused" chip from `centerContent` (move to an inline banner)
- `src/app/(demo)/report/page.tsx` — remove the status chips from `centerContent`

The header center is now always `<StepNav />` on workflow pages. Status information (running/paused/complete) moves to inline page elements.

**Store update — `src/store/executionStore.ts`:**
The `appPhase` field already tracks the current phase. `StepNav` reads this to determine active step. Ensure `appPhase` is set correctly at each transition:
- `/configure` → `appPhase = 'configure'`
- `/build` → `appPhase = 'build'`
- `/execute` → `appPhase = 'execute'`
- `/review` → `appPhase = 'review'`
- `/report` → `appPhase = 'complete'`

---

## Phase 2C — Configure Page Redesign

### What to build

The configure page is the entry point. It has two jobs: let the user pick a scenario, and show them what the agent graph will look like for that scenario.

**Target layout (full-width, below 64px header):**

```
┌─────────────────────────────────────┬──────────────────────────────────────────┐
│  LEFT PANEL (380px, dark indigo)    │  RIGHT PANEL (1fr, dark #011E41)         │
│  ─────────────────────────────────  │  ─────────────────────────────────────── │
│  Compact scenario tiles (3)         │  Agent Orchestration Preview Graph       │
│  + "Ask Sentinel" chat option       │  (parallel+series ReactFlow layout)      │
│                                     │                                          │
│  [Build agent graph →] button       │  Node hover: shows agent description     │
└─────────────────────────────────────┴──────────────────────────────────────────┘
```

### Left Panel Spec

**Background:** `#011E41` (dark — matches header, no jarring contrast)
**Width:** 380px fixed
**Padding:** `32px 24px`

**Header section:**
```
SENTINEL
Step 1 — Configure your package
```
- "SENTINEL" wordmark: 11px, IBM Plex Mono, amber `#F5A800`, letter-spacing 0.2em
- "Step 1" label: 11px mono, amber
- Main heading: 22px, Syne 700, white

**Scenario tiles (3 compact tiles):**

Each tile is a compact clickable card. NOT a full-height card like the current design — these need to be small enough that all 3 fit comfortably with room for the chat option below.

Per tile:
- Height: ~72px
- Background: selected → `rgba(245,168,0,0.08)`, unselected → `rgba(255,255,255,0.03)`
- Border: `1px solid` — selected: `rgba(245,168,0,0.4)`, unselected: `rgba(255,255,255,0.08)`
- Left border: 3px solid — selected: `#F5A800`, unselected: `rgba(255,255,255,0.15)`
- Border radius: 6px
- Padding: `12px 14px`
- Content:
  - Top: meeting type label (10px mono, amber/muted) + agent count badge (right-aligned, 10px mono, dark bg pill)
  - Bottom: scenario title (14px, IBM Plex Sans 700, white) + HITL badge if applicable (coral pill)
- No description text (that moves to the right panel when selected)
- Clicking a tile selects it AND updates the right panel graph

**4th option — "Ask Sentinel":**
Below the 3 tiles, separated by a `rgba(255,255,255,0.08)` divider:

```
[chat bubble icon]  Ask Sentinel
                    Describe your meeting and I'll configure
                    the right agents for you
```
- Same card style as scenario tiles
- Clicking this tile opens the chat interface IN THE LEFT PANEL (the 3 tiles slide up and compress; a chat interface replaces the lower portion)
- When chat mode is active: show chat messages history, input field, send button
- Sentinel can answer: what does each agent do? what data does it use? what are the rules? which scenario fits?
- When Sentinel recommends a scenario, the corresponding tile auto-selects and the right panel updates

**Build button:**
- Full width, at bottom of left panel
- 48px height, amber `#F5A800`, text: "Build agent graph →"
- Shows selected scenario name in smaller text below: e.g. "Falcon Board Q4 · 10 agents · HITL enabled"
- Loading state: spinning indicator, text "Assembling graph..."
- Disabled (40% opacity) if no scenario selected

### Right Panel Spec — Agent Orchestration Preview

This is a static/interactive ReactFlow graph showing the SELECTED scenario's agent topology in a **parallel+series layout**. This is the primary visual differentiator — it should show that agents don't just chain one after another.

**Visual topology definitions** (define these in `src/data/scenarios.ts` as `visualColumns`):

```typescript
// falcon-board visual columns (parallel+series)
visualColumns: [
  ['meta_agent'],                                                    // Col 0: Orchestrator
  ['financial_aggregator', 'capital_monitor', 'credit_quality'],    // Col 1: Parallel analysis
  ['trend_analyzer', 'regulatory_digest', 'operational_risk'],      // Col 2: Parallel synthesis
  ['supervisor'],                                                    // Col 3: Aggregation
  ['hitl_gate'],                                                     // Col 4: Human gate
  ['report_compiler'],                                              // Col 5: Output
]

// audit-committee visual columns
visualColumns: [
  ['meta_agent'],
  ['regulatory_digest', 'operational_risk'],    // Parallel
  ['supervisor'],
  ['report_compiler'],
]

// risk-flash visual columns
visualColumns: [
  ['meta_agent'],
  ['capital_monitor', 'credit_quality'],        // Parallel
  ['report_compiler'],
]
```

**Edge definitions for the parallel layout:**
- `meta_agent` → each node in column 1 (fan-out edges)
- Each node in column 1 → `trend_analyzer` (for falcon-board: financial, capital, credit all feed trend)
- Each node in columns 1+2 → `supervisor` (fan-in edges, multiple sources to one target)
- `supervisor` → `hitl_gate` (dashed, labeled "PROCEED")
- `supervisor` → `report_compiler` (dashed, labeled "SKIP HITL")
- `hitl_gate` → `report_compiler`

**New layout algorithm** in `src/store/executionStore.ts` → `computeLayout()`:
Replace the topological sort with a column-based layout:

```typescript
export function computeColumnLayout(
  visualColumns: string[][],
  nodeW = 180,
  nodeH = 80,
  colGap = 140,
  rowGap = 24,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  visualColumns.forEach((column, colIdx) => {
    const totalH = column.length * nodeH + (column.length - 1) * rowGap;
    const startY = -totalH / 2;
    column.forEach((nodeId, rowIdx) => {
      positions.set(nodeId, {
        x: colIdx * (nodeW + colGap),
        y: startY + rowIdx * (nodeH + rowGap),
      });
    });
  });
  
  return positions;
}
```

**Right panel visual style:**
- Background: `#011E41` (dark — same as left panel, unified dark experience)
- AnimatedGridPattern overlay at 4% opacity
- Nodes in preview state: same NodeShell design but smaller (160×72px), idle state (42% opacity)
- Show connection type icons: fan-out (multiple arrows from one source), fan-in (multiple arrows to one target)
- Hovering a node in the preview shows a tooltip:
  - Agent name + type badge
  - 1-sentence mandate description
  - Data sources used (e.g. "Uses: NIM, ROA, ROE, efficiency ratio")
  - Formula hint for deterministic nodes (e.g. "NIM = (Interest Income − Interest Expense) / Avg Earning Assets")
- Panel header: "Agent orchestration — [Scenario Name] · [N] nodes" in 11px mono

**Files to create/modify:**
- `src/data/scenarios.ts` — add `visualColumns: string[][]` to each `ScenarioData`
- `src/types/scenarios.ts` — add `visualColumns` field to `ScenarioData` type
- `src/store/executionStore.ts` — add `computeColumnLayout()`, update `handleSSEEvent` to use it when `visualColumns` is available
- `src/app/configure/page.tsx` — full redesign per above spec
- `src/components/configure/ScenarioPreviewGraph.tsx` — new component: static ReactFlow graph for the right panel
- `src/components/configure/ScenarioTile.tsx` — new component: compact scenario tile
- `src/components/configure/SentinelChat.tsx` — new component: chat panel (extracted from current configure page, enhanced)

---

## Phase 2D — Execute Page Redesign

### Target layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  HEADER (64px): [Crowe | Sentinel] [StepNav center] [NETWORK | DETAIL toggle]  │
│                                                              [Compare] [Reset]   │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  MAIN AREA (full screen minus header and log panel):                            │
│  ├── NETWORK VIEW: 3-column [240px left | 1fr center graph | 320px right dark] │
│  └── DETAIL VIEW:  grid of Agent Windows (see Agent Detail spec below)          │
│                                                                                  │
├────────────────────────────────────────────────────────────────────────────────┤
│  LOG PANEL (200px, collapsible): Real-time execution log feed                  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### View Toggle

The header right area contains a view toggle with two options:

```
[  ⬡ NETWORK  |  ⊞ AGENTS  ]
```

- **NETWORK** (default): The ReactFlow graph canvas with the parallel layout from Phase 2C. Click any node to open the Agent Inspector (see below).
- **AGENTS**: A grid view of Agent Windows — one "terminal window" per node showing real-time processing.

This replaces the current GRID/ORBIT toggle.

### Network View Changes

1. **Use the column-based parallel layout** from Phase 2C. The graph now shows fan-out and fan-in edges.

2. **Left sidebar** (240px, white background):
   - Scenario info at top (name, meeting type, date) — 3 compact lines
   - Speed controls (3 buttons: SLOW/NORMAL/FAST) — minimal height
   - Node type legend — compact, 12px minimum font
   - All text: minimum 12px

3. **Center canvas** (dark `#011E41`):
   - Parallel column layout — nodes that can run in parallel appear in the same vertical column
   - Fan-out edges from meta_agent (animated, with branching visual)
   - Fan-in edges to supervisor (multiple lines converging)
   - Conditional edges from supervisor: dashed, with "PROCEED" / "SKIP HITL" labels
   - Clicking any node opens the Agent Inspector panel (right side overlay or drawer)
   - Node size: 180×80px minimum (slightly larger than current 200×88 but more compact header)

4. **Right panel** (320px, `#011E41` dark background):
   - Tabs: "Live State" | "Agent Output"
   - "Live State" tab: the existing LiveStateTab (dark themed — now correct on dark bg)
   - "Agent Output" tab: when a node is clicked/selected, shows that node's output in detail

5. **Log panel** (200px, not 120px):
   - Collapsible: click the "Agent log" label to collapse to 40px, expand back to 200px
   - Shows real-time execution entries as they stream in
   - Each row: timestamp (mono 11px) | agent name | step description | duration
   - HITL rows: coral background tint
   - Error rows: red background tint

### Agent Detail View (AGENTS mode)

When the user toggles to AGENTS view, the main area shows a responsive grid of "Agent Windows" — one per node in the current scenario topology.

**Agent Window component spec (`src/components/execute/AgentWindow.tsx`):**

Each window is a card styled like a terminal/IDE panel:
- Background: `rgba(0,46,98,0.85)` (same as node cards)
- Border: 1px `rgba(255,255,255,0.1)`, with colored left border (3px, node type color)
- Min-height: 280px
- Border radius: 8px

**Window header (36px):**
- Left: node type color dot (8px) + badge label (10px mono) + agent name (13px bold white)
- Right: execution state badge (IDLE / RUNNING / COMPLETE / PAUSED) + duration when complete

**Window body tabs (within the card):**
```
[ MANDATE ] [ DATA ] [ RULES/PROMPT ] [ LOG ]
```

**Tab: MANDATE**
- Agent description (from NODE_REGISTRY): 13px body text, white
- Formula hint (for deterministic/algorithmic nodes): displayed in a code-style block, mono font, amber text
- Data sources: bulleted list of what inputs this agent uses
- Output: what the agent produces

**Tab: DATA**
Shows the raw input data this specific agent processes. Source: the scenario's raw data object.

For `financial_aggregator`:
```
INPUT: Raw financial data
{
  "nim":  { "actual": 3.21, "budget": 3.40, "priorPeriod": 3.44 },
  "roa":  { "actual": 1.02, "budget": 1.05, "priorPeriod": 1.00 },
  "roe":  { "actual": 10.8, "budget": 11.0, "priorPeriod": 10.5 },
  ...
}
```

For `regulatory_digest`:
```
INPUT: Open MRAs
  MRA-2024-01: CECL documentation · Moderate · Due 2025-04-18 · In progress
  MRA-2024-02: BSA/AML SAR timeliness · Serious · Due 2025-01-05 · OVERDUE

INPUT: Upcoming Exams
  OCC · Scheduled 2025-03-17 · BSA/AML validation and issue remediation
```

Display format: JSON viewer with syntax highlighting (use a simple monospaced pre block with color-coded keys/values). NOT a raw JSON dump — format it as structured, readable data.

Store the "raw input snapshot" per node — add a `nodeInputs: Record<string, unknown>` field to the Zustand store. Populate it when a node starts via the SSE `node_started` event. The `node_started` event should be extended to include the relevant slice of `rawData` for that node.

**Tab: RULES/PROMPT**

For deterministic nodes (financial_aggregator, capital_monitor, credit_quality):
- Show the actual computation rules as numbered steps
- Example for financial_aggregator:
  ```
  1. NIM variance = (actual − budget) / budget × 100
     → (3.21 − 3.40) / 3.40 × 100 = −5.59%
  
  2. Flag rule: NIM variance < −5% → AMBER flag
     → −5.59% < −5%: TRUE → "NIM variance −5.6% below budget threshold"
  
  3. Flag rule: efficiency ratio > 60% → AMBER flag
     → 61.4% > 60%: TRUE → "Efficiency ratio 61.4% exceeds ceiling"
  
  4. RAG: 0 flags → GREEN | 1 flag → AMBER | 2+ flags → RED
     → 2 flags → RAG: AMBER
  ```
- These rules are hardcoded display strings derived from the actual source code logic in each node file

For LLM nodes (regulatory_digest, operational_risk, trend_analyzer, report_compiler):
- Show the actual system prompt from `src/lib/prompts/[nodeName].ts`
- Display in a scrollable code block with IBM Plex Mono font
- Label: "System prompt sent to GPT-4o"

For orchestrator nodes (meta_agent, supervisor):
- Show the routing logic: what decisions it makes and when
- For supervisor: the four possible decisions and their triggers

**Tab: LOG (real-time)**

This is the most important tab. Shows step-by-step processing events as they stream in.

Requires new SSE event type: `node_progress`

```typescript
// Add to src/types/events.ts
{
  type: 'node_progress';
  runId: string;
  nodeId: string;
  nodeType: string;
  step: string;           // Human-readable step description
  detail?: string;        // Optional detail line (formula result, data value, etc.)
  timestamp: string;
}
```

**Log display format:**
```
12:34:01.234  ░░░  Loading raw financial data from scenario...
12:34:01.241  ░░░  Computing NIM: (3.21 − 3.40) / 3.40 = −5.59%
12:34:01.248  ⚑    Flag: NIM variance −5.6% below budget threshold (−5% rule)
12:34:01.251  ░░░  Computing ROA: 1.02% vs budget 1.05% (−2.9% variance)
12:34:01.255  ░░░  Computing ROE: 10.8% vs budget 11.0% (−1.8% variance)
12:34:01.258  ⚑    Flag: Efficiency ratio 61.4% exceeds 60% ceiling
12:34:01.261  ✓    RAG classification: AMBER (2 flags)
12:34:01.263  ✓    COMPLETE — financial_aggregator — 29ms
```

- Each step appears as a new row streaming in (the container auto-scrolls to bottom)
- Timestamps in 11px IBM Plex Mono
- Step icons: `░░░` (processing, gray) | `⚑` (flag, amber) | `✓` (success, teal) | `✗` (error, coral)
- Rows fade in with a 100ms opacity transition as they appear

**Add `node_progress` events to each node file:**

`src/lib/graph/nodes/financialAggregator.ts`:
```typescript
// After loading data:
emit(runId, { type: 'node_progress', nodeId: 'financial_aggregator', 
  step: 'Loading raw financial data from scenario...' });

// After each metric computation:
emit(runId, { type: 'node_progress', nodeId: 'financial_aggregator',
  step: `Computing NIM: (${rawFinancials.nim.actual} − ${rawFinancials.nim.budget}) / ${rawFinancials.nim.budget} = ${nim.variance.toFixed(2)}%`,
  detail: nim.variance < -5 ? 'FLAG: variance below −5% threshold' : 'Within threshold' });

// Etc. for each metric and flag check
```

Add similar progress events to ALL 10 node files. For LLM nodes, emit progress events at:
1. "Reading input data..."
2. "Preparing analysis prompt..."
3. "Calling language model..." (and note the model name)
4. "Processing response..." (when LLM returns)
5. "Extracting structured output..."
6. "RAG classification: [status]" (if applicable)

**Store update for progress events:**

Add to `ExecutionState` in `executionStore.ts`:
```typescript
nodeProgressLogs: Record<string, Array<{ step: string; detail?: string; timestamp: string }>>;
nodeInputSnapshots: Record<string, unknown>;
nodeOutputs: Record<string, unknown>;
```

Add to `handleSSEEvent`:
```typescript
case 'node_progress': {
  set((prev) => ({
    nodeProgressLogs: {
      ...prev.nodeProgressLogs,
      [event.nodeId]: [...(prev.nodeProgressLogs[event.nodeId] ?? []), {
        step: event.step,
        detail: event.detail,
        timestamp: event.timestamp,
      }],
    },
  }));
  break;
}
```

### Agent Inspector (click on node in Network view)

When the user clicks a node in the Network view (GRID mode), instead of navigating away, open the Agent Inspector as a **right-side drawer** that slides in over the StatePanel.

- Width: 400px
- Dark background: `#002E62`
- Header: close button (×), agent name, type badge
- Body: the same 4-tab interface as the Agent Window (MANDATE / DATA / RULES/PROMPT / LOG)
- The LOG tab in the inspector live-streams `node_progress` events for that node

Add `selectedNodeId: string | null` to the store. Set on node click.

`GraphCanvas.tsx`: add `onNodeClick` handler → `setSelectedNodeId(node.id)`.

New component: `src/components/execute/AgentInspector.tsx`

---

## Phase 2E — Streaming Report Generation

### What to build

The report page currently shows a pre-populated document. Phase 2E makes the generation visible — the board memo appears section by section as the report_compiler LLM generates it.

### New SSE event: `report_section_started` and `report_token`

**Add to `src/types/events.ts`:**
```typescript
{
  type: 'report_section_started';
  runId: string;
  sectionId: string;
  sectionTitle: string;
  sectionIndex: number;
  timestamp: string;
}

{
  type: 'report_token';
  runId: string;
  sectionId: string;
  token: string;           // chunk of text (word or sentence)
  timestamp: string;
}

{
  type: 'report_section_complete';
  runId: string;
  sectionId: string;
  ragStatus: 'red' | 'amber' | 'green';
  timestamp: string;
}
```

### Changes to `report_compiler` node

**File: `src/lib/graph/nodes/reportCompiler.ts`**

Currently: generates the full report in one LLM call and emits `node_completed` with the full text.

Change to: use the OpenAI `stream: true` option. For each section:
1. Emit `report_section_started` with section title
2. Stream tokens as they arrive, batching into word-level chunks (emit `report_token` every ~5-10 tokens)
3. When section is complete (detected by section separator in the prompt response), emit `report_section_complete`
4. Move to next section

The prompt structure should instruct the LLM to output sections with clear delimiters so the streaming parser knows where one section ends and the next begins.

### Store changes

Add to `ExecutionState`:
```typescript
reportSections: Array<{
  id: string;
  title: string;
  content: string;      // Accumulates as tokens arrive
  ragStatus?: 'red' | 'amber' | 'green';
  isStreaming: boolean;
  isComplete: boolean;
}>;
```

Handle `report_section_started`, `report_token`, `report_section_complete` in `handleSSEEvent`.

### Report page changes

**File: `src/app/(demo)/report/page.tsx`**

**Target layout** (3-column, dark-framed document):
```
┌──────────────────┬──────────────────────────────┬──────────────────┐
│ LEFT TOC         │  CENTER: White document       │ RIGHT TRACE      │
│ (240px, #011E41) │  (scrollable, max-width 720)  │ (280px, #011E41) │
│                  │                               │                  │
│ Section list     │  Report streaming in section  │ Agent execution  │
│ with RAG dots    │  by section in real-time       │ timeline trace   │
│                  │                               │                  │
│ [Download DOCX]  │                               │                  │
│ sticky at bottom │                               │                  │
└──────────────────┴──────────────────────────────┴──────────────────┘
```

**Left TOC panel (dark, `#011E41`):**
- Section list with RAG status dots
- Sections that haven't started: dimmed (30% opacity)
- Sections streaming: pulsing amber dot
- Sections complete: solid colored dot (green/amber/red)
- Click a section: scroll to it
- **Bottom sticky: "Download DOCX" amber button** — most prominent CTA on the page

**Center document (white card, scrollable):**
- Document header: institution name + meeting type + date + Crowe branding
- Each section appears one at a time:
  - Section heading appears first
  - Then the RAG badge appears
  - Then text streams in character by character (or word by word via token events)
  - A blinking cursor `|` appears at the current write position while streaming
  - When section is complete, cursor disappears and the next section begins
- Fallback: if `reportSections` is empty after 2 seconds of `isComplete`, display `FALLBACK_SECTIONS`

**Right trace panel (dark, `#011E41`):**
- "Agent execution trace" title
- Timeline of all completed agents (existing design, but on dark background)
- When a section is streaming, the corresponding agent in the trace is highlighted with an amber glow

**Report page generation states:**
1. `isComplete === false && reportSections.length === 0` — "Report compiling..." loading state
2. `reportSections.length > 0 && some.isStreaming` — sections are streaming in (show cursor)
3. `isComplete === true && all sections complete` — show download CTA prominently

---

## Phase 2F — Execute Page: Execution Error State

When the SSE stream receives a type `'error'` event, the execute page must show a visible error state.

**Add to `ExecutionState`:**
```typescript
executionError: string | null;
```

Set in `handleSSEEvent` for `case 'error'`:
```typescript
executionError: event.message
```

**In execute page:** When `executionError` is non-null AND `!isRunning`:
- Show a full-width banner above the log panel:
  - Background: `rgba(229,55,107,0.1)`, border-top: `2px solid #E5376B`
  - Icon: ⚠ coral
  - Title: "Execution failed"
  - Message: `executionError` value
  - Button: "Reset and reconfigure →" → calls `resetAll()` + `router.push('/configure')`
- The reset button in the header also becomes full-opacity amber (not the current dim coral)

---

## Phase 2G — Landing Page Improvements

Lower priority — do after 2A-2F are complete.

### Changes to `src/app/page.tsx`

**Hero section — right side:**
Replace the static agent list card with an actual mini-preview of the graph visualization. Use a scaled-down (60%) version of the ReactFlow canvas showing the parallel topology for falcon-board, with nodes in their colored styles but all in "idle" state. No interactivity — just visual.

Alternatively: show a looping animation where nodes sequentially "activate" (glow) and "complete" (checkmark) to demonstrate what execution looks like.

**Agent roster section (new section between hero and "How it works"):**
Add a section showcasing all 10 agents with their type color, name, badge, and 1-sentence description. Layout: a 5×2 grid or a horizontal scrollable strip.

```
[violet] Meta Agent · ORCHESTRATOR
"Constructs the dynamic execution graph based on scenario requirements."

[blue] Financial Aggregator · RULES ENGINE  
"Computes NIM, ROA, ROE, and efficiency ratio from raw financial data."

[blue] Capital Monitor · RULES ENGINE
"Evaluates CET1, Tier 1, Total Capital, LCR, and NSFR against thresholds."

... etc.
```

**"How it works" section:**
The current 4-column static grid is adequate. Increase the badge font from 10px to 12px.

---

## Component Reference — New Files to Create

```
src/components/layout/StepNav.tsx                    Phase 2B
src/components/configure/ScenarioTile.tsx            Phase 2C
src/components/configure/ScenarioPreviewGraph.tsx    Phase 2C
src/components/configure/SentinelChat.tsx            Phase 2C
src/components/execute/AgentWindow.tsx               Phase 2D
src/components/execute/AgentInspector.tsx            Phase 2D
src/components/execute/StatusLogFeed.tsx             Phase 2D
src/components/execute/ViewToggle.tsx                Phase 2D
src/components/report/StreamingSection.tsx           Phase 2E
src/components/report/ReportTOC.tsx                  Phase 2E
```

## Files Modified (beyond Phase 2A fixes)

```
src/app/page.tsx                                     Phase 2G
src/app/configure/page.tsx                           Phase 2C (full redesign)
src/app/(demo)/build/page.tsx                        Phase 2A (encoding fix)
src/app/(demo)/execute/page.tsx                      Phase 2D (major redesign)
src/app/(demo)/review/page.tsx                       Phase 2A, 2B
src/app/(demo)/report/page.tsx                       Phase 2E (major redesign)
src/components/layout/AppHeader.tsx                  Phase 2B
src/store/executionStore.ts                          Phase 2B, 2C, 2D, 2E, 2F
src/types/events.ts                                  Phase 2D, 2E
src/types/scenarios.ts                               Phase 2C
src/data/scenarios.ts                                Phase 2C
src/lib/graph/nodes/financialAggregator.ts           Phase 2D
src/lib/graph/nodes/capitalMonitor.ts                Phase 2D
src/lib/graph/nodes/creditQuality.ts                 Phase 2D
src/lib/graph/nodes/trendAnalyzer.ts                 Phase 2D
src/lib/graph/nodes/regulatoryDigest.ts              Phase 2D
src/lib/graph/nodes/operationalRisk.ts               Phase 2D
src/lib/graph/nodes/supervisor.ts                    Phase 2D
src/lib/graph/nodes/reportCompiler.ts                Phase 2E (streaming)
src/lib/graph/nodes/hitlGate.ts                      Phase 2D
src/lib/graph/nodes/index.ts                         Phase 2D
src/lib/graph/graph.ts                               Phase 2C (parallel execution)
src/app/api/analyze/route.ts                         Phase 2C (use visualColumns)
```

---

## Data Architecture Changes

### Scenarios (src/data/scenarios.ts + src/types/scenarios.ts)

Add `visualColumns: string[][]` to the `ScenarioData` type and all 3 scenarios.

Also add `agentDataSources: Record<string, string[]>` — maps node ID to list of data source descriptions for the DATA tab in agent inspector. Example:
```typescript
agentDataSources: {
  financial_aggregator: ['Raw NIM, ROA, ROE, efficiency ratio from scenario'],
  capital_monitor: ['CET1, Tier 1, Total Capital ratios', 'LCR and NSFR liquidity ratios'],
  regulatory_digest: ['Open MRA list with status and due dates', 'Upcoming exam schedule'],
  ...
}
```

### Zustand Store — New Fields

```typescript
// Add to ExecutionState
nodeProgressLogs: Record<string, Array<{ step: string; detail?: string; timestamp: string }>>;
nodeInputSnapshots: Record<string, unknown>;
nodeOutputs: Record<string, unknown>;
selectedNodeId: string | null;
executionError: string | null;
reportSections: ReportSection[];   // Replaces/augments existing reportDraft

// New ReportSection structure (update types/state.ts)
interface ReportSection {
  id: string;
  title: string;
  content: string;
  ragStatus?: 'red' | 'amber' | 'green';
  metrics?: Record<string, unknown>;
  isStreaming?: boolean;    // NEW
  isComplete?: boolean;     // NEW
}
```

Add these to `resetAll()` and `initialState`.

### SSE Events (src/types/events.ts)

Add 4 new event types:
```typescript
| { type: 'node_progress'; runId: string; nodeId: string; nodeType: string; step: string; detail?: string; timestamp: string }
| { type: 'report_section_started'; runId: string; sectionId: string; sectionTitle: string; sectionIndex: number; timestamp: string }
| { type: 'report_token'; runId: string; sectionId: string; token: string; timestamp: string }
| { type: 'report_section_complete'; runId: string; sectionId: string; ragStatus: 'red' | 'amber' | 'green'; timestamp: string }
```

---

## Design System Reminders (enforce throughout all new components)

- **Minimum font size: 12px** for all visible text. Badges/mono labels may go to 11px. Nothing below 11px.
- **IBM Plex Sans** for body text (labels, descriptions, button text)
- **Syne** for headings only (page titles, section headings)
- **IBM Plex Mono** for: all badges, status labels, timestamps, step indicators, data values, any technical/code content
- **Dark panels are dark** — `#011E41` or `rgba(0,46,98,0.85)`. Do not put dark-themed content on white backgrounds.
- **Light panels are for documents only** — report center column, review approval card
- **Amber `#F5A800`** is the only primary CTA color. One primary CTA per screen.
- **Left-border 3px accent** pattern for all cards and panels that have a type/color identity
- No animation library other than `motion/react` (NOT framer-motion) and `animejs v4`

---

## Implementation Order Within Each Phase

Within each phase, implement in this order:
1. Type/interface changes (types/*.ts, data/*.ts)
2. Store changes (executionStore.ts)
3. API/server changes (lib/graph/nodes/*.ts, app/api/*)
4. New leaf components (components/**/*.tsx)
5. Page-level integration (app/**/*.tsx)
6. Test end-to-end navigation and SSE flow

---

## Acceptance Criteria

### Phase 2A (Baseline fixes)
- [ ] `/api/chat` returns valid AI responses (model name fixed)
- [ ] Execute page right panel: LiveState metrics are visible (white text on dark background)
- [ ] Build page: no garbled characters in any text
- [ ] Review page: modal card clears the header on all viewports

### Phase 2B (Navigation)
- [ ] Step indicator visible on all 5 workflow screens in the header
- [ ] Active step is clearly highlighted (amber)
- [ ] Completed steps are clickable (with confirmation dialog)
- [ ] No page has its own bespoke step indicator — all use StepNav

### Phase 2C (Configure redesign)
- [ ] Left panel is dark (matches header) — no white-on-dark jarring split
- [ ] 3 scenario tiles are compact — all 3 + chat option visible without scrolling on 1080p
- [ ] Right panel shows a parallel+series graph layout (not linear chain)
- [ ] Hovering a node shows agent description tooltip
- [ ] "Ask Sentinel" chat option is accessible from the left panel
- [ ] All text in left panel ≥ 12px

### Phase 2D (Execute redesign)
- [ ] Toggle between NETWORK view and AGENTS view works
- [ ] AGENTS view shows one card per node with 4 tabs (MANDATE / DATA / RULES-PROMPT / LOG)
- [ ] LOG tab streams `node_progress` events in real time as execution runs
- [ ] DATA tab shows the actual input data for each agent
- [ ] RULES/PROMPT tab shows formulas (deterministic) or system prompt (LLM)
- [ ] Clicking a node in NETWORK view opens Agent Inspector drawer
- [ ] Log panel is 200px and collapsible
- [ ] Execution error state is visible with recovery button

### Phase 2E (Streaming report)
- [ ] Report page shows sections streaming in one at a time
- [ ] Text appears character by character (or word by word) while LLM generates
- [ ] Streaming cursor `|` visible at write position
- [ ] TOC sections update their RAG dot as each section completes
- [ ] Download DOCX button is the most prominent action (bottom of left TOC panel)

---

## Verify Command

After each phase:
```bash
npx tsc --noEmit   # 0 TypeScript errors
npm run build      # clean production build
npm run dev        # visual check all screens
```

Test the full end-to-end flow:
1. `/configure` → select Falcon Board → verify parallel graph in right panel
2. Click "Build agent graph" → `/build` transition
3. `/execute` → verify nodes animate in parallel columns → toggle AGENTS view → click a node → see LOG streaming
4. HITL gate fires → `/review` → approve
5. `/report` → verify sections stream in one by one → download DOCX
