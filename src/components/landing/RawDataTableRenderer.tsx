'use client';

import type { RawDataTable } from '@/data/agentRawInputData';

interface RawDataTableRendererProps {
  table: RawDataTable;
  compact?: boolean;
  dark?: boolean;
}

const LIGHT_STATUS: Record<string, React.CSSProperties> = {
  breach:  { background: '#FDEEF3', color: '#992A5C', fontWeight: 700 },
  flag:    { background: '#FFF5D6', color: '#D7761D' },
  ok:      { background: '#E1F5EE', color: '#0C7876' },
  overdue: { background: '#FDEEF3', color: '#992A5C', fontWeight: 700 },
  dim:     { color: '#BDBDBD' },
};

const DARK_STATUS: Record<string, React.CSSProperties> = {
  breach:  { background: 'rgba(229,55,107,0.15)', color: '#FF7096', fontWeight: 700 },
  flag:    { background: 'rgba(245,168,0,0.12)', color: '#FFD066' },
  ok:      { background: 'rgba(5,171,140,0.12)', color: '#5DDBB5' },
  overdue: { background: 'rgba(229,55,107,0.15)', color: '#FF7096', fontWeight: 700 },
  dim:     { color: 'rgba(255,255,255,0.5)' },
};

export function RawDataTableRenderer({ table, compact = false, dark = false }: RawDataTableRendererProps) {
  const fontSize = compact ? 11 : 12;
  const headerFontSize = compact ? 10 : 11;
  const cellPad = compact ? '5px 8px' : '7px 10px';
  const statusMap = dark ? DARK_STATUS : LIGHT_STATUS;

  // Color tokens
  const c = dark ? {
    title: '#FFFFFF',
    source: 'rgba(255,255,255,0.7)',
    headerBg: 'rgba(255,255,255,0.06)',
    headerText: 'rgba(255,255,255,0.75)',
    border: 'rgba(255,255,255,0.08)',
    rowEven: 'transparent',
    rowOdd: 'rgba(255,255,255,0.02)',
    cellText: 'rgba(255,255,255,0.85)',
    cellBorder: 'rgba(255,255,255,0.04)',
    sectionBg: 'rgba(255,255,255,0.04)',
    sectionText: 'rgba(255,255,255,0.7)',
    separatorBorder: 'rgba(255,255,255,0.1)',
    footnote: 'rgba(255,255,255,0.7)',
    footnoteBorder: 'rgba(255,255,255,0.06)',
  } : {
    title: '#011E41',
    source: '#828282',
    headerBg: '#011E41',
    headerText: '#FFFFFF',
    border: '#E0E0E0',
    rowEven: '#FFFFFF',
    rowOdd: '#FAFAFA',
    cellText: '#333333',
    cellBorder: '#F4F4F4',
    sectionBg: '#F4F4F4',
    sectionText: '#828282',
    separatorBorder: '#BDBDBD',
    footnote: '#828282',
    footnoteBorder: '#E0E0E0',
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Title + source meta */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: c.title, marginBottom: 3 }}>
          {table.title}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: 'var(--font-mono)', color: c.source }}>
          <span>{table.sourceLabel}</span>
          <span>&middot;</span>
          <span>As of {table.asOfDate}</span>
        </div>
      </div>

      {/* Scrollable table */}
      <div style={{ overflowX: 'auto', border: `1px solid ${c.border}`, borderRadius: compact ? 12 : 6 }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize,
            fontFamily: 'var(--font-body)',
            minWidth: table.headers.length > 5 ? 700 : undefined,
          }}
        >
          <thead>
            <tr>
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: i === 0 ? 'left' : 'right',
                    padding: cellPad,
                    fontSize: headerFontSize,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: c.headerBg,
                    color: c.headerText,
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    borderBottom: `1px solid ${c.border}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => {
              if (row.sectionHeader) {
                const label = row.cells[0]?.value ?? '';
                return (
                  <tr key={rowIdx}>
                    <td
                      colSpan={table.headers.length}
                      style={{
                        background: c.sectionBg,
                        color: c.sectionText,
                        fontSize: headerFontSize,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: cellPad,
                        borderTop: rowIdx > 0 ? `1px solid ${c.border}` : undefined,
                      }}
                    >
                      {label}
                    </td>
                  </tr>
                );
              }

              const isEven = rowIdx % 2 === 0;
              return (
                <tr
                  key={rowIdx}
                  style={{
                    background: isEven ? c.rowEven : c.rowOdd,
                    borderTop: row.separator ? `1px solid ${c.separatorBorder}` : undefined,
                  }}
                >
                  {row.cells.map((cell, cellIdx) => {
                    const statusStyle = cell.status && cell.status !== 'normal' ? statusMap[cell.status] ?? {} : {};
                    const indent = cell.indent === 2 ? 44 : cell.indent === 1 ? 24 : 0;

                    return (
                      <td
                        key={cellIdx}
                        style={{
                          padding: cellPad,
                          paddingLeft: cellIdx === 0 && indent > 0 ? indent : undefined,
                          textAlign: cellIdx === 0 ? 'left' : 'right',
                          fontWeight: cell.bold ? 700 : undefined,
                          fontFamily: cell.mono ? 'var(--font-mono)' : undefined,
                          whiteSpace: 'nowrap',
                          borderBottom: `1px solid ${c.cellBorder}`,
                          color: c.cellText,
                          ...statusStyle,
                        }}
                      >
                        {cell.value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      {table.footnote && (
        <div
          style={{
            fontSize: 11,
            color: c.footnote,
            fontStyle: 'italic',
            paddingTop: 8,
            borderTop: `1px solid ${c.footnoteBorder}`,
            marginTop: 8,
          }}
        >
          {table.footnote}
        </div>
      )}
    </div>
  );
}
