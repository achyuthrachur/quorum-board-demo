'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { SCENARIOS } from '@/data/scenarios';
import { useExecutionStore } from '@/store/executionStore';
import { ActionSearchBar } from '@/components/ui/action-search-bar';

// ─── Node type colors ─────────────────────────────────────────────────────────

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

const NODE_TEXT: Record<string, string> = {
  deterministic: '#0050AD',
  algorithmic:   '#0C7876',
  hybrid:        '#007DA3',
  llm:           '#D7761D',
  orchestrator:  '#612080',
  human:         '#992A5C',
};

// ─── Static chat messages ─────────────────────────────────────────────────────

const STATIC_CHAT: Array<{ role: 'sentinel' | 'user'; text: string }> = [
  {
    role: 'sentinel',
    text: 'Hello. Tell me about your meeting — the type, any specific areas of focus, or anything unusual this quarter that should be in scope.',
  },
  {
    role: 'user',
    text: 'Full board meeting next week. We had an OCC exam last quarter, two open MRAs — one is past due. CRE concentration is above limit. CFO needs to review before anything goes out.',
  },
  {
    role: 'sentinel',
    text: 'Understood. Given the overdue MRA and CRE concentration breach, I am activating the full 8-node graph including Regulatory digest and Trend analyzer. The CFO review gate is enabled — execution will pause for approval before final compilation.',
  },
  {
    role: 'user',
    text: 'Also include the vendor data breach from November — contained but board-reportable.',
  },
  {
    role: 'sentinel',
    text: 'Added. The Operational risk agent will process the vendor incident and surface it as a board-reportable item. Graph is configured — ready when you are.',
  },
];

// ─── Node pills ───────────────────────────────────────────────────────────────

function NodePill({ type, label }: { type: string; label: string }) {
  return (
    <span
      style={{
        height: 22, padding: '0 8px', borderRadius: 3,
        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
        fontFamily: 'var(--font-mono)',
        display: 'inline-flex', alignItems: 'center',
        whiteSpace: 'nowrap',
        background: NODE_BG[type] ?? '#E0E0E0',
        color: NODE_TEXT[type] ?? '#333333',
      }}
    >
      {label}
    </span>
  );
}

// ─── Scenario metadata ────────────────────────────────────────────────────────

const SCENARIO_NODE_STRIPS: Record<string, Array<{ type: string; label: string }>> = {
  'falcon-board': [
    { type: 'orchestrator', label: 'META' },
    { type: 'deterministic', label: 'FIN' },
    { type: 'deterministic', label: 'CAP' },
    { type: 'algorithmic', label: 'CRD' },
    { type: 'llm', label: 'REG' },
    { type: 'human', label: 'HITL' },
  ],
  'audit-committee': [
    { type: 'orchestrator', label: 'META' },
    { type: 'llm', label: 'REG' },
    { type: 'llm', label: 'OPS' },
    { type: 'orchestrator', label: 'SUP' },
    { type: 'llm', label: 'RPT' },
  ],
  'risk-flash': [
    { type: 'orchestrator', label: 'META' },
    { type: 'deterministic', label: 'CAP' },
    { type: 'algorithmic', label: 'CRD' },
    { type: 'llm', label: 'RPT' },
  ],
};

const SCENARIO_BADGES: Record<string, { agents: string; hitl?: string; fast?: string }> = {
  'falcon-board':    { agents: '8 agents', hitl: 'HITL gate' },
  'audit-committee': { agents: '5 agents' },
  'risk-flash':      { agents: '3 agents', fast: 'No HITL' },
};

const SCENARIO_META: Record<string, { type: string; title: string; desc: string }> = {
  'falcon-board': {
    type: 'Full Board of Directors',
    title: 'Quarterly board package',
    desc: 'Financial performance, capital and liquidity, credit quality, regulatory status and operational risk — with CFO review gate before compilation.',
  },
  'audit-committee': {
    type: 'Audit Committee',
    title: 'Mid-cycle brief',
    desc: 'Regulatory posture, open MRAs, internal audit coverage and operational risk findings. No financial deep-dive.',
  },
  'risk-flash': {
    type: 'Risk Committee',
    title: 'Monthly flash report',
    desc: 'Capital and credit metrics only. If all thresholds are green, the supervisor compiles directly — no LLM agents, no human review.',
  },
};

// ─── Configure page ───────────────────────────────────────────────────────────

interface AnalyzeResponse {
  run_id: string;
  graph_topology: unknown;
  node_count: number;
  meta_rationale: string;
}

export default function ConfigurePage() {
  const router = useRouter();
  const setScenario   = useExecutionStore((s) => s.setScenario);
  const startRun      = useExecutionStore((s) => s.startRun);
  const resetAll      = useExecutionStore((s) => s.resetAll);
  const setAppPhase   = useExecutionStore((s) => s.setAppPhase);

  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0]?.id ?? 'falcon-board');
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const SEARCH_ACTIONS = SCENARIOS.map((s) => ({
    id: s.id,
    label: SCENARIO_META[s.id]?.title ?? s.label,
    description: SCENARIO_META[s.id]?.type,
  }));

  const handleBuild = async () => {
    if (isBuilding) return;
    setIsBuilding(true);
    setError(null);

    try {
      resetAll();
      setScenario(selectedId);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: selectedId }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as AnalyzeResponse;
      startRun(data.run_id);
      setAppPhase('build');
      router.push('/build');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start analysis');
      setIsBuilding(false);
    }
  };

  const selectedScenario = SCENARIOS.find((sc) => sc.id === selectedId) ?? SCENARIOS[0];

  return (
    <>
      <AppHeader
        centerContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[
              { num: '1', label: 'Configure package', key: 'configure' },
              { num: '2', label: 'Build graph', key: 'build' },
              { num: '3', label: 'Execute', key: 'execute' },
              { num: '4', label: 'Review & export', key: 'review' },
            ].map((step, i, arr) => (
              <span key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: step.key === 'configure' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)' }}>
                  <span
                    style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: `1px solid ${step.key === 'configure' ? '#F5A800' : 'rgba(255,255,255,0.2)'}`,
                      background: step.key === 'configure' ? '#F5A800' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontFamily: 'var(--font-mono)',
                      color: step.key === 'configure' ? '#011E41' : 'inherit',
                      fontWeight: step.key === 'configure' ? 700 : 400,
                    }}
                  >
                    {step.num}
                  </span>
                  {step.label}
                </span>
                {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>›</span>}
              </span>
            ))}
          </div>
        }
      />

      <div style={{ position: 'fixed', top: 64, bottom: 0, left: 0, right: 0, display: 'grid', gridTemplateColumns: '1fr 420px' }}>

        {/* LEFT: Selection panel */}
        <div
          style={{
            background: '#FFFFFF',
            borderRight: '1px solid #BDBDBD',
            overflowY: 'auto',
            padding: '40px 48px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <ActionSearchBar
              actions={SEARCH_ACTIONS}
              onSelect={(id) => setSelectedId(id)}
              placeholder="Search scenarios — Falcon Board, Audit Committee, Risk Flash..."
            />
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D7761D', marginBottom: 10 }}>
            Step 1 — Meeting type
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#011E41', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.15 }}>
            What kind of package<br />do you need?
          </h1>
          <p style={{ fontSize: 14, color: '#4F4F4F', lineHeight: 1.6, marginBottom: 32, maxWidth: 520 }}>
            Select a meeting type and Sentinel will assemble the right set of agents — or describe your context in the chat and let the system decide.
          </p>

          {/* Meeting cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
            {SCENARIOS.map((scenario) => {
              const isSelected = scenario.id === selectedId;
              const meta = SCENARIO_META[scenario.id] ?? { type: scenario.id, title: scenario.id, desc: '' };
              const nodes = SCENARIO_NODE_STRIPS[scenario.id] ?? [];
              const badges = SCENARIO_BADGES[scenario.id] ?? { agents: '' };

              return (
                <div
                  key={scenario.id}
                  onClick={() => setSelectedId(scenario.id)}
                  style={{
                    background: isSelected ? '#FFFBF0' : '#FFFFFF',
                    border: isSelected ? '1.5px solid #F5A800' : '1.5px solid #BDBDBD',
                    borderLeft: isSelected ? '4px solid #F5A800' : '1.5px solid #BDBDBD',
                    borderRadius: 8,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 16,
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D7761D', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
                      {meta.type}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#011E41', marginBottom: 5 }}>
                      {meta.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#4F4F4F', lineHeight: 1.5, marginBottom: 14 }}>
                      {meta.desc}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      {nodes.map((n, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <NodePill type={n.type} label={n.label} />
                          {i < nodes.length - 1 && <span style={{ color: '#828282', fontSize: 10 }}>›</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, paddingTop: 2 }}>
                    <span style={{ background: '#E0E0E0', color: '#4F4F4F', padding: '3px 10px', borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {badges.agents}
                    </span>
                    {badges.hitl && (
                      <span style={{ background: '#FDEEF3', color: '#992A5C', padding: '3px 10px', borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        {badges.hitl}
                      </span>
                    )}
                    {badges.fast && (
                      <span style={{ background: '#E1F5EE', color: '#0C7876', padding: '3px 10px', borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        {badges.fast}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{ flex: 1, height: 1, background: '#BDBDBD' }} />
            <span style={{ fontSize: 12, color: '#828282', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
              or describe what you need in the chat →
            </span>
            <div style={{ flex: 1, height: 1, background: '#BDBDBD' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FDEEF3', border: '1px solid #E5376B', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#992A5C' }}>
              {error}
            </div>
          )}

          {/* Build button */}
          <button
            type="button"
            onClick={handleBuild}
            disabled={isBuilding}
            style={{
              width: '100%', height: 52,
              background: isBuilding ? '#828282' : '#F5A800', color: '#011E41',
              fontFamily: 'var(--font-body)', fontWeight: 700,
              fontSize: 14, letterSpacing: '0.06em',
              textTransform: 'uppercase', border: 'none',
              borderRadius: 4, cursor: isBuilding ? 'not-allowed' : 'pointer',
              marginTop: 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            {isBuilding ? 'Building graph...' : `Build agent graph — ${selectedScenario?.label ?? 'Falcon Board'}`}
            {!isBuilding && (
              <span
                style={{
                  width: 24, height: 24, background: '#011E41',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 12, color: '#F5A800',
                }}
              >
                →
              </span>
            )}
          </button>
        </div>

        {/* RIGHT: Chat panel */}
        <div style={{ background: '#F4F4F4', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{ background: '#FFFFFF', borderBottom: '1px solid #BDBDBD', padding: '16px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#011E41' }}>Sentinel agent</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#05AB8C', fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#05AB8C', display: 'inline-block' }} />
                Ready
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#828282', lineHeight: 1.5 }}>
              Describe your meeting context and I&apos;ll select the right agents for you.
            </p>
          </div>

          {/* Agent strip */}
          <div style={{ background: '#FFFFFF', borderBottom: '1px solid #BDBDBD', padding: '12px 20px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828282', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
              Active agents — {selectedScenario?.label ?? 'Falcon Board'} ({SCENARIO_NODE_STRIPS[selectedId]?.length ?? 8})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(SCENARIO_NODE_STRIPS[selectedId] ?? []).map((n, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    height: 24, padding: '0 9px', borderRadius: 3,
                    fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    background: NODE_BG[n.type] ?? '#E0E0E0',
                    color: NODE_TEXT[n.type] ?? '#333333',
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: NODE_COLORS[n.type] ?? '#BDBDBD', flexShrink: 0 }} />
                  {n.label}
                </span>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {STATIC_CHAT.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', gap: 8, flexDirection: isUser ? 'row-reverse' : 'row' }}>
                  <div
                    style={{
                      width: 26, height: 26, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                      border: '1.5px solid',
                      background: isUser ? '#FFF5D6' : '#F3E8FF',
                      borderColor: isUser ? '#F5A800' : '#B14FC5',
                      color: isUser ? '#D7761D' : '#612080',
                    }}
                  >
                    {isUser ? 'A' : 'S'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#828282', marginBottom: 4, fontFamily: 'var(--font-mono)', textAlign: isUser ? 'right' : 'left' }}>
                      {isUser ? 'You' : 'Sentinel'}
                    </div>
                    <div
                      style={{
                        fontSize: 13, lineHeight: 1.55, color: '#333333',
                        background: isUser ? '#EEF3FA' : '#FFFFFF',
                        border: `1px solid ${isUser ? '#BFCFE8' : '#BDBDBD'}`,
                        borderRadius: isUser ? '8px 0 8px 8px' : '0 8px 8px 8px',
                        padding: '10px 13px',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div style={{ background: '#FFFFFF', borderTop: '1px solid #BDBDBD', padding: '14px 20px 16px', flexShrink: 0 }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#F4F4F4', border: '1.5px solid #BDBDBD',
                borderRadius: 6, padding: '8px 12px',
              }}
            >
              <input
                type="text"
                placeholder="Describe your meeting context..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-body)', fontSize: 13, color: '#333333',
                }}
              />
              <button
                type="button"
                style={{
                  width: 28, height: 28, background: '#011E41',
                  border: 'none', borderRadius: 4, cursor: 'pointer',
                  color: 'white', fontSize: 13, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                ↑
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#828282', marginTop: 6, fontFamily: 'var(--font-mono)' }}>Press Enter to send</p>
          </div>
        </div>
      </div>
    </>
  );
}
