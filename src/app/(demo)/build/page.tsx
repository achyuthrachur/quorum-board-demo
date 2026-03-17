'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Network, Settings2, BarChart3, Sparkles, Layers, UserCheck } from 'lucide-react';
import Image from 'next/image';
import { AppHeader } from '@/components/layout/AppHeader';
import { OrbitingSkills } from '@/components/ui/orbiting-skills';
import { useExecutionStore } from '@/store/executionStore';
import { SCENARIOS } from '@/data/scenarios';

const INNER_ITEMS = [
  { icon: <Settings2 size={16} />, label: 'Financial', color: '#0075C9' },
  { icon: <Settings2 size={16} />, label: 'Capital', color: '#0075C9' },
  { icon: <BarChart3 size={16} />, label: 'Credit', color: '#05AB8C' },
];

const OUTER_ITEMS = [
  { icon: <Sparkles size={16} />, label: 'Regulatory', color: '#F5A800' },
  { icon: <Sparkles size={16} />, label: 'Operational', color: '#F5A800' },
  { icon: <Layers size={16} />, label: 'Trend', color: '#54C0E8' },
  { icon: <Network size={16} />, label: 'Supervisor', color: '#B14FC5' },
  { icon: <UserCheck size={16} />, label: 'HITL', color: '#E5376B' },
];

export default function BuildPage() {
  const router = useRouter();
  const runId              = useExecutionStore((s) => s.runId);
  const nodes              = useExecutionStore((s) => s.nodes);
  const selectedScenarioId = useExecutionStore((s) => s.selectedScenarioId);
  const setAppPhase        = useExecutionStore((s) => s.setAppPhase);

  const [graphReady, setGraphReady] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const autoAdvanced = useRef(false);

  // Mount: set phase
  useEffect(() => {
    setAppPhase('build');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard: no runId → back to configure
  useEffect(() => {
    if (!runId) {
      router.replace('/configure');
    }
  }, [runId, router]);

  // Show announcement text after 1s
  useEffect(() => {
    const t = setTimeout(() => setShowAnnouncement(true), 1000);
    return () => clearTimeout(t);
  }, []);

  // Detect graph_constructed event (nodes populated in store)
  useEffect(() => {
    if (nodes.length > 0 && !graphReady) {
      setGraphReady(true);
    }
  }, [nodes.length, graphReady]);

  // Auto-advance countdown once graph is ready
  useEffect(() => {
    if (!graphReady || autoAdvanced.current) return;

    if (countdown <= 0) {
      autoAdvanced.current = true;
      setAppPhase('execute');
      router.push('/execute');
      return;
    }

    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [graphReady, countdown, router, setAppPhase]);

  const scenario = SCENARIOS.find((s) => s.id === selectedScenarioId);
  const nodeCount = nodes.length > 0 ? nodes.length : (scenario?.expectedNodes?.length ?? 8);

  const handleBeginNow = () => {
    autoAdvanced.current = true;
    setAppPhase('execute');
    router.push('/execute');
  };

  return (
    <div style={{ background: '#011E41', minHeight: '100vh' }}>
      <AppHeader />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          paddingTop: 64,
          gap: 48,
        }}
      >
        {/* Orbiting animation */}
        <OrbitingSkills
          innerItems={INNER_ITEMS}
          outerItems={OUTER_ITEMS}
          center={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Try to use logo, fall back to Network icon */}
              <Network size={28} color="#F5A800" />
            </div>
          }
          innerGlow="#0075C9"
          outerGlow="#B14FC5"
        />

        {/* Announcement text */}
        <div
          style={{
            textAlign: 'center',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            opacity: showAnnouncement ? 1 : 0,
            transform: showAnnouncement ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          {graphReady ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#05AB8C', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                Graph ready — {nodeCount} nodes
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Investigation graph assembled
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
                {scenario?.label ?? 'Falcon Board'} · {nodeCount} agents · ready to execute
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleBeginNow}
                  style={{
                    height: 48, padding: '0 32px',
                    background: '#F5A800', color: '#011E41',
                    fontFamily: 'var(--font-body)', fontWeight: 700,
                    fontSize: 13, letterSpacing: '0.06em',
                    textTransform: 'uppercase', border: 'none',
                    borderRadius: 4, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  Begin analysis
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>→</span>
                </button>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                  Auto-advancing in {countdown}s
                </span>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F5A800', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                Building investigation graph
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Assembling {nodeCount}-node investigation graph
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
                Meta-agent is selecting and configuring the right specialists for {scenario?.label ?? 'your meeting'}
              </p>
              {/* Skip button — always visible */}
              <button
                type="button"
                onClick={handleBeginNow}
                style={{
                  height: 38, padding: '0 20px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 4, cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  letterSpacing: '0.06em',
                }}
              >
                Skip → go to execute
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
