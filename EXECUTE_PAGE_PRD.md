# SENTINEL — Execute Page PRD
## File: EXECUTE_PAGE_PRD.md
**Page to rebuild:** `src/app/(demo)/execute/page.tsx`
**Components to extend:** `src/components/execute/`, `src/components/GraphCanvas/`
**Owner:** Achyuth Rachur, Crowe AI Innovation Team

---

## READ THIS ENTIRE FILE BEFORE WRITING A SINGLE LINE OF CODE

This PRD rebuilds the execute page. The goal is simple: **the graph fills the screen, clicking a node shows everything about that agent, and the audience can watch the system actually working in real time.**

The existing architecture is sound. Do NOT rewrite the store, hooks, or API routes. Do NOT change the node types or edge types. Extend what exists.

---

## WHAT ALREADY EXISTS AND WORKS — DO NOT TOUCH

- `GraphCanvas.tsx` — ReactFlow canvas with all 6 node types, AnimatedEdge, BorderBeam on active nodes, node glow animations, MetaAgentReveal overlay
- `NodeShell.tsx` — pulsing glow on active, BorderBeam, completion checkmark, all working
- `StatusLogFeed.tsx` — collapsible log footer at bottom, auto-scrolls
- `AgentWindow.tsx` — LOG / MANDATE / DATA / RULES tabs, reads from store
- `AgentInspector.tsx` — slide-in drawer from right, reads `selectedNodeId` from store
- `StatePanel/` — Live State tab with capital gauges, credit score ring, trend sparklines
- `useSSE.ts` — SSE connection, mounted in `(demo)/layout.tsx`, survives page transitions
- `executionStore.ts` — all state, all SSE handlers, navigation guards
- Node click → `setSelectedNodeId` is already wired in `GraphCanvas.tsx`

---

## WHAT IS BROKEN AND NEEDS FIXING

### Problem 1 — Graph does not fill the screen

**Current:** Fixed 3-column grid: `260px left | flex-1 center | 320px right`. The graph gets roughly 40% of the screen. The left sidebar occupies 260px of permanent space during execution showing a scenario switcher, speed buttons, and a legend — none of which need 260px of dedicated space.

**Fix:** The graph center panel must fill the full available width. The left sidebar becomes a collapsible overlay panel that starts closed. The right state panel becomes a slide-in drawer.

### Problem 2 — Animated counter and state panel look mismatched

**Current:** The `AnimatedCounter` at the top of the live state tab is a slot-machine digit ticker that doesn't fit the visual language. The state panel cards use heavy rounded corners and Tailwind utility classes that look inconsistent.

**Fix:** Replace the counter with a clean progress indicator. Align the state panel card styling with the rest of the app's inline style approach.

### Problem 3 — AgentInspector DATA and RULES tabs are empty

**Current:** `nodeInputSnapshots[nodeId]` is never populated (backend never emits `node_input_snapshot` events), so the DATA tab always shows "Waiting for execution". The RULES tab shows one sentence from `meta.formulaHint`.

**Fix:** Import and use `getAgentRawInput` from `@/data/agentRawInputData` and `getAgentDisplayData` from `@/data/agentDisplayData`. Use `RawDataTableRenderer` (built in the configure page phase) to render the raw input tables. These files have comprehensive data for all 10 agents and do not require any backend events.

### Problem 4 — Backend never emits node_progress events

**Current:** The LOG tab in `AgentWindow` reads from `nodeProgressLogs[nodeId]` which is populated by `node_progress` SSE events. The store handler is wired correctly. The backend node functions never emit these events, so the log is always empty.

**Fix:** Add `node_progress` emissions to every node function in `src/lib/graph/nodes/`. See exact event sequences per node below.

### Problem 5 — Agents view grid is generic

**Current:** The AGENTS view shows `AgentWindow` cards in a `repeat(auto-fill, minmax(280px, 1fr))` grid. The cards are functional but visually plain and the DATA/RULES tabs are empty.

**Fix:** Update AgentWindow to use the comprehensive data files. Make the card header clickable to open the full AgentInspector drawer.

---

## NEW PAGE LAYOUT

```
┌──────────────────────────────────────────────────────────────────────┐
│  AppHeader (64px)                                                    │
│  Left: Crowe logo + Sentinel | Center: step nav | Right: controls   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  GRAPH CANVAS — fills 100% of remaining width and height             │
│  Background: #011E41 with dot grid                                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Nodes visible at full size, centered, fit to view           │   │
│  │  Parallel columns clearly grouped                            │   │
│  │  Active node glowing, completed nodes checked                │   │
│  │  Animated edges traversing between nodes                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Overlay: Left panel — collapsible, see below]                      │
│  [Overlay: Right drawer — slide in on node click]                    │
│  [Overlay: Narration card — bottom right of canvas]                  │
│  [Overlay: Legend — bottom left of canvas]                           │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  STATUS LOG FOOTER — 180px, collapsible, fixed bottom                │
└──────────────────────────────────────────────────────────────────────┘
```

The graph canvas is `position: fixed; top: 64px; bottom: 180px; left: 0; right: 0;` — full bleed. No permanent sidebar columns.

---

## HEADER CONTROLS (right side of AppHeader)

Replace the current header right content with:

```
[ ⊞ Network ]  [ ⊟ Agents ]   ← view toggle (existing ViewToggle component)
[ ◫ Panels ]                   ← toggle left control panel open/close
[ ≡ Compare ]                  ← existing compare mode toggle
[ Speed: Normal ▾ ]            ← inline speed dropdown
[ ↺ Reset ]                    ← existing reset button
```

All buttons: `height: 30px`, `padding: 0 12px`, `border: 1px solid rgba(255,255,255,0.15)`, `borderRadius: 4px`, `background: transparent`, `color: rgba(255,255,255,0.6)`, `fontFamily: var(--font-mono)`, `fontSize: 11px`.

Active state (for toggle buttons): `background: rgba(255,255,255,0.08)`, `color: #FFFFFF`.

---

## LEFT CONTROL PANEL (overlay, collapsible)

An overlay panel that slides in from the left. Starts **closed**. Opens when the `◫ Panels` button is clicked in the header.

**Dimensions:** 260px wide, full height (top: 64px, bottom: 180px). Overlay — does NOT push the graph.

**Animation:**
```tsx
<motion.div
  initial={{ x: -260, opacity: 0 }}
  animate={{ x: isOpen ? 0 : -260, opacity: isOpen ? 1 : 0 }}
  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
  style={{
    position: 'absolute', top: 0, left: 0, bottom: 0, width: 260,
    background: 'rgba(0,18,48,0.92)',
    backdropFilter: 'blur(16px)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    zIndex: 40,
  }}
/>
```

**Content inside left panel:**

```
SCENARIOS
[tile: Falcon Board]
[tile: Audit Committee]
[tile: Risk Flash]

───────────────────

EXECUTION SPEED
[Slow] [Normal] [Fast]

───────────────────

NODE TYPES
● Rules engine — deterministic
● ML scoring — algorithm
● AI agent — LLM synthesis
● Hybrid — math + LLM
● Orchestrator — routing
● Human review — HITL gate
```

Use existing `ScenarioTile` pattern and speed buttons. Legend items same as current left sidebar — just moved into this overlay panel.

Close button: `✕` in top-right corner of the panel.

---

## NETWORK VIEW — Graph fills screen

The graph canvas already works. These are the changes to make it fill the space correctly:

**1. Remove the 3-column grid.** The execute page currently wraps everything in a fixed 3-column grid div. Remove that wrapper. The `GraphCanvas` component should be:

```tsx
<div style={{
  position: 'fixed',
  top: 64,
  bottom: 180,
  left: 0,
  right: 0,
}}>
  <GraphCanvas />
</div>
```

**2. The AgentInspector drawer already overlays correctly.** It is `position: fixed; right: 0; top: 64px; bottom: 200px; width: 400px`. Keep this. When it is open, it overlays the graph — it does NOT push the graph.

**3. The StatePanel moves into the AgentInspector.** The current right panel (320px wide permanent StatePanel) is removed. The live state metrics are shown inside the AgentInspector drawer as a new tab. See AgentInspector section below.

**4. NarrationOverlay** — already positioned bottom-right of canvas. Keep as-is.

**5. GraphLegend** — already positioned bottom-left of canvas inside GraphCanvas. Keep as-is.

---

## AGENTS VIEW — Grid of AgentWindow cards

When the view toggle is set to "Agents", the graph is replaced by a grid of `AgentWindow` cards filling the full space.

```tsx
<div style={{
  position: 'fixed',
  top: 64,
  bottom: 180,
  left: 0,
  right: 0,
  background: '#011E41',
  overflowY: 'auto',
  padding: '20px 24px',
}}>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 14,
  }}>
    {agentNodeIds.map((nodeId) => (
      <AgentWindow key={nodeId} nodeId={nodeId} />
    ))}
  </div>
</div>
```

Increase `minmax` from 280px to 320px to give the tabs more breathing room.

---

## AGENTINSPECTOR DRAWER — Full rebuild

The `AgentInspector` drawer (`src/components/execute/AgentInspector.tsx`) needs to be significantly upgraded. It currently shows 4 sparse tabs. Replace with a comprehensive 5-tab drawer.

**Drawer dimensions:** Width 440px. `position: fixed; right: 0; top: 64px; bottom: 180px`. Same animation as current.

### Tab structure

```
[ LOG ]  [ SOURCE DATA ]  [ RESULTS ]  [ RULES ]  [ LIVE STATE ]
```

**Tab 1 — LOG (existing, keep)**
Real-time progress events from `nodeProgressLogs[nodeId]`. Timestamp, step, detail. Auto-scrolls to bottom as events come in. Empty state: "Not yet executed" or "No events captured."

After the backend fix (see Issue 4 below), this will populate in real time.

**Tab 2 — SOURCE DATA (new)**
Import `getAgentRawInput(agentId)` from `@/data/agentRawInputData`.
Render using `RawDataTableRenderer` with `compact={true}`.

Show:
- `keyFields` strip at top: 2-column grid, muted label + white value
- Each `RawDataTable` with title, source label, as-of date header, then the table
- Footnote below each table

This is the pre-processing input — GL extracts, loan tapes, MRA registers, incident logs.

**Tab 3 — RESULTS (new)**
Import `getAgentDisplayData(agentId)` from `@/data/agentDisplayData`.
Render all present fields using dark-mode rendering rules:
- Tables: `background: rgba(255,255,255,0.04)` rows, type color for status cells
- Gauges: 8px bars, node type color fill
- Sparklines: SVG, 5 points, quarter labels
- Decision matrix: flag icons (⚠⚠ critical, ⚠ warning, ✓ ok)
- All other panel types from `agentDisplayData.ts`

This is the processed output — scores, RAG statuses, decisions.

**Tab 4 — RULES (upgraded)**
Import `getAgentDisplayData(agentId)` for `explanation` and `note`.
Import from `NODE_REGISTRY[agentId]` for `formulaHint`.

Show:
- Large explanation paragraph (from `agentDisplayData.explanation`)
- Formula hint box if present (amber background, mono font)
- Note at bottom (from `agentDisplayData.note`, 11px mono, muted)

**Tab 5 — LIVE STATE (moved from StatePanel)**
Shows the live execution state for the currently selected node.

For deterministic/algorithmic nodes that have already completed:
- Show the `nodeOutputs[nodeId]` if available
- Show the `liveState` slice relevant to this node:
  - `financial_aggregator` → `liveState.financialMetrics`
  - `capital_monitor` → `liveState.capitalMetrics`
  - `credit_quality` → `liveState.creditMetrics`
  - `trend_analyzer` → `liveState.trendAnalysis`
  - `supervisor` → routing decision from `executionLog`
  - All others → most recent log entry summary

For nodes not yet executed: "This agent hasn't run yet."

The existing `LiveStateTab` content (financial metric rows, capital gauge bars, credit score ring) lives here when the relevant node is selected. When no node is selected or the selected node has no live state yet, show the aggregate RAG summary.

### Tab styling (dark mode)

Active tab: `borderBottom: '2px solid [nodeTypeColor]'`, `color: nodeTypeColor`
Inactive: `color: rgba(255,255,255,0.35)`, `borderBottom: '2px solid transparent'`

Tab bar: `borderBottom: '1px solid rgba(255,255,255,0.06)'`

---

## AGENTWINDOW CARD — Upgrade

`src/components/execute/AgentWindow.tsx` — extend, do not rewrite.

### Changes needed:

**1. Card is clickable** — clicking the card header opens the full AgentInspector drawer:
```tsx
<div
  onClick={() => setSelectedNodeId(nodeId)}
  style={{ cursor: 'pointer' }}
>
  {/* existing header content */}
</div>
```

**2. DATA tab** — replace the JSON dump with `RawDataTableRenderer`:
```tsx
{tab === 'data' && (
  <div style={{ padding: '8px 0' }}>
    {rawInput ? (
      <>
        {/* Key fields strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
          {rawInput.keyFields?.map((f, i) => (
            <div key={i} style={{ fontSize: 10 }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                {f.label}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>
                {f.value}
              </div>
            </div>
          ))}
        </div>
        {/* First table only in compact card — "See full data" link to open inspector */}
        <RawDataTableRenderer table={rawInput.tables[0]} compact />
        {rawInput.tables.length > 1 && (
          <button onClick={() => setSelectedNodeId(nodeId)} style={seeMoreStyle}>
            + {rawInput.tables.length - 1} more tables — open inspector →
          </button>
        )}
      </>
    ) : (
      <span style={{ color: 'rgba(255,255,255,0.2)' }}>No data available.</span>
    )}
  </div>
)}
```

Where `rawInput = getAgentRawInput(nodeId)`.

**3. RULES tab** — replace the sparse formula hint with the explanation from `agentDisplayData`:
```tsx
{tab === 'rules' && (
  <div>
    <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, fontSize: 11, marginBottom: 10 }}>
      {displayData?.explanation ?? meta.description}
    </p>
    {meta.formulaHint && (
      <div style={{ background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.15)', borderRadius: 4, padding: '6px 8px', color: '#F5A800', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
        {meta.formulaHint}
      </div>
    )}
    {displayData?.note && (
      <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
        {displayData.note}
      </div>
    )}
  </div>
)}
```

---

## STATUS LOG FOOTER — Upgrade

`src/components/execute/StatusLogFeed.tsx` — the footer already exists and works. Make these changes:

**Height:** Increase from 200px to 180px expanded, 36px collapsed. Update all `bottom: 200` references in the page to `bottom: 180`.

**Add agent column filtering:** A row of agent filter chips above the log entries when expanded:

```
FILTER: [ All ] [ Financial ] [ Capital ] [ Credit ] [ Regulatory ] [ Ops ] [ Supervisor ]
```

Chips: `height: 22px`, `padding: 0 10px`, `borderRadius: 100px`, mono 10px. Active chip: node type color background at 15%, colored text. Clicking filters the log to only show entries for that agent.

**Timestamp format:** Current shows `HH:MM:SS.mmm`. Keep as-is.

**Color coding:** Current is correct. Keep the existing `entryColor` and `entryIcon` functions.

---

## BACKEND — node_progress events

**Files to edit:** `src/lib/graph/nodes/*.ts`

The store handler for `node_progress` already exists and correctly populates `nodeProgressLogs`. The backend just needs to emit these events.

First, check how the existing node functions emit events. Look at any existing `emit()` or `emitEvent()` calls in the node files. Then add `node_progress` emissions following the same pattern.

Add these **exact** progress event sequences per node. Add a `await new Promise(resolve => setTimeout(resolve, 280))` between each emit in deterministic nodes so the audience can read the log.

**financial_aggregator:**
```typescript
emit({ type: 'node_progress', nodeId: 'financial_aggregator', step: 'Loading GL extract', detail: 'Q4 2024 interest income/expense data received', timestamp: now() });
emit({ type: 'node_progress', nodeId: 'financial_aggregator', step: 'Computing net interest income', detail: `Interest income $41,224K − expense $17,800K = NIM base`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'financial_aggregator', step: 'Calculating NIM variance', detail: `NIM 3.21% vs budget 3.40% — variance −5.6% — AMBER flag`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'financial_aggregator', step: 'Evaluating efficiency ratio', detail: `61.4% vs 60.0% threshold — above limit — flag`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'financial_aggregator', step: 'RAG assigned', detail: `2 flags → AMBER`, timestamp: now() });
```

**capital_monitor:**
```typescript
emit({ type: 'node_progress', nodeId: 'capital_monitor', step: 'Loading Call Report RC-R data', detail: 'Regulatory capital schedule received', timestamp: now() });
emit({ type: 'node_progress', nodeId: 'capital_monitor', step: 'Computing CET1 ratio', detail: `$433,000K / $4,009,259K RWA = 10.8% — above 6.5% well-cap ✓`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'capital_monitor', step: 'Evaluating liquidity ratios', detail: `LCR 112% (min 100%) — NSFR 109% (min 100%) — both clear`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'capital_monitor', step: 'RAG assigned', detail: `0 flags → GREEN`, timestamp: now() });
```

**credit_quality:**
```typescript
emit({ type: 'node_progress', nodeId: 'credit_quality', step: 'Loading loan portfolio data', detail: 'LASER LMS extract received — $2,620,900K gross loans', timestamp: now() });
emit({ type: 'node_progress', nodeId: 'credit_quality', step: 'Scoring NPL ratio', detail: `1.84% vs 1.20% peer — score −2, weight 35% → contribution −0.70`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'credit_quality', step: 'Evaluating CRE concentration', detail: `336% of RWA vs 300% limit — BREACH — score −3, weight 20% → contribution −0.60`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'credit_quality', step: 'Computing total credit health score', detail: `−0.70 − 0.25 − 0.20 − 0.60 = −1.75 → RED`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'credit_quality', step: 'RAG assigned', detail: `Score −1.75 (threshold ≤ −2.0 approaching) → RED`, timestamp: now() });
```

**trend_analyzer:**
```typescript
emit({ type: 'node_progress', nodeId: 'trend_analyzer', step: 'Loading 5-quarter baseline', detail: `Population baseline Q4'23–Q4'24 loaded`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'trend_analyzer', step: 'Running OLS regression — NIM', detail: `Slope −0.093/quarter — 4.2σ from historical mean — FLAGGED`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'trend_analyzer', step: 'Running OLS regression — NPL', detail: `Slope +0.215/quarter — 6.8σ from historical mean — FLAGGED`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'trend_analyzer', step: 'Running OLS regression — Efficiency', detail: `Slope +0.80/quarter — 3.4σ — FLAGGED`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'trend_analyzer', step: 'Calling LLM for narrative', detail: `3 flagged metrics passed to gpt-4o-mini — generating trend interpretation`, timestamp: now() });
```

**regulatory_digest:**
```typescript
emit({ type: 'node_progress', nodeId: 'regulatory_digest', step: 'Loading regulatory data', detail: 'RegTrak extract received — 2 open MRAs', timestamp: now() });
emit({ type: 'node_progress', nodeId: 'regulatory_digest', step: 'Checking MRA due dates', detail: `MRA-2024-02 due Jan 5, 2025 — today Jan 8, 2025 — OVERDUE by 18 days`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'regulatory_digest', step: 'Setting escalation flag', detail: `Overdue MRA detected — escalation_required = TRUE`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'regulatory_digest', step: 'Generating digest narrative', detail: `Calling gpt-4o-mini for regulatory synthesis (temp 0.1)`, timestamp: now() });
```

**operational_risk:**
```typescript
emit({ type: 'node_progress', nodeId: 'operational_risk', step: 'Loading incident register', detail: 'OpRisk Pro extract — 4 Q4 2024 incidents', timestamp: now() });
emit({ type: 'node_progress', nodeId: 'operational_risk', step: 'Classifying board-reportability', detail: `INC-2024-112: 1,200 accounts + OCC notification → board-reportable`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'operational_risk', step: 'Generating risk narrative', detail: `Calling gpt-4o-mini for incident synthesis (temp 0.2)`, timestamp: now() });
```

**supervisor:**
```typescript
emit({ type: 'node_progress', nodeId: 'supervisor', step: 'Reading all agent outputs', detail: `Financial: AMBER | Capital: GREEN | Credit: RED | Regulatory escalation: TRUE`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'supervisor', step: 'Evaluating routing decision', detail: `Overdue MRA + Credit RED → PROCEED_TO_HITL required`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'supervisor', step: 'Routing decision made', detail: `PROCEED_TO_HITL — calling gpt-4o-mini for rationale`, timestamp: now() });
```

**hitl_gate:**
```typescript
emit({ type: 'node_progress', nodeId: 'hitl_gate', step: 'Assembling review queue', detail: `5 flagged items — 2 HIGH priority, 3 MEDIUM`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'hitl_gate', step: 'Execution paused', detail: `Awaiting CFO approval — navigating to review page`, timestamp: now() });
// After resume (called after HITL API response):
emit({ type: 'node_progress', nodeId: 'hitl_gate', step: 'CFO decision received', detail: `APPROVED — proceeding to report compilation`, timestamp: now() });
```

**report_compiler:**
```typescript
emit({ type: 'node_progress', nodeId: 'report_compiler', step: 'Assembling input bundle', detail: `17 structured fields from 6 agents compiled`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'report_compiler', step: 'Streaming Executive Summary', detail: `gpt-4o-mini streaming — ~280 words`, timestamp: now() });
emit({ type: 'node_progress', nodeId: 'report_compiler', step: 'Streaming Financial Performance', detail: `gpt-4o-mini streaming — ~420 words`, timestamp: now() });
// ... one emit per section as it starts streaming
emit({ type: 'node_progress', nodeId: 'report_compiler', step: 'Report complete', detail: `7 sections compiled — DOCX generated`, timestamp: now() });
```

**Helper function** — add to each node file or a shared util:
```typescript
const now = () => new Date().toISOString();
```

---

## REPORT COMPILER — Token streaming (backend)

**File:** `src/lib/graph/nodes/reportCompiler.ts`

Read the current file first. If it already calls OpenAI, update it to use streaming. If it batches all sections in one call, split into per-section calls.

The store already handles `report_section_started`, `report_token`, and `report_section_complete` events. The backend just needs to emit them.

**Pattern:**
```typescript
for (const section of SECTIONS) {
  // 1. Emit section started
  emit({ type: 'report_section_started', sectionId: section.id, sectionTitle: section.title, ragStatus: section.rag, timestamp: now() });

  // 2. Stream OpenAI response token by token
  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    max_tokens: 600,
    stream: true,
    messages: [
      { role: 'system', content: buildSectionSystemPrompt(section, state) },
      { role: 'user', content: `Write the ${section.title} section of the board package.` },
    ],
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content ?? '';
    if (token) {
      emit({ type: 'report_token', sectionId: section.id, token, timestamp: now() });
    }
  }

  // 3. Emit section complete
  emit({ type: 'report_section_complete', sectionId: section.id, timestamp: now() });

  // Brief pause between sections
  await new Promise(resolve => setTimeout(resolve, 300));
}
```

**Section definitions:**
```typescript
const SECTIONS = [
  { id: 'executive_summary',    title: 'Executive summary',       rag: getOverallRag(state) },
  { id: 'financial_performance',title: 'Financial performance',   rag: state.financialMetrics?.ragStatus },
  { id: 'capital_liquidity',    title: 'Capital and liquidity',   rag: state.capitalMetrics?.ragStatus },
  { id: 'credit_quality',       title: 'Credit quality',          rag: state.creditMetrics?.ragStatus },
  { id: 'regulatory_status',    title: 'Regulatory status',       rag: state.regulatoryDigest?.ragStatus ?? 'red' },
  { id: 'operational_risk',     title: 'Operational risk',        rag: state.operationalRisk?.ragStatus ?? 'amber' },
  { id: 'forward_outlook',      title: 'Forward outlook',         rag: null },
];
```

**System prompt per section** — build a `buildSectionSystemPrompt` function that injects only the relevant data for each section. Do NOT dump the entire state into every prompt. Financial section gets financial metrics. Capital section gets capital ratios. This keeps tokens low and output focused.

Check that `report_section_started`, `report_token`, `report_section_complete` are in `src/types/events.ts`. Add them if missing.

---

## PARALLEL GRAPH LAYOUT — Visual grouping

The graph already uses `computeColumnLayout` with `visualColumns` from the scenario. What is missing is the visual grouping indicator for parallel columns.

In `GraphCanvas.tsx` or a new `GraphParallelGrouping` component, add:

After nodes render, draw a subtle background rectangle behind each column that has 2+ nodes:

```tsx
// Compute bounding box for each parallel column
// Render a rect behind them:
<div style={{
  position: 'absolute',
  left: colX - 12,
  top: minY - 8,
  width: nodeW + 24,
  height: totalColHeight + 16,
  background: 'rgba(255,255,255,0.015)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: 12,
  pointerEvents: 'none',
  zIndex: 0,
}} />
```

Add a `PARALLEL` label above each such column:
```tsx
<div style={{
  position: 'absolute',
  left: colX,
  top: minY - 24,
  fontSize: 9,
  fontFamily: 'var(--font-mono)',
  color: 'rgba(255,255,255,0.2)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}}>
  ↕ parallel
</div>
```

This is a visual-only addition. Do not change node positions or edge logic.

---

## COMPLETE LAYOUT — Execute page code structure

```tsx
export default function ExecutePage() {
  const [view, setView] = useState<'network' | 'agents'>('network');
  const [panelOpen, setPanelOpen] = useState(false);

  // ... existing store selectors and effects unchanged ...

  return (
    <>
      <AppHeader
        rightContent={
          <ExecutePageControls
            view={view}
            onViewChange={setView}
            panelOpen={panelOpen}
            onPanelToggle={() => setPanelOpen(p => !p)}
            compareMode={compareMode}
            onCompareToggle={toggleCompareMode}
            speed={speed}
            onSpeedChange={setSpeed}
            onReset={() => { resetAll(); router.push('/configure'); }}
          />
        }
      />

      {/* GRAPH CANVAS — full bleed */}
      {!compareMode && view === 'network' && (
        <div style={{ position: 'fixed', top: 64, bottom: 180, left: 0, right: 0 }}>
          <GraphCanvas />
          <NarrationOverlay />
        </div>
      )}

      {/* AGENTS GRID VIEW */}
      {!compareMode && view === 'agents' && (
        <AgentsGridView agentNodeIds={agentNodeIds} />
      )}

      {/* COMPARE MODE */}
      {compareMode && (
        <div style={{ position: 'fixed', top: 64, bottom: 180, left: 0, right: 0 }}>
          <CompareView />
        </div>
      )}

      {/* LEFT CONTROL PANEL — overlay */}
      <LeftControlPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        selectedScenarioId={selectedScenarioId}
        onScenarioSwitch={switchScenario}
        speed={speed}
        onSpeedChange={setSpeed}
      />

      {/* AGENT INSPECTOR — overlay drawer */}
      <AgentInspector />

      {/* ERROR BANNER */}
      {executionError && <ExecutionErrorBanner error={executionError} onReset={...} />}

      {/* STATUS LOG FOOTER */}
      <StatusLogFeed />
    </>
  );
}
```

---

## CROWE BRAND RULES

All surfaces on the execute page are dark (data visualization standard):
- Graph canvas: `#011E41`
- Left panel overlay: `rgba(0,18,48,0.92)` with `backdropFilter: blur(16px)`
- AgentInspector drawer: `#001833`
- Status log footer: `#001833`
- Text: `#FFFFFF`, muted `rgba(255,255,255,0.55)`, captions `rgba(255,255,255,0.3)`
- Borders: `rgba(255,255,255,0.06)` to `rgba(255,255,255,0.12)`
- Amber `#F5A800` for active states, CTAs, highlighted values
- Node type colors from `NODE_REGISTRY[id].color`

---

## WHAT NOT TO BREAK

- `NodeShell.tsx` — all existing animations (BorderBeam, glow, completion flash) — do not touch
- `AnimatedEdge.tsx` — edge traversal animation — do not touch
- `MetaAgentReveal.tsx` — graph construction overlay — do not touch
- `useSSE.ts` and `(demo)/layout.tsx` — SSE connection — do not touch
- `executionStore.ts` — all store methods — do not touch
- Navigation guards (`isPaused → /review`, `isComplete → /report`) — do not touch
- `GraphDiffPanel.tsx` — do not touch

---

## DELIVERY ORDER

1. **Layout change** — remove the 3-column grid wrapper, graph fills screen. Verify graph renders correctly at full width with no layout issues.
2. **Left panel overlay** — slide-in panel with existing scenario/speed/legend content.
3. **AgentInspector tabs** — add SOURCE DATA and RESULTS tabs using `RawDataTableRenderer`. Verify Financial Aggregator shows full GL extract table.
4. **AgentWindow upgrade** — clickable header, improved DATA and RULES tabs.
5. **node_progress backend emissions** — add to all 8 node functions. Verify LOG tab populates in real time.
6. **Report compiler streaming** — split into per-section OpenAI calls with streaming. Verify sections appear one by one on the report page with blinking cursor.
7. **Status log footer** — add agent filter chips.
8. **Parallel column visual grouping** — add background rects and labels.

---

## VERIFICATION CHECKLIST

- [ ] Graph fills 100% of available width and height — no permanent sidebars
- [ ] Left control panel opens/closes smoothly with spring animation
- [ ] Left panel shows scenario tiles, speed buttons, node type legend
- [ ] Node click opens AgentInspector drawer (existing behavior — verify still works)
- [ ] AgentInspector SOURCE DATA tab shows full tables from `agentRawInputData.ts`
- [ ] AgentInspector RESULTS tab shows processed data from `agentDisplayData.ts`
- [ ] AgentInspector RULES tab shows full explanation paragraph
- [ ] AgentInspector LIVE STATE tab shows relevant metrics when node has completed
- [ ] LOG tab populates in real time during execution with step-by-step events
- [ ] AgentWindow card header is clickable → opens inspector
- [ ] AgentWindow DATA tab shows first table from `agentRawInputData.ts`
- [ ] AgentWindow RULES tab shows explanation from `agentDisplayData.ts`
- [ ] Network ↔ Agents view toggle works
- [ ] Parallel columns have subtle background grouping and PARALLEL label
- [ ] Status log footer collapses to 36px, expands to 180px
- [ ] Agent filter chips filter log correctly
- [ ] HITL pause navigates to /review automatically
- [ ] Execution complete navigates to /report automatically
- [ ] Report page sections stream in one by one (from compiler streaming fix)
- [ ] No TypeScript errors
- [ ] No layout overflow or scroll issues

---

## KICKOFF PROMPT FOR CLAUDE CODE

> Read `EXECUTE_PAGE_PRD.md` fully before writing anything.
>
> Start with Step 1: remove the 3-column grid wrapper from `src/app/(demo)/execute/page.tsx` and confirm the graph canvas fills the full screen at `top: 64px, bottom: 180px`. Do not touch any node, edge, or store file yet.
>
> After the layout is confirmed working, proceed to Step 2 (left panel overlay), then Step 3 (AgentInspector tabs). The data files `src/data/agentRawInputData.ts` and `src/data/agentDisplayData.ts` are already written. The `RawDataTableRenderer` component should already exist from the configure page phase — import it, do not rebuild it.
>
> Do the backend node_progress emissions (Step 5) only after the UI tabs are working — that way you can verify the LOG tab immediately when you add the first emission.

---

*Execute Page PRD | Crowe AI Innovation Team | March 2026*
*Data files already written: src/data/agentRawInputData.ts + src/data/agentDisplayData.ts*
*Do not regenerate data. Do not modify store or SSE infrastructure.*
