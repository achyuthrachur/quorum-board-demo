'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { getAgentRawInput } from '@/data/agentRawInputData';
import { getAgentDisplayData } from '@/data/agentDisplayData';
import { AgentDataContent } from '@/components/configure/AgentDataContent';
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

type Tab = 'log' | 'source' | 'results' | 'rules' | 'live';

const LIVE_STATE_MAP: Record<string, string> = {
  financial_aggregator: 'financialMetrics',
  capital_monitor: 'capitalMetrics',
  credit_quality: 'creditMetrics',
  trend_analyzer: 'trendAnalysis',
  regulatory_digest: 'regulatoryDigest',
  operational_risk: 'operationalRiskDigest',
  supervisor: 'supervisorDecision',
};

function LiveStateTab({ nodeId, execState, color, durationMs, nodeOutput, liveState }: {
  nodeId: string;
  execState: string;
  color: string;
  durationMs?: number;
  nodeOutput: unknown;
  liveState: Record<string, unknown>;
}) {
  const stateKey = LIVE_STATE_MAP[nodeId] ?? null;
  const stateSlice = stateKey ? (liveState as Record<string, unknown>)[stateKey] : null;

  if (execState === 'idle') {
    return <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>This agent hasn&apos;t run yet.</span>;
  }

  if (execState === 'active') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>Running...</span>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Live metrics will appear here when this agent completes.</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: '#05AB8C', fontWeight: 700 }}>&#10003; Completed</span>
        {durationMs !== undefined && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>{durationMs}ms</span>}
      </div>
      {stateSlice != null && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Live state — {stateKey}
          </div>
          <pre style={{ color: 'rgba(255,255,255,0.8)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', maxHeight: 250, overflowY: 'auto' }}>
            {JSON.stringify(stateSlice, null, 2)}
          </pre>
        </div>
      )}
      {nodeOutput != null && (
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Output state delta
          </div>
          <pre style={{ color: 'rgba(255,255,255,0.8)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', maxHeight: 250, overflowY: 'auto' }}>
            {JSON.stringify(nodeOutput, null, 2)}
          </pre>
        </div>
      )}
      {stateSlice == null && nodeOutput == null && (
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>No live state captured for this agent.</span>
      )}
    </div>
  );
}

export function AgentInspector() {
  const [tab, setTab] = useState<Tab>('log');
  const selectedNodeId = useExecutionStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useExecutionStore((s) => s.setSelectedNodeId);
  const nodeProgressLogs = useExecutionStore((s) => s.nodeProgressLogs);
  const nodeExecutionStates = useExecutionStore((s) => s.nodeExecutionStates);
  const nodeOutputs = useExecutionStore((s) => s.nodeOutputs);
  const executionLog = useExecutionStore((s) => s.executionLog);
  const liveState = useExecutionStore((s) => s.liveState);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log to bottom when new entries arrive
  const logsForScroll = nodeProgressLogs[selectedNodeId ?? ''];
  useEffect(() => {
    if (tab === 'log') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logsForScroll?.length, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedNodeId) return null;

  const meta = NODE_REGISTRY[selectedNodeId];
  if (!meta) return null;

  const color = TYPE_COLOR[meta.type] ?? '#8FE1FF';
  const execState = nodeExecutionStates[selectedNodeId] ?? 'idle';
  const logs = nodeProgressLogs[selectedNodeId] ?? [];
  const durationMs = executionLog.find((e) => e.nodeId === selectedNodeId && e.durationMs !== undefined)?.durationMs;
  const rawInput = getAgentRawInput(selectedNodeId);
  const displayData = getAgentDisplayData(selectedNodeId);
  const nodeOutput = nodeOutputs[selectedNodeId];

  const TABS: { id: Tab; label: string }[] = [
    { id: 'log',     label: 'LOG' },
    { id: 'source',  label: 'SOURCE DATA' },
    { id: 'results', label: 'RESULTS' },
    { id: 'rules',   label: 'RULES' },
    { id: 'live',    label: 'LIVE STATE' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 64,
        right: 0,
        bottom: 180,
        width: 440,
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
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-body)' }}>
            {meta.label}
          </div>
          <div style={{ fontSize: 10, color, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginTop: 2 }}>
            {meta.badgeLabel} · {execState.toUpperCase()}{execState === 'completed' && durationMs !== undefined ? ` · ${durationMs}ms` : ''}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelectedNodeId(null)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 6, display: 'flex', alignItems: 'center' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              height: 34,
              border: 'none',
              borderBottom: tab === t.id ? `2px solid ${color}` : '2px solid transparent',
              background: 'transparent',
              color: tab === t.id ? color : 'rgba(255,255,255,0.35)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              fontWeight: tab === t.id ? 700 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', minHeight: 0 }}>

        {/* ── LOG ── */}
        {tab === 'log' && (
          logs.length === 0 ? (
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              {execState === 'idle' ? 'Not yet executed.' : 'No progress events captured.'}
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, flexShrink: 0, paddingTop: 1, fontFamily: 'var(--font-mono)' }}>
                    {log.timestamp.slice(11, 19)}
                  </span>
                  <div>
                    <div style={{ color: 'rgba(143,225,255,0.9)', fontSize: 12, fontWeight: 600 }}>{log.step}</div>
                    {log.detail && (
                      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>{log.detail}</div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )
        )}

        {/* ── SOURCE DATA ── */}
        {tab === 'source' && (
          rawInput ? (
            <div>
              {rawInput.keyFields && rawInput.keyFields.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  {rawInput.keyFields.map((kf, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>{kf.label}</div>
                      <div style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 600 }}>{kf.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {rawInput.tables.map((table) => (
                <RawDataTableRenderer key={table.id} table={table} compact dark />
              ))}
            </div>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No source data available for this agent.</span>
          )
        )}

        {/* ── RESULTS ── */}
        {tab === 'results' && (
          displayData ? (
            <AgentDataContent panel={displayData} darkMode />
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No processed results available.</span>
          )
        )}

        {/* ── RULES ── */}
        {tab === 'rules' && (
          <div>
            {displayData?.explanation && (
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, margin: '0 0 16px', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                {displayData.explanation}
              </p>
            )}
            {!displayData?.explanation && (
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 12px', fontSize: 12 }}>
                {meta.description}
              </p>
            )}
            {meta.formulaHint && (
              <div style={{ background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.15)', borderRadius: 10, padding: '10px 14px', color: '#F5A800', fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.6, marginBottom: 12 }}>
                {meta.formulaHint}
              </div>
            )}
            {displayData?.note && (
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                {displayData.note}
              </div>
            )}
          </div>
        )}

        {/* ── LIVE STATE ── */}
        {tab === 'live' && <LiveStateTab nodeId={selectedNodeId} execState={execState} color={color} durationMs={durationMs} nodeOutput={nodeOutput} liveState={liveState} />}
      </div>
    </div>
  );
}
