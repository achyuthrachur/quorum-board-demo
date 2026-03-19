'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { AppHeader } from '@/components/layout/AppHeader';
import { useExecutionStore } from '@/store/executionStore';
import {
  Timeline, TimelineItem, TimelineDot, TimelineLine,
  TimelineHeading, TimelineContent,
} from '@/components/ui/timeline';

// ─── RAG color helpers ────────────────────────────────────────────────────────

const RAG_DOT: Record<string, string> = { GREEN: '#05AB8C', AMBER: '#F5A800', RED: '#E5376B' };
const RAG_BADGE_BG: Record<string, string> = { GREEN: '#E1F5EE', AMBER: '#FFF5D6', RED: '#FDEEF3' };
const RAG_BADGE_COLOR: Record<string, string> = { GREEN: '#0C7876', AMBER: '#D7761D', RED: '#992A5C' };

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

  // Mount: set phase
  useEffect(() => {
    setAppPhase('review');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Don't set appPhase to 'complete' — report_compiler is still running.
      // Navigate to /execute which will auto-redirect to /report on execution_complete.
      setAppPhase('execute');
      router.push('/execute');
    } catch {
      // API failed but HITL might not resume — still go to report with fallback
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
      setAppPhase('execute');
      router.push('/execute');
    } catch {
      setHitlDecision('escalated');
      setAppPhase('complete');
      router.push('/report');
    }
  };

  return (
    <div style={{ background: '#F4F4F4', minHeight: '100vh' }}>
      <AppHeader />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          marginTop: 64,
          padding: '40px 24px',
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
            <Timeline positions="left">
              {findings.map((item, i) => (
                <TimelineItem key={i} status="done">
                  <TimelineDot
                    status="custom"
                    customIcon={
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: RAG_DOT[item.rag],
                        boxShadow: `0 0 4px ${RAG_DOT[item.rag]}60`,
                      }} />
                    }
                    className="border-transparent bg-transparent shadow-none"
                  />
                  {i < findings.length - 1 && <TimelineLine done />}
                  <TimelineHeading className="text-[13px] font-bold text-[#011E41]">
                    {item.agent}
                    <span style={{
                      marginLeft: 8, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
                      padding: '2px 7px', borderRadius: 3,
                      background: RAG_BADGE_BG[item.rag], color: RAG_BADGE_COLOR[item.rag],
                      verticalAlign: 'middle',
                    }}>{item.rag}</span>
                  </TimelineHeading>
                  <TimelineContent className="text-[12px] pb-3 text-[#4F4F4F] leading-relaxed">
                    {item.finding}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
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
