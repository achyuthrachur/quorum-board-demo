'use client';

import { Lock } from 'lucide-react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { cn } from '@/lib/utils';

const NODE_ORDER = [
  'meta_agent',
  'financial_aggregator',
  'capital_monitor',
  'credit_quality',
  'trend_analyzer',
  'regulatory_digest',
  'operational_risk',
  'supervisor',
  'hitl_gate',
  'report_compiler',
];

interface AgentSelectorProps {
  selectedNodes: string[];
  onChange: (nodes: string[]) => void;
}

export function AgentSelector({ selectedNodes, onChange }: AgentSelectorProps) {
  const MIN_NODES = 2;

  function toggle(nodeId: string) {
    if (nodeId === 'meta_agent') return; // locked

    const isSelected = selectedNodes.includes(nodeId);
    if (isSelected) {
      // Don't deselect if it would drop below minimum
      const nonMetaSelected = selectedNodes.filter((n) => n !== 'meta_agent');
      if (nonMetaSelected.length <= MIN_NODES) return;
      onChange(selectedNodes.filter((n) => n !== nodeId));
    } else {
      onChange([...selectedNodes, nodeId]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-[10px] uppercase tracking-widest"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
      >
        Toggle nodes — meta_agent always on
      </p>
      <div className="flex flex-wrap gap-2">
        {NODE_ORDER.map((nodeId) => {
          const meta = NODE_REGISTRY[nodeId];
          if (!meta) return null;

          const isLocked = nodeId === 'meta_agent';
          const isSelected = selectedNodes.includes(nodeId);
          const nonMetaSelected = selectedNodes.filter((n) => n !== 'meta_agent');
          const canDeselect = !isLocked && nonMetaSelected.length > MIN_NODES;
          const wouldDisable = isSelected && !canDeselect && !isLocked;

          return (
            <button
              key={nodeId}
              type="button"
              onClick={() => toggle(nodeId)}
              disabled={isLocked}
              title={
                isLocked
                  ? 'meta_agent is always required'
                  : wouldDisable
                    ? `Minimum ${MIN_NODES} nodes required`
                    : undefined
              }
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] transition-all',
                isSelected
                  ? 'text-white'
                  : 'border-white/10 bg-transparent text-white/40',
                isLocked && 'cursor-not-allowed',
                !isLocked && !wouldDisable && 'cursor-pointer hover:opacity-90',
                wouldDisable && !isLocked && 'cursor-not-allowed opacity-50',
              )}
              style={
                isSelected
                  ? {
                      borderColor: `${meta.color}60`,
                      backgroundColor: `${meta.color}18`,
                      color: meta.color,
                      fontFamily: 'var(--font-mono)',
                    }
                  : { fontFamily: 'var(--font-mono)' }
              }
            >
              {isLocked ? (
                <Lock size={9} />
              ) : (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? meta.color : 'rgba(255,255,255,0.25)' }}
                />
              )}
              {meta.label}
            </button>
          );
        })}
      </div>
      <p className="text-[9px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {selectedNodes.length} / {NODE_ORDER.length} nodes selected
      </p>
    </div>
  );
}
