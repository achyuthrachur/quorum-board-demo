# Sentinel — Production Readiness Fix Plan
> Audited: March 16, 2026 | Status: Ready to implement

---

## Executive Summary

Seven distinct problem areas identified across the codebase. The agent builder is completely broken due to an invalid OpenAI model name in `.env.local`. The execute page's right panel is visually unreadable because a dark-themed component is mounted inside a white container. Layout cramping, encoding bugs, and missing error states round out the list. Fixes are ordered by impact.

---

## Problem 1 — Agent Builder Completely Broken (Root Cause)

### What's broken
`.env.local` has `OPENAI_MODEL=gpt-5` — this is not a valid OpenAI model name. Every API call that uses this env var fails with a `404 model not found` from OpenAI.

**Impact by route:**
- `/api/chat` — returns HTTP 500 on every message. The Sentinel chat on the configure page shows "Error: AI request failed: ..." on every send. No fallback.
- `/api/analyze` → `metaAgent.ts` — has a silent fallback, so the topology is derived deterministically from `scenario.expectedNodes`. The build page still advances. Users never see this error.
- `/api/analyze` → LLM node executors (`financialAggregator`, `regulatoryDigest`, `reportCompiler`, `trendAnalyzer`, `operationalRisk`, `supervisor`) — each uses `OPENAI_MODEL` directly. Every LLM node call fails. The SSE stream receives `error` events. The graph freezes with most nodes stuck in `idle` or `active` state, never completing.
- The execute page has **no error state UI** — so the graph just freezes indefinitely with no user feedback and no recovery path.

### Fix
**File: `.env.local`**
```
OPENAI_MODEL=gpt-4o
```
Change `gpt-5` → `gpt-4o` (or `gpt-4o-mini` for lower cost).

**Also add defensive fallback in each LLM node executor:**
- If `OPENAI_API_KEY` is missing or the model call throws, return static/mock output rather than letting the node crash and kill the SSE stream.

### Files to change
- `.env.local` (1-line fix)
- `src/lib/graph/nodes/financialAggregator.ts`
- `src/lib/graph/nodes/regulatoryDigest.ts`
- `src/lib/graph/nodes/reportCompiler.ts`
- `src/lib/graph/nodes/trendAnalyzer.ts`
- `src/lib/graph/nodes/operationalRisk.ts`
- `src/lib/graph/nodes/supervisor.ts`
- `src/lib/graph/nodes/creditQuality.ts`
- `src/lib/graph/nodes/capitalMonitor.ts`

---

## Problem 2 — StatePanel Visually Unreadable (Dark Component, White Container)

### What's broken
`execute/page.tsx` mounts the right panel as:
```jsx
<div style={{ background: '#FFFFFF', borderLeft: '1px solid #BDBDBD', ... }}>
  <StatePanel />
</div>
```

`LiveStateTab` (inside `StatePanel`) is built entirely in the dark Sentinel theme:
- Text: `text-white`, `text-[#8FE1FF]`
- Backgrounds: `bg-black/10`, `bg-white/[0.03]`
- Borders: `border-white/6`, `border-white/8`

White text on a white `#FFFFFF` container background = completely invisible. This is the single most visible "looks broken" issue in the app.

### Fix
**File: `src/app/(demo)/execute/page.tsx`**

Change the right panel container:
```jsx
// BEFORE
<div style={{ background: '#FFFFFF', borderLeft: '1px solid #BDBDBD', ... }}>

// AFTER
<div style={{ background: '#011E41', borderLeft: '1px solid rgba(255,255,255,0.08)', ... }}>
```

### Files to change
- `src/app/(demo)/execute/page.tsx` (1-line change)

---

## Problem 3 — Build Page Encoding Corruption

### What's broken
`build/page.tsx` has corrupted unicode characters throughout the file. They render as gibberish in the browser.

| Corrupted | Should be |
|---|---|
| `?+"` | `—` (em dash) |
| `A·` | `·` (middle dot / interpunct) |
| `?+'` | `→` (right arrow) |
| `A?` | `→` (right arrow) |

Example of rendered output currently:
- *"Graph ready ?+" {nodeCount} nodes"*
- *"Falcon Board A· {n} agents A· ready to execute"*
- *"Skip ?+' go to execute"*
- *"Begin analysis →"* button label shows as *"Begin analysis A?"*

### Fix
**File: `src/app/(demo)/build/page.tsx`**

Re-save the file with correct UTF-8 encoding and replace all corrupted character sequences with their proper unicode equivalents. Additionally:
- Extend the auto-advance countdown from 3s → 5s (too fast for users to read what assembled)
- Make the node count callout more visually prominent in the "ready" state

### Files to change
- `src/app/(demo)/build/page.tsx` (encoding fix + countdown timing)

---

## Problem 4 — Execute Page Layout: Cramped, Wrong Proportions

### What's broken

**Column widths are too rigid:**
```js
gridTemplateColumns: '300px 1fr 380px'
```
On a 1366px laptop: left=300px + right=380px = 680px consumed, leaving only ~686px for the graph canvas. On a 1920px monitor it's fine, but this is not a production-ready layout.

**Footer log bar is too small:**
```js
height: 120  // fixed pixels
```
120px shows approximately 2 log rows. The interactive logs table cannot meaningfully display execution progress at this height.

**Font sizes below readable threshold:**
- Left sidebar section labels: `fontSize: 10`
- Speed control buttons: `fontSize: 10`
- Node legend sub-labels: `fontSize: 10`
- "Agent log" footer vertical label: `fontSize: 9` — effectively invisible
- Scenario labels in sidebar: `fontSize: 10` for meeting type

**Left sidebar scenario cards are cramped:**
- Padding `8px 10px` with small fonts creates very dense, hard-to-read cards

### Fix
**File: `src/app/(demo)/execute/page.tsx`**

1. Change columns to more flexible widths:
   ```js
   gridTemplateColumns: '260px 1fr 320px'
   ```

2. Increase footer log bar height:
   ```js
   height: 200  // was 120
   ```
   Update the main panel bottom offset to match: `bottom: 200` (was `bottom: 120`)

3. Set a global font-size floor on this page — no label below `11px`

4. Give left sidebar cards more breathing room:
   - Card padding: `10px 12px` (was `8px 10px`)
   - Meeting type label: `fontSize: 11` (was `10`)
   - Scenario label: `fontSize: 13` (unchanged — already good)

5. "Agent log" footer label:
   - `fontSize: 10` (was `9`)
   - Add a subtle border-right to separate it visually from the log table

6. Speed buttons: `fontSize: 11` (was `10`)
7. Node legend section: `fontSize: 11` for sub-labels (was `10`)

### Files to change
- `src/app/(demo)/execute/page.tsx`

---

## Problem 5 — Execute Page: No Error State When Execution Fails

### What's broken
When SSE emits an `error` event (e.g. an LLM node throws), `handleSSEEvent` sets `isRunning: false` and adds a log entry — but the execute page has no visual error state. The graph just freezes. The only indication is a log entry in the 120px footer that the user likely can't see. No recovery path is visible.

The reset button exists in the header but it's small, low-contrast (`rgba(229,55,107,0.7)` text), and not obviously a recovery action.

### Fix
**File: `src/app/(demo)/execute/page.tsx`**

Add an error detection + error banner:
1. Read `executionLog` from store and check for entries with `nodeId === 'system'` or `label === 'Error'`
2. When an error entry exists AND `!isRunning`, show a full-width error banner above the log footer:
   - Background: `rgba(229,55,107,0.1)`, border: `1px solid rgba(229,55,107,0.3)`
   - Message: the error summary from the log entry
   - Prominent "Reset and reconfigure" button that calls `resetAll()` + `router.push('/configure')`
3. Style the reset button in the header to be more visible when an error has occurred

**File: `src/store/executionStore.ts`**

Add an `hasError` derived flag or a separate `executionError: string | null` field that gets set when an `error` SSE event is received. This makes it easier to subscribe to from the execute page without scanning the full log array.

### Files to change
- `src/app/(demo)/execute/page.tsx`
- `src/store/executionStore.ts`

---

## Problem 6 — Configure Page: Visual Incoherence + Tiny Type

### What's broken

**Theme mismatch:**
The configure page hardcodes white backgrounds on both panels:
- Left panel: `background: '#FFFFFF'`
- Right chat panel: `background: '#F4F4F4'`
- Chat header: `background: '#FFFFFF'`

Against the dark indigo header (`#011E41`), this creates a jarring two-tone experience that looks like a web form bolted onto the top of an AI tool.

**NodePill font size:**
```jsx
fontSize: 9  // unreadable at any normal DPI
```
These are the colored agent type tags (FIN, CAP, CRD, etc.). At 9px they appear as colored smears, not legible labels.

**Section labels throughout:**
- "Step 1 — Meeting type": `fontSize: 11` — acceptable
- Meeting type per card: `fontSize: 10` — too small
- Node pills: `fontSize: 9` — too small
- Chat role labels ("You", "Sentinel"): `fontSize: 10` — borderline
- Timestamp/press-enter hint: `fontSize: 11` — acceptable

**Scenario card visual hierarchy is flat:**
The selected card has `border: '1.5px solid #F5A800'` and `borderLeft: '4px solid #F5A800'` — good indicator. But the unselected cards use `border: '1.5px solid #BDBDBD'` on a white background — they look like empty boxes with no affordance.

**Loading state is weak:**
When "Build agent graph" is clicked, only the button text changes to "Building graph..." with a gray background. There's no skeleton, no progress indication, and the 2-4 second wait (for meta-agent API call) has no visual feedback beyond the disabled button.

### Fix
**File: `src/app/configure/page.tsx`**

1. **NodePill**: `fontSize: 9` → `fontSize: 11`
2. **Meeting type label per card**: `fontSize: 10` → `fontSize: 11`
3. **All 10px labels in the chat panel**: → `fontSize: 11`
4. **Unselected scenario cards**: Add a subtle left border indicator even when unselected:
   ```js
   borderLeft: isSelected ? '4px solid #F5A800' : '4px solid transparent'
   ```
   This maintains layout consistency (no reflow on select) and gives the cards more visual structure.
5. **Build button loading state**: Add a subtle animated pulse or spinner icon while `isBuilding` is true, not just text change.
6. **Page background**: Change the page wrapper from implicit white to a light gray (`#F7F8FA`) to soften the transition from the dark header. Alternatively, add a 4px amber top border to the left panel to visually connect it to the amber accent on the header.
7. **Right chat panel**: Change from `#F4F4F4` to a slightly darker `#EDEEF0` so it reads as a distinct, sidebar-style panel rather than a slightly-grayed version of the same thing.

### Files to change
- `src/app/configure/page.tsx`

---

## Problem 7 — Review Page: Double-Padding Bug + Vertical Centering

### What's broken
```jsx
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
    paddingTop: 64,         // ← set here
    padding: '80px 24px',  // ← immediately overrides paddingTop: 64
  }}
>
```

CSS shorthand `padding` overrides the individual `paddingTop` on the same element. The intended `paddingTop: 64` (to clear the fixed header) is silently dropped. The card floats correctly only because `alignItems: 'center'` centers it in the flex container, but on shorter viewports the top of the card clips behind the fixed header.

### Fix
**File: `src/app/(demo)/review/page.tsx`**

Remove `paddingTop: 64` and adjust the outer wrapper to properly account for the fixed header:
```jsx
style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 64px)',
  marginTop: 64,      // push the flex container down below the header
  padding: '40px 24px',
}}
```

### Files to change
- `src/app/(demo)/review/page.tsx`

---

## Implementation Order

Work through these in sequence — each fix is independent but priority-ordered by visual/functional impact.

| # | Problem | File(s) | Effort | Impact |
|---|---|---|---|---|
| 1 | Fix `OPENAI_MODEL=gpt-5` → `gpt-4o` | `.env.local` | 1 min | Agent builder works end-to-end |
| 2 | StatePanel white container → dark background | `execute/page.tsx` | 1 min | Right panel becomes readable |
| 3 | Fix build page encoding corruption | `build/page.tsx` | 15 min | Text renders correctly |
| 4 | Execute page layout: columns, footer height, font floors | `execute/page.tsx` | 30 min | Layout breathes, legibility improves |
| 5 | Add SSE error state + recovery UI | `execute/page.tsx`, `executionStore.ts` | 20 min | Execution failures are visible + recoverable |
| 6 | Configure page: font sizes, card styles, loading state | `configure/page.tsx` | 30 min | Configure feels polished |
| 7 | Review page padding bug | `review/page.tsx` | 2 min | Modal centers correctly on all viewports |

**Total estimated effort: ~100 minutes**

---

## Files Touched (Complete List)

```
.env.local
src/app/(demo)/build/page.tsx
src/app/(demo)/execute/page.tsx
src/app/(demo)/review/page.tsx
src/app/configure/page.tsx
src/store/executionStore.ts
src/lib/graph/nodes/financialAggregator.ts
src/lib/graph/nodes/regulatoryDigest.ts
src/lib/graph/nodes/reportCompiler.ts
src/lib/graph/nodes/trendAnalyzer.ts
src/lib/graph/nodes/operationalRisk.ts
src/lib/graph/nodes/supervisor.ts
src/lib/graph/nodes/creditQuality.ts
src/lib/graph/nodes/capitalMonitor.ts
```

---

## Verify Command

After all fixes:
```bash
npx tsc --noEmit       # 0 errors
npm run dev            # visual check each page
```

**Visual checklist:**
1. `/configure` — Sentinel chat responds to a message; NodePill labels readable; "Building graph..." shows spinner on click
2. `/build` — Text renders cleanly (no `?+"` or `A·` garbage); countdown reads 5s
3. `/execute` — Right panel is dark with readable white text and sparklines; graph animates through nodes; log footer shows multiple rows; no frozen state
4. `/review` — Modal card visible without clipping; approve button works
5. `/report` — Timeline trace visible; download button active when DOCX generated
