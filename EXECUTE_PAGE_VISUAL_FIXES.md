# SENTINEL — Execute Page Visual Fixes PRD
## File: EXECUTE_PAGE_VISUAL_FIXES.md
**Page:** `src/app/(demo)/execute/page.tsx`
**Owner:** Achyuth Rachur, Crowe AI Innovation Team
**Status:** Changes already applied — this document records what was done and what remains

---

## CONTEXT

This PRD documents the visual and UX fixes applied to the execute page based on a review of the live UI. The screenshot showed four problems: a light grey canvas with no styling intention, an unexplained "GRAPH TOPOLOGY" bar at the bottom, completion states that were invisible, and no way to toggle the log panel. This document captures all requirements — both what was fixed in-session and what still needs to be completed.

---

## CHANGES ALREADY APPLIED

These were edited directly and are already in the codebase:

### 1. Graph canvas background — light mode

**Requirement:** The graph canvas must use a light background, not dark. The execute page is a professional tool, not a terminal. The light canvas makes the indigo node cards stand out as distinct elements and aligns with the Crowe light-mode visual standard for the overall app.

**What was changed:**
- `GraphCanvas.tsx` root div: `background: '#F4F4F4'`
- Execute page canvas wrapper: `background: '#F4F4F4'`
- ReactFlow dot grid: changed from `rgba(255,255,255,0.07)` (invisible on light) to `rgba(1,30,65,0.12)` (subtle indigo dots visible on light background)

**What was NOT changed:**
- Node cards stay dark indigo (`#002E62`) — the contrast of dark nodes on a light canvas is the intentional visual
- Narration card stays dark — it is a floating overlay and needs contrast against the canvas
- Status log footer stays dark — it is a distinct panel below the canvas

### 2. Node completion tick mark — visible and animated

**Requirement:** When a node completes execution, the audience must be able to see it immediately. The previous tick was 16px, the same color as the node background, and invisible at presentation distance.

**What was changed — `NodeShell.tsx`:**
- Tick mark size: `16px → 24px` (`h-6 w-6`)
- Tick font size: `9px → 13px`, `font-black`
- Tick animation: spring scale-in from `scale: 0, opacity: 0` to `scale: 1, opacity: 1` on completion, `delay: 0.1s`
- Tick glow: `boxShadow: '0 0 10px [nodeTypeColor]80'` — the glow matches the node type color so Financial Aggregator gets a blue glow, Credit Quality gets teal, HITL Gate gets coral

**Visual result:** When a node completes, a brightly colored filled circle with a bold ✓ springs into the top-right corner of the node with a matching color glow. Unmissable at presentation distance.

### 3. Graph Topology bar — removed

**Requirement:** The "GRAPH TOPOLOGY — 10 NODES SELECTED" bar at the bottom of the canvas served no demo purpose. It showed a list of selected nodes in a collapsible panel, which duplicates information already visible in the graph itself. Remove it entirely.

**What was changed:**
- `GraphDiffPanel` import removed from `GraphCanvas.tsx`
- `<GraphDiffPanel />` render removed from `GraphCanvas.tsx`
- The `GraphDiffPanel.tsx` file itself is left in place but unused — do not delete it in case it is needed later

### 4. Log toggle button — header control

**Requirement:** The execution log footer takes 180px of vertical space. During a demo presentation, there are moments where you want to hide the log to give the graph more screen real estate — particularly when showing the graph to an executive who does not need to read raw log entries.

**What was changed — `execute/page.tsx`:**
- Added `const [showLog, setShowLog] = useState(true)` page state
- Added "⊞ Logs" / "⊟ Logs" toggle button to the header right controls
- When `showLog === false`: canvas extends `bottom: 0` (full bleed to screen bottom), log footer hidden
- When `showLog === true`: canvas stops at `bottom: 180`, log footer visible
- Button uses `btnStyle(showLog)` — active state when log is visible (white border, white text)

### 5. Node card border — subtle shadow on light canvas

**Requirement:** Dark node cards on a light canvas need a subtle drop shadow to lift them off the background and give depth. The previous version had no shadow.

**What was changed — `NodeShell.tsx`:**
- Added `boxShadow: '0 2px 12px rgba(1,30,65,0.15)'` to node card base style
- Node border opacity increased slightly: `rgba(255,255,255,0.10) → rgba(255,255,255,0.14)`

### 6. Legend card — light mode

**Requirement:** The legend card in the bottom-left of the canvas was a dark frosted glass panel (`rgba(0,46,98,0.85)` with `backdropFilter: blur(8px)`). On the light canvas this looks like an alien element. It should be a clean white card consistent with the light canvas.

**What was changed — `GraphLegend.tsx`:**
- Background: `rgba(0,46,98,0.85)` → `#FFFFFF`
- Removed `backdropFilter`
- Border: `rgba(255,255,255,0.06)` → `#E0E0E0`
- Added `boxShadow: '0 2px 12px rgba(1,30,65,0.10)'`
- Label text: `var(--text-muted)` → `#828282` (legible on white)
- Legend item labels: `text-white` → `color: '#333333'`

---

## STILL REQUIRED — Not yet implemented

These are requirements identified from the same review session that were not applied in-session. Claude Code must implement these next.

### 7. Sequential visual progression through nodes

**Requirement:** For demo purposes, the audience needs to see the graph progressing node by node in a clear left-to-right sequence. Even though some nodes run in parallel in the actual execution, the visual should show a clear "something is happening" progression that a non-technical audience can follow.

**What is needed:**

The backend nodes already fire sequentially (one `node_started` → `node_completed` pair at a time from the SSE stream). The visual issue is that when a node completes and the next starts, the transition is too fast to register at `normal` speed.

**Fix in `executionStore.ts` `handleSSEEvent` for `node_started`:**

Add a brief frontend delay before updating the active node state when the previous node just completed. This gives the completion tick mark time to register visually before the next node lights up:

```typescript
case 'node_started': {
  // Small visual pause so completion of previous node is seen before next starts
  const delay = get().speed === 'slow' ? 600 : get().speed === 'normal' ? 300 : 0;
  setTimeout(() => {
    set((prev) => ({
      activeNodeId: event.nodeId,
      nodeExecutionStates: { ...prev.nodeExecutionStates, [event.nodeId]: 'active' },
      // ... rest of update
    }));
  }, delay);
  break;
}
```

**Additionally:** When a node transitions from active → completed, the glow animation on `NodeShell` should pause for 400ms at full brightness before fading out. This gives the audience a "flash" moment to register the completion before the tick animates in. Currently the glow just stops immediately.

**Implementation:** In `NodeShell.tsx`, when `executionState` changes from `active` to `completed`, add a brief intermediate state where the box-shadow stays at its bright value before transitioning to `none`. Use a `useEffect` watching `executionState` with a `setTimeout(400)` before updating the local flash state.

### 8. Completed node visual distinction — stronger

**Requirement:** Completed nodes need to look clearly different from idle nodes. Currently:
- Idle nodes: `opacity: 0.35`
- Active nodes: full opacity + glow + pulsing dot
- Completed nodes: full opacity + tick mark

The completed state needs a stronger visual signal beyond just the tick mark. A completed node should feel "done and solid" while idle nodes feel "waiting."

**Fix in `NodeShell.tsx`:**

When `isCompleted`:
- Left border color: stays as the node type color
- Add a subtle background tint: `backgroundColor: mix of #002E62 with a trace of the node type color` — use `${color}08` as a background tint layered over the base dark blue
- The label text should brighten slightly: add `opacity: 1` explicitly on completed state vs the 0.85 it currently sits at

### 9. Active node — "current step" text in node body

**Requirement:** When a node is actively executing, the audience wants to see what it is doing right now — not just a pulsing glow. Show the most recent `node_progress` log entry directly inside the node card while it is active.

**What is needed in each node component (`DeterministicNode`, `LLMNode`, `HybridNode`, `AlgorithmicNode`, `OrchestratorNode`, `HITLNode`):**

```tsx
// Inside the node body, when executionState === 'active':
const nodeProgressLogs = useExecutionStore((s) => s.nodeProgressLogs);
const latestStep = nodeProgressLogs[id]?.slice(-1)[0]?.step ?? null;

{isActive && latestStep && (
  <p
    className="text-[9px] leading-tight truncate"
    style={{ color: `${color}cc`, fontFamily: 'var(--font-mono)', marginTop: 4 }}
  >
    ▶ {latestStep}
  </p>
)}
```

This requires `node_progress` events to be emitted from the backend (see EXECUTE_PAGE_PRD.md Issue 4). If the backend is not yet emitting those events, this UI element will simply not appear. Build the UI first, wire the backend second.

### 10. Edges — animated traversal on light canvas

**Requirement:** The animated edges (`AnimatedEdge.tsx`) currently use colors tuned for a dark canvas. On the light canvas, the default inactive edge color `rgba(255,255,255,0.18)` is invisible.

**Fix in `AnimatedEdge.tsx`:**
- Inactive edge stroke: `rgba(255,255,255,0.18)` → `rgba(1,30,65,0.15)` (subtle indigo on light)
- Active edge stroke: keep the node type color, it is already bright enough
- Completed edge stroke: `rgba(5,171,140,0.25)` → `rgba(5,171,140,0.4)` (slightly more visible on light)

Read `AnimatedEdge.tsx` first to confirm the exact color values before editing.

### 11. Left control panel — backdrop needs updating

**Requirement:** The left control panel overlay uses `rgba(0,18,48,0.92)` with `backdropFilter: blur(16px)`. This is correct and should stay — it is a dark overlay on a light canvas, which is deliberate. But the scenario tiles inside it need their active state to be clearly visible.

**Fix in `execute/page.tsx` scenario tile rendering:**
- Active tile: the amber left border and background is already correct
- Inactive tile hover state: add a `cursor: pointer` and a subtle `background: rgba(255,255,255,0.04)` on hover
- No other changes needed

### 12. Empty canvas state — light mode

**Requirement:** When no graph has been built yet (before a scenario runs), the `EmptyCanvas` component shows a centered icon and text. The icon container and text colors are tuned for dark mode.

**Fix in `GraphCanvas.tsx` `EmptyCanvas` component:**
- Icon container background: `#B14FC510` → keep (it works on both light and dark)
- Icon container border: `rgba(177,79,197,0.15)` → `rgba(177,79,197,0.25)` (slightly more visible on light)
- "Select a scenario to begin" text: `text-white opacity-40` → `style={{ color: '#4F4F4F' }}`
- Subtitle text: `var(--text-muted)` → `#828282`

---

## FILES REFERENCE

| File | What changed / needs changing |
|------|-------------------------------|
| `src/app/(demo)/execute/page.tsx` | Log toggle added (done). Left panel overlay (done). Canvas background (done). |
| `src/components/GraphCanvas/GraphCanvas.tsx` | GraphDiffPanel removed (done). Background (done). Dot grid color (done). Empty canvas text colors (TODO #12). |
| `src/components/GraphCanvas/nodes/NodeShell.tsx` | Tick mark size/animation (done). Shadow (done). Completed state tint (TODO #8). Visual pause on transition (TODO #7). |
| `src/components/GraphCanvas/nodes/DeterministicNode.tsx` | Active step text (TODO #9). |
| `src/components/GraphCanvas/nodes/LLMNode.tsx` | Active step text (TODO #9). |
| `src/components/GraphCanvas/nodes/HybridNode.tsx` | Active step text (TODO #9). |
| `src/components/GraphCanvas/nodes/AlgorithmicNode.tsx` | Active step text (TODO #9). |
| `src/components/GraphCanvas/nodes/OrchestratorNode.tsx` | Active step text (TODO #9). |
| `src/components/GraphCanvas/nodes/HITLNode.tsx` | Active step text (TODO #9). |
| `src/components/GraphCanvas/AnimatedEdge.tsx` | Edge colors for light canvas (TODO #10). |
| `src/components/GraphCanvas/GraphLegend.tsx` | Light card style (done). |
| `src/store/executionStore.ts` | Visual delay on node_started (TODO #7). |

---

## DELIVERY ORDER FOR REMAINING ITEMS

1. **Edge colors** (TODO #10) — one file, fast win, makes the graph immediately more readable
2. **Empty canvas text** (TODO #12) — two lines
3. **Active step text in nodes** (TODO #9) — same change in 6 files
4. **Sequential visual pause** (TODO #7) — store + NodeShell
5. **Completed node tint** (TODO #8) — NodeShell only

---

## VERIFICATION CHECKLIST

### Already done
- [x] Canvas background is light grey `#F4F4F4`
- [x] ReactFlow dot grid is visible on light background
- [x] "GRAPH TOPOLOGY" bar is gone
- [x] Completion tick is large, animated, colored, with glow
- [x] Logs button in header toggles the footer panel
- [x] Canvas extends full height when logs are hidden
- [x] Legend card is white on light canvas
- [x] Node cards have subtle drop shadow

### Still needed
- [ ] Edges visible on light canvas (inactive edges not invisible)
- [ ] Active node shows current step text from node_progress log
- [ ] Completed node has subtle color tint
- [ ] Visual pause between node completion and next node activation
- [ ] Empty canvas text readable on light background
- [ ] Hover state on left panel scenario tiles

---

## KICKOFF PROMPT FOR CLAUDE CODE

> Read `EXECUTE_PAGE_VISUAL_FIXES.md` fully.
>
> The changes marked "Already done" are already in the codebase — do not re-apply them.
>
> Start with TODO #10 (edge colors in `AnimatedEdge.tsx`) — read the file first to confirm current color values, then update inactive/completed edge colors for the light canvas.
>
> Then proceed through the remaining TODOs in the delivery order listed above.
>
> Do NOT touch the store architecture, SSE handlers, navigation guards, or any page other than `src/app/(demo)/execute/page.tsx`.

---

*Execute Page Visual Fixes PRD | Crowe AI Innovation Team | March 2026*
*Companion to: EXECUTE_PAGE_PRD.md*
