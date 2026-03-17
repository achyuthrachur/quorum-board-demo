'use client';

/**
 * GraphParallelGrouping — adds background rects + PARALLEL labels
 * behind columns with 2+ nodes in the execute graph.
 *
 * Rendered as ReactFlow custom nodes with zIndex: -1.
 * Does NOT modify node positions, edges, or store logic.
 */

import type { NodeProps } from '@xyflow/react';

// ─── Group rect node ──────────────────────────────────────────────────────────

interface GroupRectData {
  width: number;
  height: number;
  [key: string]: unknown;
}

export function ParallelGroupNode({ data }: NodeProps) {
  const d = data as GroupRectData;
  return (
    <div
      style={{
        width: d.width,
        height: d.height,
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 12,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Parallel label node ──────────────────────────────────────────────────────

interface ParallelLabelData {
  [key: string]: unknown;
}

export function ParallelLabelNode(_props: NodeProps) {
  return (
    <div
      style={{
        pointerEvents: 'none',
        fontSize: 9,
        fontFamily: 'var(--font-mono)',
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      ↕ parallel
    </div>
  );
}
