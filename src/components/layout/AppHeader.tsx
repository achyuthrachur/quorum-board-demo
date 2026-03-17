'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { StepNav } from './StepNav';

const WORKFLOW_ROUTES = ['/configure', '/build', '/execute', '/review', '/report'];

interface AppHeaderProps {
  rightContent?: ReactNode;
  centerContent?: ReactNode;
}

export function AppHeader({ rightContent, centerContent }: AppHeaderProps) {
  const pathname = usePathname();
  const isWorkflowPage = WORKFLOW_ROUTES.includes(pathname);

  const center = isWorkflowPage ? <StepNav /> : centerContent;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-16 items-center px-6"
      style={{ backgroundColor: '#011E41' }}
    >
      <div className="flex items-center gap-3">
        <Image
          src="/crowe-logo-white.svg"
          alt="Crowe"
          height={22}
          width={79}
          priority
        />
        <span style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>|</span>
        <span
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: '0.06em',
          }}
        >
          Sentinel
        </span>
      </div>

      {center && (
        <div className="absolute left-1/2 -translate-x-1/2">
          {center}
        </div>
      )}

      {rightContent && (
        <div className="ml-auto flex items-center gap-4">
          {rightContent}
        </div>
      )}
    </header>
  );
}
