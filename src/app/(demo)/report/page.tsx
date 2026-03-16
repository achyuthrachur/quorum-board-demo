'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { useExecutionStore } from '@/store/executionStore';
import type { ReportSection } from '@/types/state';

// ─── Node type colors ─────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

const RAG_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  red:   { bg: '#FDEEF3', text: '#992A5C', label: 'RED' },
  amber: { bg: '#FFF5D6', text: '#D7761D', label: 'AMBER' },
  green: { bg: '#E1F5EE', text: '#0C7876', label: 'GREEN' },
};

// ─── Static fallback sections (shown when LLM compilation unavailable) ────────

const FALLBACK_SECTIONS: ReportSection[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    ragStatus: 'amber',
    content: `Meridian Community Bank closed Q4 2024 with solid core earnings and capital ratios well above regulatory minimums, offset by two areas that require Board attention.

Net interest margin compressed to 3.21%, a decline of 23 basis points from Q3 and 19 basis points below budget. The commercial real estate portfolio's concentration ratio has breached the internal policy limit of 30%, reaching 34% of total loans.

On the regulatory front, one of the two open MRAs from the October OCC examination has passed its remediation deadline. Capital and liquidity positions remain sound and above well-capitalised thresholds across all metrics.`,
  },
  {
    id: 'financial_performance',
    title: 'Financial Performance',
    ragStatus: 'amber',
    content: `Net interest margin declined to 3.21% in Q4 2024, representing a compression of 23 basis points from Q3 2024 and 19 basis points below the annual budget target of 3.40%. This marks the fourth consecutive quarter of NIM contraction, driven by elevated deposit repricing costs and competitive pressure on loan yields.

Return on assets was 0.94%, marginally below the peer median of 1.02%. Return on equity declined to 9.8% from 10.5% in Q3. Efficiency ratio increased to 61.4%, reflecting higher operating costs without commensurate revenue growth.`,
  },
  {
    id: 'capital_and_liquidity',
    title: 'Capital and Liquidity',
    ragStatus: 'green',
    content: `All capital ratios remain above well-capitalised thresholds. CET1 ratio stands at 12.4% against a regulatory minimum of 4.5% and well-capitalised threshold of 6.5%. Tier 1 capital ratio is 13.1%. Total capital ratio is 14.8%.

Liquidity coverage ratio is 128%, above the 100% regulatory minimum. Net stable funding ratio is 112%. The bank's liquidity position is adequate and no near-term funding concerns have been identified.`,
  },
  {
    id: 'credit_quality',
    title: 'Credit Quality',
    ragStatus: 'red',
    content: `Non-performing loan ratio increased to 1.84% in Q4 2024, up from 1.41% in Q3, and now exceeds the peer median of 1.20%. The increase is driven primarily by two large commercial real estate credits placed on non-accrual status during the quarter.

Commercial real estate concentration reached 34% of total loans, breaching the internal policy limit of 30%. Management is reviewing the concentration policy and expects to present a remediation plan at the next Board meeting. Provision coverage ratio is 68%, below the peer median of 82%.`,
  },
  {
    id: 'regulatory_status',
    title: 'Regulatory Status',
    ragStatus: 'red',
    content: `Two Matters Requiring Attention (MRAs) from the October 2024 OCC examination remain open. The first MRA, related to BSA/AML transaction monitoring controls, has passed its December 31, 2024 remediation deadline without resolution. Management has requested a 60-day extension, which is pending OCC approval.

The second MRA, related to interest rate risk model validation, is on track for its March 31, 2025 deadline. No new supervisory actions have been received. The next scheduled examination is Q3 2025.`,
  },
  {
    id: 'operational_risk',
    title: 'Operational Risk',
    ragStatus: 'amber',
    content: `A third-party vendor data breach in November 2024 exposed limited customer data (names and partial account numbers) for approximately 1,200 customers. All affected customers have been notified. Regulatory notifications to the OCC and state banking regulator were completed within required timeframes.

Remediation is in progress. Enhanced vendor due diligence procedures are being implemented. No fraudulent activity has been detected. This incident is considered board-reportable under the bank's operational risk framework.`,
  },
  {
    id: 'trend_analysis',
    title: 'Trend Analysis',
    ragStatus: 'amber',
    content: `NIM has declined in each of the last four quarters, from 3.58% in Q4 2023 to 3.21% in Q4 2024. This 37 basis point compression over four quarters suggests structural rather than cyclical pressure. Management should evaluate deposit pricing strategy and loan portfolio mix.

NPL ratio has increased from 0.98% in Q4 2023 to 1.84% in Q4 2024, a deterioration of 86 basis points. The CRE concentration trend warrants close monitoring given the current commercial real estate market environment.`,
  },
];

// ─── Section renderer ─────────────────────────────────────────────────────────

function SectionView({ section, index }: { section: ReportSection; index: number }) {
  const rag = section.ragStatus ? RAG_COLORS[section.ragStatus] : null;

  return (
    <div id={`section-${section.id}`} style={{ marginBottom: 40 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #E0E0E0', paddingBottom: 10, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#828282', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', minWidth: 24 }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#011E41', margin: 0, letterSpacing: '-0.01em' }}>
            {section.title}
          </h2>
        </div>
        {rag && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', padding: '3px 10px', borderRadius: 3, background: rag.bg, color: rag.text, flexShrink: 0 }}>
            {rag.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ fontSize: 14, lineHeight: 1.75, color: '#4F4F4F' }}>
        {section.content.split('\n\n').map((para, i) => (
          <p key={i} style={{ marginBottom: 14, margin: '0 0 14px 0' }}>{para}</p>
        ))}
      </div>

      {/* Metrics table if present */}
      {section.metrics && Object.keys(section.metrics).length > 0 && (
        <div style={{ marginTop: 16, borderTop: '1px solid #E0E0E0', paddingTop: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(section.metrics).map(([key, val]) => (
              <div key={key} style={{ background: '#F4F4F4', border: '1px solid #E0E0E0', borderRadius: 4, padding: '5px 10px' }}>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#828282', fontFamily: 'var(--font-mono)', marginRight: 6 }}>{key}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#011E41', fontFamily: 'var(--font-mono)' }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report page ──────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const reportMarkdown  = useExecutionStore((s) => s.reportMarkdown);
  const liveState       = useExecutionStore((s) => s.liveState);
  const executionLog    = useExecutionStore((s) => s.executionLog);
  const isComplete      = useExecutionStore((s) => s.isComplete);
  const hitlDecision    = useExecutionStore((s) => s.hitlDecision);
  const resetAll        = useExecutionStore((s) => s.resetAll);
  const nodes           = useExecutionStore((s) => s.nodes);

  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Guard: not complete and no log → back to configure
  useEffect(() => {
    if (!isComplete && executionLog.length === 0) {
      router.replace('/configure');
    }
  }, [isComplete, executionLog.length, router]);

  // Sections from live data, or fallback
  const reportDraft = liveState.reportDraft;
  const sections: ReportSection[] = (reportDraft?.sections && reportDraft.sections.length > 0)
    ? reportDraft.sections
    : FALLBACK_SECTIONS;
  const isLiveData = Boolean(reportDraft?.sections && reportDraft.sections.length > 0);

  const totalDuration = executionLog.reduce((sum, e) => sum + (e.durationMs ?? 0), 0);

  const scrollToSection = (index: number) => {
    setActiveSection(index);
    const id = sections[index]?.id;
    if (id && sectionRefs.current[id] && scrollRef.current) {
      const el = sectionRefs.current[id];
      const container = scrollRef.current;
      const offset = el!.offsetTop - 24;
      container.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  const handleCopy = () => {
    if (reportMarkdown) navigator.clipboard.writeText(reportMarkdown);
  };

  return (
    <>
      <AppHeader
        centerContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(5,171,140,0.15)', border: '1px solid rgba(5,171,140,0.3)', borderRadius: 100, padding: '4px 14px', fontSize: 12, color: '#05AB8C', fontFamily: 'var(--font-mono)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#05AB8C' }} />
              Package complete
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
              {nodes.length > 0 ? `${nodes.length} nodes` : ''}{totalDuration > 0 ? ` · ${(totalDuration / 1000).toFixed(1)}s` : ''}
            </span>
            {!isLiveData && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 3, background: 'rgba(245,168,0,0.15)', color: '#F5A800', border: '1px solid rgba(245,168,0,0.3)' }}>
                Demo content
              </span>
            )}
            {hitlDecision && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 3,
                fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: hitlDecision === 'approved' ? 'rgba(5,171,140,0.2)' : 'rgba(229,55,107,0.2)',
                color: hitlDecision === 'approved' ? '#05AB8C' : '#E5376B',
                border: `1px solid ${hitlDecision === 'approved' ? 'rgba(5,171,140,0.3)' : 'rgba(229,55,107,0.3)'}`,
              }}>
                {hitlDecision === 'approved' ? 'CFO approved' : 'Escalated'}
              </span>
            )}
          </div>
        }
        rightContent={
          <>
            <button
              type="button"
              style={{
                height: 34, padding: '0 16px', background: '#F5A800',
                border: 'none', borderRadius: 4, color: '#011E41',
                fontFamily: 'var(--font-body)', fontWeight: 700,
                fontSize: 12, letterSpacing: '0.04em',
                textTransform: 'uppercase', cursor: 'pointer',
                opacity: reportMarkdown ? 1 : 0.4,
              }}
            >
              ↓ Download DOCX
            </button>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                height: 34, padding: '0 14px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4,
                color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)',
                fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer',
                opacity: reportMarkdown ? 1 : 0.4,
              }}
            >
              Copy markdown
            </button>
            <button
              type="button"
              onClick={() => { resetAll(); router.push('/configure'); }}
              style={{
                height: 34, padding: '0 14px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
                color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)',
                fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer',
              }}
            >
              New package
            </button>
          </>
        }
      />

      <div style={{ position: 'fixed', top: 64, bottom: 0, left: 0, right: 0, display: 'grid', gridTemplateColumns: '240px 1fr 300px' }}>

        {/* LEFT: TOC */}
        <div style={{ background: '#FFFFFF', borderRight: '1px solid #BDBDBD', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #BDBDBD', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828282', fontFamily: 'var(--font-mono)' }}>
              Package contents · {sections.length} sections
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {sections.map((section, i) => {
              const rag = section.ragStatus ? RAG_COLORS[section.ragStatus] : null;
              return (
                <div
                  key={section.id}
                  onClick={() => scrollToSection(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px', cursor: 'pointer',
                    borderLeft: `3px solid ${i === activeSection ? '#F5A800' : 'transparent'}`,
                    background: i === activeSection ? '#FFFBF0' : 'transparent',
                  }}
                >
                  <span style={{ fontSize: 9, color: '#BDBDBD', fontFamily: 'var(--font-mono)', minWidth: 18 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 12, color: i === activeSection ? '#011E41' : '#4F4F4F', flex: 1, fontWeight: i === activeSection ? 700 : 400, lineHeight: 1.3 }}>
                    {section.title}
                  </span>
                  {rag && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: rag.text, flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Agent run times */}
          {executionLog.filter((e) => e.durationMs !== undefined).length > 0 && (
            <div style={{ borderTop: '1px solid #BDBDBD', padding: '12px 16px', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828282', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                Agent run times
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {executionLog.filter((e) => e.durationMs !== undefined).map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#4F4F4F', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 6 }}>{entry.label}</span>
                    <span style={{ fontSize: 10, color: '#828282', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{entry.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Report document */}
        <div ref={scrollRef} style={{ background: '#F4F4F4', overflowY: 'auto', padding: '32px 40px 60px' }}>
          <div
            style={{
              maxWidth: 700, margin: '0 auto',
              background: '#FFFFFF', border: '1px solid #BDBDBD',
              borderRadius: 8, padding: '44px 52px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderTop: '3px solid #011E41',
            }}
          >
            {/* Report header */}
            <div style={{ borderBottom: '2px solid #011E41', paddingBottom: 20, marginBottom: 36, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D7761D', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                  {reportDraft?.metadata?.institutionName ?? 'Meridian Community Bank'}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#011E41', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                  {reportDraft?.metadata?.meetingType ?? 'Board of Directors'}<br />
                  {reportDraft?.metadata?.meetingDate ?? 'Q4 2024 Package'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#828282', marginBottom: 3 }}>
                  {reportDraft?.metadata?.generatedAt
                    ? new Date(reportDraft.metadata.generatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : 'January 2025'}
                </div>
                <div style={{ fontSize: 11, color: '#828282', fontFamily: 'var(--font-mono)' }}>Prepared by Sentinel · Crowe AI</div>
                <div style={{ display: 'inline-block', background: '#E0E0E0', padding: '2px 8px', borderRadius: 3, fontSize: 9, fontWeight: 700, color: '#828282', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 6 }}>
                  Confidential
                </div>
              </div>
            </div>

            {/* All sections */}
            {sections.map((section, i) => (
              <div
                key={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el; }}
              >
                <SectionView section={section} index={i} />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Agent execution trace */}
        <div style={{ background: '#FFFFFF', borderLeft: '1px solid #BDBDBD', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #BDBDBD', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828282', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
              Agent execution trace
            </div>
            <div style={{ fontSize: 12, color: '#828282' }}>How this package was assembled</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {executionLog.length === 0 ? (
              <div style={{ padding: '24px 16px', fontSize: 12, color: '#828282', textAlign: 'center', lineHeight: 1.6 }}>
                No execution log available.<br />Run a scenario to see agent traces here.
              </div>
            ) : executionLog.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 10,
                  padding: '10px 14px',
                  borderBottom: '1px solid #E0E0E0',
                  alignItems: 'flex-start',
                  background: entry.nodeType === 'human' ? '#FFF5F7' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, paddingTop: 3, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 9, height: 9, borderRadius: '50%',
                      background: NODE_COLORS[entry.nodeType] ?? '#BDBDBD',
                      flexShrink: 0,
                    }}
                  />
                  {i < executionLog.length - 1 && (
                    <div style={{ width: 1, flex: 1, minHeight: 14, background: '#E0E0E0', margin: '3px 0' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: entry.nodeType === 'human' ? '#992A5C' : '#011E41', marginBottom: 2 }}>
                    {entry.label}
                  </div>
                  <div style={{ fontSize: 10, color: entry.nodeType === 'human' ? '#E5376B' : '#828282', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>
                    {entry.nodeType}{entry.durationMs !== undefined ? ` · ${entry.durationMs}ms` : ''}
                  </div>
                  {entry.summary && (
                    <div style={{ fontSize: 11, color: entry.nodeType === 'human' ? '#992A5C' : '#4F4F4F', lineHeight: 1.45 }}>
                      {entry.summary}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
