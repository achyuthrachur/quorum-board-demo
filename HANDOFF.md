# HANDOFF — Font Fix + Live Chat UI

## Status
DONE — 3 changes implemented. TypeScript 0 errors.

## What Was Done (This Session)

### Part 1 — Font Fix (Critical)
**Files: `src/app/layout.tsx`, `src/app/globals.css`**
- Removed Google Fonts `<link>` tags from layout.tsx
- Added `next/font/google` imports: `Syne` (display), `IBM_Plex_Sans` (body), `IBM_Plex_Mono` (mono)
- Each font uses a distinct CSS variable: `--font-syne`, `--font-ibm-sans`, `--font-ibm-mono`
- Applied all three `.variable` classes to `<html>`
- Updated globals.css `:root` to reference the next/font vars:
  - `--font-display: var(--font-syne), "Arial", sans-serif`
  - `--font-body: var(--font-ibm-sans), "Arial", sans-serif`
  - `--font-mono: var(--font-ibm-mono), "Courier New", monospace`
- **Result:** SENTINEL wordmark and all headings now render in Syne (geometric, heavy weight)

### Part 2 — Wire Configure Chat to AI
**Files: `src/app/api/chat/route.ts` (new), `src/app/configure/page.tsx`**

**New route `/api/chat`:**
- POST `{ message, currentScenarioId }` → `{ reply, recommendedScenarioId? }`
- Uses `OPENAI_API_KEY` + `OPENAI_MODEL` env vars (same pattern as `/api/analyze`)
- `response_format: json_object` — returns structured JSON
- System prompt explains all 3 scenarios; model sets `recommendedScenarioId` when confident

**Configure page changes:**
- Added `messages` state — seeded with first Sentinel greeting
- Added `inputValue`, `isThinking` state
- Added `handleSend()` async function — appends user msg, calls `/api/chat`, appends reply, auto-selects scenario if returned
- Messages render from `messages` state (not static array)
- Typing indicator ("Sentinel is thinking…") shown while `isThinking`
- Input has `value`, `onChange`, `onKeyDown` (Enter → send)
- Send button `onClick` wired, disabled while thinking or empty
- `useEffect` scrolls `chatEndRef` when `messages` changes

### Part 3 — Agent names on configure
Already implemented — `SCENARIO_NODE_STRIPS` renders `n.label` (not type). No change needed.

## Files Changed
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/api/chat/route.ts` (new)
- `src/app/configure/page.tsx`

## Verify Command
```bash
npx tsc --noEmit   # 0 errors
npm run build      # clean build
npm run dev        # visual check
```

## Visual Checks
1. **Fonts** — SENTINEL wordmark and h1 headings render in Syne (geometric, distinctly different from body IBM Plex Sans)
2. **Chat** — `/configure` → type "We have a full board meeting this quarter" → Sentinel replies, falcon-board auto-selected
3. **Typing indicator** — "Sentinel is thinking…" bubble appears while waiting for reply
