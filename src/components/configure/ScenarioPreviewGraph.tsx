'use client';

import '@xyflow/react/dist/style.css';

import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type NodeTypes,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { computeColumnLayout } from '@/store/executionStore';
import type { ScenarioData } from '@/types/scenarios';

// ─── Node type color map ──────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────

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
        bottom: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#002E62',
        border: `1px solid ${data.color}40`,
        borderLeft: `3px solid ${data.color}`,
        borderRadius: 6,
        padding: '10px 12px',
        width: 230,
        zIndex: 9999,
        pointerEvents: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span
          style={{
            height: 18,
            padding: '0 6px',
            background: `${data.color}20`,
            border: `1px solid ${data.color}40`,
            borderRadius: 3,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: data.color,
            display: 'inline-flex',
            alignItems: 'center',
            textTransform: 'uppercase',
          }}
        >
          {data.badgeLabel}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{data.label}</span>
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginBottom: data.dataSources || data.formulaHint ? 8 : 0 }}>
        {data.description}
      </p>
      {data.formulaHint && (
        <div
          style={{
            background: 'rgba(245,168,0,0.08)',
            border: '1px solid rgba(245,168,0,0.2)',
            borderRadius: 4,
            padding: '5px 8px',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: '#F5A800',
            marginBottom: data.dataSources ? 6 : 0,
            lineHeight: 1.4,
          }}
        >
          {data.formulaHint}
        </div>
      )}
      {data.dataSources && data.dataSources.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
            Data sources
          </div>
          {data.dataSources.map((src, i) => (
            <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, display: 'flex', gap: 4 }}>
              <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>·</span>
              <span>{src}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Preview node ─────────────────────────────────────────────────────────────

interface PreviewNodeData {
  label: string;
  badgeLabel: string;
  color: string;
  description: string;
  dataSources?: string[];
  formulaHint?: string;
  [key: string]: unknown;
}

function PreviewNode({ data }: NodeProps) {
  const d = data as PreviewNodeData;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative' }}
    >
      {hovered && <Tooltip data={d} />}
      <div
        style={{
          width: 160,
          height: 72,
          background: 'rgba(0,46,98,0.85)',
          borderLeft: `3px solid ${d.color}`,
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderRight: '1px solid rgba(255,255,255,0.10)',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '0 8px 8px 0',
          padding: '10px 12px',
          opacity: hovered ? 1 : 0.55,
          transition: 'opacity 0.15s',
          cursor: 'default',
        }}
      >
        {/* Badge */}
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: d.color,
            marginBottom: 5,
            opacity: 0.85,
          }}
        >
          {d.badgeLabel}
        </div>
        {/* Label */}
        <div
          style={{
            fontSize: 12,
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.2,
          }}
        >
          {d.label}
        </div>
        {/* Status dot */}
        <div style={{ position: 'absolute', bottom: 8, right: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: d.color, display: 'inline-block', opacity: 0.5 }} />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            idle
          </span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 6, height: 6 }} />
    </div>
  );
}

const previewNodeTypes: NodeTypes = {
  previewNode: PreviewNode,
};

// ─── Edge derivation from column layout ───────────────────────────────────────

function deriveEdges(visualColumns: string[][]): Edge[] {
  const edges: Edge[] = [];
  for (let col = 0; col < visualColumns.length - 1; col++) {
    const fromNodes = visualColumns[col];
    const toNodes = visualColumns[col + 1];
    for (const from of fromNodes) {
      for (const to of toNodes) {
        const isConditional =
          (from === 'supervisor' && to === 'hitl_gate') ||
          (from === 'supervisor' && to === 'report_compiler');
        edges.push({
          id: `${from}--${to}`,
          source: from,
          target: to,
          type: 'smoothstep',
          label: isConditional
            ? (to === 'hitl_gate' ? 'PROCEED' : 'SKIP HITL')
            : undefined,
          labelStyle: isConditional
            ? { fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }
            : undefined,
          labelBgStyle: isConditional
            ? { fill: '#011E41', fillOpacity: 0.9 }
            : undefined,
          style: isConditional
            ? { stroke: 'rgba(245,168,0,0.5)', strokeWidth: 1.5, strokeDasharray: '6 3' }
            : { stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1.5 },
        });
      }
    }
  }
  return edges;
}

// ─── ScenarioPreviewGraph ─────────────────────────────────────────────────────

interface ScenarioPreviewGraphProps {
  scenario: ScenarioData;
}

export function ScenarioPreviewGraph({ scenario }: ScenarioPreviewGraphProps) {
  const visualColumns = scenario.visualColumns ?? [scenario.expectedNodes];
  const agentDataSources = scenario.agentDataSources ?? {};

  const nodes: Node[] = useMemo(() => {
    const positions = computeColumnLayout(visualColumns, 160, 72, 120, 20);
    return scenario.expectedNodes.map((id) => {
      const meta = NODE_REGISTRY[id];
      if (!meta) return null;
      const pos = positions.get(id) ?? { x: 0, y: 0 };
      return {
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
        },
        draggable: false,
        selectable: false,
        connectable: false,
      };
    }).filter(Boolean) as Node[];
  }, [scenario.expectedNodes, visualColumns, agentDataSources]);

  const edges: Edge[] = useMemo(() => deriveEdges(visualColumns), [visualColumns]);

  const nodeCount = scenario.expectedNodes.length;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Panel header */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 20,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          Agent orchestration — {scenario.label} · {nodeCount} nodes
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={previewNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background color="rgba(255,255,255,0.04)" gap={24} />
      </ReactFlow>
    </div>
  );
}
