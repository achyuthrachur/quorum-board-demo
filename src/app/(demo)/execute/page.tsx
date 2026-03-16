'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { GraphCanvas } from '@/components/GraphCanvas/GraphCanvas';
import { InteractiveLogsTable } from '@/components/ui/interactive-logs-table-shadcnui';
import { NarrationOverlay } from '@/components/NarrationOverlay/NarrationOverlay';
import { StatePanel } from '@/components/StatePanel/StatePanel';
import { CompareView } from '@/components/CompareView/CompareView';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import { SCENARIOS } from '@/data/scenarios';
import { useExecutionStore } from '@/store/executionStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Columns2, LayoutPanelLeft, Network, GitBranch } from 'lucide-react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import type { NodeExecutionState } from '@/types/graph';

// ─── Node colors ──────────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

const NODE_BG: Record<string, string> = {
  deterministic: '#E6F1FB',
  algorithmic:   '#E1F5EE',
  hybrid:        '#E6F6FC',
  llm:           '#FFF5D6',
  orchestrator:  '#F3E8FF',
  human:         '#FDEEF3',
};

// ─── Map node execution state to RadialOrbitalTimeline status ─────────────────

function toTimelineStatus(s: NodeExecutionState): 'completed' | 'in-progress' | 'pending' {
  if (s === 'completed') return 'completed';
  if (s === 'active')    return 'in-progress';
  return 'pending';
}

// ─── Header center ────────────────────────────────────────────────────────────

function ExecuteHeaderCenter() {
  const isRunning          = useExecutionStore((s) => s.isRunning);
  const isComplete         = useExecutionStore((s) => s.isComplete);
  const selectedScenarioId = useExecutionStore((s) => s.selectedScenarioId);
  const executionLog       = useExecutionStore((s) => s.executionLog);
  const nodes              = useExecutionStore((s) => s.nodes);
  const scenario      = SCENARIOS.find((sc) => sc.id === selectedScenarioId);
  const completedCount = executionLog.filter((e) => e.nodeType !== 'human').length;
  const totalNodes    = nodes.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '5px 16px' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5A800' }} />
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{scenario?.label ?? 'Falcon Board'}</span>
      {isRunning && !isComplete && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(5,171,140,0.15)', border: '1px solid rgba(5,171,140,0.3)', borderRadius: 100, padding: '3px 10px', fontSize: 11, color: '#05AB8C', fontFamily: 'var(--font-mono)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#05AB8C' }} />
          Running — {completedCount} of {totalNodes}
        </span>
      )}
    </div>
  );
}

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
  const nodeExecutionStates = useExecutionStore((s) => s.nodeExecutionStates);
  const executionLog       = useExecutionStore((s) => s.executionLog);
  const setAppPhase        = useExecutionStore((s) => s.setAppPhase);
  const setScenario        = useExecutionStore((s) => s.setScenario);
  const startRun           = useExecutionStore((s) => s.startRun);

  // View mode: 'grid' = ReactFlow, 'orbit' = RadialOrbitalTimeline
  const [viewMode, setViewMode] = useState<'grid' | 'orbit'>('grid');

  useKeyboardShortcuts();

  // Guard: no runId → /configure
  useEffect(() => {
    if (!runId) router.replace('/configure');
  }, [runId, router]);

  // HITL pause → /review
  useEffect(() => {
    if (isPaused) { setAppPhase('review'); router.push('/review'); }
  }, [isPaused, router, setAppPhase]);

  // Complete → /report
  useEffect(() => {
    if (isComplete) { setAppPhase('complete'); router.push('/report'); }
  }, [isComplete, router, setAppPhase]);

  // Inline switchScenario (no duplicate SSE — layout handles it)
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

  // Build RadialOrbitalTimeline data from store
  const timelineData = nodes.map((node, i) => {
    const meta = NODE_REGISTRY[node.id];
    const execState = nodeExecutionStates[node.id] ?? 'idle';
    // Get last log entry for this node
    const lastLog = [...executionLog].reverse().find((e) => e.nodeId === node.id);
    return {
      id: i + 1,
      title: meta?.label ?? node.id,
      date: lastLog?.timestamp ?? '',
      content: lastLog?.summary ?? meta?.description ?? '',
      category: meta?.badgeLabel ?? 'Agent',
      icon: Network,
      relatedIds: [],
      status: toTimelineStatus(execState),
      energy: execState === 'completed' ? 100 : execState === 'active' ? 50 : 0,
    };
  });

  const SPEED_OPTIONS = ['slow', 'normal', 'fast'] as const;
  const LEGEND_ITEMS = [
    { type: 'deterministic', label: 'Rules engine',   sub: 'Deterministic — no LLM' },
    { type: 'algorithmic',   label: 'ML scoring',     sub: 'Weighted algorithm' },
    { type: 'llm',           label: 'AI agent',       sub: 'LLM synthesis' },
    { type: 'hybrid',        label: 'Hybrid',         sub: 'Math + LLM narrative' },
    { type: 'orchestrator',  label: 'Orchestrator',   sub: 'Routing and control' },
    { type: 'human',         label: 'Human review',   sub: 'HITL gate — pauses execution' },
  ];

  return (
    <>
      <AppHeader
        centerContent={<ExecuteHeaderCenter />}
        rightContent={
          <>
            {/* Grid / Orbit toggle */}
            <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  height: 30, padding: '0 12px',
                  background: viewMode === 'grid' ? 'rgba(245,168,0,0.2)' : 'transparent',
                  color: viewMode === 'grid' ? '#F5A800' : 'rgba(255,255,255,0.5)',
                  border: 'none', borderRight: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <GitBranch size={11} /> GRID
              </button>
              <button
                type="button"
                onClick={() => setViewMode('orbit')}
                style={{
                  height: 30, padding: '0 12px',
                  background: viewMode === 'orbit' ? 'rgba(245,168,0,0.2)' : 'transparent',
                  color: viewMode === 'orbit' ? '#F5A800' : 'rgba(255,255,255,0.5)',
                  border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <Network size={11} /> ORBIT
              </button>
            </div>
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
          {/* Three-panel */}
          <div style={{ position: 'fixed', top: 64, bottom: 120, left: 0, right: 0, display: 'grid', gridTemplateColumns: '300px 1fr 380px' }}>

            {/* LEFT SIDEBAR */}
            <div style={{ background: '#FFFFFF', borderRight: '1px solid #BDBDBD', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Scenarios mini */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #BDBDBD', flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828282', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                  Scenarios
                </div>
                {SCENARIOS.map((scenario) => {
                  const isActive = scenario.id === selectedScenarioId;
                  return (
                    <div
                      key={scenario.id}
                      onClick={() => switchScenario(scenario.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 10px', borderRadius: 6,
                        border: `1.5px solid ${isActive ? '#F5A800' : '#BDBDBD'}`,
                        background: isActive ? '#FFFBF0' : 'transparent',
                        marginBottom: 5, cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 10, color: '#828282', fontFamily: 'var(--font-mono)' }}>{scenario.meetingType ?? 'Full board'}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#011E41' }}>{scenario.label}</div>
                      </div>
                      <div style={{ fontSize: 10, color: '#828282', fontFamily: 'var(--font-mono)' }}>{scenario.expectedNodes?.length ?? 8} nodes</div>
                    </div>
                  );
                })}
              </div>

              {/* Speed */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #BDBDBD', flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828282', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                  Execution speed
                </div>
                <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                  {SPEED_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      style={{
                        flex: 1, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)',
                        border: `1.5px solid ${speed === s ? '#011E41' : '#BDBDBD'}`,
                        borderRadius: 4, cursor: 'pointer',
                        background: speed === s ? '#011E41' : 'transparent',
                        color: speed === s ? 'white' : '#828282',
                        textTransform: 'uppercase',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={resetAll}
                  style={{
                    width: '100%', height: 32, border: '1.5px solid #BDBDBD',
                    borderRadius: 4, background: 'transparent',
                    fontFamily: 'var(--font-body)', fontSize: 12,
                    color: '#828282', cursor: 'pointer',
                    textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700,
                  }}
                >
                  ↺ Reset
                </button>
              </div>

              {/* Node legend */}
              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828282', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                  Node types
                </div>
                {LEGEND_ITEMS.map((item) => (
                  <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, borderLeft: `3px solid ${NODE_COLORS[item.type]}`, background: NODE_BG[item.type], flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, color: '#4F4F4F' }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: '#828282', fontFamily: 'var(--font-mono)' }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER: Graph or Orbit */}
            <div style={{ background: '#011E41', position: 'relative', overflow: 'hidden' }}>
              {viewMode === 'grid' ? (
                <GraphCanvas />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {timelineData.length > 0 ? (
                    <RadialOrbitalTimeline timelineData={timelineData} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                      <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>Waiting for graph construction…</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: State panel */}
            <div style={{ background: '#FFFFFF', borderLeft: '1px solid #BDBDBD', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <StatePanel />
            </div>
          </div>

          {/* FOOTER: Interactive logs table */}
          <div
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, height: 120,
              background: '#FFFFFF', borderTop: '1.5px solid #BDBDBD',
              display: 'flex', alignItems: 'stretch', zIndex: 50,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: 80, background: '#011E41',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 8px', flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)',
                  writingMode: 'vertical-rl', textOrientation: 'mixed',
                  transform: 'rotate(180deg)',
                }}
              >
                Agent log
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', fontSize: 11 }}>
              <InteractiveLogsTable />
            </div>
          </div>
        </>
      )}
    </>
  );
}
