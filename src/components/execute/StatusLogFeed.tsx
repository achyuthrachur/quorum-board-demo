'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useExecutionStore } from '@/store/executionStore';
import { NODE_REGISTRY } from '@/data/nodeRegistry';

interface FeedEntry {
  timestamp: string;
  nodeId?: string;
  nodeType?: string;
  message: string;
  kind: 'started' | 'progress' | 'completed' | 'error' | 'hitl';
}

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

// Agent filter chips — label + which nodeIds they match
const FILTER_CHIPS: { label: string; nodeIds: string[] }[] = [
  { label: 'All',        nodeIds: [] },
  { label: 'Financial',  nodeIds: ['financial_aggregator'] },
  { label: 'Capital',    nodeIds: ['capital_monitor'] },
  { label: 'Credit',     nodeIds: ['credit_quality'] },
  { label: 'Trend',      nodeIds: ['trend_analyzer'] },
  { label: 'Regulatory', nodeIds: ['regulatory_digest'] },
  { label: 'Ops',        nodeIds: ['operational_risk'] },
  { label: 'Supervisor', nodeIds: ['supervisor'] },
  { label: 'Review',     nodeIds: ['hitl_gate'] },
  { label: 'Compiler',   nodeIds: ['report_compiler'] },
];

function entryColor(kind: FeedEntry['kind']): string {
  if (kind === 'error') return '#E5376B';
  if (kind === 'hitl') return '#E5376B';
  if (kind === 'completed') return '#05AB8C';
  if (kind === 'started') return '#F5A800';
  return 'rgba(143,225,255,0.6)';
}

function entryIcon(kind: FeedEntry['kind']): string {
  if (kind === 'error') return '✗';
  if (kind === 'hitl') return '⚑';
  if (kind === 'completed') return '✓';
  if (kind === 'started') return '░';
  return '·';
}

export function StatusLogFeed() {
  const [collapsed, setCollapsed] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const executionLog = useExecutionStore((s) => s.executionLog);
  const nodeProgressLogs = useExecutionStore((s) => s.nodeProgressLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build unified feed
  const allEntries: FeedEntry[] = [];

  for (const entry of executionLog) {
    allEntries.push({
      timestamp: entry.timestamp,
      nodeId: entry.nodeId,
      nodeType: entry.nodeType,
      message: entry.summary ?? entry.label,
      kind: entry.nodeType === 'human' ? 'hitl' : 'completed',
    });
  }

  for (const [nodeId, logs] of Object.entries(nodeProgressLogs)) {
    for (const log of logs) {
      allEntries.push({
        timestamp: log.timestamp,
        nodeId,
        message: log.detail ? `${log.step} — ${log.detail}` : log.step,
        kind: 'progress',
      });
    }
  }

  allEntries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Apply filter
  const activeChip = FILTER_CHIPS.find((c) => c.label === activeFilter);
  const entries = activeChip && activeChip.nodeIds.length > 0
    ? allEntries.filter((e) => e.nodeId && activeChip.nodeIds.includes(e.nodeId))
    : allEntries;

  // Determine which chips have any events (to style them)
  const nodeIdsWithEvents = new Set(allEntries.map((e) => e.nodeId).filter(Boolean));

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (!collapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, collapsed]);

  const height = collapsed ? 36 : 180;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height,
        background: '#001833',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transition: 'height 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          height: 36,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
          gap: 10,
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', flex: 1 }}>
          Agent Log
          {allEntries.length > 0 && (
            <span style={{ color: 'rgba(143,225,255,0.5)', marginLeft: 8 }}>
              {entries.length}{activeFilter !== 'All' ? ` / ${allEntries.length}` : ''} events
            </span>
          )}
        </span>
        {collapsed ? (
          <ChevronUp size={12} color="rgba(255,255,255,0.3)" />
        ) : (
          <ChevronDown size={12} color="rgba(255,255,255,0.3)" />
        )}
      </div>

      {/* Filter chips row */}
      {!collapsed && (
        <div
          style={{
            display: 'flex',
            gap: 5,
            padding: '6px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            flexShrink: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', textTransform: 'uppercase', alignSelf: 'center', marginRight: 2, flexShrink: 0 }}>
            Filter:
          </span>
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeFilter === chip.label;
            const hasEvents = chip.nodeIds.length === 0 || chip.nodeIds.some((id) => nodeIdsWithEvents.has(id));
            // Get node type color for non-All chips
            const nodeId = chip.nodeIds[0];
            const nodeType = nodeId ? NODE_REGISTRY[nodeId]?.type : undefined;
            const chipColor = nodeType ? TYPE_COLOR[nodeType] ?? '#8FE1FF' : '#F5A800';

            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => setActiveFilter(chip.label)}
                style={{
                  height: 22,
                  padding: '0 10px',
                  borderRadius: 100,
                  border: `1px solid ${isActive ? `${chipColor}50` : 'rgba(255,255,255,0.08)'}`,
                  background: isActive ? `${chipColor}18` : 'transparent',
                  color: isActive ? chipColor : hasEvents ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Log entries */}
      {!collapsed && (
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {entries.length === 0 ? (
            <div style={{ padding: '10px 16px', fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>
              {allEntries.length === 0 ? 'Waiting for execution to start…' : `No events for ${activeFilter}.`}
            </div>
          ) : (
            entries.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  padding: '2px 16px',
                  background: entry.kind === 'hitl' ? 'rgba(229,55,107,0.06)' : entry.kind === 'error' ? 'rgba(229,55,107,0.04)' : 'transparent',
                }}
              >
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', flexShrink: 0, width: 86 }}>
                  {entry.timestamp.slice(11, 23)}
                </span>
                <span style={{ fontSize: 11, color: entryColor(entry.kind), fontFamily: 'var(--font-mono)', flexShrink: 0, width: 12 }}>
                  {entryIcon(entry.kind)}
                </span>
                {entry.nodeId && (
                  <span style={{ fontSize: 10, color: 'rgba(143,225,255,0.4)', fontFamily: 'var(--font-mono)', flexShrink: 0, width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.nodeId}
                  </span>
                )}
                <span style={{ fontSize: 11, color: entry.kind === 'progress' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
