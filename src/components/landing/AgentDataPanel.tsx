'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { getAgentRawInput } from '@/data/agentRawInputData';
import { getAgentDisplayData, type AgentPanel, type TableRow, type MetricGauge, type SparkLine, type DecisionRow } from '@/data/agentDisplayData';
import { RawDataTableRenderer } from './RawDataTableRenderer';

// ─── Tab type ────────────────────────────────────────────────────────────────

type DataTab = 'raw' | 'processed';

// ─── Processed output sub-renderers (light mode) ────────────────────────────

function ProcessedTable({ headers, rows }: { headers: string[]; rows: TableRow[] }) {
  const HIGHLIGHT_BG: Record<string, string> = {
    red: '#FDEEF3', amber: '#FFF5D6', green: '#E1F5EE',
  };
  const HIGHLIGHT_COLOR: Record<string, string> = {
    red: '#992A5C', amber: '#D7761D', green: '#0C7876',
  };

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #E0E0E0', borderRadius: 6, marginBottom: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  padding: '7px 10px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: '#011E41',
                  color: '#FFFFFF',
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
                <td style={{ padding: '7px 10px', fontWeight: row.bold ? 700 : 600, color, borderBottom: '1px solid #F4F4F4' }}>
                  {row.label}
                </td>
                {row.values.map((v, j) => (
                  <td key={j} style={{ padding: '7px 10px', textAlign: 'right', color, fontWeight: row.bold ? 700 : 400, borderBottom: '1px solid #F4F4F4', fontSize: 11 }}>
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
    <div style={{ marginBottom: 16 }}>
      {gauges.map((g) => {
        const fill = g.status === 'green' ? '#05AB8C' : g.status === 'amber' ? '#F5A800' : '#E5376B';
        return (
          <div key={g.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#011E41' }}>{g.label}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#011E41', fontWeight: 600 }}>{g.actualLabel}</span>
            </div>
            <div style={{ height: 8, background: '#E0E0E0', borderRadius: 4, position: 'relative' }}>
              <div style={{ height: '100%', width: `${Math.min(g.fillPct, 100)}%`, background: fill, borderRadius: 4 }} />
              <div style={{ position: 'absolute', left: `${(g.minimum / (g.actual * 1.3)) * 100}%`, top: -2, bottom: -2, width: 2, background: '#E5376B', borderRadius: 1 }} />
              {g.wellCapitalized !== undefined && (
                <div style={{ position: 'absolute', left: `${(g.wellCapitalized / (g.actual * 1.3)) * 100}%`, top: -2, bottom: -2, width: 2, background: '#05AB8C', borderRadius: 1 }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 9, color: '#828282', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
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
    <div style={{ marginBottom: 16 }}>
      {sparkLines.map((sl) => {
        const w = 280;
        const h = 64;
        const pad = 10;
        const vals = sl.points.map((p) => p.value);
        const min = Math.min(...vals) * 0.95;
        const max = Math.max(...vals) * 1.05;
        const range = max - min || 1;
        const pts = sl.points.map((p, i) => ({
          x: pad + (i / (sl.points.length - 1)) * (w - 2 * pad),
          y: pad + (1 - (p.value - min) / range) * (h - 2 * pad),
        }));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        return (
          <div key={sl.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#011E41' }}>{sl.label}</span>
              <span style={{ fontSize: 10, color: sl.color, fontFamily: 'var(--font-mono)' }}>{sl.trendLabel}</span>
            </div>
            <svg width={w} height={h} style={{ display: 'block' }}>
              <path d={d} fill="none" stroke={sl.color} strokeWidth={2} />
              {pts.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={3} fill={sl.color} />
                  <text x={p.x} y={p.y - 7} textAnchor="middle" fill="#4F4F4F" fontSize={8} fontFamily="var(--font-mono)">
                    {sl.points[i].value}{sl.unit}
                  </text>
                </g>
              ))}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#828282', fontFamily: 'var(--font-mono)', marginTop: 2, width: w }}>
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
    <div style={{ marginBottom: 16 }}>
      {rows.map((r, i) => {
        const fs = r.flag ? FLAG_STYLE[r.flag] : null;
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F4F4F4' }}>
            <span style={{ fontSize: 12, color: '#333333' }}>{r.input}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: fs?.color ?? '#333333' }}>{r.value}</span>
              {fs && (
                <span style={{ fontSize: 10, background: fs.bg, color: fs.color, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>{fs.icon}</span>
              )}
            </div>
          </div>
        );
      })}
      {decision && (
        <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(245,168,0,0.08)', border: '1px solid rgba(245,168,0,0.25)', borderRadius: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#011E41', marginBottom: 4 }}>{decision}</div>
          {rationale && <div style={{ fontSize: 12, color: '#4F4F4F', lineHeight: 1.6 }}>{rationale}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Processed output renderer ───────────────────────────────────────────────

function ProcessedOutput({ panel }: { panel: AgentPanel }) {
  return (
    <div>
      {/* Main table */}
      {panel.tableHeaders && panel.tableRows && (
        <ProcessedTable headers={panel.tableHeaders} rows={panel.tableRows} />
      )}

      {/* Second table (credit quality) */}
      {panel.tableHeaders_2 && panel.tableRows_2 && (
        <ProcessedTable headers={panel.tableHeaders_2} rows={panel.tableRows_2} />
      )}

      {/* Watchlist loans */}
      {panel.watchlistLoans && panel.watchlistLoans.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#828282', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Watchlist movements</div>
          {panel.watchlistLoans.map((loan) => (
            <div key={loan.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F4F4F4', fontSize: 11 }}>
              <span style={{ color: loan.direction === 'down' ? '#E5376B' : '#05AB8C', fontSize: 14 }}>{loan.direction === 'down' ? '\u2193' : '\u2191'}</span>
              <span style={{ fontWeight: 600, color: '#011E41' }}>{loan.borrower}</span>
              <span style={{ color: '#828282', fontFamily: 'var(--font-mono)' }}>{loan.from} &rarr; {loan.to}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: '#4F4F4F' }}>{loan.balance}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gauges */}
      {panel.gauges && <ProcessedGauges gauges={panel.gauges} />}

      {/* Sparklines */}
      {panel.sparkLines && <ProcessedSparklines sparkLines={panel.sparkLines} />}

      {/* Decisions */}
      {panel.decisionRows && (
        <ProcessedDecisions rows={panel.decisionRows} decision={panel.decision} rationale={panel.decisionRationale} />
      )}

      {/* Topology */}
      {panel.topologyColumns && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }}>
          {panel.topologyColumns.map((col, i) => (
            <div key={i} style={{ flex: '0 0 auto', background: '#F4F4F4', border: '1px solid #E0E0E0', borderRadius: 6, padding: '8px 12px', minWidth: 100, textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#828282', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{col.label}</div>
              {col.agents.map((a) => <div key={a} style={{ fontSize: 11, color: '#011E41', fontWeight: 600 }}>{a}</div>)}
            </div>
          ))}
        </div>
      )}

      {/* Output structure */}
      {panel.outputStructure && (
        <div style={{ marginBottom: 16 }}>
          {panel.outputStructure.map((s) => (
            <div key={s.section} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F4F4F4', fontSize: 11 }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#011E41' }}>{s.section}</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ color: '#F5A800', fontFamily: 'var(--font-mono)' }}>{s.status}</span>
                <span style={{ color: '#828282', fontFamily: 'var(--font-mono)' }}>{s.wordCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Escalation flag */}
      {panel.escalationFlag && (
        <div style={{ padding: '10px 14px', background: '#FDEEF3', borderLeft: '3px solid #E5376B', borderRadius: 4, marginBottom: 16, fontSize: 12, color: '#992A5C' }}>
          <strong>{'\u26A0'} ESCALATION FLAG SET</strong>
          {panel.escalationReason && <div style={{ marginTop: 4, fontSize: 11 }}>{panel.escalationReason}</div>}
        </div>
      )}

      {/* Upcoming exams */}
      {panel.upcomingExams && panel.upcomingExams.length > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#FFF5D6', border: '1px solid #F5A800', borderRadius: 6, fontSize: 11, color: '#011E41', lineHeight: 1.6 }}>
          {panel.upcomingExams.map((e, i) => (
            <div key={i}><strong>Upcoming exam:</strong> {e.examiner} &mdash; {e.date} &mdash; {e.scope}</div>
          ))}
        </div>
      )}

      {/* Incident detail */}
      {panel.incidentDetail && (
        <div style={{ marginBottom: 16, border: '1px solid #E0E0E0', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ background: '#F4F4F4', padding: '8px 12px', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#828282' }}>Incident detail</div>
          {Object.entries(panel.incidentDetail).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #F4F4F4', fontSize: 11 }}>
              <span style={{ color: '#828282', fontFamily: 'var(--font-mono)' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span style={{ color: '#333333', fontWeight: 600 }}>{String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {/* HITL options */}
      {panel.hitlOptions && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {panel.hitlOptions.map((opt) => (
            <div key={opt.action} style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: `2px solid ${opt.color}`, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: opt.color }}>{opt.label}</div>
              <div style={{ fontSize: 10, color: '#828282', marginTop: 4 }}>{opt.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Compilation inputs */}
      {panel.compilationInputs && (
        <div style={{ marginBottom: 16 }}>
          {panel.compilationInputs.map((inp, i) => (
            <div key={i} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#4F4F4F', padding: '3px 0' }}>&bull; {inp}</div>
          ))}
        </div>
      )}

      {/* Scenario comparisons */}
      {panel.scenarioComparisons && (
        <div style={{ overflowX: 'auto', border: '1px solid #E0E0E0', borderRadius: 6, marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Scenario', 'Nodes', 'Human review', 'Rationale'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#011E41', color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {panel.scenarioComparisons.map((sc, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: '#011E41' }}>{sc.scenario}</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)' }}>{sc.nodeCount}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, fontWeight: 700, background: sc.hitl ? '#FDEEF3' : '#E1F5EE', color: sc.hitl ? '#992A5C' : '#0C7876' }}>
                      {sc.hitl ? 'Required' : 'Skipped'}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', color: '#4F4F4F', fontSize: 10 }}>{sc.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Note */}
      {panel.note && (
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#F5A800', background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.15)', borderRadius: 4, padding: '8px 12px', lineHeight: 1.6 }}>
          {panel.note}
        </div>
      )}
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
          {/* Peel shadow strip — simulates shadow cast by the lifted page edge */}
          <div style={{
            height: 32,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 100%)',
            marginBottom: -32,
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'none',
          }} />

          <div style={{ background: '#F4F4F4', padding: '48px' }}>
            <div
              style={{
                maxWidth: 1200,
                margin: '0 auto',
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E0E0E0',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25, ease: 'easeOut' }}
                style={{
                  padding: '20px 32px',
                  borderBottom: '1px solid #E0E0E0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ width: 4, height: 24, borderRadius: 2, background: agent.color }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#011E41', fontFamily: 'var(--font-body)' }}>
                  {agent.label}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: agent.color,
                    background: `${agent.color}15`,
                    padding: '3px 8px',
                    borderRadius: 3,
                  }}
                >
                  {agent.badgeLabel}
                </span>
              </motion.div>

              {/* Tabs */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #E0E0E0',
                  padding: '0 32px',
                }}
              >
                {([
                  { id: 'raw' as DataTab, label: 'Raw Input Data' },
                  { id: 'processed' as DataTab, label: 'Processed Output' },
                ]).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderBottom: tab === t.id ? '2px solid #F5A800' : '2px solid transparent',
                      background: 'transparent',
                      color: tab === t.id ? '#011E41' : '#828282',
                      fontWeight: tab === t.id ? 700 : 400,
                      fontSize: 13,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      marginBottom: -1,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ padding: '24px 32px' }}>
                <AnimatePresence mode="wait">
                  {tab === 'raw' && rawInput && (
                    <motion.div
                      key="raw"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: 0.3 }}
                    >
                      {/* Key fields */}
                      {rawInput.keyFields && rawInput.keyFields.length > 0 && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '6px 24px',
                            marginBottom: 20,
                            padding: '12px 16px',
                            background: '#FAFAFA',
                            borderRadius: 6,
                            border: '1px solid #E0E0E0',
                          }}
                        >
                          {rawInput.keyFields.map((kf, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#828282', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                                {kf.label}:
                              </span>
                              <span style={{ fontSize: 11, color: '#333333', fontWeight: 600 }}>{kf.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tables */}
                      {rawInput.tables.map((table) => (
                        <RawDataTableRenderer key={table.id} table={table} />
                      ))}
                    </motion.div>
                  )}

                  {tab === 'raw' && !rawInput && (
                    <motion.div key="no-raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p style={{ color: '#828282', fontSize: 13 }}>No raw input data available for this agent.</p>
                    </motion.div>
                  )}

                  {tab === 'processed' && displayData && (
                    <motion.div
                      key="processed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: 0.3 }}
                    >
                      <ProcessedOutput panel={displayData} />
                    </motion.div>
                  )}

                  {tab === 'processed' && !displayData && (
                    <motion.div key="no-processed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p style={{ color: '#828282', fontSize: 13 }}>No processed output available for this agent.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Explanation (always visible below tabs) */}
                {displayData?.explanation && (
                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E0E0E0' }}>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#828282', marginBottom: 8 }}>
                      What this agent does
                    </div>
                    <p style={{ fontSize: 13, color: '#4F4F4F', lineHeight: 1.75, margin: 0, fontFamily: 'var(--font-body)' }}>
                      {displayData.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
