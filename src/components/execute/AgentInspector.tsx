'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { useExecutionStore } from '@/store/executionStore';

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

const TYPE_MODEL: Record<string, string> = {
  llm:          'OpenAI GPT-4o — LLM synthesis',
  hybrid:       'Math regression + LLM narrative',
  orchestrator: 'Deterministic routing logic',
  deterministic:'Rules engine — no LLM',
  algorithmic:  'Weighted scoring algorithm',
  human:        'Human-in-the-loop gate',
};

type Tab = 'mandate' | 'data' | 'rules' | 'log';

export function AgentInspector() {
  const [tab, setTab] = useState<Tab>('log');
  const selectedNodeId = useExecutionStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useExecutionStore((s) => s.setSelectedNodeId);
  const nodeProgressLogs = useExecutionStore((s) => s.nodeProgressLogs);
  const nodeInputSnapshots = useExecutionStore((s) => s.nodeInputSnapshots);
  const nodeExecutionStates = useExecutionStore((s) => s.nodeExecutionStates);

  if (!selectedNodeId) return null;

  const meta = NODE_REGISTRY[selectedNodeId];
  if (!meta) return null;

  const executionLog = useExecutionStore((s) => s.executionLog);
  const color = TYPE_COLOR[meta.type] ?? '#8FE1FF';
  const execState = nodeExecutionStates[selectedNodeId] ?? 'idle';
  const logs = nodeProgressLogs[selectedNodeId] ?? [];
  const snapshot = nodeInputSnapshots[selectedNodeId];
  const durationMs = executionLog.find((e) => e.nodeId === selectedNodeId && e.durationMs !== undefined)?.durationMs;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'log',     label: 'LOG' },
    { id: 'mandate', label: 'MANDATE' },
    { id: 'data',    label: 'DATA' },
    { id: 'rules',   label: 'RULES' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 64,
        right: 0,
        bottom: 200,
        width: 400,
        background: '#001833',
        borderLeft: `1px solid ${color}30`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 55,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {meta.label}
          </div>
          <div
            style={{
              fontSize: 10,
              color: color,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
              marginTop: 2,
            }}
          >
            {meta.badgeLabel} · {execState.toUpperCase()}{execState === 'completed' && durationMs !== undefined ? ` · ${durationMs}ms` : ''}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelectedNodeId(null)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              height: 32,
              border: 'none',
              borderBottom: tab === t.id ? `2px solid ${color}` : '2px solid transparent',
              background: 'transparent',
              color: tab === t.id ? color : 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {tab === 'mandate' && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '0 0 12px' }}>
              {meta.description}
            </p>
          </div>
        )}

        {tab === 'data' && (
          snapshot ? (
            <pre
              style={{
                color: 'rgba(143,225,255,0.75)',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                fontSize: 11,
              }}
            >
              {JSON.stringify(snapshot, null, 2)}
            </pre>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>
              {execState === 'idle' ? 'Waiting for execution…' : 'No input snapshot captured.'}
            </span>
          )
        )}

        {tab === 'rules' && (
          <div>
            <div
              style={{
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 10,
                fontSize: 11,
              }}
            >
              {TYPE_MODEL[meta.type] ?? '—'}
            </div>
            {meta.formulaHint && (
              <div
                style={{
                  background: 'rgba(245,168,0,0.06)',
                  border: '1px solid rgba(245,168,0,0.15)',
                  borderRadius: 4,
                  padding: '8px 12px',
                  color: '#F5A800',
                  fontSize: 11,
                  lineHeight: 1.6,
                }}
              >
                {meta.formulaHint}
              </div>
            )}
          </div>
        )}

        {tab === 'log' && (
          logs.length === 0 ? (
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>
              {execState === 'idle' ? 'Not yet executed.' : 'No progress events.'}
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.2)',
                      fontSize: 10,
                      flexShrink: 0,
                      paddingTop: 1,
                    }}
                  >
                    {log.timestamp.slice(11, 19)}
                  </span>
                  <div>
                    <div style={{ color: 'rgba(143,225,255,0.8)', fontSize: 11 }}>
                      {log.step}
                    </div>
                    {log.detail && (
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 }}>
                        {log.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
