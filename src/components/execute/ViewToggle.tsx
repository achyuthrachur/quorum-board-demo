'use client';

import { GitBranch, LayoutGrid } from 'lucide-react';

interface ViewToggleProps {
  view: 'network' | 'agents';
  onChange: (v: 'network' | 'agents') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => onChange('network')}
        style={{
          height: 30,
          padding: '0 12px',
          background: view === 'network' ? 'rgba(245,168,0,0.2)' : 'transparent',
          color: view === 'network' ? '#F5A800' : 'rgba(255,255,255,0.5)',
          border: 'none',
          borderRight: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <GitBranch size={11} /> NETWORK
      </button>
      <button
        type="button"
        onClick={() => onChange('agents')}
        style={{
          height: 30,
          padding: '0 12px',
          background: view === 'agents' ? 'rgba(245,168,0,0.2)' : 'transparent',
          color: view === 'agents' ? '#F5A800' : 'rgba(255,255,255,0.5)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <LayoutGrid size={11} /> AGENTS
      </button>
    </div>
  );
}
