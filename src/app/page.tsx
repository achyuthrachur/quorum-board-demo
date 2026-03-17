'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'motion/react';
import { AppHeader } from '@/components/layout/AppHeader';
import ShaderBackground from '@/components/shader-background';
import { SpecialText } from '@/components/ui/special-text';
import { NODE_REGISTRY } from '@/data/nodeRegistry';

// ─── How it works steps ───────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01 — Orchestration',
    accentColor: '#B14FC5',
    title: 'Graph constructor assembles your agent graph',
    desc: 'A meta-agent evaluates your meeting type and builds the minimum set of agents needed. Full board gets 8 nodes. Flash report gets 3.',
    badgeBg: '#F3E8FF', badgeColor: '#612080', badge: 'Orchestrator',
  },
  {
    num: '02 — Deterministic',
    accentColor: '#0075C9',
    title: 'Rules engines compute financials and capital',
    desc: 'NIM, ROA, CET1, LCR — calculated with formulas you can see and verify. No LLM involved at this stage. Math is math.',
    badgeBg: '#E6F1FB', badgeColor: '#0050AD', badge: 'Rules engine',
  },
  {
    num: '03 — AI synthesis',
    accentColor: '#F5A800',
    title: 'AI agents synthesize regulatory and risk data',
    desc: 'LLM agents read open MRAs, exam timelines and incident logs. They flag what is board-reportable and escalate what is overdue.',
    badgeBg: '#FFF5D6', badgeColor: '#D7761D', badge: 'AI agent',
  },
  {
    num: '04 — Human review',
    accentColor: '#E5376B',
    title: 'CFO review gate before final compilation',
    desc: 'Execution pauses. The CFO approves or revises the draft. Only then does the report compiler produce the final package.',
    badgeBg: '#FDEEF3', badgeColor: '#992A5C', badge: 'Human in the loop',
  },
];

// ─── Animated stat counter ────────────────────────────────────────────────────

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const numeric = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numeric)) { setDisplay(value); return; }
    const suffix = value.replace(/[0-9]/g, '');
    let start = 0;
    const duration = 1200;
    const step = Math.ceil(numeric / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, numeric);
      setDisplay(`${start}${suffix}`);
      if (start >= numeric) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div ref={ref}>
      <div style={{ fontSize: 40, fontWeight: 700, color: '#F5A800', lineHeight: 1, marginBottom: 6, fontFamily: 'var(--font-display)' }}>
        {display}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
        {label}
      </div>
    </div>
  );
}

// ─── Animated hero graph preview ─────────────────────────────────────────────

const COLUMNS = [
  ['meta_agent'],
  ['financial_aggregator', 'capital_monitor', 'credit_quality'],
  ['trend_analyzer', 'regulatory_digest', 'operational_risk'],
  ['supervisor'],
  ['hitl_gate'],
  ['report_compiler'],
] as const;

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

const NODE_LABEL: Record<string, string> = {
  meta_agent:              'Meta Agent',
  financial_aggregator:    'Financial',
  capital_monitor:         'Capital',
  credit_quality:          'Credit',
  trend_analyzer:          'Trend',
  regulatory_digest:       'Regulatory',
  operational_risk:        'Op Risk',
  supervisor:              'Supervisor',
  hitl_gate:               'CFO Gate',
  report_compiler:         'Compiler',
};

const NODE_W = 84;
const NODE_H = 26;
const COL_X = [0, 94, 188, 282, 376, 470]; // left edge of each column
const CONTAINER_W = 470 + NODE_W; // 554
const CONTAINER_H = 156;
const ROW_GAP = 34;

// Compute node positions
const NODE_POS: Record<string, { x: number; y: number }> = {};
(COLUMNS as readonly (readonly string[])[]).forEach((col, colIdx) => {
  const totalH = col.length * NODE_H + (col.length - 1) * ROW_GAP;
  const startY = (CONTAINER_H - totalH) / 2;
  col.forEach((nodeId, rowIdx) => {
    NODE_POS[nodeId] = {
      x: COL_X[colIdx],
      y: startY + rowIdx * (NODE_H + ROW_GAP),
    };
  });
});

// Build edges: each node in col N → each node in col N+1
const GRAPH_EDGES: Array<{ from: string; to: string }> = [];
for (let c = 0; c < COLUMNS.length - 1; c++) {
  for (const from of COLUMNS[c]) {
    for (const to of COLUMNS[c + 1]) {
      GRAPH_EDGES.push({ from, to });
    }
  }
}

type NodeExecState = 'idle' | 'active' | 'completed';

// Animation phases: cumulative nodeStates + duration (ms)
const ANIM_PHASES: Array<{ nodeStates: Partial<Record<string, NodeExecState>>; duration: number }> = [
  { nodeStates: { meta_agent: 'active' }, duration: 800 },
  {
    nodeStates: {
      meta_agent: 'completed',
      financial_aggregator: 'active', capital_monitor: 'active', credit_quality: 'active',
    },
    duration: 1000,
  },
  {
    nodeStates: {
      meta_agent: 'completed',
      financial_aggregator: 'completed', capital_monitor: 'completed', credit_quality: 'completed',
      trend_analyzer: 'active', regulatory_digest: 'active', operational_risk: 'active',
    },
    duration: 1000,
  },
  {
    nodeStates: {
      meta_agent: 'completed',
      financial_aggregator: 'completed', capital_monitor: 'completed', credit_quality: 'completed',
      trend_analyzer: 'completed', regulatory_digest: 'completed', operational_risk: 'completed',
      supervisor: 'active',
    },
    duration: 800,
  },
  {
    nodeStates: {
      meta_agent: 'completed',
      financial_aggregator: 'completed', capital_monitor: 'completed', credit_quality: 'completed',
      trend_analyzer: 'completed', regulatory_digest: 'completed', operational_risk: 'completed',
      supervisor: 'completed', hitl_gate: 'active',
    },
    duration: 700,
  },
  {
    nodeStates: {
      meta_agent: 'completed',
      financial_aggregator: 'completed', capital_monitor: 'completed', credit_quality: 'completed',
      trend_analyzer: 'completed', regulatory_digest: 'completed', operational_risk: 'completed',
      supervisor: 'completed', hitl_gate: 'completed', report_compiler: 'active',
    },
    duration: 700,
  },
  {
    nodeStates: {
      meta_agent: 'completed',
      financial_aggregator: 'completed', capital_monitor: 'completed', credit_quality: 'completed',
      trend_analyzer: 'completed', regulatory_digest: 'completed', operational_risk: 'completed',
      supervisor: 'completed', hitl_gate: 'completed', report_compiler: 'completed',
    },
    duration: 1400,
  },
];

function getNodeStatesForPhase(phase: number): Record<string, NodeExecState> {
  const base: Record<string, NodeExecState> = {};
  Object.keys(NODE_POS).forEach((id) => { base[id] = 'idle'; });
  Object.assign(base, ANIM_PHASES[phase]?.nodeStates ?? {});
  return base;
}

function HeroGraphPreview() {
  const [phase, setPhase] = useState(0);
  const nodeStates = getNodeStatesForPhase(phase);

  useEffect(() => {
    const duration = ANIM_PHASES[phase]?.duration ?? 1000;
    const timer = setTimeout(() => {
      setPhase((p) => (p + 1) % ANIM_PHASES.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [phase]);

  const scale = 0.68;
  const scaledW = Math.ceil(CONTAINER_W * scale);
  const scaledH = Math.ceil(CONTAINER_H * scale);

  return (
    <div
      style={{
        background: 'rgba(0,46,98,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '24px 28px 28px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          marginBottom: 20,
          fontFamily: 'var(--font-mono)',
        }}
      >
        Falcon Board — live agent graph (10 nodes)
      </div>

      {/* Scaled graph container */}
      <div style={{ width: scaledW, height: scaledH, position: 'relative', overflow: 'visible' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CONTAINER_W,
            height: CONTAINER_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* SVG edges */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: CONTAINER_W, height: CONTAINER_H, pointerEvents: 'none' }}
          >
            {GRAPH_EDGES.map((edge) => {
              const from = NODE_POS[edge.from];
              const to = NODE_POS[edge.to];
              if (!from || !to) return null;
              const x1 = from.x + NODE_W;
              const y1 = from.y + NODE_H / 2;
              const x2 = to.x;
              const y2 = to.y + NODE_H / 2;
              const cx1 = x1 + (x2 - x1) * 0.45;
              const cx2 = x1 + (x2 - x1) * 0.55;
              const fromState = nodeStates[edge.from];
              const toState = nodeStates[edge.to];
              const isLive = fromState === 'active' || (fromState === 'completed' && toState === 'active');
              const isDone = fromState === 'completed' && toState === 'completed';
              const color = isLive
                ? (TYPE_COLOR[NODE_REGISTRY[edge.from]?.type ?? ''] ?? '#F5A800')
                : isDone
                ? '#05AB8C'
                : 'rgba(255,255,255,0.08)';
              const opacity = isLive ? 0.7 : isDone ? 0.25 : 1;
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  d={`M ${x1} ${y1} C ${cx1} ${y1} ${cx2} ${y2} ${x2} ${y2}`}
                  stroke={color}
                  strokeOpacity={opacity}
                  strokeWidth={isLive ? 1.5 : 1}
                  fill="none"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {Object.entries(NODE_POS).map(([nodeId, pos]) => {
            const meta = NODE_REGISTRY[nodeId];
            if (!meta) return null;
            const typeColor = TYPE_COLOR[meta.type] ?? '#8FE1FF';
            const execState = nodeStates[nodeId] ?? 'idle';
            const isActive = execState === 'active';
            const isDone = execState === 'completed';

            return (
              <div
                key={nodeId}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: NODE_W,
                  height: NODE_H,
                  borderRadius: 4,
                  border: `1px solid ${isActive ? `${typeColor}80` : isDone ? 'rgba(5,171,140,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  borderLeft: `3px solid ${isActive ? typeColor : isDone ? '#05AB8C' : 'rgba(255,255,255,0.12)'}`,
                  background: isActive
                    ? `${typeColor}18`
                    : isDone
                    ? 'rgba(5,171,140,0.07)'
                    : 'rgba(255,255,255,0.03)',
                  boxShadow: isActive ? `0 0 10px ${typeColor}30` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 7,
                  transition: 'all 0.3s ease',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: isActive ? typeColor : isDone ? '#05AB8C' : 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {NODE_LABEL[nodeId] ?? nodeId}
                </span>
                {isActive && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: typeColor,
                      boxShadow: `0 0 6px ${typeColor}`,
                      flexShrink: 0,
                      marginLeft: 'auto',
                      marginRight: 7,
                      animation: 'pulse 0.8s ease-in-out infinite',
                    }}
                  />
                )}
                {isDone && (
                  <span
                    style={{
                      fontSize: 8,
                      color: '#05AB8C',
                      flexShrink: 0,
                      marginLeft: 'auto',
                      marginRight: 7,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status strip */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
        }}
      >
        {[
          { color: TYPE_COLOR['orchestrator'] ?? '#B14FC5', label: 'Orchestrator' },
          { color: TYPE_COLOR['deterministic'] ?? '#0075C9', label: 'Rules' },
          { color: TYPE_COLOR['llm'] ?? '#F5A800', label: 'AI Agent' },
          { color: TYPE_COLOR['human'] ?? '#E5376B', label: 'Human' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, borderLeft: `3px solid ${item.color}`, background: `${item.color}20` }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Agent Roster section ─────────────────────────────────────────────────────

function AgentRoster() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const agents = Object.values(NODE_REGISTRY);

  return (
    <section ref={ref} style={{ background: '#011E41', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 48px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F5A800', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
            Agent roster
          </p>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: 8 }}>
            10 specialized agents, purpose-built for banking
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 40, maxWidth: 520 }}>
            Each agent handles exactly one domain. Deterministic where math is enough. AI where synthesis is required.
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 10,
          }}
        >
          {agents.map((agent, i) => {
            const typeColor = TYPE_COLOR[agent.type] ?? '#8FE1FF';
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft: `3px solid ${typeColor}`,
                  borderRadius: 5,
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: typeColor,
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 6,
                  }}
                >
                  {agent.badgeLabel}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)',
                    marginBottom: 6,
                    lineHeight: 1.25,
                  }}
                >
                  {agent.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.35)',
                    lineHeight: 1.55,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {agent.description}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Header nav ───────────────────────────────────────────────────────────────

function HeaderNav() {
  return (
    <>
      <nav className="hidden items-center gap-8 md:flex">
        {['Platform', 'Use cases', 'Documentation'].map((label) => (
          <a key={label} href="#" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, textDecoration: 'none' }}>
            {label}
          </a>
        ))}
      </nav>
      <Link href="/configure">
        <button
          type="button"
          style={{
            height: 36, padding: '0 20px',
            background: '#F5A800', color: '#011E41',
            fontFamily: 'var(--font-body)', fontWeight: 700,
            fontSize: 13, letterSpacing: '0.04em',
            border: 'none', borderRadius: 4, cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Enter platform
        </button>
      </Link>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'var(--font-body)', color: '#333333' }}>
      <ShaderBackground />

      <AppHeader rightContent={<HeaderNav />} />

      {/* ── HERO ── */}
      <section style={{ position: 'relative', paddingTop: 64, minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#011E41' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '80px 48px 72px',
            display: 'grid',
            gridTemplateColumns: '1fr 460px',
            gap: 80,
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* LEFT */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <span style={{ color: '#F5A800', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                <SpecialText className="tracking-widest uppercase">
                  SENTINEL — Board intelligence platform
                </SpecialText>
              </span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{
                fontWeight: 700, fontSize: 52, lineHeight: 1.05,
                color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: 20,
              }}
            >
              From fragmented data<br />
              to a{' '}
              <span style={{ color: '#F5A800' }}>board-ready</span> package
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              style={{ fontSize: 17, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', marginBottom: 40, maxWidth: 480 }}
            >
              A multi-agent AI system that aggregates financial, credit, capital,
              regulatory and operational data — then compiles polished board packages with
              human oversight built in at every step.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}
            >
              <Link href="/configure">
                <button
                  type="button"
                  style={{
                    height: 52, padding: '0 32px',
                    background: '#F5A800', color: '#011E41',
                    fontFamily: 'var(--font-body)', fontWeight: 700,
                    fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase',
                    border: 'none', borderRadius: 4, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  Start a board package
                  <span style={{ background: '#011E41', color: '#F5A800', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>→</span>
                </button>
              </Link>
              <a href="#how-it-works" style={{ textDecoration: 'none' }}>
                <button
                  type="button"
                  style={{
                    height: 52, padding: '0 28px',
                    background: 'transparent', color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'var(--font-body)', fontWeight: 600,
                    fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase',
                    border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 4, cursor: 'pointer',
                  }}
                >
                  Watch the demo
                </button>
              </a>
            </motion.div>

            {/* Stat strip */}
            <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 32 }}>
              {[
                { value: '10',   label: 'Specialized agents' },
                { value: '3',    label: 'Meeting types' },
                { value: '1',    label: 'Human review gate' },
                { value: '100%', label: 'Auditable' },
              ].map((stat, i, arr) => (
                <div
                  key={stat.label}
                  style={{
                    flex: 1,
                    paddingRight: i < arr.length - 1 ? 32 : 0,
                    marginRight: i < arr.length - 1 ? 32 : 0,
                    borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                  }}
                >
                  <AnimatedStat value={stat.value} label={stat.label} />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Animated graph preview */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <HeroGraphPreview />
          </motion.div>
        </div>
      </section>

      {/* ── AGENT ROSTER ── */}
      <AgentRoster />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: '#FFFFFF', borderTop: '1px solid #E0E0E0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 48px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D7761D', marginBottom: 12 }}>
            How it works
          </p>
          <h2 style={{ fontSize: 34, fontWeight: 700, color: '#011E41', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Four stages, one cohesive package
          </h2>
          <p style={{ fontSize: 16, color: '#4F4F4F', marginBottom: 48, maxWidth: 560 }}>
            Each stage uses the right kind of intelligence — rules where math is math, AI where synthesis is needed.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#BDBDBD', border: '1px solid #BDBDBD', borderRadius: 8, overflow: 'hidden' }}>
            {STEPS.map((step) => (
              <div key={step.num} style={{ background: '#FFFFFF', padding: '28px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#828282', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                  {step.num}
                </div>
                <div style={{ width: 32, height: 3, borderRadius: 2, background: step.accentColor, marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#011E41', marginBottom: 10, lineHeight: 1.3 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: '#4F4F4F', lineHeight: 1.6 }}>
                  {step.desc}
                </div>
                <div style={{ display: 'inline-block', marginTop: 14, padding: '3px 10px', borderRadius: 3, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', background: step.badgeBg, color: step.badgeColor }}>
                  {step.badge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#011E41', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/crowe-logo-white.svg" alt="Crowe" height={20} width={72} />
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
            AI Innovation Team · Sentinel · 2026
          </span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          Confidential — not for distribution
        </div>
      </footer>
    </div>
  );
}
