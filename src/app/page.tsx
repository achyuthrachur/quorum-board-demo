'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
import { AppHeader } from '@/components/layout/AppHeader';
import ShaderBackground from '@/components/shader-background';
import { SpecialText } from '@/components/ui/special-text';
import { AgentGallery } from '@/components/landing/AgentGallery';
import { FloatingOrbit } from '@/components/landing/FloatingOrbit';
import { GradientOrbs } from '@/components/landing/GradientOrbs';

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { label: 'Orchestrate', color: '#B14FC5' },
  { label: 'Compute', color: '#0075C9' },
  { label: 'Synthesize', color: '#F5A800' },
  { label: 'Review', color: '#E5376B' },
];

// ─── How it works steps ───────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01 — Orchestration',
    accentColor: '#B14FC5',
    title: 'Graph constructor assembles your agent graph',
    desc: 'An orchestrator agent evaluates your meeting type and builds the minimum set of agents needed. Full board gets 8 nodes. Flash report gets 3.',
    badgeBg: '#F3E8FF', badgeColor: '#612080', badge: 'Orchestrator',
  },
  {
    num: '02 — Deterministic',
    accentColor: '#0075C9',
    title: 'Rules engines compute financials and capital',
    desc: 'Net interest margin, return on assets, capital ratios, liquidity coverage \u2014 calculated with formulas you can see and verify. No AI involved at this stage. Math is math.',
    badgeBg: '#E6F1FB', badgeColor: '#0050AD', badge: 'Rules engine',
  },
  {
    num: '03 — AI synthesis',
    accentColor: '#F5A800',
    title: 'AI agents synthesize regulatory and risk data',
    desc: 'AI agents read open regulatory actions, exam timelines and incident logs. They flag what is board-reportable and escalate what is overdue.',
    badgeBg: '#FFF5D6', badgeColor: '#D7761D', badge: 'AI agent',
  },
  {
    num: '04 — Human review',
    accentColor: '#E5376B',
    title: 'Executive review gate before final compilation',
    desc: 'Execution pauses. The chief financial officer approves or revises the draft. Only then does the report compiler produce the final package.',
    badgeBg: '#FDEEF3', badgeColor: '#992A5C', badge: 'Human in the loop',
  },
];

// ─── Page-level CSS animations ────────────────────────────────────────────────

const PAGE_CSS = `
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(245,168,0,0.4), 0 0 60px rgba(245,168,0,0.12); }
  50% { box-shadow: 0 0 40px rgba(245,168,0,0.6), 0 0 100px rgba(245,168,0,0.2); }
}
@keyframes pulse-travel {
  0% { left: -2%; opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { left: 102%; opacity: 0; }
}
@keyframes pulse-travel-reverse {
  0% { right: -2%; opacity: 0; }
  10% { opacity: 0.4; }
  90% { opacity: 0.4; }
  100% { right: 102%; opacity: 0; }
}
@keyframes connector-pulse {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}
`;

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

// ─── Animated pipeline preview ────────────────────────────────────────────────

function PipelinePreview() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      marginBottom: 48,
    }}>
      {PIPELINE_STAGES.map((stage, i) => (
        <Fragment key={stage.label}>
          {/* Node */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            transition={{ delay: 0.8 + i * 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 0 0 ${stage.color}00`,
                  `0 0 24px 6px ${stage.color}40`,
                  `0 0 0 0 ${stage.color}00`,
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeInOut',
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: `2px solid ${stage.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${stage.color}10`,
              }}
            >
              <div style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: stage.color,
                boxShadow: `0 0 10px ${stage.color}`,
              }} />
            </motion.div>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: stage.color,
              fontFamily: 'var(--font-mono)',
            }}>
              {stage.label}
            </span>
          </motion.div>

          {/* Connector line between nodes */}
          {i < PIPELINE_STAGES.length - 1 && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.0 + i * 0.2, duration: 0.4 }}
              style={{
                width: 64,
                height: 2,
                marginBottom: 26,
                transformOrigin: 'left',
                background: `linear-gradient(90deg, ${stage.color}, ${PIPELINE_STAGES[i + 1].color})`,
                opacity: 0.5,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Animated pulse along the connector */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`,
                backgroundSize: '200% 100%',
                animation: 'connector-pulse 2s linear infinite',
                animationDelay: `${1.5 + i * 0.3}s`,
              }} />
            </motion.div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

// ─── Header nav ───────────────────────────────────────────────────────────────

function HeaderNav() {
  return (
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
  );
}

// ─── Stats data ───────────────────────────────────────────────────────────────

const STATS = [
  { value: '10', label: 'Specialized agents' },
  { value: '3', label: 'Meeting types' },
  { value: '1', label: 'Human review gate' },
  { value: 'Full', label: 'Execution trace' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [showAgents, setShowAgents] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Parallax scroll transforms
  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 500], [0, -120]);
  const subtitleY = useTransform(scrollY, [0, 500], [0, -70]);
  const pipelineY = useTransform(scrollY, [0, 500], [0, -45]);
  const ctaY = useTransform(scrollY, [0, 500], [0, -30]);
  const statsY = useTransform(scrollY, [0, 500], [0, -10]);

  // How it works scroll trigger
  const howRef = useRef<HTMLDivElement>(null);
  const howInView = useInView(howRef, { once: true, margin: '-80px' });

  const handleMeetAgents = () => {
    if (showAgents) {
      setShowAgents(false);
    } else {
      setShowAgents(true);
      setTimeout(() => {
        galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)', color: '#333333' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <ShaderBackground />
      <AppHeader rightContent={<HeaderNav />} />

      {/* ── SECTION 1: HERO ── */}
      <section
        style={{
          position: 'relative',
          paddingTop: 64,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Dark radial overlay for text readability over shader */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(1,30,65,0.88) 0%, rgba(1,30,65,0.95) 50%, rgba(1,30,65,0.98) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Background effects */}
        <GradientOrbs />
        <FloatingOrbit />

        <div
          style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: '80px 48px 72px',
            textAlign: 'center',
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Title with parallax */}
          <motion.div style={{ y: titleY, marginBottom: 16 }}>
            <span
              style={{
                color: '#F5A800',
                fontFamily: 'var(--font-display)',
                fontSize: 72,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              <SpecialText className="tracking-tight">QUORUM</SpecialText>
            </span>
          </motion.div>

          {/* Subtitles with parallax */}
          <motion.div style={{ y: subtitleY }}>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{
                fontSize: 22,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 8,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              Board intelligence platform
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 40,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
              }}
            >
              Multi-agent AI that builds board packages for financial institutions
            </motion.p>
          </motion.div>

          {/* Animated pipeline preview */}
          <motion.div style={{ y: pipelineY }}>
            <PipelinePreview />
          </motion.div>

          {/* CTAs with parallax + glowing primary button */}
          <motion.div style={{ y: ctaY }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                marginBottom: 56,
              }}
            >
              <Link href="/configure">
                <button
                  type="button"
                  style={{
                    height: 52,
                    padding: '0 32px',
                    background: '#F5A800',
                    color: '#011E41',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    animation: 'glow-pulse 2.5s ease-in-out infinite',
                  }}
                >
                  Start the demo
                  <span
                    style={{
                      background: '#011E41',
                      color: '#F5A800',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                    }}
                  >
                    &rarr;
                  </span>
                </button>
              </Link>
              <button
                type="button"
                onClick={handleMeetAgents}
                style={{
                  height: 52,
                  padding: '0 28px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {showAgents ? 'Hide agents \u2191' : 'Meet the agents \u2193'}
              </button>
            </motion.div>
          </motion.div>

          {/* Stat strip with parallax + network pulse */}
          <motion.div style={{ y: statsY }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              style={{ position: 'relative' }}
            >
              {/* Network pulse decoration */}
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: '5%',
                  right: '5%',
                  height: 1,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(245,168,0,0.25) 20%, rgba(245,168,0,0.25) 80%, transparent 100%)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -3,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#F5A800',
                    boxShadow: '0 0 12px #F5A800, 0 0 24px rgba(245,168,0,0.3)',
                    animation: 'pulse-travel 5s linear infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: -2,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#54C0E8',
                    boxShadow: '0 0 8px #54C0E8',
                    animation: 'pulse-travel-reverse 7s linear infinite',
                    animationDelay: '-3s',
                  }}
                />
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'flex',
                  gap: 0,
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                  paddingTop: 32,
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {STATS.map((stat, i, arr) => (
                  <div
                    key={stat.label}
                    style={{
                      flex: 1,
                      maxWidth: 180,
                      paddingRight: i < arr.length - 1 ? 32 : 0,
                      marginRight: i < arr.length - 1 ? 32 : 0,
                      borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                    }}
                  >
                    <AnimatedStat value={stat.value} label={stat.label} />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: AGENT GALLERY ── */}
      <motion.div
        ref={galleryRef}
        initial={{ opacity: 0, y: 40 }}
        animate={showAgents ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          pointerEvents: showAgents ? 'auto' : 'none',
          background: '#011E41',
          overflow: 'hidden',
          ...(showAgents ? {} : { height: 0 }),
        }}
      >
        <AgentGallery />
      </motion.div>

      {/* ── SECTION 3: HOW IT WORKS (scroll-triggered stagger) ── */}
      <section id="how-it-works" style={{ background: '#FFFFFF', borderTop: '1px solid #E0E0E0' }}>
        <div ref={howRef} style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 48px' }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={howInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D7761D', marginBottom: 12 }}
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={howInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            style={{ fontSize: 34, fontWeight: 700, color: '#011E41', letterSpacing: '-0.02em', marginBottom: 8 }}
          >
            Four stages, one cohesive package
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={howInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            style={{ fontSize: 16, color: '#4F4F4F', marginBottom: 48, maxWidth: 560 }}
          >
            Each stage uses the right kind of intelligence — rules where math is math, AI where synthesis is needed.
          </motion.p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#BDBDBD', border: '1px solid #BDBDBD', borderRadius: 8, overflow: 'hidden' }}>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                animate={howInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: '#FFFFFF', padding: '28px 24px' }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#828282', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                  {step.num}
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={howInView ? { width: 32 } : { width: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: 3, borderRadius: 2, background: step.accentColor, marginBottom: 16 }}
                />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#011E41', marginBottom: 10, lineHeight: 1.3 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: '#4F4F4F', lineHeight: 1.6 }}>
                  {step.desc}
                </div>
                <div style={{ display: 'inline-block', marginTop: 14, padding: '3px 10px', borderRadius: 3, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', background: step.badgeBg, color: step.badgeColor }}>
                  {step.badge}
                </div>
              </motion.div>
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
            AI Innovation Team &middot; Quorum &middot; 2026
          </span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          Confidential — not for distribution
        </div>
      </footer>
    </div>
  );
}
