'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, GripVertical } from 'lucide-react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { useDroppable } from '@dnd-kit/core';

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9', algorithmic: '#05AB8C', hybrid: '#54C0E8',
  llm: '#F5A800', orchestrator: '#B14FC5', human: '#E5376B',
};

const COL_ORDER: Record<string, number> = {
  meta_agent: 0,
  financial_aggregator: 1, capital_monitor: 1, credit_quality: 1,
  trend_analyzer: 2, regulatory_digest: 2, operational_risk: 2,
  supervisor: 3, hitl_gate: 4, report_compiler: 5,
};

const EDGE_CSS = `
@keyframes dashFlow {
  to { stroke-dashoffset: -20; }
}
.custom-edge-animated {
  stroke-dasharray: 8 4;
  animation: dashFlow 0.6s linear infinite;
}
`;

interface CustomBuilderCanvasProps {
  customAgents: string[];
  onReset: () => void;
}

export function CustomBuilderCanvas({ customAgents, onReset }: CustomBuilderCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop' });

  const layout = useMemo(() => {
    const colMap = new Map<number, string[]>();
    for (const id of customAgents) {
      const col = COL_ORDER[id] ?? 3;
      if (!colMap.has(col)) colMap.set(col, []);
      colMap.get(col)!.push(id);
    }
    return [...colMap.entries()].sort((a, b) => a[0] - b[0]);
  }, [customAgents]);

  const isEmpty = customAgents.length === 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: isOver ? '#E8E8F0' : '#F0F0F4',
        overflow: 'auto',
        transition: 'background 0.2s',
      }}
    >
      <style>{EDGE_CSS}</style>

      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #DDDDE2 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Reset */}
      {!isEmpty && (
        <motion.button
          type="button"
          onClick={onReset}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'absolute', top: 16, right: 20, zIndex: 20,
            display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px',
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
            border: '1px solid #E0E0E0', borderRadius: 10,
            fontSize: 11, fontFamily: 'var(--font-mono)', color: '#666', cursor: 'pointer',
          }}
        >
          <RotateCcw size={12} /> Reset canvas
        </motion.button>
      )}

      {/* Header */}
      <div style={{
        position: 'absolute', top: 16, left: 20, zIndex: 10,
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)',
        padding: '10px 18px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#011E41' }}>
          Custom graph · {customAgents.length} agents
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#888', marginTop: 2 }}>
          {isEmpty ? 'Drag agents from the palette or click to add' : `${layout.length} stages configured`}
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <motion.div
            animate={{ borderColor: isOver ? '#F5A800' : '#CCC' }}
            style={{
              width: 420, height: 220,
              border: '2px dashed #CCC', borderRadius: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10,
              transition: 'border-color 0.2s',
            }}
          >
            <motion.div animate={{ scale: isOver ? 1.2 : 1 }} style={{ fontSize: 36, color: isOver ? '#F5A800' : '#DDD' }}>+</motion.div>
            <div style={{ fontSize: 15, color: isOver ? '#F5A800' : '#AAA', fontFamily: 'var(--font-body)' }}>
              {isOver ? 'Drop here!' : 'Drag agents here to build your graph'}
            </div>
            <div style={{ fontSize: 11, color: '#CCC', fontFamily: 'var(--font-mono)' }}>Or click agents in the palette</div>
          </motion.div>
        </div>
      )}

      {/* Graph layout */}
      {!isEmpty && (
        <div style={{ position: 'relative', zIndex: 10, padding: '80px 40px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {layout.map(([colIdx, agents], ci) => (
              <div key={colIdx} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                  {agents.map((id, ri) => {
                    const meta = NODE_REGISTRY[id];
                    if (!meta) return null;
                    const color = TYPE_COLOR[meta.type] ?? meta.color;
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, scale: 0.85, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: ci * 0.12 + ri * 0.06, type: 'spring', damping: 22, stiffness: 300 }}
                        style={{
                          width: 220, height: 90,
                          background: 'linear-gradient(135deg, #011E41 0%, #001530 100%)',
                          borderRadius: 16, padding: '14px 16px',
                          position: 'relative',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}60)`, borderRadius: '16px 16px 0 0' }} />
                        <div style={{ position: 'absolute', top: 10, right: 10, color: 'rgba(255,255,255,0.2)', cursor: 'grab' }}>
                          <GripVertical size={12} />
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, background: `${color}15`, padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}20` }}>{meta.badgeLabel}</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginTop: 8, fontFamily: 'var(--font-body)', lineHeight: 1.2 }}>{meta.label}</div>
                        <div style={{ position: 'absolute', bottom: 10, right: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, opacity: 0.6 }} />
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.35)' }}>idle</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {/* Arrow to next column */}
                {ci < layout.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: (ci + 1) * 0.15 }}
                    style={{ width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <svg width={48} height={20}>
                      <line x1={0} y1={10} x2={34} y2={10} stroke="#555" strokeWidth={2} className="custom-edge-animated" />
                      <polygon points="34,5 46,10 34,15" fill="#555" />
                    </svg>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
