'use client';

import {
  Network,
  TrendingUp,
  Shield,
  BarChart3,
  Activity,
  FileText,
  AlertTriangle,
  GitBranch,
  UserCheck,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { NodeMeta } from '@/types/graph';

const AGENT_ICONS: Record<string, LucideIcon> = {
  meta_agent: Network,
  financial_aggregator: TrendingUp,
  capital_monitor: Shield,
  credit_quality: BarChart3,
  trend_analyzer: Activity,
  regulatory_digest: FileText,
  operational_risk: AlertTriangle,
  supervisor: GitBranch,
  hitl_gate: UserCheck,
  report_compiler: BookOpen,
};

export { AGENT_ICONS };

const TYPE_MODEL: Record<string, string> = {
  llm: 'AI synthesis agent',
  hybrid: 'Math + AI hybrid',
  orchestrator: 'Routing logic',
  deterministic: 'Rules engine',
  algorithmic: 'Scoring algorithm',
  human: 'Human-in-the-loop',
};

// Darker variants for on-white text contrast (WCAG AA)
const ACCESSIBLE_TEXT_COLOR: Record<string, string> = {
  '#F5A800': '#B07800', // amber → dark amber
  '#54C0E8': '#0A7EA8', // cyan → dark cyan
  '#FFD231': '#9A7500', // bright amber → dark gold
};

// Acronym-free descriptions for the landing page cards
const LANDING_DESCRIPTIONS: Record<string, string> = {
  financial_aggregator: 'Computes net interest margin, return on assets, return on equity, non-interest income, and efficiency ratio from raw financial data.',
  capital_monitor: 'Evaluates common equity tier 1, tier 1 capital, total capital, liquidity coverage, and net stable funding ratios against regulatory thresholds.',
  credit_quality: 'Scores credit portfolio health using non-performing loan ratios, provision coverage, net charge-off ratios, and concentration risk.',
  regulatory_digest: 'Synthesizes open regulatory actions, overdue items, and upcoming exams into a regulatory risk narrative.',
  supervisor: 'Reviews all node outputs, decides whether to loop back for refinement or proceed to the human review gate.',
  hitl_gate: 'Pauses execution for board-level human review and approval before final report compilation.',
};

const LANDING_BADGES: Record<string, string> = {
  ml_scoring: 'SCORING',
};

interface AgentCardContentProps {
  agent: NodeMeta;
  dataSources?: string[];
  isActive?: boolean;
}

export function AgentCardContent({ agent, dataSources, isActive }: AgentCardContentProps) {
  const Icon = AGENT_ICONS[agent.id] ?? Network;
  const color = agent.color;
  const textColor = ACCESSIBLE_TEXT_COLOR[color] ?? color;
  const description = LANDING_DESCRIPTIONS[agent.id] ?? agent.description;
  const badgeLabel = agent.badgeLabel === 'ML SCORING' ? (LANDING_BADGES['ml_scoring'] ?? agent.badgeLabel) : agent.badgeLabel;
  const label = agent.id === 'hitl_gate' ? 'Human Review Gate' : agent.label;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: 0,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #E0E0E0',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative',
      }}
    >
      {/* ── Top hero area with gradient + icon ── */}
      <div
        style={{
          height: 160,
          background: `linear-gradient(135deg, ${color}18 0%, ${color}08 50%, transparent 100%)`,
          borderBottom: `3px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative ring behind icon */}
        <div
          style={{
            position: 'absolute',
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: `2px solid ${color}15`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 160,
            height: 160,
            borderRadius: '50%',
            border: `1px solid ${color}08`,
          }}
        />
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: '#FFFFFF',
            border: `2px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 16px ${color}25`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Icon size={36} color={color} strokeWidth={1.5} />
        </div>

        {/* Badge top-right */}
        <span
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            fontSize: 8,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            background: color,
            borderRadius: 4,
            padding: '4px 10px',
          }}
        >
          {badgeLabel}
        </span>
      </div>

      {/* ── Content area ── */}
      <div style={{ padding: '18px 22px 16px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Label */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#011E41',
            fontFamily: 'var(--font-body)',
            marginBottom: 3,
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>

        {/* Type line */}
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: textColor,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          {TYPE_MODEL[agent.type] ?? agent.type}
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 12,
            color: '#4F4F4F',
            lineHeight: 1.65,
            margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical' as const,
          }}
        >
          {description}
        </p>

        {/* Data source tags */}
        {dataSources && dataSources.length > 0 && (
          <div
            style={{
              marginTop: 'auto',
              paddingTop: 10,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 5,
            }}
          >
            {dataSources.slice(0, 2).map((src, i) => (
              <span
                key={i}
                style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  color: '#4F4F4F',
                  background: '#F4F4F4',
                  border: '1px solid #E0E0E0',
                  borderRadius: 3,
                  padding: '3px 8px',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {src}
              </span>
            ))}
          </div>
        )}

      </div>

      {/* Corner peel decoration — shown on active card */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ position: 'absolute', bottom: 0, right: 0, pointerEvents: 'none' }}
          >
            {/* Outer fold — agent color hint */}
            <div style={{
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '0 0 40px 40px',
              borderColor: `transparent transparent ${color}40 transparent`,
            }} />
            {/* Inner fold — paper thickness illusion */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '0 0 32px 32px',
              borderColor: 'transparent transparent rgba(255,255,255,0.9) transparent',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
