'use client';

interface ScenarioTileProps {
  id: string;
  meetingType: string;
  title: string;
  agentCount: number;
  hitlRequired?: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function ScenarioTile({
  meetingType,
  title,
  agentCount,
  hitlRequired,
  isSelected,
  onClick,
}: ScenarioTileProps) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: isSelected ? 'rgba(245,168,0,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isSelected ? 'rgba(245,168,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderLeft: `3px solid ${isSelected ? '#F5A800' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 6,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* Top row: meeting type + agent count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isSelected ? '#F5A800' : 'rgba(255,255,255,0.45)',
          }}
        >
          {meetingType}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              height: 20,
              padding: '0 7px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 3,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {agentCount} agents
          </span>
          {hitlRequired && (
            <span
              style={{
                height: 20,
                padding: '0 7px',
                background: 'rgba(229,55,107,0.15)',
                border: '1px solid rgba(229,55,107,0.3)',
                borderRadius: 3,
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#E5376B',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              HITL
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: title */}
      <div
        style={{
          fontSize: 14,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>
    </div>
  );
}
