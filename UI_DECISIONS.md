# SENTINEL — UI Decisions
## Locked selections for Phase 2 build
**Status:** FINAL — do not modify without owner sign-off
**Date:** March 2026

---

## SECTION 1 — COLOR PALETTE & THEME

### 1a — Surface Hierarchy
**Selection: B — 3 levels**
```css
--background:     #011E41;   /* Crowe Indigo Dark — app background, panel floors */
--surface:        #002E62;   /* Crowe Indigo Core — node cards, right panel sections */
--surface-raised: #003F9F;   /* Crowe Indigo Bright — hover states, elevated cards */
```

### 1b — Muted Text Color
**Selection: A — #8FE1FF (Crowe Cyan Light)**
```css
--text-muted: #8FE1FF;
```

### 1c — Node Type Colors (all confirmed as-is)
```css
--node-deterministic: #0075C9;   /* Crowe Blue — Rules Engine */
--node-algorithmic:   #05AB8C;   /* Crowe Teal — ML Scoring */
--node-llm:           #F5A800;   /* Crowe Amber — AI Agent */
--node-hybrid:        #54C0E8;   /* Crowe Cyan — Hybrid */
--node-orchestrator:  #B14FC5;   /* Crowe Violet — Orchestrator */
--node-human:         #E5376B;   /* Crowe Coral — Human/HITL */
```

### Full CSS token set
```css
:root {
  --background:     #011E41;
  --surface:        #002E62;
  --surface-raised: #003F9F;
  --accent:         #F5A800;
  --accent-bright:  #FFD231;
  --teal:           #05AB8C;
  --cyan:           #54C0E8;
  --coral:          #E5376B;
  --violet:         #B14FC5;
  --text-primary:   #FFFFFF;
  --text-muted:     #8FE1FF;
  --border:         rgba(255,255,255,0.08);
  --border-active:  rgba(245,168,0,0.4);
}
```

---

## SECTION 2 — TYPOGRAPHY

### 2d — Confirmed font pairing
**Selection: Syne + IBM Plex Sans + IBM Plex Mono**

```tsx
// layout.tsx
import { Syne, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-display',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});
```

**Usage:**
- `--font-display` (Syne Bold/ExtraBold): node labels, metric values, section headings, scenario titles, HITL modal headline, SENTINEL wordmark
- `--font-body` (IBM Plex Sans Regular/Medium): prose narratives, descriptions, log summaries, report preview body
- `--font-mono` (IBM Plex Mono Regular/Medium): timestamps, score values, state field keys, formula hints

---

## SECTION 3 — ANIMATED / INTERACTIVE COMPONENTS

### 3a — Scenario Selector Cards
**Selection: A — SpotlightCard**
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/DavidHDev/spotlight-card"
```
- Import: `import SpotlightCard from '@/components/ui/spotlight-card'`
- spotlightColor: `'rgba(245, 168, 0, 0.12)'`
- Fallback if SSL blocked: shadcn Card with `hover:border-[#F5A800] transition-colors` + `motion/react whileHover={{ scale: 1.01 }}`

### 3b — Animated Number Display
**Selection: A — React Bits CountUp**
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/reactbits/count-up"
```
- Import: `import CountUp from '@/components/ui/count-up'`
- Used for: credit health score ring + NIM/ROA/ROE values in Live State tab
- Fallback if SSL blocked: Anime.js v4 `animate(el, { innerHTML: [0, value], round: 100, duration: 1200, ease: 'outExpo' })`

### 3c — Graph Canvas Background
**Selection: D — ReactFlow built-in dot grid**
```tsx
import { Background, BackgroundVariant } from '@xyflow/react';
<Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
```
No install required.

### 3d — Narration Text Reveal
**Selection: A — React Bits BlurText**
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/reactbits/blur-text"
```
- Import: `import BlurText from '@/components/ui/blur-text'`
- Used for: narration overlay card text + SENTINEL wordmark on header load
- animateBy: `"words"`, delay: `80`, direction: `"top"`
- Fallback if SSL blocked: `motion/react` `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}`

### 3e — LLM Node Thinking Indicator
**Selection: A — Pulsing amber ring (CSS keyframe)**
No install required.
```css
@keyframes node-thinking-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 168, 0, 0.4); }
  50%       { box-shadow: 0 0 0 8px rgba(245, 168, 0, 0); }
}
.node-thinking {
  animation: node-thinking-pulse 1.5s ease-in-out infinite;
}
```

### 3f — HITL Modal Entrance
**Selection: C — Blur backdrop fade with card drop**
No install required. Uses `motion/react` AnimatePresence.
```tsx
// Backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.2 }}

// Card (200ms delay after backdrop)
initial={{ opacity: 0, y: -20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
```

---

## SECTION 4 — LAYOUT DIMENSIONS

```
Header height:          64px
Left panel width:       320px
Right panel width:      380px
Execution log height:   120px
Node card dimensions:   200px × 80px
Graph canvas bg:        ReactFlow dot grid (see 3c)
```

---

## SECTION 5 — ICON LIBRARY

### 5a — Primary icon set
**Selection: A — Lucide React (already installed)**

### 5b — Node type icons
```tsx
import {
  Settings2,    // Deterministic — Rules Engine
  BarChart3,    // Algorithmic — ML Scoring
  Sparkles,     // LLM — AI Agent
  Layers,       // Hybrid
  Network,      // Orchestrator
  UserCheck,    // Human/HITL
} from 'lucide-react';
```

Additional icons used in the app:
```tsx
import {
  Play,           // Run Analysis button
  RotateCcw,      // Reset button
  Download,       // Download DOCX
  Copy,           // Copy Markdown
  ChevronDown,    // Collapse panels
  AlertTriangle,  // HITL modal header
  CheckCircle2,   // Node completed state
  Clock,          // Timestamp in execution log
  Keyboard,       // Shortcut legend trigger in header
  Columns2,       // Compare mode toggle
} from 'lucide-react';
```

---

## SECTION 6 — INSTALL SUMMARY

### Required installs before Phase 2-A
Run these in order from the project root. Use `NODE_TLS_REJECT_UNAUTHORIZED=0` prefix for all 21st.dev/React Bits installs on the Crowe corporate network.

```bash
# SpotlightCard — scenario cards
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/DavidHDev/spotlight-card"

# CountUp — metric number animations
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/reactbits/count-up"

# BlurText — narration overlays + SENTINEL header wordmark
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/reactbits/blur-text"
```

### If all three are SSL-blocked
Fall back to zero-install alternatives listed in each section above.
All fallbacks use `motion/react` + `animejs` + `CSS` which are already installed.
The demo will still look polished — the SpotlightCard/CountUp/BlurText upgrades
are enhancements, not load-bearing.

---

## NOTES FOR CLAUDE CODE

- Read this file at the start of every Phase 2 prompt
- All color tokens are defined in Section 1 — use CSS variables throughout, never hardcode hex values in components
- Font variables are `--font-display`, `--font-body`, `--font-mono` — apply via `font-[family-name:var(--font-display)]` Tailwind syntax
- SpotlightCard, CountUp, BlurText: if the install succeeded, the component lives in `src/components/ui/` — import from there
- If any animated component install failed, use the fallback specified in its section
- `NODE_TLS_REJECT_UNAUTHORIZED=0` is for dev installs only — do not add to any CI config or production environment

---

*UI Decisions v1.0 | Crowe AI Innovation Team | March 2026*
*Companion to SENTINEL_PRD_v3.md and SENTINEL_KICKOFF_PROMPTS.md*
