'use client';

import { useState } from 'react';
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
  llm:     'OpenAI GPT-4o — LLM synthesis',
  hybrid:  'Math regression + LLM narrative',
  orchestrator: 'Deterministic routing logic',
  deterministic: 'Rules engine — no LLM',
  algorithmic:   'Weighted scoring algorithm',
  human:   'Human-in-the-loop gate',
};

type Tab = 'mandate' | 'data' | 'rules' | 'log';

interface AgentWindowProps {
  nodeId: string;
}

export function AgentWindow({ nodeId }: AgentWindowProps) {
  const [tab, setTab] = useState<Tab>('log');
  const meta = NODE_REGISTRY[nodeId];
  const nodeProgressLogs = useExecutionStore((s) => s.nodeProgressLogs);
  const nodeInputSnapshots = useExecutionStore((s) => s.nodeInputSnapshots);
  const nodeExecutionStates = useExecutionStore((s) => s.nodeExecutionStates);

  if (!meta) return null;

  const executionLog = useExecutionStore((s) => s.executionLog);
  const execState = nodeExecutionStates[nodeId] ?? 'idle';
  const logs = nodeProgressLogs[nodeId] ?? [];
  const snapshot = nodeInputSnapshots[nodeId];
  const color = TYPE_COLOR[meta.type] ?? '#8FE1FF';
  const durationMs = executionLog.find((e) => e.nodeId === nodeId && e.durationMs !== undefined)?.durationMs;

  const isActive = execState === 'active';
  const isCompleted = execState === 'completed';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'log',     label: 'LOG' },
    { id: 'mandate', label: 'MANDATE' },
    { id: 'data',    label: 'DATA' },
    { id: 'rules',   label: 'RULES' },
  ];

  return (
    <div
      style={{
        background: '#011E41',
        border: `1px solid ${isActive ? `${color}40` : isCompleted ? 'rgba(5,171,140,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderLeft: `3px solid ${isActive ? color : isCompleted ? '#05AB8C' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 280,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px 6px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isActive ? color : isCompleted ? '#05AB8C' : 'rgba(255,255,255,0.15)',
            boxShadow: isActive ? `0 0 6px ${color}` : 'none',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: isActive ? color : 'rgba(255,255,255,0.7)',
            fontFamily: 'var(--font-body)',
            flex: 1,
          }}
        >
          {meta.label}
        </span>
        <span
          style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            color: color,
            background: `${color}15`,
            padding: '2px 6px',
            borderRadius: 3,
            letterSpacing: '0.08em',
          }}
        >
          {meta.badgeLabel}
        </span>
        <span
          style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            color: isCompleted ? '#05AB8C' : isActive ? color : 'rgba(255,255,255,0.25)',
            letterSpacing: '0.06em',
          }}
        >
          {execState.toUpperCase()}{isCompleted && durationMs !== undefined ? ` · ${durationMs}ms` : ''}
        </span>
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
              height: 26,
              border: 'none',
              borderBottom: tab === t.id ? `2px solid ${color}` : '2px solid transparent',
              background: 'transparent',
              color: tab === t.id ? color : 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
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
          padding: '8px 12px',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {tab === 'mandate' && (
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
            {meta.description}
          </p>
        )}

        {tab === 'data' && (
          snapshot ? (
            <pre
              style={{
                color: 'rgba(143,225,255,0.7)',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                fontSize: 10,
              }}
            >
              {JSON.stringify(snapshot, null, 2)}
            </pre>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>
              {execState === 'idle' ? 'Waiting for execution…' : 'No snapshot captured.'}
            </span>
          )
        )}

        {tab === 'rules' && (
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              {TYPE_MODEL[meta.type] ?? '—'}
            </div>
            {meta.formulaHint && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 4,
                  padding: '6px 8px',
                  color: '#F5A800',
                  fontSize: 10,
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
              {execState === 'idle' ? 'Not yet executed.' : 'No progress events captured.'}
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, flexShrink: 0 }}>
                    {log.timestamp.slice(11, 19)}
                  </span>
                  <span style={{ color: 'rgba(143,225,255,0.7)', fontSize: 10 }}>
                    {log.step}
                  </span>
                  {log.detail && (
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>
                      {log.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
