import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type { SSEEvent } from '@/types/events';
import { sleep } from '@/lib/graph/utils';
import { capitalMonitor } from './capitalMonitor';
import { creditQuality } from './creditQuality';
import { financialAggregator } from './financialAggregator';
import { hitlGate } from './hitlGate';
import { operationalRisk } from './operationalRisk';
import { regulatoryDigest } from './regulatoryDigest';
import { reportCompiler } from './reportCompiler';
import { supervisor } from './supervisor';
import { trendAnalyzer } from './trendAnalyzer';

export type NodeFn = (
  state: BoardState,
  config: RunnableConfig,
) => Promise<Partial<BoardState>>;

const metaAgentMeta = NODE_REGISTRY.meta_agent;

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

async function metaAgentNode(
  state: BoardState,
  config: RunnableConfig,
): Promise<Partial<BoardState>> {
  const runId = getRunId(state, config);
  const startedAt = Date.now();
  const timestamp = new Date(startedAt).toISOString();

  emit(
    runId,
    {
      type: 'node_started',
      runId,
      nodeId: metaAgentMeta.id,
      nodeType: metaAgentMeta.type,
      label: metaAgentMeta.label,
      inputSnapshot: { scenarioId: state.scenarioId, meetingType: state.meetingType },
      timestamp,
    } as SSEEvent,
  );

  emit(runId, { type: 'node_progress', runId, nodeId: metaAgentMeta.id, nodeType: metaAgentMeta.type, step: `Analyzing meeting type and scope requirements: ${state.meetingType}…`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(350);
  emit(runId, { type: 'node_progress', runId, nodeId: metaAgentMeta.id, nodeType: metaAgentMeta.type, step: `Selecting specialist agents for topology…`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);
  emit(runId, { type: 'node_progress', runId, nodeId: metaAgentMeta.id, nodeType: metaAgentMeta.type, step: `Computing optimal execution order: ${state.graphTopology?.nodes?.length ?? 0} nodes, ${state.graphTopology?.edges?.length ?? 0} edges`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);
  emit(runId, { type: 'node_progress', runId, nodeId: metaAgentMeta.id, nodeType: metaAgentMeta.type, step: 'Wiring agent connections and data flows…', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const stateDelta: Partial<BoardState> = {};

  emit(
    runId,
    {
      type: 'node_completed',
      runId,
      nodeId: metaAgentMeta.id,
      nodeType: metaAgentMeta.type,
      label: metaAgentMeta.label,
      outputSummary: `Graph topology assembled: ${state.graphTopology?.nodes?.length ?? 'N'} nodes optimised for ${state.meetingType}`,
      stateDelta,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent,
  );

  return stateDelta;
}

export const NODE_FUNCTIONS: Record<string, NodeFn> = {
  meta_agent: metaAgentNode,
  financial_aggregator: financialAggregator,
  capital_monitor: capitalMonitor,
  credit_quality: creditQuality,
  trend_analyzer: trendAnalyzer,
  regulatory_digest: regulatoryDigest,
  operational_risk: operationalRisk,
  supervisor,
  hitl_gate: hitlGate,
  report_compiler: reportCompiler,
};

export function getNodeFunction(nodeId: string): NodeFn | undefined {
  return NODE_FUNCTIONS[nodeId];
}
