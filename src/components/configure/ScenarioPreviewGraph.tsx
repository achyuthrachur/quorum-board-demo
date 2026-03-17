'use client';

import '@xyflow/react/dist/style.css';

import { useState, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Handle,
  Position,
  MarkerType,
  type NodeTypes,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { computeColumnLayout } from '@/store/executionStore';
import type { ScenarioData } from '@/types/scenarios';

// ─── Constants ───────────────────────────────────────────────────────────────

const NODE_W = 280;
const NODE_H = 115;
const COL_GAP = 60;
const ROW_GAP = 180;

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

const STAGE_NAMES = ['Orchestration', 'Data Collection', 'Synthesis', 'Review', 'Human Gate', 'Compilation'];

const LEGEND_ITEMS = [
  { color: '#B14FC5', label: 'Orchestrator' },
  { color: '#0075C9', label: 'Rules' },
  { color: '#05AB8C', label: 'Scoring' },
  { color: '#54C0E8', label: 'Hybrid' },
  { color: '#F5A800', label: 'AI Agent' },
  { color: '#E5376B', label: 'Human' },
];

// ─── Tooltip (frosted glass) ─────────────────────────────────────────────────

interface TooltipData {
  label: string;
  badgeLabel: string;
  color: string;
  description: string;
  dataSources?: string[];
  formulaHint?: string;
}

function Tooltip({ data }: { data: TooltipData }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 14px)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(1,30,65,0.92)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${data.color}30`,
        borderRadius: 14,
        padding: '14px 16px',
        width: 290,
        zIndex: 9999,
        pointerEvents: 'none',
        boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${data.color}15`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ height: 22, padding: '0 10px', background: `${data.color}20`, border: `1px solid ${data.color}35`, borderRadius: 20, fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', color: data.color, display: 'inline-flex', alignItems: 'center', textTransform: 'uppercase' }}>{data.badgeLabel}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{data.label}</span>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0, marginBottom: data.dataSources || data.formulaHint ? 10 : 0 }}>{data.description}</p>
      {data.formulaHint && (
        <div style={{ background: 'rgba(245,168,0,0.08)', border: '1px solid rgba(245,168,0,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontFamily: 'var(--font-mono)', color: '#F5A800', marginBottom: data.dataSources ? 8 : 0, lineHeight: 1.4 }}>{data.formulaHint}</div>
      )}
      {data.dataSources && data.dataSources.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Data sources</div>
          {data.dataSources.map((src, i) => (
            <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, display: 'flex', gap: 6 }}>
              <span style={{ color: data.color, flexShrink: 0, fontSize: 8, marginTop: 2 }}>&#9679;</span>
              <span>{src}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Preview node (elegant card) ─────────────────────────────────────────────

interface PreviewNodeData {
  label: string;
  badgeLabel: string;
  color: string;
  description: string;
  dataSources?: string[];
  formulaHint?: string;
  onNodeClick?: (nodeId: string) => void;
  nodeId?: string;
  [key: string]: unknown;
}

function PreviewNode({ data }: NodeProps) {
  const d = data as PreviewNodeData;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      <div
        style={{
          width: NODE_W,
          height: NODE_H,
          background: `linear-gradient(135deg, #011E41 0%, ${hovered ? '#002040' : '#001530'} 100%)`,
          borderRadius: 16,
          padding: '16px 20px',
          transition: 'all 0.2s ease',
          boxShadow: hovered
            ? `0 12px 32px rgba(0,0,0,0.25), 0 0 0 2px ${d.color}40, inset 0 1px 0 rgba(255,255,255,0.08)`
            : '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
          transform: hovered ? 'translateY(-2px)' : 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent gradient bar at top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${d.color}, ${d.color}60)`, borderRadius: '16px 16px 0 0' }} />

        {/* Badge pill */}
        <div style={{ marginBottom: 10, marginTop: 2 }}>
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: d.color,
            background: `${d.color}15`,
            padding: '3px 10px',
            borderRadius: 20,
            border: `1px solid ${d.color}25`,
          }}>
            {d.badgeLabel}
          </span>
        </div>

        {/* Label */}
        <div style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15 }}>{d.label}</div>

        {/* Status pill bottom-right */}
        <div style={{ position: 'absolute', bottom: 12, right: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, display: 'inline-block', opacity: 0.5, boxShadow: `0 0 6px ${d.color}40` }} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>idle</span>
        </div>

        {/* Subtle glow on hover */}
        {hovered && <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: `radial-gradient(ellipse at 30% 20%, ${d.color}08, transparent 70%)`, pointerEvents: 'none' }} />}
      </div>

      <Handle id="left" type="target" position={Position.Left} style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle id="top" type="source" position={Position.Top} style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle id="top-target" type="target" position={Position.Top} style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, width: 8, height: 8 }} />
    </div>
  );
}

// ─── Group background node (parallel indicator) ─────────────────────────────

function GroupNode({ data }: NodeProps) {
  const d = data as { width: number; height: number; [key: string]: unknown };
  return (
    <div style={{ width: d.width, height: d.height, background: 'rgba(0,0,0,0.03)', borderRadius: 20, border: '1px dashed rgba(0,0,0,0.06)' }} />
  );
}

// ─── Column header label node ────────────────────────────────────────────────

function ColumnHeaderNode({ data }: NodeProps) {
  const d = data as { label: string; [key: string]: unknown };
  return (
    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.04em', color: '#888', whiteSpace: 'nowrap' }}>
      {d.label}
    </div>
  );
}

const previewNodeTypes: NodeTypes = { previewNode: PreviewNode, groupNode: GroupNode, columnHeader: ColumnHeaderNode };

// ─── Edge derivation ─────────────────────────────────────────────────────────

const ARROW_MARKER = { type: MarkerType.ArrowClosed, color: '#333', width: 14, height: 14 };

function deriveEdges(visualColumns: string[][]): Edge[] {
  const edges: Edge[] = [];
  const allNodes = visualColumns.flat();
  const hasSupervisor = allNodes.includes('supervisor');
  const hasHitl = allNodes.includes('hitl_gate');
  const hasCompiler = allNodes.includes('report_compiler');

  for (let col = 0; col < visualColumns.length - 1; col++) {
    for (const from of visualColumns[col]) {
      for (const to of visualColumns[col + 1]) {
        const isProceed = from === 'supervisor' && to === 'hitl_gate';

        if (isProceed) {
          edges.push({
            id: `${from}--${to}--proceed`,
            source: from,
            sourceHandle: 'top',
            target: to,
            targetHandle: 'top-target',
            type: 'smoothstep',
            label: 'PROCEED',
            labelStyle: { fill: '#FFFFFF', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em' },
            labelBgStyle: { fill: '#F5A800', fillOpacity: 1, rx: 12, ry: 12 },
            labelBgPadding: [6, 12] as [number, number],
            style: { stroke: '#F5A800', strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#F5A800', width: 14, height: 14 },
          });
        } else {
          edges.push({
            id: `${from}--${to}`,
            source: from,
            target: to,
            type: 'smoothstep',
            style: { stroke: '#555', strokeWidth: 2 },
            markerEnd: ARROW_MARKER,
          });
        }
      }
    }
  }

  if (hasSupervisor && hasHitl && hasCompiler) {
    edges.push({
      id: 'supervisor--report_compiler--skip',
      source: 'supervisor',
      sourceHandle: 'bottom',
      target: 'report_compiler',
      targetHandle: 'bottom-target',
      type: 'smoothstep',
      label: 'SKIP HITL',
      labelStyle: { fill: '#FFFFFF', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em' },
      labelBgStyle: { fill: '#888', fillOpacity: 1, rx: 10, ry: 10 },
      labelBgPadding: [5, 10] as [number, number],
      style: { stroke: '#999', strokeWidth: 2, strokeDasharray: '8 4' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#999', width: 12, height: 12 },
    });
  }

  return edges;
}

// ─── Inner ReactFlow (has access to useReactFlow for fitView on change) ──────

function ReactFlowInner({ nodes, edges, onNodeClick, nodeCount }: {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (id: string) => void;
  nodeCount: number;
}) {
  const { fitView } = useReactFlow();

  // Re-fit whenever node count changes (agents added/removed)
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.02, maxZoom: 1.5, duration: 300 });
    }, 100);
    return () => clearTimeout(timer);
  }, [nodeCount, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={previewNodeTypes}
      onNodeClick={(_event, node) => onNodeClick?.(node.id)}
      fitView
      fitViewOptions={{ padding: 0.02, maxZoom: 1.5 }}
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      zoomOnDoubleClick={false}
      minZoom={0.3}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      proOptions={{ hideAttribution: true }}
      style={{ background: '#F0F0F4' }}
    >
      <Background color="#E2E2E8" gap={32} size={1.5} />
    </ReactFlow>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ScenarioPreviewGraphProps {
  scenario: ScenarioData;
  onNodeClick?: (nodeId: string) => void;
}

export function ScenarioPreviewGraph({ scenario, onNodeClick }: ScenarioPreviewGraphProps) {
  const visualColumns = scenario.visualColumns ?? [scenario.expectedNodes];
  const agentDataSources = scenario.agentDataSources ?? {};

  const nodes: Node[] = useMemo(() => {
    const positions = computeColumnLayout(visualColumns, NODE_W, NODE_H, COL_GAP, ROW_GAP);

    const result: Node[] = [];

    // Add group background rects for parallel columns (2+ nodes)
    const PAD = 16;
    visualColumns.forEach((col, colIdx) => {
      if (col.length < 2) return;
      const colPositions = col.map((id) => positions.get(id)).filter(Boolean) as { x: number; y: number }[];
      if (colPositions.length < 2) return;
      const minY = Math.min(...colPositions.map((p) => p.y));
      const maxY = Math.max(...colPositions.map((p) => p.y));
      result.push({
        id: `_group_${colIdx}`,
        type: 'groupNode',
        position: { x: colPositions[0].x - PAD, y: minY - PAD },
        data: { width: NODE_W + PAD * 2, height: maxY - minY + NODE_H + PAD * 2 },
        draggable: false,
        selectable: false,
        connectable: false,
        zIndex: -1,
      } as Node);
    });

    // Add agent nodes
    for (const id of scenario.expectedNodes) {
      const meta = NODE_REGISTRY[id];
      if (!meta) continue;
      const pos = positions.get(id) ?? { x: 0, y: 0 };
      result.push({
        id,
        type: 'previewNode',
        position: pos,
        data: {
          label: meta.label,
          badgeLabel: meta.badgeLabel,
          color: TYPE_COLOR[meta.type] ?? meta.color,
          description: meta.description,
          dataSources: agentDataSources[id],
          formulaHint: meta.formulaHint,
          onNodeClick,
          nodeId: id,
        },
        draggable: false,
        selectable: false,
        connectable: false,
      });
    }

    return result;
  }, [scenario.expectedNodes, visualColumns, agentDataSources, onNodeClick]);

  const edges: Edge[] = useMemo(() => deriveEdges(visualColumns), [visualColumns]);

  const columnHeaders = useMemo(() => {
    return visualColumns.map((col, i) => {
      const stageName = STAGE_NAMES[i] ?? `Stage ${String(i + 1).padStart(2, '0')}`;
      const parallel = col.length > 1 ? ` · ${col.length} parallel` : '';
      return `Stage ${String(i + 1).padStart(2, '0')} — ${stageName}${parallel}`;
    });
  }, [visualColumns]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#F0F0F4' }}>
      {/* Panel header — frosted pill */}
      <div style={{
        position: 'absolute', top: 16, left: 20, zIndex: 10,
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)',
        padding: '10px 18px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#011E41' }}>
          {scenario.label} · {scenario.expectedNodes.length} agents
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#888', marginTop: 2 }}>
          {columnHeaders.length} stages · Click any node for details
        </div>
      </div>

      {/* Legend — frosted pill */}
      <div style={{
        position: 'absolute', bottom: 16, left: 20, zIndex: 10,
        display: 'flex', gap: 16,
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)',
        padding: '10px 18px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 20, background: item.color, opacity: 0.8 }} />
            <span style={{ fontSize: 10, color: '#333', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      <ReactFlowProvider>
        <ReactFlowInner
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          nodeCount={scenario.expectedNodes.length}
        />
      </ReactFlowProvider>
    </div>
  );
}
