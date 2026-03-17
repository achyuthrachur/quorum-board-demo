'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScenarioTile } from '@/components/configure/ScenarioTile';
import { ScenarioPreviewGraph } from '@/components/configure/ScenarioPreviewGraph';
import { SentinelChat } from '@/components/configure/SentinelChat';
import { SCENARIOS } from '@/data/scenarios';
import { useExecutionStore } from '@/store/executionStore';

// ─── Scenario metadata for display ───────────────────────────────────────────

const SCENARIO_META: Record<string, { title: string }> = {
  'falcon-board':    { title: 'Quarterly board package' },
  'audit-committee': { title: 'Mid-cycle audit brief' },
  'risk-flash':      { title: 'Monthly flash report' },
};

interface AnalyzeResponse {
  run_id: string;
  graph_topology: unknown;
  node_count: number;
  meta_rationale: string;
}

export default function ConfigurePage() {
  const router    = useRouter();
  const setScenario = useExecutionStore((s) => s.setScenario);
  const startRun    = useExecutionStore((s) => s.startRun);
  const resetAll    = useExecutionStore((s) => s.resetAll);
  const setAppPhase = useExecutionStore((s) => s.setAppPhase);

  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0]?.id ?? 'falcon-board');
  const [showChat, setShowChat] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mount: ensure phase is correct
  useEffect(() => {
    setAppPhase('configure');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedScenario = SCENARIOS.find((sc) => sc.id === selectedId) ?? SCENARIOS[0];

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

  const handleSelectTile = (id: string) => {
    setSelectedId(id);
    setShowChat(false);
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppHeader />

      <div
        style={{
          position: 'fixed',
          top: 64,
          bottom: 0,
          left: 0,
          right: 0,
          display: 'grid',
          gridTemplateColumns: '380px 1fr',
        }}
      >
        {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
        <div
          style={{
            background: '#011E41',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            padding: '28px 24px 24px',
            overflowY: 'auto',
          }}
        >
          {/* Wordmark + heading */}
          <div style={{ marginBottom: 24, flexShrink: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: '#F5A800',
                marginBottom: 6,
              }}
            >
              SENTINEL
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: 10,
              }}
            >
              Step 1 — Configure your package
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              What kind of package<br />do you need?
            </h1>
          </div>

          {/* Scenario tiles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, flexShrink: 0 }}>
            {SCENARIOS.map((scenario) => (
              <ScenarioTile
                key={scenario.id}
                id={scenario.id}
                meetingType={scenario.meetingType}
                title={SCENARIO_META[scenario.id]?.title ?? scenario.label}
                agentCount={scenario.expectedNodes.length}
                hitlRequired={scenario.hitlRequired}
                isSelected={selectedId === scenario.id && !showChat}
                onClick={() => handleSelectTile(scenario.id)}
              />
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12, flexShrink: 0 }} />

          {/* Ask Sentinel tile */}
          <div
            onClick={() => setShowChat(!showChat)}
            style={{
              background: showChat ? 'rgba(177,79,197,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showChat ? 'rgba(177,79,197,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderLeft: `3px solid ${showChat ? '#B14FC5' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 6,
              padding: '12px 14px',
              cursor: 'pointer',
              flexShrink: 0,
              marginBottom: 12,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={14} color={showChat ? '#B14FC5' : 'rgba(255,255,255,0.4)'} />
              <span
                style={{
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  color: showChat ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                }}
              >
                Ask Sentinel
              </span>
            </div>
            {!showChat && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, marginLeft: 22, lineHeight: 1.4 }}>
                Describe your meeting and I&apos;ll configure the right agents
              </p>
            )}
          </div>

          {/* Chat panel — shown when Ask Sentinel is active */}
          {showChat && (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
              <SentinelChat
                currentScenarioId={selectedId}
                onScenarioRecommended={(id) => {
                  setSelectedId(id);
                  setShowChat(false);
                }}
              />
            </div>
          )}

          {/* Spacer when chat is not shown */}
          {!showChat && <div style={{ flex: 1 }} />}

          {/* Error */}
          {error && (
            <div
              style={{
                background: 'rgba(229,55,107,0.1)',
                border: '1px solid rgba(229,55,107,0.3)',
                borderRadius: 6,
                padding: '8px 12px',
                marginBottom: 12,
                fontSize: 12,
                color: '#E5376B',
                flexShrink: 0,
              }}
            >
              {error}
            </div>
          )}

          {/* Build button */}
          <button
            type="button"
            onClick={() => void handleBuild()}
            disabled={isBuilding}
            style={{
              width: '100%',
              height: 48,
              background: isBuilding ? 'rgba(245,168,0,0.4)' : '#F5A800',
              color: '#011E41',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.04em',
              border: 'none',
              borderRadius: 4,
              cursor: isBuilding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              flexShrink: 0,
            }}
          >
            {isBuilding && (
              <span
                style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(1,30,65,0.3)',
                  borderTop: '2px solid #011E41',
                  animation: 'spin 0.7s linear infinite',
                  flexShrink: 0,
                }}
              />
            )}
            {isBuilding ? 'Assembling graph…' : 'Build agent graph →'}
          </button>
          {!isBuilding && selectedScenario && (
            <div
              style={{
                textAlign: 'center',
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-mono)',
                marginTop: 6,
              }}
            >
              {selectedScenario.label} · {selectedScenario.expectedNodes.length} agents
              {selectedScenario.hitlRequired ? ' · HITL enabled' : ''}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
        <div style={{ background: '#011E41', position: 'relative', overflow: 'hidden' }}>
          {selectedScenario && (
            <ScenarioPreviewGraph scenario={selectedScenario} />
          )}
        </div>
      </div>
    </>
  );
}
