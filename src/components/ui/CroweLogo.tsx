'use client';

interface CroweLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CONFIG = {
  sm: {
    crowe: 'text-base',
    sentinel: 'text-xs',
    dividerHeight: 'h-4',
    gap: 'gap-2',
  },
  md: {
    crowe: 'text-xl',
    sentinel: 'text-sm',
    dividerHeight: 'h-5',
    gap: 'gap-3',
  },
  lg: {
    crowe: 'text-4xl',
    sentinel: 'text-xl',
    dividerHeight: 'h-9',
    gap: 'gap-4',
  },
};

export function CroweLogo({ size = 'md', className }: CroweLogoProps) {
  const config = SIZE_CONFIG[size];

  return (
    <div className={`flex items-center ${config.gap} ${className ?? ''}`}>
      <span
        className={`font-extrabold tracking-wider ${config.crowe}`}
        style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
      >
        CROWE
      </span>
      <div
        className={`${config.dividerHeight} w-px shrink-0`}
        style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
      />
      <span
        className={`font-normal tracking-widest ${config.sentinel}`}
        style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}
      >
        SENTINEL
      </span>
    </div>
  );
}
