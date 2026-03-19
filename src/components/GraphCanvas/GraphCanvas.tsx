'use client';

import '@xyflow/react/dist/style.css';

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  type Node,
} from '@xyflow/react';
import { AnimatePresence, motion } from 'motion/react';
import { Brain } from 'lucide-react';

import { useExecutionStore } from '@/store/executionStore';
import { SCENARIOS } from '@/data/scenarios';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { DeterministicNode } from './nodes/DeterministicNode';
import { AlgorithmicNode } from './nodes/AlgorithmicNode';
import { LLMNode } from './nodes/LLMNode';
import { HybridNode } from './nodes/HybridNode';
import { OrchestratorNode } from './nodes/OrchestratorNode';
import { HITLNode } from './nodes/HITLNode';
import { AnimatedEdge } from './AnimatedEdge';
import { GraphLegend } from './GraphLegend';
import { MetaAgentReveal } from './MetaAgentReveal';
import { SwitchAnnotation } from './SwitchAnnotation';
// GraphDiffPanel removed — replaced by log toggle in header
import { ParallelGroupNode, ParallelLabelNode } from './GraphParallelGrouping';

// ─── Node + Edge Type Registries ─────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  deterministicNode:  DeterministicNode,
  algorithmicNode:    AlgorithmicNode,
  llmNode:            LLMNode,
  hybridNode:         HybridNode,
  orchestratorNode:   OrchestratorNode,
  hitlNode:           HITLNode,
  parallelGroupNode:  ParallelGroupNode,
  parallelLabelNode:  ParallelLabelNode,
};

const edgeTypes: EdgeTypes = {
  animatedEdge: AnimatedEdge,
};

// ─── Node dimensions (must match computeColumnLayout defaults) ────────────────

const NODE_W = 210;
const NODE_H = 100;
const PAD_X  = 14;
const PAD_Y  = 12;
const LABEL_OFFSET = 26; // px above group rect

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyCanvas() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <motion.div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: '#B14FC510', border: '1px solid rgba(177,79,197,0.25)' }}
        animate={{ boxShadow: ['0 0 0px 0px #B14FC500', '0 0 18px 4px #B14FC525', '0 0 0px 0px #B14FC500'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Brain size={22} style={{ color: 'rgba(177,79,197,0.5)' }} strokeWidth={1.5} />
      </motion.div>
      <div className="text-center">
        <p className="text-sm font-bold" style={{ color: '#4F4F4F', fontFamily: 'var(--font-display)' }}>
          Select a scenario to begin
        </p>
        <p className="mt-1 text-xs" style={{ color: '#828282', fontFamily: 'var(--font-mono)' }}>
          Meta-agent will construct the graph
        </p>
      </div>
    </div>
  );
}

// ─── Graph canvas ─────────────────────────────────────────────────────────────

export function GraphCanvas() {
  const nodes = useExecutionStore((s) => s.nodes);
  const edges = useExecutionStore((s) => s.edges);
  const onNodesChange = useExecutionStore((s) => s.onNodesChange);
  const onEdgesChange = useExecutionStore((s) => s.onEdgesChange);
  const showReveal = useExecutionStore((s) => s.showReveal);
  const revealRationale = useExecutionStore((s) => s.revealRationale);
  const revealNodeCount = useExecutionStore((s) => s.revealNodeCount);
  const dismissReveal = useExecutionStore((s) => s.dismissReveal);
  const switchAnnotation = useExecutionStore((s) => s.switchAnnotation);
  const setSelectedNodeId = useExecutionStore((s) => s.setSelectedNodeId);
  const selectedScenarioId = useExecutionStore((s) => s.selectedScenarioId);

  const hasGraph = nodes.length > 0;

  // ── Parallel group overlay nodes ──────────────────────────────────────────
  const parallelOverlayNodes = useMemo<Node[]>(() => {
    if (!hasGraph || !selectedScenarioId) return [];

    const scenario = SCENARIOS.find((s) => s.id === selectedScenarioId);
    const visualColumns = scenario?.visualColumns;
    if (!visualColumns) return [];

    const result: Node[] = [];

    // Build a position map from the existing nodes in the store
    const posMap = new Map<string, { x: number; y: number }>();
    for (const n of nodes) {
      posMap.set(n.id, n.position);
    }

    visualColumns.forEach((col, colIdx) => {
      if (col.length < 2) return;

      const colPositions = col
        .map((id) => posMap.get(id))
        .filter((p): p is { x: number; y: number } => p !== undefined);

      if (colPositions.length < 2) return;

      const minX = Math.min(...colPositions.map((p) => p.x));
      const minY = Math.min(...colPositions.map((p) => p.y));
      const maxY = Math.max(...colPositions.map((p) => p.y));

      const groupW = NODE_W + PAD_X * 2;
      const groupH = maxY - minY + NODE_H + PAD_Y * 2;

      // Background rect
      result.push({
        id: `_pg_rect_${colIdx}`,
        type: 'parallelGroupNode',
        position: { x: minX - PAD_X, y: minY - PAD_Y },
        data: { width: groupW, height: groupH },
        draggable: false,
        selectable: false,
        connectable: false,
        zIndex: -1,
      } as Node);

      // Label above
      result.push({
        id: `_pg_label_${colIdx}`,
        type: 'parallelLabelNode',
        position: { x: minX - PAD_X, y: minY - PAD_Y - LABEL_OFFSET },
        data: {},
        draggable: false,
        selectable: false,
        connectable: false,
        zIndex: -1,
      } as Node);
    });

    return result;
  }, [hasGraph, selectedScenarioId, nodes]);

  const allNodes = useMemo(
    () => [...parallelOverlayNodes, ...nodes],
    [parallelOverlayNodes, nodes],
  );

  return (
    <div className="relative h-full w-full" style={{ background: '#F4F4F4' }}>
      {/* Subtle animated grid background */}
      <AnimatedGridPattern
        className="absolute inset-0 h-full w-full opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,white_40%,transparent_80%)]"
        numSquares={40}
        maxOpacity={0.5}
        duration={4}
        width={32}
        height={32}
      />

      <AnimatePresence>
        {!hasGraph && !showReveal && !switchAnnotation && (
          <motion.div
            key="empty"
            className="absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyCanvas />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasGraph && (
          <motion.div
            key="flow"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute inset-0 bottom-0" style={{ paddingBottom: 0 }}>
              <ReactFlow
                nodes={allNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(_evt, node) => {
                  // Only trigger for real agent nodes, not overlay nodes
                  if (!node.id.startsWith('_pg_')) {
                    setSelectedNodeId(node.id);
                  }
                }}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.22 }}
                minZoom={0.3}
                maxZoom={2}
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag
                zoomOnScroll
                proOptions={{ hideAttribution: true }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={1.5}
                  color="rgba(1,30,65,0.12)"
                />
              </ReactFlow>
            </div>

            {/* Legend — overlays the canvas, bottom-left */}
            <GraphLegend />


          </motion.div>
        )}
      </AnimatePresence>

      {/* Switch annotation overlay */}
      <SwitchAnnotation annotation={switchAnnotation} />

      {/* MetaAgentReveal overlay */}
      <MetaAgentReveal
        visible={showReveal}
        rationale={revealRationale}
        nodeCount={revealNodeCount}
        onDismiss={dismissReveal}
      />
    </div>
  );
}
