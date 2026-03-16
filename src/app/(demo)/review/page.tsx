'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { AppHeader } from '@/components/layout/AppHeader';
import { useExecutionStore } from '@/store/executionStore';

// ─── RAG status dot ───────────────────────────────────────────────────────────

const RAG_COLORS = { GREEN: '#05AB8C', AMBER: '#F5A800', RED: '#E5376B' };

function RagDot({ status }: { status: 'GREEN' | 'AMBER' | 'RED' }) {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: RAG_COLORS[status],
        flexShrink: 0,
        boxShadow: `0 0 6px ${RAG_COLORS[status]}60`,
      }}
    />
  );
}

// ─── Static findings (replaced with hitlDraftSections when available) ─────────

const STATIC_FINDINGS = [
  { agent: 'Financial performance', rag: 'AMBER' as const, finding: 'NIM compressed to 3.21% — 23 bps below Q3, 19 bps below budget' },
  { agent: 'Capital and liquidity', rag: 'GREEN' as const, finding: 'All ratios above well-capitalised thresholds — CET1 at 12.4%' },
  { agent: 'Credit quality',        rag: 'RED'   as const, finding: 'CRE concentration breach — 34% of total loans vs 30% policy limit' },
  { agent: 'Trend analyzer',        rag: 'AMBER' as const, finding: 'NIM declining 4 consecutive quarters — structural compression risk' },
  { agent: 'Regulatory digest',     rag: 'RED'   as const, finding: '1 overdue MRA from October OCC exam — remediation deadline passed' },
  { agent: 'Operational risk',      rag: 'AMBER' as const, finding: 'November vendor data breach — contained but board-reportable' },
];

// ─── Review page ──────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const router = useRouter();
  const runId              = useExecutionStore((s) => s.runId);
  const isPaused           = useExecutionStore((s) => s.isPaused);
  const hitlDraftSections  = useExecutionStore((s) => s.hitlDraftSections);
  const hitlSummary        = useExecutionStore((s) => s.hitlSummary);
  const submitHITLDecision = useExecutionStore((s) => s.submitHITLDecision);
  const setHitlDecision    = useExecutionStore((s) => s.setHitlDecision);
  const setAppPhase        = useExecutionStore((s) => s.setAppPhase);

  // Build findings list from live data when available, else fall back to static
  const findings = hitlDraftSections && hitlDraftSections.length > 0
    ? hitlDraftSections.map((s) => ({
        agent: s.title,
        rag: (s.ragStatus ?? 'AMBER') as 'GREEN' | 'AMBER' | 'RED',
        finding: s.content.split('\n')[0].slice(0, 160),
      }))
    : STATIC_FINDINGS;

  // Guard: no runId and not paused → back to configure
  useEffect(() => {
    if (!runId && !isPaused) {
      router.replace('/configure');
    }
  }, [runId, isPaused, router]);

  const handleApprove = async () => {
    if (!runId) return;
    try {
      await submitHITLDecision(runId, 'approved');
      setHitlDecision('approved');
      setAppPhase('complete');
      router.push('/report');
    } catch {
      setHitlDecision('approved');
      setAppPhase('complete');
      router.push('/report');
    }
  };

  const handleEscalate = async () => {
    if (!runId) return;
    try {
      await submitHITLDecision(runId, 'revised', 'Escalated to full board for review');
      setHitlDecision('escalated');
      setAppPhase('complete');
      router.push('/report');
    } catch {
      setHitlDecision('escalated');
      setAppPhase('complete');
      router.push('/report');
    }
  };

  return (
    <div style={{ background: '#F4F4F4', minHeight: '100vh' }}>
      <AppHeader
        centerContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(229,55,107,0.3)', borderRadius: 100, padding: '5px 16px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E5376B', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-mono)' }}>
              Execution paused — CFO review required
            </span>
          </div>
        }
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          paddingTop: 64,
          padding: '80px 24px',
        }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            background: '#FFFFFF',
            border: '1px solid #BDBDBD',
            borderRadius: 12,
            padding: '40px 48px',
            maxWidth: 720,
            width: '100%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            borderTop: '3px solid #E5376B',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#992A5C', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
              CFO review gate · HITL
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#011E41', letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.2 }}>
              Agent analysis complete —<br />review before compilation
            </h1>
            <p style={{ fontSize: 14, color: '#4F4F4F', lineHeight: 1.6 }}>
              All agents have completed their analysis. Review the findings summary below and approve to compile the final board package, or escalate for additional review.
            </p>
          </div>

          {/* Findings timeline */}
          <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828282', fontFamily: 'var(--font-mono)' }}>
                Agent findings summary
              </div>
              {hitlDraftSections && hitlDraftSections.length > 0 ? (
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 3, background: '#E1F5EE', color: '#0C7876' }}>
                  Live · {hitlDraftSections.length} sections
                </div>
              ) : (
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 3, background: '#F4F4F4', color: '#828282' }}>
                  Demo data
                </div>
              )}
            </div>
            {hitlSummary && hitlSummary.keyFlags.length > 0 && (
              <div style={{ background: '#FFF5D6', border: '1px solid #F5A800', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#011E41', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700, marginRight: 6 }}>Key flags:</span>
                {hitlSummary.keyFlags.join(' · ')}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {findings.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '12px 0',
                    borderBottom: i < findings.length - 1 ? '1px solid #F0F0F0' : 'none',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Timeline connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2, flexShrink: 0 }}>
                    <RagDot status={item.rag} />
                    {i < findings.length - 1 && (
                      <div style={{ width: 1, height: 28, background: '#E0E0E0', marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#011E41', marginBottom: 3 }}>
                      {item.agent}
                    </div>
                    <div style={{ fontSize: 12, color: '#4F4F4F', lineHeight: 1.5 }}>
                      {item.finding}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
                      padding: '3px 8px', borderRadius: 3, flexShrink: 0,
                      background: item.rag === 'GREEN' ? '#E1F5EE' : item.rag === 'RED' ? '#FDEEF3' : '#FFF5D6',
                      color: item.rag === 'GREEN' ? '#0C7876' : item.rag === 'RED' ? '#992A5C' : '#D7761D',
                    }}
                  >
                    {item.rag}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
            <button
              type="button"
              onClick={handleApprove}
              style={{
                width: '100%', height: 52,
                background: '#F5A800', color: '#011E41',
                fontFamily: 'var(--font-body)', fontWeight: 700,
                fontSize: 14, letterSpacing: '0.04em',
                textTransform: 'uppercase', border: 'none',
                borderRadius: 6, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              Approve — compile final package
              <span style={{ background: '#011E41', color: '#F5A800', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                →
              </span>
            </button>
            <button
              type="button"
              onClick={handleEscalate}
              style={{
                width: '100%', height: 44,
                background: 'transparent',
                border: '1.5px solid #BDBDBD', borderRadius: 6,
                color: '#4F4F4F', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontWeight: 600,
                fontSize: 13, letterSpacing: '0.02em',
              }}
            >
              Escalate to board — flag for additional review
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
