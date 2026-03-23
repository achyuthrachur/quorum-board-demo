'use client';

interface OrbitDot {
  color: string;
  rx: number;
  ry: number;
  duration: number;
  size: number;
  opacity: number;
  phase: number;
}

// One dot per agent, using their theme colors
const DOTS: OrbitDot[] = [
  { color: '#B14FC5', rx: 300, ry: 130, duration: 28, size: 7, opacity: 0.7, phase: 0 },
  { color: '#0075C9', rx: 380, ry: 100, duration: 35, size: 5, opacity: 0.5, phase: 0.1 },
  { color: '#0075C9', rx: 220, ry: 150, duration: 23, size: 4, opacity: 0.4, phase: 0.22 },
  { color: '#05AB8C', rx: 420, ry: 110, duration: 40, size: 6, opacity: 0.5, phase: 0.35 },
  { color: '#54C0E8', rx: 260, ry: 170, duration: 30, size: 4, opacity: 0.4, phase: 0.45 },
  { color: '#F5A800', rx: 350, ry: 140, duration: 33, size: 8, opacity: 0.65, phase: 0.55 },
  { color: '#F5A800', rx: 180, ry: 80, duration: 20, size: 4, opacity: 0.35, phase: 0.62 },
  { color: '#B14FC5', rx: 450, ry: 160, duration: 45, size: 5, opacity: 0.35, phase: 0.72 },
  { color: '#E5376B', rx: 280, ry: 120, duration: 26, size: 6, opacity: 0.55, phase: 0.82 },
  { color: '#F5A800', rx: 480, ry: 180, duration: 50, size: 4, opacity: 0.25, phase: 0.92 },
];

function buildKeyframes(): string {
  return DOTS.map((dot, i) => {
    const steps = 8;
    const frames = Array.from({ length: steps + 1 }, (_, k) => {
      const t = k / steps;
      const angle = t * Math.PI * 2;
      const x = dot.rx * Math.cos(angle);
      const y = dot.ry * Math.sin(angle);
      return `${(t * 100).toFixed(1)}% { transform: translate(${x.toFixed(1)}px, ${y.toFixed(1)}px); }`;
    });
    return `@keyframes orbit-dot-${i} { ${frames.join(' ')} }`;
  }).join('\n');
}

const KEYFRAMES_CSS = buildKeyframes();

export function FloatingOrbit() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {DOTS.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: dot.size,
            height: dot.size,
            borderRadius: '50%',
            background: dot.color,
            opacity: dot.opacity,
            boxShadow: `0 0 ${dot.size * 3}px ${dot.color}, 0 0 ${dot.size * 8}px ${dot.color}30`,
            animation: `orbit-dot-${i} ${dot.duration}s linear infinite`,
            animationDelay: `${-dot.phase * dot.duration}s`,
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
    </div>
  );
}
