# HANDOFF — Phase 2 PRD Gap Closure

## Status
DONE — All 7 PRD gaps closed. TypeScript: 0 errors. Build blocked only by TLS/font-fetch (corporate proxy).

---

## What was just done

### G1: `nodeInputSnapshots` now populated (HIGH — DATA tab was always empty)
- Added `inputSnapshot?: Record<string, unknown>` to `NodeStartedEvent` in `events.ts`
- Updated `node_started` handler in `executionStore.ts` to populate `nodeInputSnapshots`
- Added `inputSnapshot` to all 10 node emit calls with relevant state slices:
  - meta_agent: `{ scenarioId, meetingType }`
  - financialAggregator: `state.rawData.financials`
  - capitalMonitor: `state.rawData.capital`
  - creditQuality: `state.rawData.credit`
  - trendAnalyzer: `{ financialMetrics, capitalMetrics, creditMetrics }`
  - regulatoryDigest: `state.rawData.regulatory`
  - operationalRisk: `state.rawData.operational`
  - supervisor: `{ financialMetrics, regulatoryDigest, operationalRiskDigest }`
  - hitlGate: `{ supervisorDecision, supervisorRationale }`
  - reportCompiler: `{ sectionCount: 7, model }`

### G2: `nodeOutputs` now populated from `node_completed`
- Added `nodeOutputs` population in `node_completed` handler using `event.stateDelta`

### G3: AgentWindow + AgentInspector state badge + duration
- AgentWindow header now shows `IDLE` / `ACTIVE` / `COMPLETED · 234ms`
- AgentInspector subtitle shows duration after completion

### G4: AgentWindow CSS tweaks
- `borderRadius: 6` → `8`
- `minHeight: 160` → `280`

### G5: Report trace panel amber glow
- `report_compiler` entry in right trace gets amber glow (`boxShadow`, dot color) while streaming

### G6: ScenarioPreviewGraph font fixes
- Tooltip badge label: `9px` → `11px`
- "Data sources" header: `9px` → `11px`
- Node "idle" status text: `8px` → `11px`
- PreviewNode badge: `9px` → `11px`

### G7: Configure preview graph conditional edges
- supervisor→hitl_gate: dashed amber edge + "PROCEED" label
- supervisor→report_compiler: dashed amber edge + "SKIP HITL" label
- All other edges remain solid white generic fan-out/fan-in

---

## Files touched
- `src/types/events.ts` — G1
- `src/store/executionStore.ts` — G1, G2
- `src/lib/graph/nodes/index.ts` — G1
- `src/lib/graph/nodes/financialAggregator.ts` — G1
- `src/lib/graph/nodes/capitalMonitor.ts` — G1
- `src/lib/graph/nodes/creditQuality.ts` — G1
- `src/lib/graph/nodes/trendAnalyzer.ts` — G1
- `src/lib/graph/nodes/regulatoryDigest.ts` — G1
- `src/lib/graph/nodes/operationalRisk.ts` — G1
- `src/lib/graph/nodes/supervisor.ts` — G1
- `src/lib/graph/nodes/hitlGate.ts` — G1
- `src/lib/graph/nodes/reportCompiler.ts` — G1
- `src/components/execute/AgentWindow.tsx` — G3, G4
- `src/components/execute/AgentInspector.tsx` — G3
- `src/app/(demo)/report/page.tsx` — G5
- `src/components/configure/ScenarioPreviewGraph.tsx` — G6, G7

---

## Verify
```bash
npx tsc --noEmit   # 0 errors
npm run build       # passes (may fail on TLS/font-fetch if behind proxy)
npm run dev
```

**Visual checks:**
1. `/configure` → hover nodes in preview graph → tooltips have 11px font; supervisor→hitl_gate edge is dashed amber
2. `/execute` → toggle AGENTS → click any AgentWindow → DATA tab shows input snapshot JSON
3. `/execute` → AgentWindow header shows "ACTIVE" or "COMPLETED · 234ms" state badge
4. `/execute` → AgentWindow cards are 280px min-height with 8px radius
5. `/report` → while streaming, `report_compiler` entry in right trace has amber glow
6. Full e2e: configure → build → execute → review → report
