import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type { FinancialMetrics, MetricWithPriorBudget, RAGStatus } from '@/types/state';
import type { SSEEvent } from '@/types/events';
import { sleep } from '@/lib/graph/utils';

const nodeMeta = NODE_REGISTRY.financial_aggregator;

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

interface RawFinancialMetric {
  actual: number;
  budget: number;
  priorPeriod: number;
}

interface RawFinancials {
  nim: RawFinancialMetric;
  roa: RawFinancialMetric;
  roe: RawFinancialMetric;
  nonInterestIncome: RawFinancialMetric;
  efficiencyRatio: RawFinancialMetric;
}

function buildMetric(raw: RawFinancialMetric): MetricWithPriorBudget {
  const variance = ((raw.actual - raw.budget) / raw.budget) * 100;
  return { value: raw.actual, priorPeriod: raw.priorPeriod, budget: raw.budget, variance };
}

export async function financialAggregator(
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
    inputSnapshot: (state.rawData.financials ?? null) as Record<string, unknown> | null ?? undefined,
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: 'Loading raw financial data from scenario…', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);

  const rawFinancials = state.rawData.financials as RawFinancials | undefined;

  if (!rawFinancials) {
    const stateDelta: Partial<BoardState> = {};
    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: 'No financial data in scenario.',
      stateDelta,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent);
    return stateDelta;
  }

  const nim = buildMetric(rawFinancials.nim);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Computing NIM variance: ${rawFinancials.nim.actual}% actual vs ${rawFinancials.nim.budget}% budget…`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);

  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `NIM variance ${nim.variance.toFixed(2)}%`, detail: nim.variance < -5 ? 'FLAG: variance below −5% threshold' : 'Within threshold', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const roa = buildMetric(rawFinancials.roa);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Computing ROA variance: ${rawFinancials.roa.actual}% actual vs ${rawFinancials.roa.budget}% budget…`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);

  const roe = buildMetric(rawFinancials.roe);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `ROE: ${rawFinancials.roe.actual}% actual vs ${rawFinancials.roe.budget}% budget → variance ${roe.variance.toFixed(2)}%`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const nonInterestIncome = buildMetric(rawFinancials.nonInterestIncome);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Non-interest income: ${rawFinancials.nonInterestIncome.actual}% vs budget ${rawFinancials.nonInterestIncome.budget}%`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const efficiencyRatio = buildMetric(rawFinancials.efficiencyRatio);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Efficiency ratio: ${rawFinancials.efficiencyRatio.actual}% vs 60% ceiling`, detail: rawFinancials.efficiencyRatio.actual > 60 ? 'FLAG: exceeds 60% ceiling' : 'Within threshold', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);

  const flags: string[] = [];
  if (nim.variance < -5) {
    flags.push(`NIM variance ${nim.variance.toFixed(1)}% below budget threshold (−5%)`);
  }
  if (efficiencyRatio.value > 60) {
    flags.push(`Efficiency ratio ${efficiencyRatio.value.toFixed(1)}% exceeds 60% ceiling`);
  }

  const ragStatus: RAGStatus = flags.length === 0 ? 'green' : flags.length === 1 ? 'amber' : 'red';
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `RAG classification: ${ragStatus.toUpperCase()} (${flags.length} flag${flags.length !== 1 ? 's' : ''})`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(200);

  const financialMetrics: FinancialMetrics = {
    nim,
    roa,
    roe,
    nonInterestIncome,
    efficiencyRatio,
    ragStatus,
    flags,
  };

  const stateDelta: Partial<BoardState> = { financialMetrics };

  emit(runId, {
    type: 'node_completed',
    runId,
    nodeId: nodeMeta.id,
    nodeType: nodeMeta.type,
    label: nodeMeta.label,
    outputSummary: `Financial metrics computed. RAG: ${ragStatus}. Flags: ${flags.length}.`,
    stateDelta,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  } as SSEEvent);

  return stateDelta;
}
