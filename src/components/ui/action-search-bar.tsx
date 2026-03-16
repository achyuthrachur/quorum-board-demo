'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface Action {
  id: string;
  label: string;
  description?: string;
}

interface ActionSearchBarProps {
  actions: Action[];
  onSelect: (id: string) => void;
  placeholder?: string;
}

export function ActionSearchBar({ actions, onSelect, placeholder = 'Search...' }: ActionSearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = query
    ? actions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : actions;

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#F4F4F4',
          border: '1.5px solid #BDBDBD',
          borderRadius: 6,
          padding: '8px 12px',
        }}
      >
        <Search size={14} color="#828282" />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: '#333333',
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#FFFFFF',
            border: '1.5px solid #BDBDBD',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {filtered.map((action) => (
            <button
              key={action.id}
              type="button"
              onMouseDown={() => { onSelect(action.id); setQuery(''); }}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #E0E0E0',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FFFBF0'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#011E41' }}>{action.label}</span>
              {action.description && (
                <span style={{ fontSize: 11, color: '#828282' }}>{action.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
