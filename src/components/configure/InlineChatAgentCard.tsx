'use client';

import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { SCENARIOS } from '@/data/scenarios';

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9', algorithmic: '#05AB8C', hybrid: '#54C0E8',
  llm: '#F5A800', orchestrator: '#B14FC5', human: '#E5376B',
};

interface InlineChatAgentCardProps {
  agentId: string;
  onAdd: (id: string) => void;
  onSkip: (id: string) => void;
  alreadyAdded: boolean;
}

export function InlineChatAgentCard({ agentId, onAdd, onSkip, alreadyAdded }: InlineChatAgentCardProps) {
  const agent = NODE_REGISTRY[agentId];
  if (!agent) return null;

  const color = TYPE_COLOR[agent.type] ?? agent.color;
  const dataSources = SCENARIOS[0].agentDataSources?.[agentId] ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        width: 320,
        background: '#FFFFFF',
        border: '1px solid #E0E0E0',
        borderLeft: `3px solid ${color}`,
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 10,
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>{agent.badgeLabel}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', fontFamily: 'var(--font-body)' }}>{agent.label}</span>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 12, color: '#333', lineHeight: 1.6, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {agent.description}
        </p>

        {dataSources.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#AAA', marginBottom: 4 }}>Data sources</div>
            {dataSources.slice(0, 3).map((src, i) => (
              <div key={i} style={{ fontSize: 11, color: '#666', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                <span style={{ color: '#CCC', flexShrink: 0 }}>&bull;</span>
                <span>{src}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {alreadyAdded ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: '#EFFAF5', borderRadius: 8, width: 'fit-content' }}>
            <Check size={14} color="#0A7B61" strokeWidth={2.5} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0A7B61' }}>Added</span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => onAdd(agentId)}
              style={{
                height: 34,
                padding: '0 18px',
                background: '#011E41',
                color: '#FFFFFF',
                borderRadius: 8,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Check size={13} strokeWidth={2.5} /> Add to graph
            </button>
            <button
              type="button"
              onClick={() => onSkip(agentId)}
              style={{
                height: 34,
                padding: '0 14px',
                background: 'transparent',
                color: '#999',
                borderRadius: 8,
                border: '1px solid #DDD',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
