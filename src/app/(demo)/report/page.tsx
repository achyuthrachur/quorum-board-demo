'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { useExecutionStore } from '@/store/executionStore';

// ─── Node type colors ─────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

// ─── TOC items ────────────────────────────────────────────────────────────────

const TOC_ITEMS = [
  { color: '#B14FC5', label: 'Executive summary',  rag: null },
  { color: '#0075C9', label: 'Financial performance', rag: '#D7761D' },
  { color: '#0075C9', label: 'Capital and liquidity', rag: '#05AB8C' },
  { color: '#05AB8C', label: 'Credit quality',     rag: '#E5376B' },
  { color: '#F5A800', label: 'Regulatory status',  rag: '#E5376B' },
  { color: '#F5A800', label: 'Operational risk',   rag: '#D7761D' },
  { color: '#4F4F4F', label: 'Forward outlook',    rag: null },
];

// ─── Report page ──────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const reportMarkdown = useExecutionStore((s) => s.reportMarkdown);
  const executionLog   = useExecutionStore((s) => s.executionLog);
  const isComplete     = useExecutionStore((s) => s.isComplete);
  const hitlDecision   = useExecutionStore((s) => s.hitlDecision);
  const resetAll       = useExecutionStore((s) => s.resetAll);
  const nodes          = useExecutionStore((s) => s.nodes);

  const [activeSection, setActiveSection] = useState(0);

  // Guard: not complete and no log → back to configure
  useEffect(() => {
    if (!isComplete && executionLog.length === 0) {
      router.replace('/configure');
    }
  }, [isComplete, executionLog.length, router]);

  const totalDuration = executionLog.reduce((sum, e) => sum + (e.durationMs ?? 0), 0);

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
              {nodes.length > 0 ? `${nodes.length} nodes` : ''} {totalDuration > 0 ? `· ${(totalDuration / 1000).toFixed(1)}s` : ''}
            </span>
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
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              ↓ Download DOCX
            </button>
            <button
              type="button"
              style={{
                height: 34, padding: '0 14px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4,
                color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)',
                fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer',
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

      <div style={{ position: 'fixed', top: 64, bottom: 0, left: 0, right: 0, display: 'grid', gridTemplateColumns: '260px 1fr 320px' }}>

        {/* LEFT: TOC */}
        <div style={{ background: '#FFFFFF', borderRight: '1px solid #BDBDBD', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #BDBDBD', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828282', fontFamily: 'var(--font-mono)' }}>
              Package contents
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {TOC_ITEMS.map((item, i) => (
              <div
                key={i}
                onClick={() => setActiveSection(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 18px', cursor: 'pointer',
                  borderLeft: `3px solid ${i === activeSection ? '#F5A800' : 'transparent'}`,
                  background: i === activeSection ? '#FFFBF0' : 'transparent',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: i === activeSection ? '#011E41' : '#4F4F4F', flex: 1, fontWeight: i === activeSection ? 700 : 400 }}>
                  {item.label}
                </span>
                {item.rag && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.rag, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
          {/* Agent run times */}
          <div style={{ borderTop: '1px solid #BDBDBD', padding: '14px 18px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#828282', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
              Agent run times
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {executionLog.filter((e) => e.durationMs !== undefined).map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#4F4F4F' }}>{entry.label}</span>
                  <span style={{ fontSize: 10, color: '#828282', fontFamily: 'var(--font-mono)' }}>{entry.durationMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Report document */}
        <div style={{ background: '#F4F4F4', overflowY: 'auto', padding: '32px 48px 60px' }}>
          <div
            style={{
              maxWidth: 720, margin: '0 auto',
              background: '#FFFFFF', border: '1px solid #BDBDBD',
              borderRadius: 8, padding: '48px 56px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderTop: '3px solid #011E41',
            }}
          >
            {/* Report header */}
            <div style={{ borderBottom: '3px solid #011E41', paddingBottom: 24, marginBottom: 32, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D7761D', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                  Meridian Community Bank
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#011E41', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                  Board of Directors<br />Q4 2024 Package
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#828282', marginBottom: 4 }}>Board meeting — January 2025</div>
                <div style={{ fontSize: 12, color: '#828282', fontFamily: 'var(--font-mono)' }}>Prepared by Sentinel · Crowe AI</div>
                <div style={{ display: 'inline-block', background: '#E0E0E0', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, color: '#828282', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 6 }}>
                  Confidential
                </div>
              </div>
            </div>

            {/* Report content */}
            {reportMarkdown ? (
              <div style={{ fontSize: 14, lineHeight: 1.7, color: '#4F4F4F', whiteSpace: 'pre-wrap' }}>
                {reportMarkdown}
              </div>
            ) : (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid #E0E0E0', paddingBottom: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#828282', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>01</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#011E41', flex: 1 }}>Executive summary</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#4F4F4F', marginBottom: 12 }}>
                  Meridian Community Bank closed Q4 2024 with solid core earnings and capital ratios well above regulatory minimums, offset by two areas that require Board attention. Net interest margin compressed to 3.21%, a decline of 23 basis points from Q3 and 19 basis points below budget. The commercial real estate portfolio&apos;s concentration ratio has breached the internal policy limit of 30%, reaching 34% of total loans.
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#4F4F4F' }}>
                  On the regulatory front, one of the two open MRAs from the October OCC examination has passed its remediation deadline. Capital and liquidity positions remain sound and above well-capitalised thresholds across all metrics.
                </p>
              </div>
            )}
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
            {executionLog.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 10,
                  padding: '10px 16px',
                  borderBottom: '1px solid #E0E0E0',
                  alignItems: 'flex-start',
                  background: entry.nodeType === 'human' ? '#FFF5F7' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, paddingTop: 3, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: NODE_COLORS[entry.nodeType] ?? '#BDBDBD',
                      flexShrink: 0,
                    }}
                  />
                  {i < executionLog.length - 1 && (
                    <div style={{ width: 1, flex: 1, minHeight: 16, background: '#E0E0E0', margin: '3px 0' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: entry.nodeType === 'human' ? '#992A5C' : '#011E41', marginBottom: 2 }}>
                    {entry.label}
                  </div>
                  <div style={{ fontSize: 10, color: entry.nodeType === 'human' ? '#E5376B' : '#828282', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                    {entry.nodeType} · {entry.durationMs !== undefined ? `${entry.durationMs}ms` : 'running'}
                  </div>
                  <div style={{ fontSize: 11, color: entry.nodeType === 'human' ? '#992A5C' : '#4F4F4F', lineHeight: 1.45 }}>
                    {entry.summary}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
