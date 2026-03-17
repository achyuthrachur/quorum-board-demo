'use client';

/**
 * AgentDataContent — shared renderer for processed agent display data.
 * Used by AgentDetailDrawer (dark mode) and can be used by landing page (light mode).
 * Renders all fields present in AgentPanel conditionally.
 */

import type { AgentPanel, TableRow, MetricGauge, SparkLine, DecisionRow } from '@/data/agentDisplayData';

// ─── Color maps ──────────────────────────────────────────────────────────────

const LIGHT_HL_BG: Record<string, string> = { red: '#FFF0F3', amber: '#FFF8E6', green: '#EFFAF5' };
const LIGHT_HL_COLOR: Record<string, string> = { red: '#C9244D', amber: '#B87A00', green: '#0A7B61' };
const DARK_HL_BG: Record<string, string> = { red: 'rgba(229,55,107,0.12)', amber: 'rgba(245,168,0,0.10)', green: 'rgba(5,171,140,0.10)' };
const DARK_HL_COLOR: Record<string, string> = { red: '#FF7096', amber: '#FFD066', green: '#5DDBB5' };

// ─── Props ───────────────────────────────────────────────────────────────────

interface AgentDataContentProps {
  panel: AgentPanel;
  darkMode?: boolean;
}

export function AgentDataContent({ panel, darkMode = false }: AgentDataContentProps) {
  const hlBg = darkMode ? DARK_HL_BG : LIGHT_HL_BG;
  const hlColor = darkMode ? DARK_HL_COLOR : LIGHT_HL_COLOR;

  const t = darkMode ? {
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.7)',
    textDim: 'rgba(255,255,255,0.7)',
    headerBg: 'rgba(255,255,255,0.06)',
    headerText: 'rgba(255,255,255,0.75)',
    rowBg: 'transparent',
    rowAltBg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.04)',
    tableBorder: 'rgba(255,255,255,0.08)',
    amber: '#FFD066',
    sectionBg: 'rgba(255,255,255,0.04)',
  } : {
    text: '#1a1a1a',
    textMuted: '#666',
    textDim: '#AAA',
    headerBg: '#F8F8FA',
    headerText: '#666',
    rowBg: '#FFFFFF',
    rowAltBg: '#FAFAFA',
    border: '#F4F4F6',
    tableBorder: '#E8E8EC',
    amber: '#B87A00',
    sectionBg: '#F8F8FA',
  };

  // ─── Table ─────────────────────────────────────────────────────────────────

  function Table({ headers, rows }: { headers: string[]; rows: TableRow[] }) {
    return (
      <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${t.tableBorder}`, marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: t.headerBg, color: t.headerText, whiteSpace: 'nowrap', borderBottom: `1px solid ${t.tableBorder}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const bg = row.highlight && row.highlight !== 'none' ? hlBg[row.highlight] ?? t.rowBg : i % 2 === 0 ? t.rowBg : t.rowAltBg;
              const color = row.highlight && row.highlight !== 'none' ? hlColor[row.highlight] ?? t.text : t.text;
              return (
                <tr key={i} style={{ background: bg }}>
                  <td style={{ padding: '8px 12px', fontWeight: row.bold ? 700 : 500, color: row.bold ? t.text : color, borderBottom: `1px solid ${t.border}` }}>{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} style={{ padding: '8px 12px', textAlign: 'right', color, fontWeight: row.bold ? 700 : 400, borderBottom: `1px solid ${t.border}` }}>{v}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {panel.tableHeaders && panel.tableRows && <Table headers={panel.tableHeaders} rows={panel.tableRows} />}
      {panel.tableHeaders_2 && panel.tableRows_2 && <Table headers={panel.tableHeaders_2} rows={panel.tableRows_2} />}

      {panel.watchlistLoans && panel.watchlistLoans.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Watchlist movements</div>
          {panel.watchlistLoans.map((loan) => (
            <div key={loan.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${t.border}`, fontSize: 12 }}>
              <span style={{ color: loan.direction === 'down' ? (darkMode ? '#FF7096' : '#C9244D') : (darkMode ? '#5DDBB5' : '#0A7B61'), fontSize: 16 }}>{loan.direction === 'down' ? '\u2193' : '\u2191'}</span>
              <span style={{ fontWeight: 600, color: t.text }}>{loan.borrower}</span>
              <span style={{ color: t.textMuted, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{loan.from} &rarr; {loan.to}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: t.textMuted }}>{loan.balance}</span>
            </div>
          ))}
        </div>
      )}

      {panel.gauges && (
        <div style={{ marginBottom: 16 }}>
          {panel.gauges.map((g) => {
            const fill = g.status === 'green' ? '#05AB8C' : g.status === 'amber' ? '#F5A800' : '#E5376B';
            return (
              <div key={g.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{g.label}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: t.text, fontWeight: 600 }}>{g.actualLabel}</span>
                </div>
                <div style={{ height: 8, background: darkMode ? 'rgba(255,255,255,0.08)' : '#EDEDF0', borderRadius: 100 }}>
                  <div style={{ height: '100%', width: `${Math.min(g.fillPct, 100)}%`, background: fill, borderRadius: 100, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: t.textDim, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  <span>min {g.minimumLabel}</span>
                  {g.wellCapLabel && <span>well-cap {g.wellCapLabel}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {panel.sparkLines && (
        <div style={{ marginBottom: 16 }}>
          {panel.sparkLines.map((sl) => {
            const w = 370; const h = 64; const pad = 10;
            const vals = sl.points.map((p) => p.value);
            const mn = Math.min(...vals) * 0.95; const mx = Math.max(...vals) * 1.05; const rng = mx - mn || 1;
            const pts = sl.points.map((p, i) => ({ x: pad + (i / (sl.points.length - 1)) * (w - 2 * pad), y: pad + (1 - (p.value - mn) / rng) * (h - 2 * pad) }));
            const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            return (
              <div key={sl.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{sl.label}</span>
                  <span style={{ fontSize: 10, color: sl.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{sl.trendLabel}</span>
                </div>
                <svg width={w} height={h}><path d={d} fill="none" stroke={sl.color} strokeWidth={2.5} strokeLinecap="round" />{pts.map((p, i) => (<g key={i}><circle cx={p.x} cy={p.y} r={4} fill={darkMode ? '#001530' : '#FFF'} stroke={sl.color} strokeWidth={2} /><text x={p.x} y={p.y - 10} textAnchor="middle" fill={t.textMuted} fontSize={9} fontFamily="var(--font-mono)">{sl.points[i].value}{sl.unit}</text></g>))}</svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: t.textDim, fontFamily: 'var(--font-mono)', marginTop: 2, width: w }}>{sl.points.map((p) => <span key={p.quarter}>{p.quarter}</span>)}</div>
              </div>
            );
          })}
        </div>
      )}

      {panel.decisionRows && (
        <div style={{ marginBottom: 16 }}>
          {panel.decisionRows.map((r, i) => {
            const flagStyle = r.flag ? {
              critical: { bg: darkMode ? 'rgba(229,55,107,0.12)' : '#FFF0F3', color: darkMode ? '#FF7096' : '#C9244D', icon: '\u26A0\u26A0' },
              warning: { bg: darkMode ? 'rgba(245,168,0,0.10)' : '#FFF8E6', color: darkMode ? '#FFD066' : '#B87A00', icon: '\u26A0' },
              ok: { bg: darkMode ? 'rgba(5,171,140,0.10)' : '#EFFAF5', color: darkMode ? '#5DDBB5' : '#0A7B61', icon: '\u2713' },
            }[r.flag] : null;
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 13, color: t.textMuted }}>{r.input}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: flagStyle?.color ?? t.text }}>{r.value}</span>
                  {flagStyle && <span style={{ fontSize: 10, background: flagStyle.bg, color: flagStyle.color, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>{flagStyle.icon}</span>}
                </div>
              </div>
            );
          })}
          {panel.decision && (
            <div style={{ marginTop: 14, padding: '14px 16px', background: darkMode ? 'rgba(245,168,0,0.08)' : '#FFF8E6', border: `1px solid ${darkMode ? 'rgba(245,168,0,0.2)' : '#F5D580'}`, borderRadius: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: darkMode ? '#FFD066' : '#1a1a1a', marginBottom: 4 }}>{panel.decision}</div>
              {panel.decisionRationale && <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.6 }}>{panel.decisionRationale}</div>}
            </div>
          )}
        </div>
      )}

      {panel.note && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: t.amber, background: darkMode ? 'rgba(245,168,0,0.08)' : '#FFF8E6', border: `1px solid ${darkMode ? 'rgba(245,168,0,0.15)' : '#F5D580'}`, borderRadius: 12, padding: '10px 14px', lineHeight: 1.6 }}>{panel.note}</div>}
    </div>
  );
}
