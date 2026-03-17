'use client';

import { useState } from 'react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { getAgentRawInput } from '@/data/agentRawInputData';
import { getAgentDisplayData } from '@/data/agentDisplayData';
import { RawDataTableRenderer } from '@/components/landing/RawDataTableRenderer';
import { useExecutionStore } from '@/store/executionStore';

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

type Tab = 'log' | 'mandate' | 'data' | 'rules';

interface AgentWindowProps {
  nodeId: string;
}

export function AgentWindow({ nodeId }: AgentWindowProps) {
  const [tab, setTab] = useState<Tab>('log');
  const meta = NODE_REGISTRY[nodeId];
  const nodeProgressLogs = useExecutionStore((s) => s.nodeProgressLogs);
  const nodeExecutionStates = useExecutionStore((s) => s.nodeExecutionStates);
  const setSelectedNodeId = useExecutionStore((s) => s.setSelectedNodeId);

  if (!meta) return null;

  const executionLog = useExecutionStore((s) => s.executionLog);
  const execState = nodeExecutionStates[nodeId] ?? 'idle';
  const logs = nodeProgressLogs[nodeId] ?? [];
  const color = TYPE_COLOR[meta.type] ?? '#8FE1FF';
  const durationMs = executionLog.find((e) => e.nodeId === nodeId && e.durationMs !== undefined)?.durationMs;

  const isActive = execState === 'active';
  const isCompleted = execState === 'completed';

  const rawInput = getAgentRawInput(nodeId);
  const displayData = getAgentDisplayData(nodeId);

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
      {/* Header — clickable to open inspector */}
      <div
        onClick={() => setSelectedNodeId(nodeId)}
        style={{
          padding: '8px 12px 6px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? color : isCompleted ? '#05AB8C' : 'rgba(255,255,255,0.15)', boxShadow: isActive ? `0 0 6px ${color}` : 'none', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? color : 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', flex: 1 }}>
          {meta.label}
        </span>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color, background: `${color}15`, padding: '2px 6px', borderRadius: 3, letterSpacing: '0.08em' }}>{meta.badgeLabel}</span>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: isCompleted ? '#05AB8C' : isActive ? color : 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>
          {execState.toUpperCase()}{isCompleted && durationMs !== undefined ? ` · ${durationMs}ms` : ''}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
            flex: 1, height: 26, border: 'none',
            borderBottom: tab === t.id ? `2px solid ${color}` : '2px solid transparent',
            background: 'transparent',
            color: tab === t.id ? color : 'rgba(255,255,255,0.3)',
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        {tab === 'mandate' && (
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
            {meta.description}
          </p>
        )}

        {tab === 'data' && (
          rawInput ? (
            <div style={{ padding: '4px 0' }}>
              {rawInput.keyFields && rawInput.keyFields.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  {rawInput.keyFields.map((f, i) => (
                    <div key={i} style={{ fontSize: 10 }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{f.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              )}
              <RawDataTableRenderer table={rawInput.tables[0]} compact dark />
              {rawInput.tables.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(nodeId)}
                  style={{
                    marginTop: 8, width: '100%', height: 28,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6, cursor: 'pointer',
                    color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'var(--font-mono)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                >
                  + {rawInput.tables.length - 1} more tables — open inspector &rarr;
                </button>
              )}
            </div>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>No data available.</span>
          )
        )}

        {tab === 'rules' && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: 11, margin: '0 0 10px' }}>
              {displayData?.explanation ?? meta.description}
            </p>
            {meta.formulaHint && (
              <div style={{ background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.15)', borderRadius: 4, padding: '6px 8px', color: '#F5A800', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                {meta.formulaHint}
              </div>
            )}
            {displayData?.note && (
              <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                {displayData.note}
              </div>
            )}
          </div>
        )}

        {tab === 'log' && (
          logs.length === 0 ? (
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>
              {execState === 'idle' ? 'Not yet executed.' : 'No progress events captured.'}
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, flexShrink: 0 }}>{log.timestamp.slice(11, 19)}</span>
                  <span style={{ color: 'rgba(143,225,255,0.8)', fontSize: 10 }}>{log.step}</span>
                  {log.detail && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{log.detail}</span>}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
