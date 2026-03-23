'use client';

const CSS = `
@keyframes orb-drift-1 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(120px, 80px) scale(1.3); }
  100% { transform: translate(-40px, 120px) scale(1.1); }
}
@keyframes orb-drift-2 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-100px, 60px) scale(1.2); }
  100% { transform: translate(50px, -30px) scale(1.05); }
}
@keyframes orb-drift-3 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(70px, -70px) scale(1.15); }
  100% { transform: translate(-60px, 40px) scale(1.25); }
}
`;

export function GradientOrbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        width: 700,
        height: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,168,0,0.22) 0%, transparent 70%)',
        filter: 'blur(60px)',
        top: '-25%',
        left: '-10%',
        animation: 'orb-drift-1 25s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: 550,
        height: 550,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(5,171,140,0.16) 0%, transparent 70%)',
        filter: 'blur(60px)',
        top: '20%',
        right: '-15%',
        animation: 'orb-drift-2 30s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(177,79,197,0.14) 0%, transparent 70%)',
        filter: 'blur(60px)',
        bottom: '-15%',
        left: '25%',
        animation: 'orb-drift-3 28s ease-in-out infinite',
      }} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </div>
  );
}
