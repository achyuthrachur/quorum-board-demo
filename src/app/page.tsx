'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'motion/react';
import { AppHeader } from '@/components/layout/AppHeader';
import ShaderBackground from '@/components/shader-background';
import { SpecialText } from '@/components/ui/special-text';

// ─── Agent diagram node data ──────────────────────────────────────────────────

const DIAGRAM_NODES = [
  { color: '#B14FC5', type: 'Orchestrator', name: 'Graph constructor',    icon: '⬡', status: '#B14FC5' },
  { color: '#0075C9', type: 'Rules engine',  name: 'Financial performance', icon: '⚙', status: '#05AB8C' },
  { color: '#0075C9', type: 'Rules engine',  name: 'Capital and liquidity', icon: '⚙', status: '#05AB8C' },
  { color: '#05AB8C', type: 'ML scoring',    name: 'Credit quality',        icon: '◈', status: '#05AB8C' },
  { color: '#F5A800', type: 'AI agent',      name: 'Regulatory digest',     icon: '◉', status: 'rgba(255,255,255,0.2)' },
  { color: '#E5376B', type: 'Human review',  name: 'CFO review gate',       icon: '◎', status: 'rgba(255,255,255,0.2)' },
];

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
      {/* Shader animation — fixed behind hero, covered by sections below */}
      <ShaderBackground />

      <AppHeader rightContent={<HeaderNav />} />

      {/* ── HERO ── always dark — explicit background so it's never washed out by body theme */}
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
            {/* SENTINEL wordmark with scramble reveal */}
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
                { value: '8',    label: 'Specialized agents' },
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

          {/* RIGHT — Agent diagram card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              background: 'rgba(0,46,98,0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: 32,
            }}
          >
            <div
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
                marginBottom: 24, fontFamily: 'var(--font-mono)',
              }}
            >
              Agent graph — Falcon Board (8 nodes)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DIAGRAM_NODES.map((node, i) => (
                <div key={node.name}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderLeft: `3px solid ${node.color}`,
                      borderRadius: 6, padding: '10px 14px',
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, background: `${node.color}26`, color: node.color }}>
                      {node.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 2, fontFamily: 'var(--font-mono)', color: node.color }}>
                        {node.type}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{node.name}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.status, flexShrink: 0 }} />
                  </div>
                  {i < DIAGRAM_NODES.length - 1 && (
                    <div style={{ marginLeft: 24, height: 8, borderLeft: '1px solid rgba(255,255,255,0.12)' }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── white section covers shader when scrolled */}
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
                <div style={{ display: 'inline-block', marginTop: 14, padding: '3px 10px', borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', background: step.badgeBg, color: step.badgeColor }}>
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
