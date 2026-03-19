'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { getAgentRawInput } from '@/data/agentRawInputData';
import { getAgentDisplayData, type AgentPanel, type TableRow, type MetricGauge, type SparkLine, type DecisionRow } from '@/data/agentDisplayData';
import { RawDataTableRenderer } from './RawDataTableRenderer';

// ─── Tab type ────────────────────────────────────────────────────────────────

type DataTab = 'raw' | 'processed';

// ─── Processing simulation steps per agent ───────────────────────────────────

type ProcessingPhase = 'idle' | 'running' | 'done';

const AGENT_PROCESSING_STEPS: Record<string, string[]> = {
  meta_agent: [
    'Analyzing meeting type and scope requirements…',
    'Selecting specialist agents for topology…',
    'Computing optimal execution order…',
    'Wiring agent connections and data flows…',
    'Graph topology assembled.',
  ],
  financial_aggregator: [
    'Loading raw financial data from scenario…',
    'Computing NIM variance against budget…',
    'Computing ROA and ROE variances…',
    'Evaluating non-interest income trends…',
    'Checking efficiency ratio against 60% ceiling…',
    'Classifying RAG status…',
  ],
  capital_monitor: [
    'Loading capital and liquidity data…',
    'Evaluating CET1 ratio against 4.5% minimum…',
    'Evaluating Tier 1 capital ratio…',
    'Checking LCR against 100% regulatory floor…',
    'Checking NSFR stable funding ratio…',
    'Classifying overall capital RAG status…',
  ],
  credit_quality: [
    'Loading credit portfolio data…',
    'Scoring NPL ratio against peer median…',
    'Evaluating provision coverage ratio…',
    'Scoring net charge-off ratio…',
    'Checking concentration limit breaches…',
    'Computing weighted credit score and RAG…',
  ],
  trend_analyzer: [
    'Loading 5-quarter rolling data…',
    'Computing NIM linear regression…',
    'Computing NPL ratio regression slope…',
    'Computing efficiency ratio regression…',
    'Flagging adverse trends above threshold…',
    'Generating narrative interpretation…',
  ],
  regulatory_digest: [
    'Loading open regulatory actions…',
    'Scanning due dates for overdue items…',
    'Cross-referencing examination schedule…',
    'Drafting regulatory narrative…',
    'Evaluating escalation conditions…',
    'Setting escalation flag if required…',
  ],
  operational_risk: [
    'Loading incident log from scenario…',
    'Classifying each event by severity…',
    'Identifying board-reportable incidents…',
    'Checking vendor breach notification thresholds…',
    'Aggregating risk themes across incidents…',
    'Drafting operational risk narrative…',
  ],
  supervisor: [
    'Collecting outputs from all specialist agents…',
    'Reading RAG statuses and flag counts…',
    'Evaluating escalation indicators…',
    'Scoring aggregate risk posture…',
    'Determining routing decision…',
  ],
  hitl_gate: [
    'Packaging agent findings for review…',
    'Summarizing all flags and escalations…',
    'Presenting decision options to reviewer…',
    'Awaiting human decision…',
  ],
  report_compiler: [
    'Collecting structured outputs from all agents…',
    'Drafting executive summary section…',
    'Compiling financial performance narrative…',
    'Compiling capital and liquidity section…',
    'Compiling credit quality section…',
    'Compiling regulatory and risk sections…',
    'Finalizing board package narrative…',
  ],
};

const STEP_INTERVAL_MS = 450;

/* ── Shared padding constant — one place, every element uses it ── */
const PAD = '12px 20px';

// ─── Processed output sub-renderers (light mode, full-width) ────────────────

function ProcessedTable({ headers, rows }: { headers: string[]; rows: TableRow[] }) {
  const HIGHLIGHT_BG: Record<string, string> = {
    red: '#FDEEF3', amber: '#FFF5D6', green: '#E1F5EE',
  };
  const HIGHLIGHT_COLOR: Record<string, string> = {
    red: '#992A5C', amber: '#D7761D', green: '#0C7876',
  };

  return (
    <div style={{ marginBottom: 32, borderRadius: 10, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-body)', tableLayout: 'auto' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: i === 0 || i === headers.length - 1 ? 'left' : 'right',
                  padding: PAD,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: '#011E41',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const bg = row.highlight && row.highlight !== 'none'
              ? HIGHLIGHT_BG[row.highlight] ?? '#FFFFFF'
              : i % 2 === 0 ? '#FFFFFF' : '#FAFAFA';
            const color = row.highlight && row.highlight !== 'none'
              ? HIGHLIGHT_COLOR[row.highlight] ?? '#333333'
              : '#333333';

            return (
              <tr key={i} style={{ background: bg }}>
                <td style={{ padding: PAD, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: row.bold ? 700 : 600, color, borderBottom: '1px solid #F4F4F4' }}>
                  {row.label}
                </td>
                {row.values.map((v, j) => (
                  <td key={j} style={{ padding: PAD, textAlign: j === row.values.length - 1 ? 'left' : 'right', fontFamily: 'var(--font-body)', fontSize: 13, color, fontWeight: row.bold ? 700 : 400, borderBottom: '1px solid #F4F4F4' }}>
                    {v}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProcessedGauges({ gauges }: { gauges: MetricGauge[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
      {gauges.map((g) => {
        const fill = g.status === 'green' ? '#05AB8C' : g.status === 'amber' ? '#F5A800' : '#E5376B';
        return (
          <div key={g.label} style={{ padding: '20px 24px', background: '#FAFAFA', borderRadius: 12, border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', color: '#011E41' }}>{g.label}</span>
              <span style={{ fontSize: 20, fontFamily: 'var(--font-body)', color: fill, fontWeight: 700 }}>{g.actualLabel}</span>
            </div>
            <div style={{ height: 6, background: '#E0E0E0', borderRadius: 3, position: 'relative' }}>
              <div style={{ height: '100%', width: `${Math.min(g.fillPct, 100)}%`, background: fill, borderRadius: 3, transition: 'width 0.8s ease' }} />
              <div style={{ position: 'absolute', left: `${(g.minimum / (g.actual * 1.3)) * 100}%`, top: -3, bottom: -3, width: 2, background: '#E5376B', borderRadius: 1 }} />
              {g.wellCapitalized !== undefined && (
                <div style={{ position: 'absolute', left: `${(g.wellCapitalized / (g.actual * 1.3)) * 100}%`, top: -3, bottom: -3, width: 2, background: '#05AB8C', borderRadius: 1 }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#828282', fontFamily: 'var(--font-body)', marginTop: 8 }}>
              <span>min {g.minimumLabel}</span>
              {g.wellCapLabel && <span>well-cap {g.wellCapLabel}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProcessedSparklines({ sparkLines }: { sparkLines: SparkLine[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 32 }}>
      {sparkLines.map((sl) => {
        const h = 80;
        const padX = 24;
        const padY = 16;
        const vals = sl.points.map((p) => p.value);
        const min = Math.min(...vals) * 0.95;
        const max = Math.max(...vals) * 1.05;
        const range = max - min || 1;

        return (
          <div key={sl.label} style={{ padding: '20px 24px', background: '#FAFAFA', borderRadius: 12, border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', color: '#011E41' }}>{sl.label}</span>
              <span style={{ fontSize: 12, color: sl.color, fontFamily: 'var(--font-body)', fontWeight: 600 }}>{sl.trendLabel}</span>
            </div>
            <svg width="100%" viewBox={`0 0 400 ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
              {/* Area fill */}
              <path
                d={
                  sl.points.map((p, i) => {
                    const x = padX + (i / (sl.points.length - 1)) * (400 - 2 * padX);
                    const y = padY + (1 - (p.value - min) / range) * (h - 2 * padY);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ') + ` L ${400 - padX} ${h} L ${padX} ${h} Z`
                }
                fill={`${sl.color}12`}
              />
              {/* Line */}
              <path
                d={sl.points.map((p, i) => {
                  const x = padX + (i / (sl.points.length - 1)) * (400 - 2 * padX);
                  const y = padY + (1 - (p.value - min) / range) * (h - 2 * padY);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke={sl.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dots */}
              {sl.points.map((p, i) => {
                const x = padX + (i / (sl.points.length - 1)) * (400 - 2 * padX);
                const y = padY + (1 - (p.value - min) / range) * (h - 2 * padY);
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={4} fill="#FFFFFF" stroke={sl.color} strokeWidth={2} />
                    <text x={x} y={y - 10} textAnchor="middle" fill="#4F4F4F" fontSize={10} fontFamily="var(--font-body)">
                      {p.value}{sl.unit}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#828282', fontFamily: 'var(--font-body)', marginTop: 8, padding: '0 8px' }}>
              {sl.points.map((p) => <span key={p.quarter}>{p.quarter}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProcessedDecisions({ rows, decision, rationale }: { rows: DecisionRow[]; decision?: string; rationale?: string }) {
  const FLAG_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
    critical: { bg: '#FDEEF3', color: '#992A5C', icon: '\u26A0\u26A0' },
    warning:  { bg: '#FFF5D6', color: '#D7761D', icon: '\u26A0' },
    ok:       { bg: '#E1F5EE', color: '#0C7876', icon: '\u2713' },
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'grid', gap: 2 }}>
        {rows.map((r, i) => {
          const fs = r.flag ? FLAG_STYLE[r.flag] : null;
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: PAD,
              background: fs ? fs.bg : '#FAFAFA',
              borderRadius: 8,
            }}>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: '#333333' }}>{r.input}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 600, color: fs?.color ?? '#333333' }}>{r.value}</span>
                {fs && (
                  <span style={{ fontSize: 11, background: fs.bg, color: fs.color, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>{fs.icon}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {decision && (
        <div style={{ marginTop: 20, padding: '20px 24px', background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.2)', borderRadius: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-body)', color: '#011E41', marginBottom: 6 }}>{decision}</div>
          {rationale && <div style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: '#4F4F4F', lineHeight: 1.7 }}>{rationale}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Processed output renderer ───────────────────────────────────────────────

function ProcessedOutput({ panel }: { panel: AgentPanel }) {
  return (
    <div>
      {panel.tableHeaders && panel.tableRows && (
        <ProcessedTable headers={panel.tableHeaders} rows={panel.tableRows} />
      )}
      {panel.tableHeaders_2 && panel.tableRows_2 && (
        <ProcessedTable headers={panel.tableHeaders_2} rows={panel.tableRows_2} />
      )}
      {panel.watchlistLoans && panel.watchlistLoans.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#828282', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Watchlist movements</div>
          <div style={{ display: 'grid', gap: 2 }}>
            {panel.watchlistLoans.map((loan) => (
              <div key={loan.id} style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: PAD, background: '#FAFAFA', borderRadius: 8,
                fontSize: 13, fontFamily: 'var(--font-body)',
              }}>
                <span style={{ color: loan.direction === 'down' ? '#E5376B' : '#05AB8C', fontSize: 16, fontWeight: 700 }}>{loan.direction === 'down' ? '\u2193' : '\u2191'}</span>
                <span style={{ fontWeight: 600, color: '#011E41' }}>{loan.borrower}</span>
                <span style={{ color: '#828282' }}>{loan.from} &rarr; {loan.to}</span>
                <span style={{ marginLeft: 'auto', color: '#4F4F4F' }}>{loan.balance}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {panel.gauges && <ProcessedGauges gauges={panel.gauges} />}
      {panel.sparkLines && <ProcessedSparklines sparkLines={panel.sparkLines} />}
      {panel.decisionRows && (
        <ProcessedDecisions rows={panel.decisionRows} decision={panel.decision} rationale={panel.decisionRationale} />
      )}
      {panel.topologyColumns && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          {panel.topologyColumns.map((col, i) => (
            <div key={i} style={{
              flex: '1 1 120px',
              background: '#FAFAFA', border: '1px solid #E0E0E0',
              borderRadius: 10, padding: PAD, textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#828282', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{col.label}</div>
              {col.agents.map((a) => <div key={a} style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: '#011E41', fontWeight: 600 }}>{a}</div>)}
            </div>
          ))}
        </div>
      )}
      {panel.outputStructure && (
        <div style={{ marginBottom: 32, display: 'grid', gap: 2 }}>
          {panel.outputStructure.map((s) => (
            <div key={s.section} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: PAD, background: '#FAFAFA', borderRadius: 8,
              fontSize: 13, fontFamily: 'var(--font-body)',
            }}>
              <span style={{ color: '#011E41' }}>{s.section}</span>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: '#F5A800', fontWeight: 600 }}>{s.status}</span>
                <span style={{ color: '#828282' }}>{s.wordCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {panel.escalationFlag && (
        <div style={{ padding: PAD, background: '#FDEEF3', borderLeft: '3px solid #E5376B', borderRadius: 8, marginBottom: 32, fontSize: 14, fontFamily: 'var(--font-body)', color: '#992A5C' }}>
          <strong>{'\u26A0'} ESCALATION FLAG SET</strong>
          {panel.escalationReason && <div style={{ marginTop: 6, fontSize: 13, color: '#4F4F4F' }}>{panel.escalationReason}</div>}
        </div>
      )}
      {panel.upcomingExams && panel.upcomingExams.length > 0 && (
        <div style={{ marginBottom: 32, padding: PAD, background: '#FFF5D6', border: '1px solid #F5A800', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-body)', color: '#011E41', lineHeight: 1.7 }}>
          {panel.upcomingExams.map((e, i) => (
            <div key={i}><strong>Upcoming exam:</strong> {e.examiner} &mdash; {e.date} &mdash; {e.scope}</div>
          ))}
        </div>
      )}
      {panel.incidentDetail && (
        <div style={{ marginBottom: 32, borderRadius: 10, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
          <div style={{ background: '#F4F4F4', padding: PAD, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#828282' }}>Incident detail</div>
          {Object.entries(panel.incidentDetail).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: PAD, borderBottom: '1px solid #F4F4F4', fontSize: 13, fontFamily: 'var(--font-body)' }}>
              <span style={{ color: '#828282' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span style={{ color: '#333333', fontWeight: 600 }}>{String(v)}</span>
            </div>
          ))}
        </div>
      )}
      {panel.hitlOptions && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
          {panel.hitlOptions.map((opt) => (
            <div key={opt.action} style={{
              padding: PAD, borderRadius: 10,
              border: `2px solid ${opt.color}`, textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', color: opt.color }}>{opt.label}</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: '#828282', marginTop: 6 }}>{opt.description}</div>
            </div>
          ))}
        </div>
      )}
      {panel.compilationInputs && (
        <div style={{ marginBottom: 32, display: 'grid', gap: 4 }}>
          {panel.compilationInputs.map((inp, i) => (
            <div key={i} style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: '#4F4F4F', padding: PAD, background: '#FAFAFA', borderRadius: 6 }}>&bull; {inp}</div>
          ))}
        </div>
      )}
      {panel.scenarioComparisons && (
        <div style={{ marginBottom: 32, borderRadius: 10, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-body)', tableLayout: 'auto' }}>
            <thead>
              <tr>
                {['Scenario', 'Nodes', 'Human review', 'Rationale'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: PAD, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#011E41', color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {panel.scenarioComparisons.map((sc, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                  <td style={{ padding: PAD, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#011E41', borderBottom: '1px solid #F4F4F4' }}>{sc.scenario}</td>
                  <td style={{ padding: PAD, fontFamily: 'var(--font-body)', fontSize: 13, borderBottom: '1px solid #F4F4F4' }}>{sc.nodeCount}</td>
                  <td style={{ padding: PAD, fontFamily: 'var(--font-body)', fontSize: 13, borderBottom: '1px solid #F4F4F4' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 700, background: sc.hitl ? '#FDEEF3' : '#E1F5EE', color: sc.hitl ? '#992A5C' : '#0C7876' }}>
                      {sc.hitl ? 'Required' : 'Skipped'}
                    </span>
                  </td>
                  <td style={{ padding: PAD, fontFamily: 'var(--font-body)', fontSize: 13, color: '#4F4F4F', borderBottom: '1px solid #F4F4F4' }}>{sc.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {panel.note && (
        <div style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: '#F5A800', background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.15)', borderRadius: 10, padding: PAD, lineHeight: 1.7 }}>
          {panel.note}
        </div>
      )}
    </div>
  );
}

// ─── Progressive reveal wrapper ──────────────────────────────────────────────

function RevealSection({ visible, children, delay = 0 }: { visible: boolean; children: React.ReactNode; delay?: number }) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function ProcessedOutputProgressive({ panel, revealedSections }: { panel: AgentPanel; revealedSections: number }) {
  // Build ordered list of which sections exist for this panel
  let idx = 0;
  const s = () => ++idx;

  return (
    <div>
      {panel.tableHeaders && panel.tableRows && (
        <RevealSection visible={revealedSections >= s()}>
          <ProcessedTable headers={panel.tableHeaders} rows={panel.tableRows} />
        </RevealSection>
      )}
      {panel.tableHeaders_2 && panel.tableRows_2 && (
        <RevealSection visible={revealedSections >= s()}>
          <ProcessedTable headers={panel.tableHeaders_2} rows={panel.tableRows_2} />
        </RevealSection>
      )}
      {panel.watchlistLoans && panel.watchlistLoans.length > 0 && (
        <RevealSection visible={revealedSections >= s()}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#828282', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Watchlist movements</div>
            <div style={{ display: 'grid', gap: 2 }}>
              {panel.watchlistLoans.map((loan) => (
                <div key={loan.id} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: PAD, background: '#FAFAFA', borderRadius: 8,
                  fontSize: 13, fontFamily: 'var(--font-body)',
                }}>
                  <span style={{ color: loan.direction === 'down' ? '#E5376B' : '#05AB8C', fontSize: 16, fontWeight: 700 }}>{loan.direction === 'down' ? '\u2193' : '\u2191'}</span>
                  <span style={{ fontWeight: 600, color: '#011E41' }}>{loan.borrower}</span>
                  <span style={{ color: '#828282' }}>{loan.from} &rarr; {loan.to}</span>
                  <span style={{ marginLeft: 'auto', color: '#4F4F4F' }}>{loan.balance}</span>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      )}
      {panel.gauges && (
        <RevealSection visible={revealedSections >= s()}>
          <ProcessedGauges gauges={panel.gauges} />
        </RevealSection>
      )}
      {panel.sparkLines && (
        <RevealSection visible={revealedSections >= s()}>
          <ProcessedSparklines sparkLines={panel.sparkLines} />
        </RevealSection>
      )}
      {panel.decisionRows && (
        <RevealSection visible={revealedSections >= s()}>
          <ProcessedDecisions rows={panel.decisionRows} decision={panel.decision} rationale={panel.decisionRationale} />
        </RevealSection>
      )}
      {panel.topologyColumns && (
        <RevealSection visible={revealedSections >= s()}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
            {panel.topologyColumns.map((col, i) => (
              <div key={i} style={{
                flex: '1 1 120px',
                background: '#FAFAFA', border: '1px solid #E0E0E0',
                borderRadius: 10, padding: PAD, textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#828282', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{col.label}</div>
                {col.agents.map((a) => <div key={a} style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: '#011E41', fontWeight: 600 }}>{a}</div>)}
              </div>
            ))}
          </div>
        </RevealSection>
      )}
      {panel.outputStructure && (
        <RevealSection visible={revealedSections >= s()}>
          <div style={{ marginBottom: 32, display: 'grid', gap: 2 }}>
            {panel.outputStructure.map((sec) => (
              <div key={sec.section} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: PAD, background: '#FAFAFA', borderRadius: 8,
                fontSize: 13, fontFamily: 'var(--font-body)',
              }}>
                <span style={{ color: '#011E41' }}>{sec.section}</span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ color: '#F5A800', fontWeight: 600 }}>{sec.status}</span>
                  <span style={{ color: '#828282' }}>{sec.wordCount}</span>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      )}
      {panel.escalationFlag && (
        <RevealSection visible={revealedSections >= s()}>
          <div style={{ padding: PAD, background: '#FDEEF3', borderLeft: '3px solid #E5376B', borderRadius: 8, marginBottom: 32, fontSize: 14, fontFamily: 'var(--font-body)', color: '#992A5C' }}>
            <strong>{'\u26A0'} ESCALATION FLAG SET</strong>
            {panel.escalationReason && <div style={{ marginTop: 6, fontSize: 13, color: '#4F4F4F' }}>{panel.escalationReason}</div>}
          </div>
        </RevealSection>
      )}
      {panel.upcomingExams && panel.upcomingExams.length > 0 && (
        <RevealSection visible={revealedSections >= s()}>
          <div style={{ marginBottom: 32, padding: PAD, background: '#FFF5D6', border: '1px solid #F5A800', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-body)', color: '#011E41', lineHeight: 1.7 }}>
            {panel.upcomingExams.map((e, i) => (
              <div key={i}><strong>Upcoming exam:</strong> {e.examiner} &mdash; {e.date} &mdash; {e.scope}</div>
            ))}
          </div>
        </RevealSection>
      )}
      {panel.incidentDetail && (
        <RevealSection visible={revealedSections >= s()}>
          <div style={{ marginBottom: 32, borderRadius: 10, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
            <div style={{ background: '#F4F4F4', padding: PAD, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#828282' }}>Incident detail</div>
            {Object.entries(panel.incidentDetail).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: PAD, borderBottom: '1px solid #F4F4F4', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                <span style={{ color: '#828282' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span style={{ color: '#333333', fontWeight: 600 }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </RevealSection>
      )}
      {panel.hitlOptions && (
        <RevealSection visible={revealedSections >= s()}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
            {panel.hitlOptions.map((opt) => (
              <div key={opt.action} style={{
                padding: PAD, borderRadius: 10,
                border: `2px solid ${opt.color}`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', color: opt.color }}>{opt.label}</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: '#828282', marginTop: 6 }}>{opt.description}</div>
              </div>
            ))}
          </div>
        </RevealSection>
      )}
      {panel.compilationInputs && (
        <RevealSection visible={revealedSections >= s()}>
          <div style={{ marginBottom: 32, display: 'grid', gap: 4 }}>
            {panel.compilationInputs.map((inp, i) => (
              <div key={i} style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: '#4F4F4F', padding: PAD, background: '#FAFAFA', borderRadius: 6 }}>&bull; {inp}</div>
            ))}
          </div>
        </RevealSection>
      )}
      {panel.scenarioComparisons && (
        <RevealSection visible={revealedSections >= s()}>
          <div style={{ marginBottom: 32, borderRadius: 10, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-body)', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  {['Scenario', 'Nodes', 'Human review', 'Rationale'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: PAD, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#011E41', color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {panel.scenarioComparisons.map((sc, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                    <td style={{ padding: PAD, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#011E41', borderBottom: '1px solid #F4F4F4' }}>{sc.scenario}</td>
                    <td style={{ padding: PAD, fontFamily: 'var(--font-body)', fontSize: 13, borderBottom: '1px solid #F4F4F4' }}>{sc.nodeCount}</td>
                    <td style={{ padding: PAD, fontFamily: 'var(--font-body)', fontSize: 13, borderBottom: '1px solid #F4F4F4' }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 700, background: sc.hitl ? '#FDEEF3' : '#E1F5EE', color: sc.hitl ? '#992A5C' : '#0C7876' }}>
                        {sc.hitl ? 'Required' : 'Skipped'}
                      </span>
                    </td>
                    <td style={{ padding: PAD, fontFamily: 'var(--font-body)', fontSize: 13, color: '#4F4F4F', borderBottom: '1px solid #F4F4F4' }}>{sc.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RevealSection>
      )}
      {panel.note && (
        <RevealSection visible={revealedSections >= s()}>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: '#F5A800', background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.15)', borderRadius: 10, padding: PAD, lineHeight: 1.7 }}>
            {panel.note}
          </div>
        </RevealSection>
      )}
    </div>
  );
}

// ─── Processing overlay ──────────────────────────────────────────────────────

function ProcessingOverlay({
  steps,
  currentStep,
  agentColor,
}: {
  steps: string[];
  currentStep: number;
  agentColor: string;
}) {
  return (
    <div style={{
      padding: '48px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      {/* Progress bar */}
      <div style={{
        height: 3,
        background: '#E0E0E0',
        borderRadius: 2,
        marginBottom: 40,
        overflow: 'hidden',
      }}>
        <motion.div
          style={{ height: '100%', background: agentColor, borderRadius: 2 }}
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      {/* Step list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((step, i) => {
          const isComplete = i < currentStep;
          const isActive = i === currentStep;
          const isPending = i > currentStep;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{
                opacity: isPending ? 0.25 : 1,
                x: 0,
              }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '10px 16px',
                borderRadius: 8,
                background: isActive ? `${agentColor}08` : 'transparent',
              }}
            >
              {/* Status indicator */}
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: isComplete ? agentColor : isActive ? `${agentColor}20` : '#E0E0E0',
                border: isActive ? `2px solid ${agentColor}` : 'none',
                transition: 'all 0.3s ease',
              }}>
                {isComplete && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {isActive && (
                  <motion.div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: agentColor,
                    }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Step text */}
              <span style={{
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                color: isComplete ? '#333333' : isActive ? '#011E41' : '#AAAAAA',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.3s ease',
              }}>
                {step}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface AgentDataPanelProps {
  agentId: string | null;
}

export function AgentDataPanel({ agentId }: AgentDataPanelProps) {
  const [tab, setTab] = useState<DataTab>('raw');
  const agent = agentId ? NODE_REGISTRY[agentId] : null;
  const rawInput = agentId ? getAgentRawInput(agentId) : null;
  const displayData = agentId ? getAgentDisplayData(agentId) : null;

  // Processing simulation state
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [revealedSections, setRevealedSections] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedAgentsRef = useRef<Set<string>>(new Set());

  // Reset when agent changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTab('raw');
    setProcessingPhase('idle');
    setCurrentStep(0);
    setRevealedSections(0);
  }, [agentId]);

  // Count how many output sections this agent has (for progressive reveal)
  const countSections = useCallback((panel: AgentPanel): number => {
    let count = 0;
    if (panel.tableHeaders && panel.tableRows) count++;
    if (panel.tableHeaders_2 && panel.tableRows_2) count++;
    if (panel.watchlistLoans && panel.watchlistLoans.length > 0) count++;
    if (panel.gauges) count++;
    if (panel.sparkLines) count++;
    if (panel.decisionRows) count++;
    if (panel.topologyColumns) count++;
    if (panel.outputStructure) count++;
    if (panel.escalationFlag) count++;
    if (panel.upcomingExams && panel.upcomingExams.length > 0) count++;
    if (panel.incidentDetail) count++;
    if (panel.hitlOptions) count++;
    if (panel.compilationInputs) count++;
    if (panel.scenarioComparisons) count++;
    if (panel.note) count++;
    return count;
  }, []);

  // Start processing simulation
  const startProcessing = useCallback(() => {
    if (!agentId) return;

    // If already processed this agent, skip straight to done
    if (processedAgentsRef.current.has(agentId)) {
      setProcessingPhase('done');
      if (displayData) setRevealedSections(countSections(displayData));
      return;
    }

    const steps = AGENT_PROCESSING_STEPS[agentId] ?? ['Processing…'];
    setProcessingPhase('running');
    setCurrentStep(0);
    setRevealedSections(0);

    let step = 0;
    function tickStep() {
      step++;
      if (step < steps.length) {
        setCurrentStep(step);
        timerRef.current = setTimeout(tickStep, STEP_INTERVAL_MS);
      } else {
        // Processing complete — start revealing sections
        timerRef.current = setTimeout(() => {
          setProcessingPhase('done');
          processedAgentsRef.current.add(agentId!);
          // Progressive reveal of output sections
          if (displayData) {
            const totalSections = countSections(displayData);
            let revealed = 0;
            function revealNext() {
              revealed++;
              setRevealedSections(revealed);
              if (revealed < totalSections) {
                timerRef.current = setTimeout(revealNext, 200);
              }
            }
            revealNext();
          }
        }, 600);
      }
    }

    timerRef.current = setTimeout(tickStep, STEP_INTERVAL_MS);
  }, [agentId, displayData, countSections]);

  // Handle tab switch
  const handleTabClick = useCallback((newTab: DataTab) => {
    setTab(newTab);
    if (newTab === 'processed' && processingPhase === 'idle') {
      startProcessing();
    }
  }, [processingPhase, startProcessing]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div style={{ perspective: '1200px', perspectiveOrigin: '50% 0%' }}>
    <AnimatePresence mode="wait">
      {agentId && agent && (
        <motion.div
          key={agentId}
          style={{ transformOrigin: 'top center' }}
          initial={{ opacity: 0, rotateX: -22, scaleY: 0.88 }}
          animate={{ opacity: 1, rotateX: 0, scaleY: 1 }}
          exit={{ opacity: 0, rotateX: -22, scaleY: 0.88 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Peel shadow strip */}
          <div style={{
            height: 32,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 100%)',
            marginBottom: -32,
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'none',
          }} />

          <div style={{ background: '#F7F8FA', padding: '48px 0' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(24px, 5vw, 80px)' }}>

              {/* Agent header — large, Apple-clean */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25, ease: 'easeOut' }}
                style={{ marginBottom: 32 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: agent.color }} />
                  <h3 style={{
                    fontSize: 28, fontWeight: 700, color: '#011E41',
                    fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0,
                  }}>
                    {agent.label}
                  </h3>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: agent.color, background: `${agent.color}15`,
                    padding: '4px 12px', borderRadius: 4,
                  }}>
                    {agent.badgeLabel}
                  </span>
                </div>
                {displayData?.explanation && (
                  <p style={{
                    fontSize: 16, fontFamily: 'var(--font-body)', color: '#4F4F4F', lineHeight: 1.7,
                    margin: 0, maxWidth: 720, paddingLeft: 18,
                  }}>
                    {displayData.explanation}
                  </p>
                )}
              </motion.div>

              {/* Tabs — minimal underline style */}
              <div style={{
                display: 'flex', gap: 0,
                borderBottom: '1px solid #E0E0E0',
                marginBottom: 32,
              }}>
                {([
                  { id: 'raw' as DataTab, label: 'Raw Input Data' },
                  { id: 'processed' as DataTab, label: 'Processed Output' },
                ]).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTabClick(t.id)}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderBottom: tab === t.id ? '2px solid #F5A800' : '2px solid transparent',
                      background: 'transparent',
                      color: tab === t.id ? '#011E41' : '#828282',
                      fontWeight: tab === t.id ? 700 : 400,
                      fontSize: 14,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      marginBottom: -1,
                      transition: 'color 0.2s ease, border-color 0.2s ease',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content — full width, no boxed card */}
              <AnimatePresence mode="wait">
                {tab === 'raw' && rawInput && (
                  <motion.div
                    key="raw"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Key fields as stat cards */}
                    {rawInput.keyFields && rawInput.keyFields.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 12,
                        marginBottom: 32,
                      }}>
                        {rawInput.keyFields.map((kf, i) => (
                          <div key={i} style={{
                            padding: PAD,
                            background: '#FFFFFF',
                            borderRadius: 10,
                            border: '1px solid #E0E0E0',
                          }}>
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#828282', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                              {kf.label}
                            </div>
                            <div style={{ fontSize: 16, fontFamily: 'var(--font-body)', color: '#011E41', fontWeight: 600 }}>{kf.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tables — full width */}
                    {rawInput.tables.map((table) => (
                      <RawDataTableRenderer key={table.id} table={table} />
                    ))}
                  </motion.div>
                )}

                {tab === 'raw' && !rawInput && (
                  <motion.div key="no-raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p style={{ color: '#828282', fontSize: 14, fontFamily: 'var(--font-body)' }}>No raw input data available for this agent.</p>
                  </motion.div>
                )}

                {tab === 'processed' && processingPhase === 'running' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ProcessingOverlay
                      steps={AGENT_PROCESSING_STEPS[agentId] ?? ['Processing…']}
                      currentStep={currentStep}
                      agentColor={agent.color}
                    />
                  </motion.div>
                )}

                {tab === 'processed' && processingPhase === 'done' && displayData && (
                  <motion.div
                    key="processed"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProcessedOutputProgressive panel={displayData} revealedSections={revealedSections} />
                  </motion.div>
                )}

                {tab === 'processed' && processingPhase === 'idle' && (
                  <motion.div key="idle-processed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p style={{ color: '#828282', fontSize: 14, fontFamily: 'var(--font-body)' }}>Click &ldquo;Processed Output&rdquo; to run this agent.</p>
                  </motion.div>
                )}

                {tab === 'processed' && !displayData && processingPhase !== 'running' && (
                  <motion.div key="no-processed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p style={{ color: '#828282', fontSize: 14, fontFamily: 'var(--font-body)' }}>No processed output available for this agent.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
