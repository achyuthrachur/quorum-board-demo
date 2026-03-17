# SENTINEL — Phase 2 PRD
## Fix, complete, and enhance the existing build
**File:** `SENTINEL_PHASE2_PRD.md`
**Owner:** Achyuth Rachur, Crowe AI Innovation Team
**Codebase:** `C:\Users\RachurA\AI Coding Projects\Crowe-Sentinel`

---

## READ THIS FIRST — What already exists

Before touching anything, understand what is already built and working:

- `/` — Landing page with animated hero graph, agent roster, how it works strip
- `/configure` — Two-panel page: left = scenario tiles + chat, right = preview graph
- `/build` — Orbiting animation page while meta-agent assembles graph
- `/execute` — Three-panel execution with network/agents toggle, AgentInspector drawer, StatusLogFeed footer
- `/review` — Full dedicated HITL CFO review page with findings timeline
- `/report` — Three-panel report with streaming sections, agent trace, download

The Zustand store (`executionStore.ts`) handles ALL state. It already handles:
- All SSE event types including `node_progress`, `report_section_started`, `report_token`, `report_section_complete`
- `nodeProgressLogs`, `nodeInputSnapshots`, `reportSections`, `selectedNodeId`
- Navigation guards (runId checks), phase management, HITL submit

**The problem is not architecture. The problem is that the backend never emits the events the frontend is already wired to receive, and several UI components are incomplete or disconnected.**

Do NOT rewrite the store. Do NOT restructure the pages. Fix what is broken and build what is missing.

---

## ISSUE 1 — Navigation is broken

### Problem
The `(demo)` route group creates URLs `/build`, `/execute`, `/review`, `/report` — but the `StepNav` component and various `router.push()` calls may be pointing to wrong paths. The landing page and configure page navigation also need to be verified.

### Fix

**1A. Read `/src/components/layout/StepNav.tsx` first.**
Check every `href` in the step nav. The correct routes are:
```
/             → Landing
/configure    → Configure
/build        → Build (inside /(demo)/ route group → URL is /build)
/execute      → Execute (inside /(demo)/ route group → URL is /execute)
/review       → Review (inside /(demo)/ route group → URL is /review)
/report       → Report (inside /(demo)/ route group → URL is /report)
```

**1B. Fix every `router.push()` and `router.replace()` across all pages:**
- `/configure/page.tsx` → after build: `router.push('/build')` ✓
- `/(demo)/execute/page.tsx` → on HITL pause: `router.push('/review')` ✓
- `/(demo)/execute/page.tsx` → on complete: `router.push('/report')` ✓
- `/(demo)/review/page.tsx` → on approve/escalate: `router.push('/report')` ✓
- Verify `/(demo)/build/page.tsx` → on auto-advance: `router.push('/execute')` ✓

**1C. Fix the `isWorkflowPage` check in `AppHeader.tsx`:**
```typescript
// Current (may be wrong):
const WORKFLOW_ROUTES = ['/configure', '/build', '/execute', '/review', '/report'];

// This is correct — verify it matches actual URL paths
```

**1D. Add a "Back to configure" link on the execute page header** that calls `resetAll()` then `router.push('/configure')`. This already exists but verify it works.

**1E. On the landing page `/`, verify the "Start a board package" and "Enter platform" buttons both navigate to `/configure` using `<Link href="/configure">`.** They are already in the code — just verify they actually work in the browser.

---

## ISSUE 2 — Graph shows series-only layout, not parallel + series flow

### Problem
The `computeLayout` function in the store uses a simple dagre-style column layout. Every node ends up in a strict left-to-right series. Achyuth's vision is that some agents run in parallel (Financial, Capital, Credit all fire simultaneously) and feed into Trend, which then feeds Supervisor — showing the real orchestration topology.

The configure page right panel (`ScenarioPreviewGraph`) shows a static layout that doesn't reflect actual parallel flow.

### Fix

**2A. Define `VISUAL_COLUMNS` in `/src/data/scenarios.ts` for each scenario:**

Each scenario should define which nodes run in parallel (same column) vs in series (different columns). Add a `visualColumns` field to the scenario type and data:

```typescript
// Falcon Board parallel topology
visualColumns: [
  ['meta_agent'],
  ['financial_aggregator', 'capital_monitor', 'credit_quality'],  // PARALLEL
  ['trend_analyzer', 'regulatory_digest', 'operational_risk'],    // PARALLEL
  ['supervisor'],
  ['hitl_gate'],
  ['report_compiler'],
]

// Audit Committee
visualColumns: [
  ['meta_agent'],
  ['regulatory_digest', 'operational_risk'],  // PARALLEL
  ['supervisor'],
  ['report_compiler'],
]

// Risk Flash
visualColumns: [
  ['meta_agent'],
  ['capital_monitor', 'credit_quality'],  // PARALLEL
  ['supervisor'],
  ['report_compiler'],
]
```

**2B. Update `computeColumnLayout` in the store to use `visualColumns`:**

The function already exists. When a `graph_constructed` SSE event arrives, instead of using the edge-derived `computeLayout`, use `computeColumnLayout` with the scenario's `visualColumns`. This gives the correct parallel-column positioning.

In `handleSSEEvent` for `graph_constructed`:
```typescript
case 'graph_constructed': {
  // Get visual columns from scenario
  const scenario = SCENARIOS.find(s => s.id === get().selectedScenarioId);
  const columns = scenario?.visualColumns ?? [event.nodes]; // fallback: all in one column
  
  const positions = computeColumnLayout(columns);
  const nodes = buildRFNodes(event.nodes, positions);
  const edges = buildRFEdges(event.edges);
  set({ nodes, edges, showReveal: true, ... });
  break;
}
```

**2C. Update `ScenarioPreviewGraph` on the configure page right panel:**

The right panel should show the selected scenario's `visualColumns` topology immediately when the user clicks a scenario tile — before any analysis is run. This is the "orchestration preview" that Achyuth described.

Read `/src/components/configure/ScenarioPreviewGraph.tsx` and update it to:
- Use the scenario's `visualColumns` to position nodes in columns
- Show parallel columns clearly — nodes in the same column should be vertically stacked with a visual grouping (subtle background rect or bracket)
- Show edges between columns
- Animate the graph gently (nodes pulse softly, not executing — just a preview)
- Add a label at the top of each column showing how many agents are in that stage
- Add column header labels: "Orchestration", "Data Collection", "Synthesis", "Review", "Compilation"

**2D. Update the execute page GraphCanvas to use the same column layout:**

When the execution graph is displayed in `/execute`, it should use the same `visualColumns` layout — not the dagre-computed layout. The parallel columns must be visible during execution so the audience can see that Financial, Capital, and Credit are all firing simultaneously.

---

## ISSUE 3 — Backend never emits node_progress events

### Problem
The store handles `node_progress` events perfectly — `nodeProgressLogs[nodeId]` is populated and the `AgentWindow` LOG tab reads from it. But the backend node functions (`/src/lib/graph/nodes/*.ts`) never call `emit(runId, { type: 'node_progress', ... })`. So the LOG tab is always empty.

### Fix

**3A. Add `node_progress` emissions to every node function in `/src/lib/graph/nodes/`.**

The `emit` function signature for this event:
```typescript
emit(runId, {
  type: 'node_progress',
  nodeId: 'financial_aggregator',
  step: 'Calculating NIM variance',
  detail: 'NIM 3.21% vs budget 3.40% — variance: -5.6%',
  timestamp: new Date().toISOString(),
});
```

**Per node, add these specific progress steps:**

`financialAggregator.ts` — emit 4 progress events:
1. `step: 'Loading financial data'`, `detail: 'Q4 2024 period data loaded'`
2. `step: 'Calculating NIM variance'`, `detail: 'NIM 3.21% vs budget 3.40% — variance: -5.6%'`
3. `step: 'Evaluating efficiency ratio'`, `detail: 'Efficiency 61.4% — above 60% threshold, flagged'`
4. `step: 'Assigning RAG status'`, `detail: 'AMBER — 2 metrics flagged'`

`capitalMonitor.ts` — emit 3 progress events:
1. `step: 'Loading capital ratios'`, `detail: 'CET1 10.8%, Tier 1 11.4%, Total 13.1%'`
2. `step: 'Comparing to regulatory thresholds'`, `detail: 'All ratios above well-capitalised minimums'`
3. `step: 'Assigning RAG status'`, `detail: 'GREEN — no threshold breaches detected'`

`creditQuality.ts` — emit 4 progress events:
1. `step: 'Loading credit portfolio data'`, `detail: 'NPL ratio 1.84% vs peer median 1.20%'`
2. `step: 'Running weighted scoring algorithm'`, `detail: 'NPL(0.35) + PCR(0.25) + NCO(0.20) + Concentration(0.20)'`
3. `step: 'Evaluating concentration limits'`, `detail: 'CRE 34% vs limit 30% — BREACH detected'`
4. `step: 'Score computed'`, `detail: 'Credit health score: -2 → RED'`

`trendAnalyzer.ts` — emit 4 progress events:
1. `step: 'Loading 5-quarter baseline'`, `detail: 'Q4 2023 → Q4 2024 population data'`
2. `step: 'Computing linear regression slopes'`, `detail: 'NIM slope: -0.093/quarter (flagged)'`
3. `step: 'Flagging trend anomalies'`, `detail: 'NIM declining 4 consecutive quarters'`
4. `step: 'Generating narrative'`, `detail: 'Calling OpenAI for trend interpretation...'`

`regulatoryDigest.ts` — emit 3 progress events:
1. `step: 'Parsing open MRA list'`, `detail: '2 MRAs found — 1 overdue, 1 in remediation'`
2. `step: 'Checking remediation deadlines'`, `detail: 'MRA-2024-02 past due by 18 days — escalation flag set'`
3. `step: 'Generating regulatory summary'`, `detail: 'Calling OpenAI for digest synthesis...'`

`operationalRisk.ts` — emit 3 progress events:
1. `step: 'Scanning incident log'`, `detail: '2 incidents found in Q4 2024'`
2. `step: 'Evaluating board-reportability'`, `detail: 'Vendor breach (Nov 2024) flagged as board-reportable'`
3. `step: 'Generating risk narrative'`, `detail: 'Calling OpenAI for operational risk synthesis...'`

`supervisor.ts` — emit 3 progress events:
1. `step: 'Reading assembled agent outputs'`, `detail: 'Financial: AMBER, Capital: GREEN, Credit: RED'`
2. `step: 'Evaluating escalation triggers'`, `detail: 'Overdue MRA + CRE breach → HITL required'`
3. `step: 'Routing decision'`, `detail: 'PROCEED_TO_HITL — package ready for CFO review'`

`hitlGate.ts` — emit 2 progress events:
1. `step: 'Pausing execution'`, `detail: 'Awaiting CFO review and approval'`
2. After resume: `step: 'CFO decision received'`, `detail: decision === 'approved' ? 'Approved — proceeding to report compilation' : 'Escalated — flagged for board review'`

`reportCompiler.ts` — emit progress events per section as they stream (see Issue 4).

**3B. Add a 200–500ms artificial delay between progress events** in deterministic nodes so the audience can read the log as it populates. LLM nodes have natural latency. For deterministic nodes, add:
```typescript
await new Promise(resolve => setTimeout(resolve, 300));
```
between each `emit(runId, { type: 'node_progress', ... })` call.

---

## ISSUE 4 — Report sections are dumped all at once, not streamed

### Problem
The `reportCompiler.ts` node calls OpenAI once and dumps the full report. The store handles streaming events (`report_section_started`, `report_token`, `report_section_complete`) and the `StreamingSection` component has a blinking cursor — but it never actually streams because the backend never emits those events.

### Fix

**4A. Refactor `reportCompiler.ts` to stream section by section.**

Instead of one OpenAI call for the full report, make separate OpenAI calls per section, streaming each one:

```typescript
const SECTIONS = [
  { id: 'executive_summary',    title: 'Executive summary',       rag: summarizeRag(state) },
  { id: 'financial_performance',title: 'Financial performance',   rag: state.financialMetrics?.ragStatus },
  { id: 'capital_liquidity',    title: 'Capital and liquidity',   rag: state.capitalMetrics?.ragStatus },
  { id: 'credit_quality',       title: 'Credit quality',          rag: state.creditMetrics?.ragStatus },
  { id: 'regulatory_status',    title: 'Regulatory status',       rag: regulatoryRag(state) },
  { id: 'operational_risk',     title: 'Operational risk',        rag: operationalRag(state) },
  { id: 'forward_outlook',      title: 'Forward outlook',         rag: null },
];

for (const section of SECTIONS) {
  // Emit section started
  emit(runId, {
    type: 'report_section_started',
    sectionId: section.id,
    sectionTitle: section.title,
    ragStatus: section.rag,
    timestamp: new Date().toISOString(),
  });

  // Stream the OpenAI response token by token
  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    stream: true,
    messages: [{ role: 'user', content: buildSectionPrompt(section, state) }],
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content ?? '';
    if (token) {
      emit(runId, {
        type: 'report_token',
        sectionId: section.id,
        token,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Emit section complete
  emit(runId, {
    type: 'report_section_complete',
    sectionId: section.id,
    timestamp: new Date().toISOString(),
  });

  // Small pause between sections so the UI can breathe
  await new Promise(resolve => setTimeout(resolve, 400));
}
```

**4B. Add the streaming event types to `/src/types/events.ts` if not already there:**
```typescript
{ type: 'report_section_started'; sectionId: string; sectionTitle: string; ragStatus?: string; timestamp: string }
{ type: 'report_token'; sectionId: string; token: string; timestamp: string }
{ type: 'report_section_complete'; sectionId: string; timestamp: string }
```

These should already exist — verify and add if missing.

**4C. The `StreamingSection` component already has the blinking cursor. Verify it is receiving tokens** by checking that `section.isStreaming === true` and `section.content` grows as tokens arrive. The component is correct — the fix is purely in the backend.

---

## ISSUE 5 — AgentWindow DATA tab shows nothing

### Problem
`nodeInputSnapshots[nodeId]` is never populated. The DATA tab always shows "No snapshot captured." The AgentWindow and AgentInspector are wired to read from this — they just need the data to be there.

### Fix

**5A. Populate `nodeInputSnapshots` when each node starts executing.**

In each node function, before the node does any processing, emit a `node_input_snapshot` event OR directly add to state via the store. The cleanest approach is a new SSE event type:

Add to `/src/types/events.ts`:
```typescript
{ type: 'node_input_snapshot'; nodeId: string; snapshot: unknown; timestamp: string }
```

Add to the store's `handleSSEEvent`:
```typescript
case 'node_input_snapshot': {
  set((prev) => ({
    nodeInputSnapshots: {
      ...prev.nodeInputSnapshots,
      [event.nodeId]: event.snapshot,
    },
  }));
  break;
}
```

**5B. In each node function, emit the snapshot at the start:**

```typescript
// financialAggregator.ts — emit the financial input data
emit(runId, {
  type: 'node_input_snapshot',
  nodeId: 'financial_aggregator',
  snapshot: {
    period: state.rawData.financialData?.period,
    nim:    state.rawData.financialData?.nim,
    roa:    state.rawData.financialData?.roa,
    roe:    state.rawData.financialData?.roe,
    efficiencyRatio: state.rawData.financialData?.efficiencyRatio,
  },
  timestamp: new Date().toISOString(),
});
```

Each node should emit a snapshot of the specific data slice it is working on — not the entire state. Keep it focused:
- `financial_aggregator` → `financialData`
- `capital_monitor` → `capitalData`
- `credit_quality` → `creditData`
- `trend_analyzer` → `populationBaseline` + key metrics
- `regulatory_digest` → `regulatoryData`
- `operational_risk` → `operationalRiskData`
- `supervisor` → all RAG statuses + supervisor decision inputs
- `report_compiler` → section titles + rag statuses (not full content)

---

## ISSUE 6 — AgentWindow RULES tab is sparse

### Problem
The RULES tab shows just `meta.formulaHint` and the node type label. Achyuth wants to see the actual rules, weights, and logic for deterministic/algorithmic nodes — and the actual system prompt for LLM nodes.

### Fix

**6A. Expand the `NodeMeta` type in `/src/data/nodeRegistry.ts` to include `rulesDetail`:**

```typescript
export interface NodeMeta {
  id: string;
  type: NodeType;
  label: string;
  badgeLabel: string;
  color: string;
  description: string;
  formulaHint?: string;
  rulesDetail?: RulesDetail;  // ADD THIS
}

export interface RulesDetail {
  methodology: string;           // One paragraph explanation
  inputs: string[];              // List of input fields this node uses
  outputs: string[];             // List of output fields this node produces
  thresholds?: Record<string, string>;  // For deterministic nodes: threshold rules
  weights?: Record<string, number>;     // For algorithmic nodes: scoring weights
  model?: string;                // For LLM nodes: model + temperature
  promptSummary?: string;        // For LLM nodes: 2-sentence summary of the system prompt
}
```

**6B. Populate `rulesDetail` for every node in `nodeRegistry.ts`:**

```typescript
financial_aggregator: {
  ...existing fields...
  rulesDetail: {
    methodology: 'Pure arithmetic rules engine. No LLM involved. Calculates variance between actual and budget for each metric, then applies threshold rules to assign a RAG status.',
    inputs: ['nim.value', 'nim.budget', 'roa.value', 'roa.budget', 'roe.value', 'efficiencyRatio.value'],
    outputs: ['financialMetrics.ragStatus', 'financialMetrics.flags', 'financialMetrics.variance'],
    thresholds: {
      'NIM variance < -5%': 'Flag as compression risk',
      'Efficiency ratio > 60%': 'Flag as elevated',
      '0 flags': 'GREEN',
      '1 flag': 'AMBER',
      '2+ flags': 'RED',
    },
  },
},

credit_quality: {
  ...
  rulesDetail: {
    methodology: 'Weighted scoring algorithm. No LLM. Each credit dimension receives a score between -3 and +2, multiplied by its weight. Total score maps to RAG.',
    inputs: ['nplRatio', 'provisionCoverageRatio', 'ncoRatio', 'concentrations'],
    outputs: ['creditMetrics.score', 'creditMetrics.ragStatus', 'creditMetrics.flags'],
    weights: {
      'NPL ratio vs peer': 0.35,
      'Provision coverage ratio': 0.25,
      'NCO trend (QoQ)': 0.20,
      'Concentration breach': 0.20,
    },
    thresholds: {
      'Score ≤ -2': 'RED',
      'Score -1 to 0': 'AMBER',
      'Score ≥ 1': 'GREEN',
    },
  },
},

regulatory_digest: {
  ...
  rulesDetail: {
    methodology: 'LLM synthesis agent. Reads the regulatory data object and generates a structured digest identifying escalation triggers and board-reportable items.',
    inputs: ['regulatoryData.openMRAs', 'regulatoryData.upcomingExams', 'regulatoryData.internalAuditCoverage'],
    outputs: ['regulatoryDigest.summary', 'regulatoryDigest.escalationRequired', 'regulatoryDigest.overdueItems'],
    model: 'gpt-4o-mini · temperature 0.1 · JSON mode',
    promptSummary: 'You are a regulatory compliance officer. Given a list of open MRAs, exam schedules, and audit coverage data, produce a structured digest. Escalation is required if any MRA is past its remediation due date.',
  },
},
```

Add equivalent `rulesDetail` for all 10 nodes.

**6C. Update the `AgentWindow` and `AgentInspector` RULES tab** to render `rulesDetail` properly:

```tsx
{tab === 'rules' && meta.rulesDetail && (
  <div>
    <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, fontSize: 11, marginBottom: 12 }}>
      {meta.rulesDetail.methodology}
    </p>

    {meta.rulesDetail.weights && (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 6, textTransform: 'uppercase' }}>
          Scoring weights
        </div>
        {Object.entries(meta.rulesDetail.weights).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{k}</span>
            <span style={{ color: color, fontSize: 10, fontWeight: 700 }}>{(v * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    )}

    {meta.rulesDetail.thresholds && (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 6, textTransform: 'uppercase' }}>
          Threshold rules
        </div>
        {Object.entries(meta.rulesDetail.thresholds).map(([condition, result]) => (
          <div key={condition} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
            <span style={{ color: color, fontSize: 10, flexShrink: 0 }}>IF</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, flex: 1 }}>{condition}</span>
            <span style={{ color: '#05AB8C', fontSize: 10 }}>→ {result}</span>
          </div>
        ))}
      </div>
    )}

    {meta.rulesDetail.promptSummary && (
      <div style={{ background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.15)', borderRadius: 4, padding: '8px 10px', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#F5A800', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>System prompt</div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, lineHeight: 1.6, margin: 0 }}>
          {meta.rulesDetail.promptSummary}
        </p>
      </div>
    )}

    {meta.rulesDetail.model && (
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
        {meta.rulesDetail.model}
      </div>
    )}
  </div>
)}
```

---

## ISSUE 7 — AgentWindow MANDATE tab needs more detail

### Problem
The MANDATE tab just shows `meta.description` — one sentence. Achyuth wants to see what the agent's mandate is, what metrics it is looking at, what it is instructed to produce.

### Fix

**7A. Add `mandate` field to `NodeMeta` in `nodeRegistry.ts`:**

```typescript
mandate?: {
  role: string;          // "You are a..." — the agent's persona
  objective: string;     // What it is trying to produce
  metrics: string[];     // Specific metrics/fields it evaluates
  outputFormat: string;  // What it produces
}
```

**7B. Populate for every node. Example:**

```typescript
financial_aggregator: {
  mandate: {
    role: 'Financial rules engine',
    objective: 'Calculate period-over-period and budget variances for core profitability metrics and assign a RAG status for the board package financial section.',
    metrics: ['Net interest margin (NIM)', 'Return on assets (ROA)', 'Return on equity (ROE)', 'Non-interest income', 'Efficiency ratio'],
    outputFormat: 'FinancialMetrics object with values, variances, flags, and RAG status',
  },
}

regulatory_digest: {
  mandate: {
    role: 'Regulatory compliance officer',
    objective: 'Synthesize open examination findings, remediation timelines, and audit coverage data into a board-level regulatory status summary with escalation flags.',
    metrics: ['Open MRAs by agency', 'Days remaining / overdue per MRA', 'Upcoming examination schedule', 'Internal audit coverage by risk rating'],
    outputFormat: 'RegulatoryDigest with summary narrative, escalation flag, overdue items list',
  },
}
```

**7C. Update the MANDATE tab UI in `AgentWindow` and `AgentInspector`:**

```tsx
{tab === 'mandate' && (
  <div>
    {meta.mandate ? (
      <>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Role</div>
          <p style={{ color: color, fontSize: 11, fontWeight: 700, margin: 0 }}>{meta.mandate.role}</p>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Objective</div>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 1.6, margin: 0 }}>{meta.mandate.objective}</p>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Metrics evaluated</div>
          {meta.mandate.metrics.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
              <span style={{ color: color, fontSize: 9 }}>◆</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{m}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Output</div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'var(--font-mono)', margin: 0 }}>{meta.mandate.outputFormat}</p>
        </div>
      </>
    ) : (
      <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
        {meta.description}
      </p>
    )}
  </div>
)}
```

---

## ISSUE 8 — Clicking a node in the graph canvas doesn't open AgentInspector

### Problem
The `AgentInspector` component reads from `selectedNodeId` in the store. When `selectedNodeId` is set, the inspector drawer slides in. But clicking a node in the `GraphCanvas` may not be calling `setSelectedNodeId`.

### Fix

**8A. Read `/src/components/GraphCanvas/nodes/NodeShell.tsx`.**

Find the `onClick` handler on the node. It should call `setSelectedNodeId(id)`. If it is not there, add:

```typescript
const setSelectedNodeId = useExecutionStore((s) => s.setSelectedNodeId);

// In the node's container div:
onClick={() => setSelectedNodeId(nodeId)}
```

**8B. Verify that clicking a node in the AGENTS view grid also opens the inspector.**

In the `AgentWindow` component, clicking the card header should also set `selectedNodeId`. Add an `onClick` to the header div:

```tsx
<div
  onClick={() => setSelectedNodeId(nodeId)}
  style={{ cursor: 'pointer', ...existingStyles }}
>
```

**8C. Verify the inspector positioning.**

The `AgentInspector` is `position: fixed; right: 0; top: 64px; bottom: 200px; width: 400px`. When it is open, the execute page layout should compress the center and right panels to make room. The execute page already handles this:

```typescript
right: selectedNodeId ? 400 : 0,
```

Verify this is wired correctly. The inspector should slide in when a node is clicked and slide out when the X button is clicked.

---

## ISSUE 9 — Configure right panel needs "orchestration" framing

### Problem
The right panel on `/configure` shows a preview graph but it is labeled generically. Achyuth's vision is that selecting a preset immediately shows the orchestration graph — which agents fire, in what order, which are parallel, which gates exist.

### Fix

**9A. Update the right panel header in `ScenarioPreviewGraph`** to show:
- "Agent orchestration — [Scenario Name]"
- Column headers: Stage 01, Stage 02, etc.
- For each parallel column: show how many agents fire simultaneously with a bracket or grouping indicator
- For HITL gate: show a clear "Human approval required here" label on that node
- Speed: add a note "Parallel agents fire simultaneously" under any multi-agent column

**9B. Add a legend to the bottom of the preview graph:**
- `●` RULES ENGINE — no LLM, deterministic
- `●` ML SCORING — weighted algorithm
- `●` AI AGENT — LLM synthesis
- `●` HUMAN REVIEW — requires approval

This legend already exists in the execute page left sidebar — reuse it here.

---

## ISSUE 10 — SentinelChat (the chatbot) needs to answer agent questions

### Problem
Achyuth wants the chat to answer questions like:
- "What is the financial aggregator doing?"
- "Where does the credit quality agent get its data?"
- "What rules does the capital monitor use?"
- "Which agents are running in parallel?"

The chat UI exists but the `/api/chat` route may not be providing this context.

### Fix

**10A. Read `/src/app/api/chat/route.ts`.** Verify the system prompt includes:
- The full node registry (all agents, their types, descriptions, inputs, outputs)
- The selected scenario's `visualColumns` topology
- The fact that some agents are deterministic (no LLM) and some are LLM-based

If the system prompt is missing this context, update it:

```typescript
const systemPrompt = `You are Sentinel, an AI orchestration system for financial institution board reporting.

You help users understand the multi-agent system that assembles board packages.

Available agents:
${Object.values(NODE_REGISTRY).map(n => 
  `- ${n.label} (${n.badgeLabel}): ${n.description}`
).join('\n')}

Current scenario: ${scenarioId}
Agent topology (which agents run in parallel vs series):
${JSON.stringify(scenario.visualColumns)}

When asked about agents, explain:
1. What the agent does and why
2. Whether it uses an LLM or is deterministic/algorithmic
3. What data it reads from
4. What it produces
5. Where it sits in the execution flow

Be concise and specific. Use financial services terminology appropriate for a CFO or CRO audience.`;
```

**10B. Add suggested questions below the chat input** on the configure page:

```tsx
const SUGGESTED_QUESTIONS = [
  "What does the credit quality agent do?",
  "Which agents run in parallel?",
  "Where does the regulatory digest get its data?",
  "What is the HITL gate and when does it fire?",
  "How does the supervisor decide what to do next?",
];
```

Show these as clickable chips below the chat input that auto-populate the input field when clicked.

---

## ISSUE 11 — Graph layout for parallel nodes needs edge rendering

### Problem
When parallel columns are shown, the edges from the previous column need to fan out to all parallel nodes, and the edges from parallel nodes need to converge back into the next single node. The current edge rendering may not handle this correctly.

### Fix

**11A. Update the edge definitions for each scenario** in `scenarios.ts` to explicitly define all edges including fan-out and fan-in:

For Falcon Board:
```typescript
edges: [
  // Fan out from meta_agent to all parallel nodes
  { id: 'meta-fin', source: 'meta_agent', target: 'financial_aggregator', type: 'default' },
  { id: 'meta-cap', source: 'meta_agent', target: 'capital_monitor', type: 'default' },
  { id: 'meta-crd', source: 'meta_agent', target: 'credit_quality', type: 'default' },
  // Fan out to synthesis layer
  { id: 'fin-trend', source: 'financial_aggregator', target: 'trend_analyzer', type: 'default' },
  { id: 'cap-trend', source: 'capital_monitor', target: 'trend_analyzer', type: 'default' },
  { id: 'crd-trend', source: 'credit_quality', target: 'trend_analyzer', type: 'default' },
  // Additional parallel paths
  { id: 'meta-reg', source: 'meta_agent', target: 'regulatory_digest', type: 'default' },
  { id: 'meta-ops', source: 'meta_agent', target: 'operational_risk', type: 'default' },
  // Converge to supervisor
  { id: 'trend-sup', source: 'trend_analyzer', target: 'supervisor', type: 'default' },
  { id: 'reg-sup', source: 'regulatory_digest', target: 'supervisor', type: 'default' },
  { id: 'ops-sup', source: 'operational_risk', target: 'supervisor', type: 'default' },
  // Series: supervisor → hitl → compiler
  { id: 'sup-hitl', source: 'supervisor', target: 'hitl_gate', type: 'conditional' },
  { id: 'hitl-rpt', source: 'hitl_gate', target: 'report_compiler', type: 'default' },
]
```

Add the `edges` field to the scenario type and data if not already there.

---

## DELIVERY ORDER

Execute these fixes in this exact order. Do not move to the next until the current one is verified working.

**Step 1 — Navigation (Issue 1)**
Fix all routes and navigation links. Verify every page can be reached and back-navigation works.
Test: click through the entire flow from landing → configure → build → execute → review → report and back.

**Step 2 — node_progress events (Issue 3)**
Add all progress event emissions to every node function. This is the highest-priority visual fix.
Test: run a scenario and verify the LOG tab in AgentWindow populates with events in real time.

**Step 3 — nodeInputSnapshots (Issue 5)**
Add `node_input_snapshot` event type and emissions. Verify DATA tab shows scenario-specific data.
Test: click into financial_aggregator AgentWindow → DATA tab shows NIM, ROA, ROE values.

**Step 4 — RULES and MANDATE tab content (Issues 6, 7)**
Add `rulesDetail` and `mandate` fields to nodeRegistry, update both tab UI components.
Test: click into credit_quality AgentInspector → RULES tab shows weights and thresholds correctly.

**Step 5 — Node click → Inspector (Issue 8)**
Wire node clicks in GraphCanvas and AgentWindow grid to `setSelectedNodeId`.
Test: click a node in network view → inspector drawer opens. Click X → closes.

**Step 6 — Parallel graph topology (Issue 2)**
Add `visualColumns` and `edges` to scenarios, update layout to use them.
Test: open configure page → right panel shows Falcon Board with Financial/Capital/Credit in same column.

**Step 7 — Report streaming (Issue 4)**
Refactor reportCompiler to stream section by section using OpenAI streaming API.
Test: run Falcon Board through to report → watch sections appear one by one with blinking cursor.

**Step 8 — Configure panel orchestration framing (Issue 9)**
Update ScenarioPreviewGraph with column headers, parallel groupings, HITL label, legend.
Test: select each of the 3 scenarios → right panel shows correct topology with visual hierarchy.

**Step 9 — Chat agent context (Issue 10)**
Update `/api/chat` system prompt with full node registry and topology context. Add suggested questions.
Test: ask "What does the regulatory digest agent do?" → get specific answer mentioning MRAs, OCC, escalation triggers.

**Step 10 — Final verification**
Run all 3 scenarios end to end. Verify:
- [ ] Landing page loads, "Start a board package" navigates to /configure
- [ ] All 3 scenario preset tiles work, right panel shows correct parallel topology
- [ ] Chat answers agent questions correctly
- [ ] Build page shows orbiting animation, auto-advances to execute
- [ ] Execute page: nodes fire with LOG tab showing real-time progress events
- [ ] Execute page: clicking a node opens the inspector with all 4 tabs populated
- [ ] Network ↔ Agents view toggle works
- [ ] HITL pause navigates to /review automatically
- [ ] Review page shows findings and both buttons work
- [ ] Report page: sections stream in one by one with blinking cursor
- [ ] DOCX download works
- [ ] Agent trace timeline on report page shows all agents
- [ ] "New package" returns to /configure cleanly

---

## FILE REFERENCE — What to read before touching each issue

| Issue | Files to read first |
|-------|---------------------|
| 1 Navigation | `src/components/layout/StepNav.tsx`, all page.tsx files |
| 2 Parallel layout | `src/data/scenarios.ts`, `src/store/executionStore.ts` (computeColumnLayout), `src/components/configure/ScenarioPreviewGraph.tsx` |
| 3 node_progress | `src/lib/graph/nodes/*.ts`, `src/lib/eventEmitter.ts`, `src/types/events.ts` |
| 4 Report streaming | `src/lib/graph/nodes/reportCompiler.ts`, `src/types/events.ts` |
| 5 Snapshots | `src/lib/graph/nodes/*.ts`, `src/types/events.ts`, `src/store/executionStore.ts` |
| 6 Rules tab | `src/data/nodeRegistry.ts`, `src/components/execute/AgentWindow.tsx`, `src/components/execute/AgentInspector.tsx` |
| 7 Mandate tab | Same as Issue 6 |
| 8 Node click | `src/components/GraphCanvas/nodes/NodeShell.tsx`, `src/components/execute/AgentWindow.tsx` |
| 9 Configure panel | `src/components/configure/ScenarioPreviewGraph.tsx` |
| 10 Chat | `src/app/api/chat/route.ts`, `src/components/configure/SentinelChat.tsx` |

---

*SENTINEL Phase 2 PRD | Crowe AI Innovation Team | March 2026*
*This document fixes and completes an existing build — do NOT rewrite or restructure.*
