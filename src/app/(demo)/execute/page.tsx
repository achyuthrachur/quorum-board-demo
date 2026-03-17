'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { GraphCanvas } from '@/components/GraphCanvas/GraphCanvas';
import { NarrationOverlay } from '@/components/NarrationOverlay/NarrationOverlay';
import { StatePanel } from '@/components/StatePanel/StatePanel';
import { CompareView } from '@/components/CompareView/CompareView';
import { ViewToggle } from '@/components/execute/ViewToggle';
import { StatusLogFeed } from '@/components/execute/StatusLogFeed';
import { AgentWindow } from '@/components/execute/AgentWindow';
import { AgentInspector } from '@/components/execute/AgentInspector';
import { SCENARIOS } from '@/data/scenarios';
import { useExecutionStore } from '@/store/executionStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Columns2, LayoutPanelLeft } from 'lucide-react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';

// ─── Node type colors ──────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

const LEGEND_ITEMS = [
  { type: 'deterministic', label: 'Rules engine',  sub: 'Deterministic — no LLM' },
  { type: 'algorithmic',   label: 'ML scoring',    sub: 'Weighted algorithm' },
  { type: 'llm',           label: 'AI agent',      sub: 'LLM synthesis' },
  { type: 'hybrid',        label: 'Hybrid',        sub: 'Math + LLM narrative' },
  { type: 'orchestrator',  label: 'Orchestrator',  sub: 'Routing and control' },
  { type: 'human',         label: 'Human review',  sub: 'HITL gate — pauses execution' },
];

// ─── Execute page ─────────────────────────────────────────────────────────────

export default function ExecutePage() {
  const router = useRouter();

  const runId              = useExecutionStore((s) => s.runId);
  const isPaused           = useExecutionStore((s) => s.isPaused);
  const isComplete         = useExecutionStore((s) => s.isComplete);
  const isRunning          = useExecutionStore((s) => s.isRunning);
  const compareMode        = useExecutionStore((s) => s.compareMode);
  const toggleCompareMode  = useExecutionStore((s) => s.toggleCompareMode);
  const speed              = useExecutionStore((s) => s.speed);
  const setSpeed           = useExecutionStore((s) => s.setSpeed);
  const resetAll           = useExecutionStore((s) => s.resetAll);
  const nodes              = useExecutionStore((s) => s.nodes);
  const selectedScenarioId = useExecutionStore((s) => s.selectedScenarioId);
  const setAppPhase        = useExecutionStore((s) => s.setAppPhase);
  const setScenario        = useExecutionStore((s) => s.setScenario);
  const startRun           = useExecutionStore((s) => s.startRun);
  const executionError     = useExecutionStore((s) => s.executionError);
  const selectedNodeId     = useExecutionStore((s) => s.selectedNodeId);

  const [view, setView] = useState<'network' | 'agents'>('network');

  const SPEED_OPTIONS = ['slow', 'normal', 'fast'] as const;

  useKeyboardShortcuts();

  useEffect(() => {
    setAppPhase('execute');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!runId) router.replace('/configure');
  }, [runId, router]);

  useEffect(() => {
    if (isPaused) { setAppPhase('review'); router.push('/review'); }
  }, [isPaused, router, setAppPhase]);

  useEffect(() => {
    if (isComplete) { setAppPhase('complete'); router.push('/report'); }
  }, [isComplete, router, setAppPhase]);

  const switchScenario = useCallback(async (newId: string) => {
    if (newId === selectedScenarioId && !isRunning && !isComplete) return;
    resetAll();
    setScenario(newId);
    await new Promise<void>((r) => setTimeout(r, 400));
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: newId }),
      });
      if (res.ok) {
        const data = await res.json() as { run_id: string };
        startRun(data.run_id);
      }
    } catch { /* swallow */ }
  }, [selectedScenarioId, isRunning, isComplete, resetAll, setScenario, startRun]);

  // Derive agent node IDs to show in AGENTS view
  const agentNodeIds = nodes.length > 0
    ? nodes.map((n) => n.id).filter((id) => id in NODE_REGISTRY)
    : Object.keys(NODE_REGISTRY);

  return (
    <>
      <AppHeader
        rightContent={
          <>
            <ViewToggle view={view} onChange={setView} />
            <button
              type="button"
              onClick={toggleCompareMode}
              style={{
                height: 30, padding: '0 12px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4, background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: '0.06em', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {compareMode ? <LayoutPanelLeft size={12} /> : <Columns2 size={12} />}
              {compareMode ? 'Single' : 'Compare'}
            </button>
            <button
              type="button"
              onClick={() => { resetAll(); router.push('/configure'); }}
              style={{
                height: 30, padding: '0 12px',
                border: '1px solid rgba(229,55,107,0.3)',
                borderRadius: 4, background: 'transparent',
                color: 'rgba(229,55,107,0.7)',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: '0.06em', cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </>
        }
      />

      <NarrationOverlay />

      {compareMode ? (
        <div style={{ position: 'fixed', top: 64, bottom: 0, left: 0, right: 0 }}>
          <CompareView />
        </div>
      ) : (
        <>
          {/* ── NETWORK VIEW ── */}
          {view === 'network' && (
            <div
              style={{
                position: 'fixed',
                top: 64,
                bottom: 200,
                left: 0,
                right: selectedNodeId ? 400 : 0,
                display: 'grid',
                gridTemplateColumns: '260px 1fr 320px',
              }}
            >
              {/* LEFT SIDEBAR — dark */}
              <div
                style={{
                  background: '#001833',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Scenarios */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                    Scenarios
                  </div>
                  {SCENARIOS.map((scenario) => {
                    const isActive = scenario.id === selectedScenarioId;
                    return (
                      <div
                        key={scenario.id}
                        onClick={() => switchScenario(scenario.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 4,
                          border: `1px solid ${isActive ? 'rgba(245,168,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          background: isActive ? 'rgba(245,168,0,0.06)' : 'transparent',
                          marginBottom: 5,
                          cursor: 'pointer',
                          borderLeft: `3px solid ${isActive ? '#F5A800' : 'rgba(255,255,255,0.1)'}`,
                        }}
                      >
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                          {scenario.meetingType ?? 'Full board'}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#F5A800' : 'rgba(255,255,255,0.7)' }}>
                          {scenario.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Speed */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                    Execution speed
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSpeed(s)}
                        style={{
                          flex: 1, height: 26,
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)',
                          border: `1px solid ${speed === s ? '#F5A800' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 4, cursor: 'pointer',
                          background: speed === s ? 'rgba(245,168,0,0.15)' : 'transparent',
                          color: speed === s ? '#F5A800' : 'rgba(255,255,255,0.35)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Node legend */}
                <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                    Node types
                  </div>
                  {LEGEND_ITEMS.map((item) => (
                    <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 2, borderLeft: `3px solid ${NODE_COLORS[item.type]}`, background: `${NODE_COLORS[item.type]}18`, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CENTER: Graph canvas */}
              <div style={{ background: '#011E41', position: 'relative', overflow: 'hidden' }}>
                <GraphCanvas />
              </div>

              {/* RIGHT: State panel */}
              <div style={{ background: '#011E41', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <StatePanel />
              </div>
            </div>
          )}

          {/* ── AGENTS VIEW ── */}
          {view === 'agents' && (
            <div
              style={{
                position: 'fixed',
                top: 64,
                bottom: 200,
                left: 0,
                right: selectedNodeId ? 400 : 0,
                background: '#011E41',
                overflowY: 'auto',
                padding: 20,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 12,
                }}
              >
                {agentNodeIds.map((nodeId) => (
                  <AgentWindow key={nodeId} nodeId={nodeId} />
                ))}
              </div>
            </div>
          )}

          {/* ERROR BANNER */}
          {executionError && !isRunning && (
            <div
              style={{
                position: 'fixed', bottom: 200, left: 0, right: 0, zIndex: 60,
                background: 'rgba(229,55,107,0.1)', border: '1px solid rgba(229,55,107,0.3)',
                padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <span style={{ fontSize: 13, color: '#E5376B', flex: 1, fontFamily: 'var(--font-body)' }}>
                {executionError}
              </span>
              <button
                type="button"
                onClick={() => { resetAll(); router.push('/configure'); }}
                style={{
                  height: 30, padding: '0 16px',
                  background: 'rgba(229,55,107,0.2)', border: '1px solid rgba(229,55,107,0.4)',
                  borderRadius: 4, cursor: 'pointer', color: '#E5376B',
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  letterSpacing: '0.06em', whiteSpace: 'nowrap',
                }}
              >
                Reset and reconfigure
              </button>
            </div>
          )}

          {/* Agent Inspector drawer */}
          <AgentInspector />

          {/* Status log feed footer */}
          <StatusLogFeed />
        </>
      )}
    </>
  );
}
