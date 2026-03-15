'use client';

import { SCENARIOS } from '@/data/scenarios';

interface InputDataTabProps {
  scenarioId: string | null;
}

function formatValue(val: number, isPercent = true): string {
  if (isPercent) return `${val.toFixed(2)}%`;
  return val.toFixed(2);
}

export function InputDataTab({ scenarioId }: InputDataTabProps) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);

  if (!scenario) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/85" style={{ fontFamily: 'var(--font-display)' }}>
          Select a scenario
        </p>
      </div>
    );
  }

  const tableClass = 'w-full text-xs';
  const thClass = 'px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.18em]';
  const tdClass = 'px-3 py-2';
  const rowClass = 'border-b border-white/5 last:border-0';
  const mutedStyle = { color: 'var(--text-muted)' };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      {/* Scenario header */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
        <div className="text-[10px] uppercase tracking-[0.2em]" style={mutedStyle}>
          {scenario.meetingType} · {scenario.meetingDate}
        </div>
        <div className="mt-0.5 text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {scenario.institutionName}
        </div>
      </div>

      {/* Financial metrics */}
      {scenario.financials && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03]">
          <div className="border-b border-white/8 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70" style={{ fontFamily: 'var(--font-display)' }}>
              Financial
            </span>
          </div>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass} style={mutedStyle}>Metric</th>
                <th className={`${thClass} text-right`} style={mutedStyle}>Actual</th>
                <th className={`${thClass} text-right`} style={mutedStyle}>Budget</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'NIM', val: scenario.financials.nim.actual, bud: scenario.financials.nim.budget },
                { label: 'ROA', val: scenario.financials.roa.actual, bud: scenario.financials.roa.budget },
                { label: 'ROE', val: scenario.financials.roe.actual, bud: scenario.financials.roe.budget },
              ].map((r) => (
                <tr key={r.label} className={rowClass}>
                  <td className={tdClass} style={{ color: 'var(--text-muted)' }}>{r.label}</td>
                  <td className={`${tdClass} text-right font-medium text-white`}>{formatValue(r.val)}</td>
                  <td className={`${tdClass} text-right`} style={mutedStyle}>{formatValue(r.bud)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Capital metrics */}
      {scenario.capital && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03]">
          <div className="border-b border-white/8 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70" style={{ fontFamily: 'var(--font-display)' }}>
              Capital
            </span>
          </div>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass} style={mutedStyle}>Metric</th>
                <th className={`${thClass} text-right`} style={mutedStyle}>Actual</th>
                <th className={`${thClass} text-right`} style={mutedStyle}>Min</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'CET1', val: scenario.capital.cet1.actual, min: scenario.capital.cet1.minimum },
                { label: 'Tier 1', val: scenario.capital.tierOne.actual, min: scenario.capital.tierOne.minimum },
                { label: 'LCR', val: scenario.capital.lcr.actual, min: scenario.capital.lcr.minimum, noPercent: true },
                { label: 'NSFR', val: scenario.capital.nsfr.actual, min: scenario.capital.nsfr.minimum, noPercent: true },
              ].map((r) => (
                <tr key={r.label} className={rowClass}>
                  <td className={tdClass} style={{ color: 'var(--text-muted)' }}>{r.label}</td>
                  <td className={`${tdClass} text-right font-medium text-white`}>
                    {r.noPercent ? `${r.val}%` : formatValue(r.val)}
                  </td>
                  <td className={`${tdClass} text-right`} style={mutedStyle}>
                    {r.noPercent ? `${r.min}%` : formatValue(r.min)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Credit metrics */}
      {scenario.credit && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03]">
          <div className="border-b border-white/8 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70" style={{ fontFamily: 'var(--font-display)' }}>
              Credit
            </span>
          </div>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass} style={mutedStyle}>Metric</th>
                <th className={`${thClass} text-right`} style={mutedStyle}>Value</th>
                <th className={`${thClass} text-right`} style={mutedStyle}>Peer</th>
              </tr>
            </thead>
            <tbody>
              <tr className={rowClass}>
                <td className={tdClass} style={{ color: 'var(--text-muted)' }}>NPL</td>
                <td className={`${tdClass} text-right font-medium text-white`}>{formatValue(scenario.credit.nplRatio.actual)}</td>
                <td className={`${tdClass} text-right`} style={mutedStyle}>{formatValue(scenario.credit.nplRatio.peerMedian)}</td>
              </tr>
              <tr className={rowClass}>
                <td className={tdClass} style={{ color: 'var(--text-muted)' }}>Provision Coverage</td>
                <td className={`${tdClass} text-right font-medium text-white`}>{scenario.credit.provisionCoverageRatio.actual}%</td>
                <td className={`${tdClass} text-right`} style={mutedStyle}>{scenario.credit.provisionCoverageRatio.peerMedian}%</td>
              </tr>
              <tr className={rowClass}>
                <td className={tdClass} style={{ color: 'var(--text-muted)' }}>NCO Ratio</td>
                <td className={`${tdClass} text-right font-medium text-white`}>{formatValue(scenario.credit.ncoRatio.actual)}</td>
                <td className={`${tdClass} text-right`} style={mutedStyle}>{formatValue(scenario.credit.ncoRatio.peerMedian)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
