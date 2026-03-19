import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type { CapitalMetrics, MetricWithMinimum, RAGStatus } from '@/types/state';
import type { SSEEvent } from '@/types/events';
import { sleep } from '@/lib/graph/utils';

const nodeMeta = NODE_REGISTRY.capital_monitor;

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

interface RawCapitalRatio {
  actual: number;
  minimum: number;
  wellCapitalized?: number;
}

interface RawCapital {
  cet1: RawCapitalRatio;
  tierOne: RawCapitalRatio;
  totalCapital: RawCapitalRatio;
  lcr: RawCapitalRatio;
  nsfr: RawCapitalRatio;
}

const APPROACHING_BPS = 1.5; // 150 bps

function buildCapitalMetric(raw: RawCapitalRatio): MetricWithMinimum {
  return { value: raw.actual, minimum: raw.minimum, wellCapitalized: raw.wellCapitalized };
}

function flagRatio(
  label: string,
  raw: RawCapitalRatio,
  flags: string[],
): 'breach' | 'approaching' | 'ok' {
  if (raw.actual < raw.minimum) {
    flags.push(`${label} ${raw.actual.toFixed(2)}% breaches minimum ${raw.minimum.toFixed(2)}%`);
    return 'breach';
  }
  if (raw.actual < raw.minimum + APPROACHING_BPS) {
    flags.push(
      `${label} ${raw.actual.toFixed(2)}% within 150bps of minimum ${raw.minimum.toFixed(2)}%`,
    );
    return 'approaching';
  }
  if (raw.wellCapitalized !== undefined && raw.actual < raw.wellCapitalized) {
    flags.push(
      `${label} ${raw.actual.toFixed(2)}% below well-capitalised threshold ${raw.wellCapitalized.toFixed(2)}%`,
    );
    return 'approaching';
  }
  return 'ok';
}

export async function capitalMonitor(
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
    inputSnapshot: (state.rawData.capital ?? null) as Record<string, unknown> | null ?? undefined,
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: 'Loading capital and liquidity data…', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);

  const rawCapital = state.rawData.capital as RawCapital | undefined;

  if (!rawCapital) {
    const stateDelta: Partial<BoardState> = {};
    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: 'No capital data in scenario.',
      stateDelta,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent);
    return stateDelta;
  }

  const flags: string[] = [];

  const cet1Result = flagRatio('CET1', rawCapital.cet1, flags);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Evaluating CET1 ratio: ${rawCapital.cet1.actual}% against ${rawCapital.cet1.minimum}% minimum…`, detail: cet1Result !== 'ok' ? `FLAG: ${cet1Result}` : 'Pass', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const tierOneResult = flagRatio('Tier 1', rawCapital.tierOne, flags);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Evaluating Tier 1 capital ratio: ${rawCapital.tierOne.actual}% against ${rawCapital.tierOne.minimum}% minimum…`, detail: tierOneResult !== 'ok' ? `FLAG: ${tierOneResult}` : 'Pass', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const totalCapitalResult = flagRatio('Total Capital', rawCapital.totalCapital, flags);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Total capital ratio: ${rawCapital.totalCapital.actual}% against ${rawCapital.totalCapital.minimum}% minimum…`, detail: totalCapitalResult !== 'ok' ? `FLAG: ${totalCapitalResult}` : 'Pass', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const lcrResult = flagRatio('LCR', rawCapital.lcr, flags);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Checking LCR: ${rawCapital.lcr.actual}% against ${rawCapital.lcr.minimum}% regulatory floor…`, detail: lcrResult !== 'ok' ? `FLAG: ${lcrResult}` : 'Pass', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const nsfrResult = flagRatio('NSFR', rawCapital.nsfr, flags);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Checking NSFR stable funding ratio: ${rawCapital.nsfr.actual}% against ${rawCapital.nsfr.minimum}% minimum…`, detail: nsfrResult !== 'ok' ? `FLAG: ${nsfrResult}` : 'Pass', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const results = {
    cet1: cet1Result,
    tierOne: tierOneResult,
    totalCapital: totalCapitalResult,
    lcr: lcrResult,
    nsfr: nsfrResult,
  };

  const hasBreach = Object.values(results).some((r) => r === 'breach');
  const hasApproaching = Object.values(results).some((r) => r === 'approaching');

  const ragStatus: RAGStatus = hasBreach ? 'red' : hasApproaching ? 'amber' : 'green';
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Classifying overall capital RAG status: ${ragStatus.toUpperCase()} (${flags.length} flag${flags.length !== 1 ? 's' : ''})`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(200);

  const capitalMetrics: CapitalMetrics = {
    cet1: buildCapitalMetric(rawCapital.cet1),
    tierOne: buildCapitalMetric(rawCapital.tierOne),
    totalCapital: buildCapitalMetric(rawCapital.totalCapital),
    lcr: buildCapitalMetric(rawCapital.lcr),
    nsfr: buildCapitalMetric(rawCapital.nsfr),
    ragStatus,
    flags,
  };

  const stateDelta: Partial<BoardState> = { capitalMetrics };

  emit(runId, {
    type: 'node_completed',
    runId,
    nodeId: nodeMeta.id,
    nodeType: nodeMeta.type,
    label: nodeMeta.label,
    outputSummary: `Capital metrics computed. RAG: ${ragStatus}. Flags: ${flags.length}.`,
    stateDelta,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  } as SSEEvent);

  return stateDelta;
}
