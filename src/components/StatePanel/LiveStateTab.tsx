'use client';

/* Aesthetic direction: Swiss / typographic */

import { AnimatePresence, motion } from 'motion/react';

import { NumberTicker } from '@/components/ui/number-ticker';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { SparkLineChart } from '@/components/stats-card-2';
import { useExecutionStore } from '@/store/executionStore';
import { POPULATION_BASELINE, QUARTERS } from '@/data/populationBaseline';
import type {
  CapitalMetrics,
  CreditMetrics,
  FinancialMetrics,
  MetricWithMinimum,
  MetricWithPriorBudget,
  RAGStatus,
  TrendAnalysis,
} from '@/types/state';

const RAG_COLORS: Record<RAGStatus, string> = {
  red: '#E5376B',
  amber: '#F5A800',
  green: '#05AB8C',
};

const SECTION_TRANSITION = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
};

function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

function formatThresholdLabel(metric: MetricWithMinimum): string {
  if (metric.wellCapitalized !== undefined) {
    return `threshold ${metric.wellCapitalized.toFixed(1)}%`;
  }

  return `threshold ${metric.minimum.toFixed(1)}%`;
}

function getVarianceStatus(variance: number): RAGStatus {
  if (variance >= 0) return 'green';
  if (variance >= -5) return 'amber';
  return 'red';
}

function computeCreditScore(metrics: CreditMetrics): number {
  const scoreNpl =
    metrics.nplRatio.value < metrics.nplRatio.peerMedian
      ? 1
      : metrics.nplRatio.value < metrics.nplRatio.peerMedian * 1.2
        ? 0
        : -1;

  const scorePcr =
    metrics.provisionCoverageRatio.value > metrics.provisionCoverageRatio.peerMedian
      ? 1
      : metrics.provisionCoverageRatio.value > metrics.provisionCoverageRatio.peerMedian * 0.8
        ? 0
        : -1;

  const scoreNco =
    metrics.ncoRatio.value < metrics.ncoRatio.peerMedian
      ? 1
      : metrics.ncoRatio.value < metrics.ncoRatio.peerMedian * 1.2
        ? 0
        : -1;

  const concentrationBreaches = metrics.concentrations.filter(
    (item) => item.percentage > item.limit,
  ).length;
  const scoreConcentration = concentrationBreaches === 0 ? 1 : concentrationBreaches === 1 ? 0 : -1;

  const rawScore =
    (0.35 * scoreNpl + 0.25 * scorePcr + 0.2 * scoreNco + 0.2 * scoreConcentration) * 5;

  return Math.max(0, Math.min(100, Math.round(((rawScore + 5) / 10) * 100)));
}

function TrendMiniCard({
  label,
  data,
  unit = '%',
  color,
  colorClass,
}: {
  label: string;
  data: number[];
  unit?: string;
  color: string;
  colorClass: string;
}) {
  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];
  const delta  = latest - prev;
  const deltaColor = delta >= 0 ? '#05AB8C' : '#E5376B';

  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: '8px 10px',
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8FE1FF', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            {latest.toFixed(2)}{unit}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: deltaColor, marginLeft: 4, fontFamily: 'var(--font-mono)' }}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(2)}
          </span>
        </div>
        <SparkLineChart data={data} width={80} height={28} strokeWidth={1.5} className={colorClass} />
      </div>
    </div>
  );
}

function TrendSection({ trend }: { trend: TrendAnalysis | null | undefined }) {
  const nim = trend?.nimTrend?.length ? trend.nimTrend : [...POPULATION_BASELINE.nim];
  const roa = trend?.roaTrend?.length ? trend.roaTrend : [...POPULATION_BASELINE.roa];
  const roe = trend?.roeTrend?.length ? trend.roeTrend : [...POPULATION_BASELINE.roe];
  const isLive = Boolean(trend?.nimTrend?.length);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
          5Q trend · {QUARTERS[0]}–{QUARTERS[QUARTERS.length - 1]}
        </span>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 3, background: isLive ? 'rgba(5,171,140,0.15)' : 'rgba(255,255,255,0.06)', color: isLive ? '#05AB8C' : 'rgba(255,255,255,0.3)' }}>
          {isLive ? 'Live' : 'Baseline'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <TrendMiniCard label="NIM" data={nim} color="#F5A800" colorClass="text-[#F5A800]" />
        <TrendMiniCard label="ROA" data={roa} color="#54C0E8" colorClass="text-[#54C0E8]" />
        <TrendMiniCard label="ROE" data={roe} color="#B14FC5" colorClass="text-[#B14FC5]" />
      </div>
    </div>
  );
}

// ─── Panel section ─────────────────────────────────────────────────────────────

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={SECTION_TRANSITION}
      className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 shadow-[0_20px_50px_-36px_rgba(0,0,0,0.8)]"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3
          className="text-[0.8rem] font-extrabold uppercase tracking-[0.22em] text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h3>
      </div>
      {children}
    </motion.section>
  );
}

function VarianceBadge({ variance }: { variance: number }) {
  const status = getVarianceStatus(variance);
  const color = RAG_COLORS[status];
  const prefix = variance >= 0 ? '+' : '';

  return (
    <span
      className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
      style={{
        borderColor: `${color}40`,
        backgroundColor: `${color}18`,
        color,
      }}
    >
      {prefix}
      {variance.toFixed(1)}% vs budget
    </span>
  );
}

function FinancialMetricRow({
  label,
  metric,
}: {
  label: string;
  metric: MetricWithPriorBudget;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/6 bg-black/10 px-3 py-3">
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8FE1FF]">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-white">{formatPercent(metric.value)}</span>
          <span className="text-xs text-[#8FE1FF]/80">prior {formatPercent(metric.priorPeriod)}</span>
        </div>
      </div>
      <VarianceBadge variance={metric.variance} />
    </div>
  );
}

function getCapitalBarColor(metric: MetricWithMinimum): string {
  if (metric.value < metric.minimum) return RAG_COLORS.red;
  if (metric.wellCapitalized !== undefined && metric.value < metric.wellCapitalized) {
    return RAG_COLORS.amber;
  }
  if (metric.value < metric.minimum + 1.5) return RAG_COLORS.amber;
  return RAG_COLORS.green;
}

function CapitalMetricRow({
  label,
  metric,
}: {
  label: string;
  metric: MetricWithMinimum;
}) {
  const scaleMax = Math.max(
    metric.value,
    metric.wellCapitalized ?? metric.minimum,
    metric.minimum * 1.4,
  );
  const fill = Math.min((metric.value / scaleMax) * 100, 100);
  const marker = Math.min((metric.minimum / scaleMax) * 100, 100);
  const barColor = getCapitalBarColor(metric);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{label}</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#8FE1FF]/80">
            {formatThresholdLabel(metric)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-white">{formatPercent(metric.value, 1)}</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#8FE1FF]/80">
            min {formatPercent(metric.minimum, 1)}
          </div>
        </div>
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${fill}%`, backgroundColor: barColor }}
        />
        <div
          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-white/70"
          style={{ left: `calc(${marker}% - 0.5px)` }}
        />
      </div>
    </div>
  );
}

function CreditScoreRing({ metrics }: { metrics: CreditMetrics }) {
  const score = computeCreditScore(metrics);
  const color = RAG_COLORS[metrics.ragStatus];
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-4 rounded-[1.75rem] border border-white/6 bg-black/10 p-4">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <NumberTicker
            value={score}
            decimalPlaces={0}
            className="text-3xl font-extrabold tracking-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          />
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#8FE1FF]">score</span>
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#8FE1FF]">
            Credit quality
          </div>
          <div className="text-xl font-semibold text-white">Peer and concentration signal</div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#8FE1FF]/80">NPL</div>
            <div className="mt-1 font-semibold text-white">
              {formatPercent(metrics.nplRatio.value)}
            </div>
          </div>
          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#8FE1FF]/80">
              Watchlist
            </div>
            <div className="mt-1 font-semibold text-white">{metrics.watchlistMovements.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RagRow({
  financial,
  capital,
  credit,
}: {
  financial: FinancialMetrics | null | undefined;
  capital: CapitalMetrics | null | undefined;
  credit: CreditMetrics | null | undefined;
}) {
  const items = [
    { label: 'Financial', status: financial?.ragStatus },
    { label: 'Capital', status: capital?.ragStatus },
    { label: 'Credit', status: credit?.ragStatus },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => {
        const color = item.status ? RAG_COLORS[item.status] : 'rgba(255,255,255,0.18)';

        return (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-2xl border border-white/6 bg-black/10 px-3 py-3"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: item.status ? `0 0 12px ${color}` : 'none',
              }}
            />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-white">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LiveStateTab() {
  const liveState = useExecutionStore((state) => state.liveState);
  const executionLog = useExecutionStore((state) => state.executionLog);
  const financialMetrics = liveState.financialMetrics;
  const capitalMetrics   = liveState.capitalMetrics;
  const creditMetrics    = liveState.creditMetrics;
  const trendAnalysis    = liveState.trendAnalysis;

  const completedAgents = executionLog.filter((e) => e.nodeType !== 'human').length;
  const hasAnyState = Boolean(financialMetrics || capitalMetrics || creditMetrics);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-1">
        {/* Animated agent progress counter */}
        <div className="mb-4 flex items-center gap-3 px-1 pt-1">
          <div className="flex flex-col items-start">
            <AnimatedCounter value={completedAgents} />
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8FE1FF]"
              style={{ fontFamily: 'var(--font-mono)', marginTop: 4 }}
            >
              agents complete
            </span>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            <PanelSection key="trends" title="Key metrics trend">
              <TrendSection trend={trendAnalysis} />
            </PanelSection>

            {financialMetrics && (
              <PanelSection key="financial" title="Financial">
                <div className="space-y-3">
                  <FinancialMetricRow label="NIM" metric={financialMetrics.nim} />
                  <FinancialMetricRow label="ROA" metric={financialMetrics.roa} />
                  <FinancialMetricRow label="ROE" metric={financialMetrics.roe} />
                </div>
              </PanelSection>
            )}

            {capitalMetrics && (
              <PanelSection key="capital" title="Capital">
                <div className="space-y-4">
                  <CapitalMetricRow label="CET1" metric={capitalMetrics.cet1} />
                  <CapitalMetricRow label="Tier 1" metric={capitalMetrics.tierOne} />
                  <CapitalMetricRow label="Total capital" metric={capitalMetrics.totalCapital} />
                  <CapitalMetricRow label="LCR" metric={capitalMetrics.lcr} />
                  <CapitalMetricRow label="NSFR" metric={capitalMetrics.nsfr} />
                </div>
              </PanelSection>
            )}

            {creditMetrics && (
              <PanelSection key="credit" title="Credit Score">
                <CreditScoreRing metrics={creditMetrics} />
              </PanelSection>
            )}

            {hasAnyState && (
              <PanelSection key="rag" title="RAG Summary">
                <RagRow
                  financial={financialMetrics}
                  capital={capitalMetrics}
                  credit={creditMetrics}
                />
              </PanelSection>
            )}
          </div>
        </AnimatePresence>

        {false && !hasAnyState && (
          <div className="flex h-full min-h-[240px] items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
            <div>
              <p
                className="text-sm font-bold uppercase tracking-[0.22em] text-white/85"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Awaiting state deltas
              </p>
              <p className="mt-2 text-sm text-[#8FE1FF]/80">
                Metrics will fade in here as each node completes and pushes live execution state.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
