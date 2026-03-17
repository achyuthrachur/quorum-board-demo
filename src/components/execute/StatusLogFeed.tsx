'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useExecutionStore } from '@/store/executionStore';

interface FeedEntry {
  timestamp: string;
  nodeId?: string;
  nodeType?: string;
  message: string;
  kind: 'started' | 'progress' | 'completed' | 'error' | 'hitl';
}

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
  const [collapsed, setCollapsed] = useState(false);
  const executionLog = useExecutionStore((s) => s.executionLog);
  const nodeProgressLogs = useExecutionStore((s) => s.nodeProgressLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build unified feed
  const entries: FeedEntry[] = [];

  for (const entry of executionLog) {
    entries.push({
      timestamp: entry.timestamp,
      nodeId: entry.nodeId,
      nodeType: entry.nodeType,
      message: entry.summary ?? entry.label,
      kind: entry.nodeType === 'human' ? 'hitl' : 'completed',
    });
  }

  for (const [nodeId, logs] of Object.entries(nodeProgressLogs)) {
    for (const log of logs) {
      entries.push({
        timestamp: log.timestamp,
        nodeId,
        message: log.detail ? `${log.step} — ${log.detail}` : log.step,
        kind: 'progress',
      });
    }
  }

  entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (!collapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, collapsed]);

  const height = collapsed ? 36 : 200;

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
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-mono)',
            flex: 1,
          }}
        >
          Agent Log
          {entries.length > 0 && (
            <span style={{ color: 'rgba(143,225,255,0.5)', marginLeft: 8 }}>
              {entries.length} events
            </span>
          )}
        </span>
        {collapsed ? (
          <ChevronUp size={12} color="rgba(255,255,255,0.3)" />
        ) : (
          <ChevronDown size={12} color="rgba(255,255,255,0.3)" />
        )}
      </div>

      {/* Log entries */}
      {!collapsed && (
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '6px 0',
          }}
        >
          {entries.length === 0 ? (
            <div
              style={{
                padding: '12px 16px',
                fontSize: 11,
                color: 'rgba(255,255,255,0.2)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Waiting for execution to start…
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
                  background:
                    entry.kind === 'hitl'
                      ? 'rgba(229,55,107,0.06)'
                      : entry.kind === 'error'
                      ? 'rgba(229,55,107,0.04)'
                      : 'transparent',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.2)',
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0,
                    width: 86,
                  }}
                >
                  {entry.timestamp.slice(11, 23)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: entryColor(entry.kind),
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0,
                    width: 12,
                  }}
                >
                  {entryIcon(entry.kind)}
                </span>
                {entry.nodeId && (
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(143,225,255,0.4)',
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0,
                      width: 140,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.nodeId}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    color:
                      entry.kind === 'progress'
                        ? 'rgba(255,255,255,0.5)'
                        : 'rgba(255,255,255,0.75)',
                    fontFamily: 'var(--font-body)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
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
