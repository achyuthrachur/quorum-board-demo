'use client';

import React from 'react';

export interface OrbitItem {
  icon: React.ReactNode;
  label: string;
  color?: string;
}

interface OrbitingSkillsProps {
  innerItems: OrbitItem[];
  outerItems: OrbitItem[];
  center?: React.ReactNode;
  innerGlow?: string;
  outerGlow?: string;
}

export function OrbitingSkills({
  innerItems,
  outerItems,
  center,
  innerGlow = '#0075C9',
  outerGlow = '#B14FC5',
}: OrbitingSkillsProps) {
  const INNER_RADIUS = 110;
  const OUTER_RADIUS = 190;

  return (
    <div style={{ position: 'relative', width: 440, height: 440, margin: '0 auto' }}>
      {/* Orbit rings */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: INNER_RADIUS * 2,
          height: INNER_RADIUS * 2,
          borderRadius: '50%',
          border: `1.5px solid ${innerGlow}40`,
          boxShadow: `0 0 20px ${innerGlow}20, inset 0 0 20px ${innerGlow}10`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: OUTER_RADIUS * 2,
          height: OUTER_RADIUS * 2,
          borderRadius: '50%',
          border: `1.5px solid ${outerGlow}40`,
          boxShadow: `0 0 20px ${outerGlow}20, inset 0 0 20px ${outerGlow}10`,
          pointerEvents: 'none',
        }}
      />

      {/* Center node */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#002E62',
          border: `2px solid ${innerGlow}60`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 24px ${innerGlow}40`,
          zIndex: 10,
        }}
      >
        {center}
      </div>

      {/* Inner orbit items */}
      {innerItems.map((item, i) => {
        const angle = (i / innerItems.length) * 360;
        const delay = (i / innerItems.length) * -20;
        return (
          <OrbitNode
            key={`inner-${i}`}
            item={item}
            radius={INNER_RADIUS}
            angle={angle}
            duration={20}
            delay={delay}
            glow={innerGlow}
          />
        );
      })}

      {/* Outer orbit items */}
      {outerItems.map((item, i) => {
        const angle = (i / outerItems.length) * 360;
        const delay = (i / outerItems.length) * -30;
        return (
          <OrbitNode
            key={`outer-${i}`}
            item={item}
            radius={OUTER_RADIUS}
            angle={angle}
            duration={30}
            delay={delay}
            glow={outerGlow}
          />
        );
      })}

      <style>{`
        @keyframes orbit {
          from { transform: translate(-50%, -50%) rotate(var(--start-angle)) translateX(var(--radius)) rotate(calc(-1 * var(--start-angle))); }
          to   { transform: translate(-50%, -50%) rotate(calc(var(--start-angle) + 360deg)) translateX(var(--radius)) rotate(calc(-1 * var(--start-angle) - 360deg)); }
        }
      `}</style>
    </div>
  );
}

function OrbitNode({
  item,
  radius,
  angle,
  duration,
  delay,
  glow,
}: {
  item: OrbitItem;
  radius: number;
  angle: number;
  duration: number;
  delay: number;
  glow: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        '--start-angle': `${angle}deg`,
        '--radius': `${radius}px`,
        animation: `orbit ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      } as React.CSSProperties}
    >
      <div
        style={{
          background: '#002E62',
          border: `1.5px solid ${glow}50`,
          borderRadius: 8,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          minWidth: 52,
          boxShadow: `0 0 12px ${glow}30`,
        }}
      >
        <div style={{ color: item.color ?? glow, display: 'flex' }}>{item.icon}</div>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          {item.label}
        </span>
      </div>
    </div>
  );
}
