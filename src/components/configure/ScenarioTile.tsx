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
        border: `1px solid ${isSelected ? 'rgba(245,168,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isSelected ? '0 0 0 1px rgba(245,168,0,0.15)' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Accent bar */}
      {isSelected && (
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: '#F5A800', borderRadius: '14px 0 0 14px' }} />
      )}

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 6, minWidth: 0 }}>
        <span
          style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isSelected ? '#F5A800' : 'rgba(255,255,255,0.4)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {meetingType}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span
            style={{
              height: 20,
              padding: '0 8px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 20,
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {agentCount} agents
          </span>
          {hitlRequired && (
            <span
              style={{
                height: 20,
                padding: '0 8px',
                background: 'rgba(229,55,107,0.1)',
                borderRadius: 20,
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#E5376B',
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              Review
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 14,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>
    </div>
  );
}
