import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type {
  CreditMetrics,
  ConcentrationRisk,
  WatchlistMovement,
  MetricWithPeer,
  RAGStatus,
} from '@/types/state';
import type { SSEEvent } from '@/types/events';
import { sleep } from '@/lib/graph/utils';

const nodeMeta = NODE_REGISTRY.credit_quality;

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

interface RawPeerMetric {
  actual: number;
  priorPeriod: number;
  peerMedian: number;
}

interface RawCredit {
  nplRatio: RawPeerMetric;
  provisionCoverageRatio: RawPeerMetric;
  ncoRatio: RawPeerMetric;
  concentrations: ConcentrationRisk[];
  watchlistMovements: WatchlistMovement[];
}

// Each component scores -1, 0, or +1.
// Final score = (w1*s1 + w2*s2 + w3*s3 + w4*s4) * 5  → range –5 to +5
// RAG: ≤ –2 red | –1 to 0 amber | ≥ 1 green

const WEIGHTS = { npl: 0.35, pcr: 0.25, nco: 0.20, conc: 0.20 };

function scoreNPL(actual: number, peer: number): number {
  if (actual < peer) return 1;
  if (actual < peer * 1.2) return 0;
  return -1;
}

function scorePCR(actual: number, peer: number): number {
  if (actual > peer) return 1;
  if (actual > peer * 0.8) return 0;
  return -1;
}

function scoreNCO(actual: number, peer: number): number {
  if (actual < peer) return 1;
  if (actual < peer * 1.2) return 0;
  return -1;
}

function scoreConcentration(concentrations: ConcentrationRisk[]): number {
  const breaches = concentrations.filter((c) => c.percentage > c.limit);
  if (breaches.length === 0) return 1;
  if (breaches.length === 1) return 0;
  return -1;
}

function buildPeerMetric(raw: RawPeerMetric): MetricWithPeer {
  return { value: raw.actual, priorPeriod: raw.priorPeriod, peerMedian: raw.peerMedian };
}

export async function creditQuality(
  state: BoardState,
  config: RunnableConfig,
): Promise<Partial<BoardState>> {
  const runId = getRunId(state, config);
  const startedAt = Date.now();

  emit(runId, {
    type: 'node_started',
    runId,
    nodeId: nodeMeta.id,
    nodeType: nodeMeta.type,
    label: nodeMeta.label,
    inputSnapshot: (state.rawData.credit ?? null) as Record<string, unknown> | null ?? undefined,
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: 'Loading credit portfolio data…', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);

  const rawCredit = state.rawData.credit as RawCredit | undefined;

  if (!rawCredit) {
    const stateDelta: Partial<BoardState> = {};
    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: 'No credit data in scenario.',
      stateDelta,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent);
    return stateDelta;
  }

  const { nplRatio, provisionCoverageRatio, ncoRatio, concentrations, watchlistMovements } =
    rawCredit;

  const sNpl = scoreNPL(nplRatio.actual, nplRatio.peerMedian);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Scoring NPL ratio: ${nplRatio.actual}% vs peer median ${nplRatio.peerMedian}%…`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);

  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `NPL score: ${sNpl > 0 ? '+1 (better than peer)' : sNpl === 0 ? '0 (in line with peer)' : '−1 (worse than peer)'}`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const sPcr = scorePCR(provisionCoverageRatio.actual, provisionCoverageRatio.peerMedian);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Provision coverage: ${provisionCoverageRatio.actual}% vs peer ${provisionCoverageRatio.peerMedian}% → score ${sPcr > 0 ? '+1' : sPcr === 0 ? '0' : '−1'}`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const sNco = scoreNCO(ncoRatio.actual, ncoRatio.peerMedian);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `NCO ratio: ${ncoRatio.actual}% vs peer ${ncoRatio.peerMedian}% → score ${sNco > 0 ? '+1' : sNco === 0 ? '0' : '−1'}`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const sConc = scoreConcentration(concentrations);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Checking concentration limits: ${concentrations.filter((c) => c.percentage > c.limit).length} breach(es) detected`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const creditScore =
    (WEIGHTS.npl * sNpl + WEIGHTS.pcr * sPcr + WEIGHTS.nco * sNco + WEIGHTS.conc * sConc) * 5;

  const ragStatus: RAGStatus = creditScore <= -2 ? 'red' : creditScore < 1 ? 'amber' : 'green';
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Weighted credit score: ${creditScore.toFixed(2)} → RAG: ${ragStatus.toUpperCase()}`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(200);

  const flags: string[] = [];
  if (sNpl < 0)
    flags.push(
      `NPL ratio ${nplRatio.actual.toFixed(2)}% materially above peer median ${nplRatio.peerMedian.toFixed(2)}%`,
    );
  if (sPcr < 0)
    flags.push(
      `Provision coverage ${provisionCoverageRatio.actual.toFixed(1)}% below peer median ${provisionCoverageRatio.peerMedian.toFixed(1)}%`,
    );
  if (sNco < 0)
    flags.push(
      `NCO ratio ${ncoRatio.actual.toFixed(2)}% materially above peer median ${ncoRatio.peerMedian.toFixed(2)}%`,
    );
  const breaches = concentrations.filter((c) => c.percentage > c.limit);
  if (breaches.length > 0)
    flags.push(
      `${breaches.length} concentration limit breach(es): ${breaches.map((b) => b.segment).join(', ')}`,
    );

  const creditMetrics: CreditMetrics = {
    nplRatio: buildPeerMetric(nplRatio),
    provisionCoverageRatio: buildPeerMetric(provisionCoverageRatio),
    ncoRatio: buildPeerMetric(ncoRatio),
    concentrations,
    watchlistMovements,
    ragStatus,
    flags,
  };

  const stateDelta: Partial<BoardState> = { creditMetrics };

  emit(runId, {
    type: 'node_completed',
    runId,
    nodeId: nodeMeta.id,
    nodeType: nodeMeta.type,
    label: nodeMeta.label,
    outputSummary: `Credit scored ${creditScore.toFixed(2)}. RAG: ${ragStatus}. Flags: ${flags.length}.`,
    stateDelta,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  } as SSEEvent);

  return stateDelta;
}
