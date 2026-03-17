# SENTINEL — Configure Page Redesign PRD
## File: CONFIGURE_PAGE_PRD.md
**Page to rewrite:** `src/app/configure/page.tsx`
**New components to create:** `src/components/configure/` (extend existing folder)
**Data file:** `src/data/agentDisplayData.ts` (already written — import from here)
**Owner:** Achyuth Rachur, Crowe AI Innovation Team

---

## SCOPE

This PRD covers ONLY:
- `src/app/configure/page.tsx`
- Components inside `src/components/configure/`

Do NOT touch:
- Any other page
- The store, API routes, or data files
- `src/components/layout/` (AppHeader, StepNav)
- `src/data/` files

---

## INSTALL THESE FIRST

```bash
# Drag-and-drop for custom builder mode
NODE_TLS_REJECT_UNAUTHORIZED=0 npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Animated beam for connecting dropped agents
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/aceternity/animated-beam"
```

If `animated-beam` fails SSL, build the beam with SVG `<path>` + `stroke-dashoffset` animation using `motion/react` — the pattern already exists in the landing page hero graph. Do not block on failed installs.

All other dependencies are already installed:
- `@xyflow/react` — for the preset orchestration graph
- `motion/react` — for all animations
- `lucide-react` — for icons
- `AGENT_DISPLAY_DATA` from `@/data/agentDisplayData` — for all agent data panels

---

## PAGE ARCHITECTURE — Three Modes

The configure page has three distinct modes. The user picks one by clicking a mode selector at the top of the left panel.

```
MODE A: Preset      → Select a pre-built scenario
MODE B: AI Chat     → Describe your meeting, AI builds the graph
MODE C: Custom      → Drag and drop agents onto a blank canvas
```

All three modes share:
- The same `AppHeader` with `StepNav`
- A left panel for controls (280px wide, fixed)
- A right panel that fills all remaining space
- The same "Execute →" button at the bottom of the left panel
- The same navigation guard: if no `runId`, redirect to `/configure`

---

## LEFT PANEL (all modes)

Fixed width: 280px. Background: `#011E41`. Full height minus 64px header.

```
┌──────────────────────────────┐
│  SENTINEL                    │  ← amber mono label
│  Configure your package      │  ← heading
│                              │
│  ┌────┬────────┬─────────┐   │  ← mode selector tabs
│  │ A  │   B    │    C    │   │
│  │Pre │  Chat  │ Custom  │   │
│  └────┴────────┴─────────┘   │
│                              │
│  [Mode-specific controls]    │  ← changes per mode
│                              │
│  [spacer fills remaining]    │
│                              │
│  [error banner if any]       │
│  [Execute → button]          │  ← amber, full width
│  [scenario + agent count]    │  ← small caption below
└──────────────────────────────┘
```

### Mode selector tabs

Three equal-width tabs, styled as pill buttons:

```tsx
const MODES = [
  { id: 'preset', label: 'Preset' },
  { id: 'chat',   label: 'AI Chat' },
  { id: 'custom', label: 'Custom' },
];
```

Active tab: amber background (`#F5A800`), indigo text (`#011E41`), bold.
Inactive tabs: transparent, white 50% text, border `rgba(255,255,255,0.12)`.

Switching modes updates the right panel immediately.

### Execute button (all modes)

At the bottom of the left panel, pinned:

```tsx
<button onClick={handleBuild} disabled={isBuilding || !canExecute}>
  {isBuilding ? 'Assembling graph…' : 'Execute →'}
</button>
```

`canExecute` logic:
- Preset mode: always true (a scenario is always selected)
- Chat mode: true once at least one agent has been added to the graph
- Custom mode: true once at least 2 agents are on the canvas

---

## MODE A — PRESET (right panel)

### Overview

The right panel shows the selected scenario's full agent orchestration graph filling the entire space. Agents are large, readable, clickable. Clicking any agent opens the Agent Detail Drawer.

This replaces the current `ScenarioPreviewGraph` which is too small and hard to read.

### Left panel content (Mode A)

Below the mode tabs:

```
SCENARIO

[Tile: Falcon Board Q4]       ← isSelected = amber left border
[Tile: Audit Committee]
[Tile: Risk Flash]
```

Scenario tiles are compact (keep existing `ScenarioTile` component). All three visible without scrolling.

### Right panel (Mode A) — Full-screen orchestration graph

The graph fills the entire right panel at 100% width and height.

**Key differences from the current `ScenarioPreviewGraph`:**
- Nodes are larger: 200px wide × 90px tall
- Nodes are interactive — clicking one opens the Agent Detail Drawer (see below)
- Column headers are visible above each column of nodes
- Parallel columns have a visual grouping bracket or subtle background rect
- The graph auto-fits to fill the panel on scenario change

**Node appearance (larger, more readable):**

```
┌─────────────────────────────┐
│ [type badge]    [status dot] │  ← top row
│                              │
│  [Agent label — 14px bold]  │  ← main label
│  [description — 11px, muted]│  ← one line, truncated
│                              │
│  [data source count tag]    │  ← bottom-left
└─────────────────────────────┘
  3px left border = node type color
```

**Column headers** (shown above each column of nodes):

```
Stage 01          Stage 02                  Stage 03
Orchestration     Data Collection           Synthesis
                  ← 3 agents running in →   ← 3 agents running in →
                     parallel                  parallel
```

Column header style: `fontSize: 10, fontFamily: var(--font-mono), color: rgba(255,255,255,0.35), textTransform: uppercase, letterSpacing: 0.1em`

For columns with 2+ nodes, add a subtle label: `"parallel execution"` in amber mono text below the column header.

**On node hover:** Slight glow (box-shadow in node type color at 30% opacity), cursor becomes pointer.

**On node click:** Open the Agent Detail Drawer.

### Agent Detail Drawer

A slide-in drawer from the right side of the right panel. Width: 420px. Sits on top of the graph (z-index 50). Does NOT push the graph — it overlays it.

**Drawer structure:**

```
┌──────────────────────────────────────────┐
│ [←  Back to graph]          [✕ Close]   │
│ ──────────────────────────────────────── │
│ [node type badge]                        │
│ [Agent Name — 22px bold]                │
│ [one-line description]                   │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │  DATA THIS AGENT WORKS WITH          │ │
│ │  (content from agentDisplayData.ts)  │ │
│ │                                      │ │
│ │  [tables / gauges / sparklines /     │ │
│ │   decision matrix / topology /       │ │
│ │   output structure — per agent]      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [explanation text — from agentDisplayData│
│  .explanation field]                     │
│                                          │
│ [note — from agentDisplayData.note]      │
└──────────────────────────────────────────┘
```

**Drawer animation:**

```tsx
<motion.div
  initial={{ x: 420, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 420, opacity: 0 }}
  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
/>
```

Use `AnimatePresence` so the exit animation plays when the drawer closes.

**Drawer background:** `#001833` (darker than graph canvas). Light border on left: `1px solid rgba(255,255,255,0.08)`.

**Scrollable content area:** The data content inside the drawer is scrollable. The header (agent name + close button) stays fixed at the top.

### Agent Detail Drawer — Data rendering

Import `getAgentDisplayData` from `@/data/agentDisplayData`. Call it with the clicked agent's ID. Render based on what fields are present in the returned panel object.

**Rendering rules:**

1. **`tableRows` + `tableHeaders`** → render as a styled table:
   - Header row: `background: #011E41`, white text, mono font, uppercase, 11px
   - Data rows: alternating `#F4F4F4` / `#FFFFFF` backgrounds, 13px body text
   - `highlight: 'red'` → last cell gets `background: #FDEEF3, color: #992A5C`
   - `highlight: 'amber'` → last cell gets `background: #FFF5D6, color: #D7761D`
   - `highlight: 'green'` → last cell gets `background: #E1F5EE, color: #0C7876`
   - `bold: true` → entire row is font-weight 700

2. **`gauges`** → render each as a labeled horizontal bar:
   ```
   CET1 Ratio          10.8%   (min 4.5%  |  well-cap 6.5%)
   ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   ```
   - Bar container: full width, height 8px, background `#E0E0E0`, border-radius 4px
   - Fill: `fillPct`% of width, color from `status` (green = `#05AB8C`, amber = `#F5A800`, red = `#E5376B`)
   - Two vertical tick marks on bar at minimum and well-cap thresholds (if present)

3. **`sparkLines`** → render each as an SVG line chart (no external chart library):
   - Width: 100% of container, height: 80px
   - Plot 5 points across the width, connected by a smooth line
   - Dots at each point (4px circles, filled)
   - Quarter labels below x-axis: `Q4'23`, `Q1'24`, `Q2'24`, `Q3'24`, `Q4'24`
   - Color from `sparkLine.color`
   - `trend: 'down'` + flag → add small `▼ declining` label in coral red
   - `trend: 'up'` + flag → add `▲ rising` label in coral red
   - `trend: 'up'` + no flag → `▲ improving` in teal

4. **`decisionRows`** → render as a decision matrix:
   ```
   Input                    Value                    
   Financial RAG            AMBER          ⚠
   Capital RAG              GREEN          ✓
   Credit RAG               RED            ⚠⚠
   ```
   - `flag: 'critical'` → coral `⚠⚠` badge
   - `flag: 'warning'` → amber `⚠` badge
   - `flag: 'ok'` → teal `✓` badge
   - Decision + rationale shown below the matrix in a highlighted box (amber border)

5. **`topologyColumns`** → render as column diagram showing which agents run when:
   - Each column is a vertical stack of agent name chips
   - Arrows between columns
   - Column label above

6. **`outputStructure`** → render as a simple list with status badges

7. **`watchlistLoans`** (credit quality only) → render as a table below the scoring table:
   ```
   Loan ID      Borrower                    Balance    Rating Change
   CRE-10482    Harbor Office Partners      $18.6M     Pass 6 → Special Mention  ↓
   ```

8. **`escalationFlag`** (regulatory digest only) → if true, show a prominent alert box:
   ```
   ⚠ ESCALATION FLAG SET
   MRA-2024-02 is 18 days past its remediation deadline.
   Supervisor will route to HITL gate.
   ```
   Red border, coral text, light red background.

9. **`incidentDetail`** (operational risk only) → render as a detail card with all incident fields

10. **`compilationInputs`** (report compiler only) → render as a bulleted input list

11. **`scenarioComparisons`** (meta agent only) → render as a 3-row comparison table showing node count and HITL status per scenario

---

## MODE B — AI CHAT (right panel)

### Overview

Clicking "AI Chat" in the mode selector transforms the right panel into a **full-screen chat experience**. The left panel shrinks to just the mode tabs, scenario summary, and execute button. The right panel becomes a large chat window.

This replaces the current cramped chat panel which is squeezed into the left sidebar.

### Left panel content (Mode B)

Below mode tabs:
```
ADDED AGENTS (0)

[agent chip: Financial ✕]   ← only shown once agents are added
[agent chip: Regulatory ✕]

Tip: Describe your meeting and
I'll recommend agents one by one.
You confirm each before it's added.
```

Agent chips: small pill with agent color dot, label, and × to remove. Clicking × removes the agent from the custom graph being built.

### Right panel (Mode B) — Full chat window

Full height, full width. White background.

```
┌────────────────────────────────────────────────────────┐
│  Sentinel Agent                         ● Ready        │  ← header strip
│ ─────────────────────────────────────────────────────  │
│                                                        │
│  [messages area — fills all space]                     │
│                                                        │
│  When Sentinel recommends an agent, a card appears     │
│  inline in the chat:                                   │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🤖 Sentinel:                                   │   │
│  │  "Based on what you've described, I recommend   │   │
│  │   adding the Regulatory Digest agent. It will   │   │
│  │   parse your open MRAs and flag anything        │   │
│  │   overdue before the exam."                     │   │
│  │                                                 │   │
│  │  ┌──────────────────────────┐                   │   │
│  │  │  [Agent Card — compact]  │                   │   │
│  │  │  Regulatory Digest       │                   │   │
│  │  │  AI AGENT                │                   │   │
│  │  │  [description]           │                   │   │
│  │  │  [ Add ✓ ] [ Skip ✗ ]   │                   │   │
│  │  └──────────────────────────┘                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ─────────────────────────────────────────────────     │
│  [Suggested questions]                                 │
│  [Input + send button]                                 │
└────────────────────────────────────────────────────────┘
```

### Inline Agent Card (Mode B chat)

When the API response includes a `recommendedAgentId`, render a compact agent card inline in the chat message. The card is **not** the full 3D flip card from the landing page — it is a flat inline card:

```tsx
interface InlineAgentCardProps {
  agentId: string;
  onAdd: (id: string) => void;
  onSkip: (id: string) => void;
  alreadyAdded: boolean;
}
```

Flat card layout (280px wide × auto height):
```
┌────────────────────────────────────┐
│ [color dot]  [badge]  [agent name] │
│ ─────────────────────────────────  │
│ [description — 2 lines max]        │
│                                    │
│ Data sources:                      │
│ • source 1                         │
│ • source 2                         │
│                                    │
│ [ ✓ Add to graph ]  [ Skip ]       │  ← if not yet decided
│ [ ✓ Added ]                        │  ← if already added (green, disabled)
└────────────────────────────────────┘
```

When Add is clicked:
1. Button becomes green `✓ Added` (disabled)
2. Agent chip appears in the left panel "ADDED AGENTS" list
3. Send a follow-up message to the chat: `"Great. [Agent name] added. Should I include anything else?"`

When Skip is clicked:
1. Card grays out with `Skipped` label
2. Chat continues

### Suggested questions (Mode B)

Show these as clickable chips above the input bar when the conversation has fewer than 2 messages from the user:

```
"Full board meeting next quarter — open MRAs"
"Audit committee focused on BSA/AML"
"Quick risk flash — just capital and credit"
"What agents do I need for a CRE review?"
```

Clicking a chip populates the input and sends it.

### API call (Mode B)

The existing `/api/chat` route already exists. Update its system prompt to include:
- Full `NODE_REGISTRY` descriptions
- Instructions to recommend agents one at a time
- When recommending an agent, include `"recommendedAgentId": "agent_id"` in the JSON response alongside `"reply"`

Parse the API response and extract `recommendedAgentId` if present. Render the inline card when it is.

### Graph rebuild animation (Mode B → Execute)

When the user says "I'm done, configure" or clicks Execute in Mode B:
1. The right panel transitions from the chat window to the orchestration graph
2. The graph appears to build itself: nodes fade in one by one, left to right, with edges drawing between them
3. Use motion/react stagger: each node gets `transition={{ delay: index * 0.12 }}`
4. Edges draw with `stroke-dashoffset` animation after their source node appears
5. This animation lasts ~1.5s total then the Execute button becomes active

---

## MODE C — CUSTOM BUILDER (right panel)

### Overview

A blank canvas where agents can be dragged from a palette and dropped onto a workspace. Connections form automatically when two agents are dropped near each other. The result is a custom execution graph.

### Left panel content (Mode C)

Below mode tabs:

```
AGENT PALETTE

[draggable chip: Meta Agent]
[draggable chip: Financial]
[draggable chip: Capital]
[draggable chip: Credit]
[draggable chip: Trend]
[draggable chip: Regulatory]
[draggable chip: Operational]
[draggable chip: Supervisor]
[draggable chip: HITL Gate]
[draggable chip: Report Compiler]

Drag agents onto the canvas →
```

Each palette chip shows:
- 8px color dot (node type color)
- Agent label (12px)
- Dimmed and un-draggable once already on canvas

### Right panel (Mode C) — Drop canvas

Full height, full width. Background: `#011E41` with dot grid pattern (same as execute page graph canvas).

**Empty state:**

```
         ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐

              Drag agents here
              to build your graph

         └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

Dashed border box centered, fades in on first render.

**Drag and drop implementation:**

Use `@dnd-kit/core`. The palette chips in the left panel are `<Draggable>` items. The canvas area is a `<Droppable>` zone.

When an agent is dropped:
1. A node appears at the drop position on the canvas
2. The node animates in with `scale: 0.8 → 1` and `opacity: 0 → 1` (motion/react, 0.3s spring)
3. The palette chip in the left panel becomes dimmed and non-draggable

**Auto-connection logic:**

When a second node is dropped onto the canvas, automatically draw an edge connecting the most recently dropped node to the previous one. Simple rule: connect in drop order. No complex topology logic needed for custom mode — the user decides the order by the order they drop.

When 3+ nodes exist, show a "reorganize" hint: `"Drag nodes to reposition"`. Nodes on the canvas should be draggable after dropping (use `@dnd-kit/sortable` or ReactFlow's built-in draggable node support).

**Connection animation:**

When an edge is drawn between two nodes:
- If `animated-beam` installed: use it
- Fallback: SVG path with `stroke-dashoffset` animation:
  ```tsx
  // Draw path from source to target
  // Animate stroke-dashoffset from pathLength to 0 over 0.6s
  ```

**Clear canvas button:**

Top-right of the canvas: a small `Reset canvas` button that removes all dropped nodes and resets palette chips.

**Canvas node appearance:**

Same as Mode A nodes (200px × 90px, left border in type color, badge + label). Add a small drag handle icon in the top-right corner (`GripVertical` from lucide).

---

## AgentDetailDrawer Component

Create `src/components/configure/AgentDetailDrawer.tsx`.

This drawer is shared across Mode A (click on graph node) and Mode B (click "See data" on inline card).

```typescript
interface AgentDetailDrawerProps {
  agentId: string | null;        // null = closed
  onClose: () => void;
}
```

Import and use `getAgentDisplayData` from `@/data/agentDisplayData`.

Render logic:

```tsx
export function AgentDetailDrawer({ agentId, onClose }: AgentDetailDrawerProps) {
  const panel = agentId ? getAgentDisplayData(agentId) : null;
  const meta = agentId ? NODE_REGISTRY[agentId] : null;

  return (
    <AnimatePresence>
      {agentId && panel && meta && (
        <motion.div
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0,
            width: 420,
            background: '#001833',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Fixed header */}
          <DrawerHeader meta={meta} onClose={onClose} />
          
          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <AgentDataContent panel={panel} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**`AgentDataContent` component** renders the panel data using the rendering rules defined above in the Mode A section. Build it as a single component that handles all field types via conditional rendering.

---

## InlineChatAgentCard Component

Create `src/components/configure/InlineChatAgentCard.tsx`.

Compact flat card rendered inline inside chat messages when Sentinel recommends an agent.

```typescript
interface InlineChatAgentCardProps {
  agentId: string;
  onAdd: () => void;
  onSkip: () => void;
  alreadyAdded: boolean;
}
```

Background: `#002E62`. Border: `1px solid rgba(255,255,255,0.1)` with left border in node type color. Width: 280px. Border-radius: 8px.

Content:
- Top row: color dot + badge label + agent name
- Middle: description (2 lines max, truncated)
- Data sources: bullet list (max 3, from `NODE_REGISTRY[agentId]` scenarios data)
- Bottom: Add / Skip buttons (or Added state)

---

## Configure Page State

```typescript
type ConfigureMode = 'preset' | 'chat' | 'custom';

// Page-level state
const [mode, setMode] = useState<ConfigureMode>('preset');
const [selectedScenarioId, setSelectedScenarioId] = useState<string>('falcon-board');
const [openDrawerAgentId, setOpenDrawerAgentId] = useState<string | null>(null);
const [customAgents, setCustomAgents] = useState<string[]>([]);  // Mode C
const [chatAgents, setChatAgents] = useState<string[]>([]);      // Mode B
const [isBuilding, setIsBuilding] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Execute handler

```typescript
const handleExecute = async () => {
  setIsBuilding(true);
  setError(null);

  // Determine scenario ID based on mode
  let scenarioId = selectedScenarioId;

  if (mode === 'chat' && chatAgents.length > 0) {
    // Use closest matching preset or custom scenario
    scenarioId = matchClosestScenario(chatAgents);
  }

  if (mode === 'custom' && customAgents.length >= 2) {
    scenarioId = matchClosestScenario(customAgents);
  }

  try {
    resetAll();
    setScenario(scenarioId);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    startRun(data.run_id);
    setAppPhase('build');
    router.push('/build');
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Failed to start');
    setIsBuilding(false);
  }
};
```

`matchClosestScenario(agentIds: string[])` — simple function that returns:
- `'falcon-board'` if agentIds includes any of `['financial_aggregator', 'hitl_gate', 'report_compiler']`
- `'audit-committee'` if agentIds includes `'regulatory_digest'` but not `'financial_aggregator'`
- `'risk-flash'` otherwise

---

## Crowe Brand Styling Rules

**All components in this page:**

Dark surfaces (left panel, graph canvas, drawer):
- Background: `#011E41` or `#001833`
- Text: `#FFFFFF`, muted `rgba(255,255,255,0.55)`
- Borders: `rgba(255,255,255,0.08)`

Data tables inside the drawer (light):
- Table header: `background: #011E41, color: #FFFFFF`
- Even rows: `background: #F4F4F4`
- Odd rows: `background: #FFFFFF`
- Body text: `#333333`

Accent:
- CTAs, active states: `#F5A800`
- Node type colors from `NODE_REGISTRY[id].color`

Typography:
- Labels / mono / badges: `var(--font-mono)` (IBM Plex Mono)
- Body / descriptions: `var(--font-body)` (IBM Plex Sans)
- All section labels: 10px, uppercase, letterSpacing 0.1em

---

## What to Preserve From Existing Code

Keep these files exactly as they are — just import and use them:
- `ScenarioTile` component (used in Mode A left panel)
- `SentinelChat` component (extend for Mode B, don't rewrite from scratch)
- `ScenarioPreviewGraph` component (keep for now, Mode A replaces it with the new larger graph — but don't delete it yet)
- `AppHeader` and `StepNav` (import, do not modify)
- All store methods: `setScenario`, `startRun`, `resetAll`, `setAppPhase`
- All navigation patterns: `router.push('/build')` after successful `/api/analyze` call

---

## Verification Checklist

- [ ] Mode selector tabs switch right panel correctly
- [ ] Mode A: all 3 scenario tiles visible, clicking one updates graph
- [ ] Mode A: graph fills the full right panel at readable size
- [ ] Mode A: clicking a node opens the Agent Detail Drawer with slide-in animation
- [ ] Mode A: drawer shows correct data for each agent (from agentDisplayData.ts)
- [ ] Mode A: tables render with correct highlight colors (red/amber/green)
- [ ] Mode A: capital gauges show bar fills with correct percentages
- [ ] Mode A: trend sparklines show 5 data points with quarter labels
- [ ] Mode A: supervisor decision matrix shows routing decision and rationale
- [ ] Mode A: drawer close button works, exit animation plays
- [ ] Mode B: right panel is a full-size chat window
- [ ] Mode B: sending a message gets a response from /api/chat
- [ ] Mode B: when API returns recommendedAgentId, inline card appears in chat
- [ ] Mode B: Add button on inline card adds agent chip to left panel
- [ ] Mode B: Skip button grays out the card
- [ ] Mode B: suggested questions appear as clickable chips initially
- [ ] Mode C: palette chips in left panel are draggable
- [ ] Mode C: dropping an agent onto canvas creates a node with animation
- [ ] Mode C: dropping a second agent auto-connects them with an animated edge
- [ ] Mode C: canvas nodes are repositionable after dropping
- [ ] Mode C: Reset canvas button clears all nodes
- [ ] All modes: Execute button calls /api/analyze and navigates to /build
- [ ] All modes: error banner shows if /api/analyze fails
- [ ] No TypeScript errors
- [ ] No white flash or layout jump when switching modes

---

*Configure Page PRD | Crowe AI Innovation Team | March 2026*
*Companion file: src/data/agentDisplayData.ts (already written — do not regenerate)*
*Scope: src/app/configure/page.tsx + src/components/configure/ ONLY*
