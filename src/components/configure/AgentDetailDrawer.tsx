'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { getAgentRawInput } from '@/data/agentRawInputData';
import { getAgentDisplayData, type AgentPanel, type TableRow, type MetricGauge, type SparkLine, type DecisionRow } from '@/data/agentDisplayData';
import { RawDataTableRenderer } from '@/components/landing/RawDataTableRenderer';
import {
  Network, TrendingUp, Shield, BarChart3, Activity,
  FileText, AlertTriangle, GitBranch, UserCheck, BookOpen,
  type LucideIcon,
} from 'lucide-react';

const AGENT_ICONS: Record<string, LucideIcon> = {
  meta_agent: Network, financial_aggregator: TrendingUp, capital_monitor: Shield,
  credit_quality: BarChart3, trend_analyzer: Activity, regulatory_digest: FileText,
  operational_risk: AlertTriangle, supervisor: GitBranch, hitl_gate: UserCheck,
  report_compiler: BookOpen,
};

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9', algorithmic: '#05AB8C', hybrid: '#54C0E8',
  llm: '#F5A800', orchestrator: '#B14FC5', human: '#E5376B',
};

// ─── Elegant dark-blue table ─────────────────────────────────────────────────

const HL_BG: Record<string, string> = { red: 'rgba(229,55,107,0.12)', amber: 'rgba(245,168,0,0.10)', green: 'rgba(5,171,140,0.10)' };
const HL_COLOR: Record<string, string> = { red: '#FF7096', amber: '#FFD066', green: '#5DDBB5' };

function BlueTable({ headers, rows }: { headers: string[]; rows: TableRow[] }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '10px 14px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const bg = row.highlight && row.highlight !== 'none' ? HL_BG[row.highlight] ?? 'transparent' : 'transparent';
            const color = row.highlight && row.highlight !== 'none' ? HL_COLOR[row.highlight] ?? '#FFFFFF' : '#FFFFFF';
            return (
              <tr key={i} style={{ background: bg }}>
                <td style={{ padding: '8px 14px', fontWeight: row.bold ? 700 : 500, color: row.bold ? '#FFFFFF' : 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.label}</td>
                {row.values.map((v, j) => (
                  <td key={j} style={{ padding: '8px 14px', textAlign: 'right', color, fontWeight: row.bold ? 700 : 400, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{v}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BlueGauges({ gauges }: { gauges: MetricGauge[] }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {gauges.map((g) => {
        const fill = g.status === 'green' ? '#05AB8C' : g.status === 'amber' ? '#F5A800' : '#E5376B';
        return (
          <div key={g.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{g.label}</span>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: '#FFFFFF', fontWeight: 600 }}>{g.actualLabel}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 100 }}>
              <div style={{ height: '100%', width: `${Math.min(g.fillPct, 100)}%`, background: fill, borderRadius: 100, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
              <span>min {g.minimumLabel}</span>
              {g.wellCapLabel && <span>well-cap {g.wellCapLabel}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BlueSparklines({ sparkLines }: { sparkLines: SparkLine[] }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {sparkLines.map((sl) => {
        const w = 390; const h = 64; const pad = 10;
        const vals = sl.points.map((p) => p.value);
        const mn = Math.min(...vals) * 0.95; const mx = Math.max(...vals) * 1.05; const rng = mx - mn || 1;
        const pts = sl.points.map((p, i) => ({ x: pad + (i / (sl.points.length - 1)) * (w - 2 * pad), y: pad + (1 - (p.value - mn) / rng) * (h - 2 * pad) }));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return (
          <div key={sl.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{sl.label}</span>
              <span style={{ fontSize: 10, color: sl.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{sl.trendLabel}</span>
            </div>
            <svg width={w} height={h}><path d={d} fill="none" stroke={sl.color} strokeWidth={2.5} strokeLinecap="round" />{pts.map((p, i) => (<g key={i}><circle cx={p.x} cy={p.y} r={4} fill="#001530" stroke={sl.color} strokeWidth={2} /><text x={p.x} y={p.y - 10} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={9} fontFamily="var(--font-mono)">{sl.points[i].value}{sl.unit}</text></g>))}</svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', marginTop: 2, width: w }}>{sl.points.map((p) => <span key={p.quarter}>{p.quarter}</span>)}</div>
          </div>
        );
      })}
    </div>
  );
}

function BlueDecisions({ rows, decision, rationale }: { rows: DecisionRow[]; decision?: string; rationale?: string }) {
  const FS: Record<string, { bg: string; color: string; icon: string }> = {
    critical: { bg: 'rgba(229,55,107,0.12)', color: '#FF7096', icon: '\u26A0\u26A0' },
    warning: { bg: 'rgba(245,168,0,0.10)', color: '#FFD066', icon: '\u26A0' },
    ok: { bg: 'rgba(5,171,140,0.10)', color: '#5DDBB5', icon: '\u2713' },
  };
  return (
    <div style={{ marginBottom: 16 }}>
      {rows.map((r, i) => { const f = r.flag ? FS[r.flag] : null; return (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{r.input}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: f?.color ?? '#FFFFFF' }}>{r.value}</span>
            {f && <span style={{ fontSize: 10, background: f.bg, color: f.color, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>{f.icon}</span>}
          </div>
        </div>
      ); })}
      {decision && (
        <div style={{ marginTop: 14, padding: '14px 16px', background: 'rgba(245,168,0,0.08)', border: '1px solid rgba(245,168,0,0.2)', borderRadius: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#FFD066', marginBottom: 4 }}>{decision}</div>
          {rationale && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{rationale}</div>}
        </div>
      )}
    </div>
  );
}

function BlueProcessedOutput({ panel }: { panel: AgentPanel }) {
  return (
    <div>
      {panel.tableHeaders && panel.tableRows && <BlueTable headers={panel.tableHeaders} rows={panel.tableRows} />}
      {panel.tableHeaders_2 && panel.tableRows_2 && <BlueTable headers={panel.tableHeaders_2} rows={panel.tableRows_2} />}
      {panel.watchlistLoans && panel.watchlistLoans.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Watchlist movements</div>
          {panel.watchlistLoans.map((loan) => (
            <div key={loan.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
              <span style={{ color: loan.direction === 'down' ? '#FF7096' : '#5DDBB5', fontSize: 16 }}>{loan.direction === 'down' ? '\u2193' : '\u2191'}</span>
              <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{loan.borrower}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{loan.from} &rarr; {loan.to}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)' }}>{loan.balance}</span>
            </div>
          ))}
        </div>
      )}
      {panel.gauges && <BlueGauges gauges={panel.gauges} />}
      {panel.sparkLines && <BlueSparklines sparkLines={panel.sparkLines} />}
      {panel.decisionRows && <BlueDecisions rows={panel.decisionRows} decision={panel.decision} rationale={panel.decisionRationale} />}
      {panel.escalationFlag && (
        <div style={{ padding: '12px 16px', background: 'rgba(229,55,107,0.1)', borderLeft: '3px solid #E5376B', borderRadius: 14, marginBottom: 16, fontSize: 13, color: '#FF7096' }}>
          <strong>{'\u26A0'} Escalation flag set</strong>
          {panel.escalationReason && <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{panel.escalationReason}</div>}
        </div>
      )}
      {panel.incidentDetail && (
        <div style={{ marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 14px', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Incident detail</div>
          {Object.entries(panel.incidentDetail).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-mono)' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(v)}</span>
            </div>
          ))}
        </div>
      )}
      {panel.outputStructure && <div style={{ marginBottom: 16 }}>{panel.outputStructure.map((s) => (
        <div key={s.section} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>{s.section}</span>
          <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#FFD066', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.status}</span><span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>{s.wordCount}</span></div>
        </div>
      ))}</div>}
      {panel.topologyColumns && <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }}>{panel.topologyColumns.map((col, i) => (
        <div key={i} style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '8px 12px', minWidth: 90, textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{col.label}</div>
          {col.agents.map((a) => <div key={a} style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 600 }}>{a}</div>)}
        </div>
      ))}</div>}
      {panel.scenarioComparisons && (
        <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr>{['Scenario', 'Nodes', 'Review', 'Rationale'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>)}</tr></thead>
            <tbody>{panel.scenarioComparisons.map((sc, i) => (
              <tr key={i}><td style={{ padding: '8px 12px', fontWeight: 600, color: '#FFFFFF' }}>{sc.scenario}</td><td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.8)' }}>{sc.nodeCount}</td><td style={{ padding: '8px 12px' }}><span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: sc.hitl ? 'rgba(229,55,107,0.12)' : 'rgba(5,171,140,0.10)', color: sc.hitl ? '#FF7096' : '#5DDBB5' }}>{sc.hitl ? 'Required' : 'Skipped'}</span></td><td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{sc.rationale}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {panel.compilationInputs && <div style={{ marginBottom: 16 }}>{panel.compilationInputs.map((inp, i) => <div key={i} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)', padding: '3px 0' }}>&bull; {inp}</div>)}</div>}
      {panel.hitlOptions && <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>{panel.hitlOptions.map((opt) => <div key={opt.action} style={{ flex: 1, padding: '10px 14px', borderRadius: 14, border: `2px solid ${opt.color}`, textAlign: 'center' }}><div style={{ fontSize: 12, fontWeight: 700, color: opt.color }}>{opt.label}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{opt.description}</div></div>)}</div>}
      {panel.note && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#FFD066', background: 'rgba(245,168,0,0.08)', border: '1px solid rgba(245,168,0,0.15)', borderRadius: 14, padding: '12px 16px', lineHeight: 1.6 }}>{panel.note}</div>}
    </div>
  );
}

// ─── Drawer ──────────────────────────────────────────────────────────────────

type DrawerTab = 'raw' | 'processed';

interface AgentDetailDrawerProps {
  agentId: string | null;
  onClose: () => void;
}

export function AgentDetailDrawer({ agentId, onClose }: AgentDetailDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('raw');

  const agent = agentId ? NODE_REGISTRY[agentId] : null;
  const rawInput = agentId ? getAgentRawInput(agentId) : null;
  const displayData = agentId ? getAgentDisplayData(agentId) : null;
  const color = agent ? TYPE_COLOR[agent.type] ?? agent.color : '#8FE1FF';
  const Icon = agentId ? AGENT_ICONS[agentId] ?? Network : Network;

  return (
    <AnimatePresence>
      {agentId && agent && (
        <motion.div
          key={agentId}
          initial={{ x: '100%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 480,
            background: 'linear-gradient(180deg, #001530 0%, #011E41 100%)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '24px 0 0 24px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '-12px 0 48px rgba(0,0,0,0.2)',
          }}
        >
          {/* ── Header: icon + title + description ── */}
          <div style={{ padding: '24px 28px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                  style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(135deg, ${color}25, ${color}10)`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon size={24} color={color} strokeWidth={1.5} />
                </motion.div>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, background: `${color}12`, padding: '4px 12px', borderRadius: 20, border: `1px solid ${color}20` }}>{agent.badgeLabel}</span>
              </div>
              <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                <X size={16} />
              </button>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.15, fontFamily: 'var(--font-display)' }}
            >
              {agent.label}
            </motion.h2>

            {/* Explanation FIRST — this is the "what it does" */}
            {displayData?.explanation && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 10, lineHeight: 1.7, margin: '10px 0 0' }}
              >
                {displayData.explanation}
              </motion.p>
            )}

            {displayData?.note && (
              <div style={{ marginTop: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: '#FFD066', background: 'rgba(245,168,0,0.08)', border: '1px solid rgba(245,168,0,0.12)', borderRadius: 12, padding: '10px 14px', lineHeight: 1.5 }}>{displayData.note}</div>
            )}
          </div>

          {/* ── Tabs — segmented control ── */}
          <div style={{ padding: '0 28px 12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
              {([
                { id: 'raw' as DrawerTab, label: 'Raw Source Data' },
                { id: 'processed' as DrawerTab, label: 'Processed Output' },
              ]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1,
                    height: 36,
                    border: 'none',
                    borderRadius: 12,
                    background: tab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: tab === t.id ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                    fontWeight: tab === t.id ? 700 : 500,
                    fontSize: 12,
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Scrollable data content (BELOW description) ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 28px 28px' }}>
            <AnimatePresence mode="wait">
              {tab === 'raw' && rawInput && (
                <motion.div key="raw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  {rawInput.keyFields && rawInput.keyFields.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 20, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                      {rawInput.keyFields.map((kf, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>{kf.label}</div>
                          <div style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 600 }}>{kf.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {rawInput.tables.map((table) => (
                    <RawDataTableRenderer key={table.id} table={table} compact dark />
                  ))}
                </motion.div>
              )}
              {tab === 'processed' && displayData && (
                <motion.div key="processed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <BlueProcessedOutput panel={displayData} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
