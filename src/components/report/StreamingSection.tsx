'use client';

import { useEffect, useRef } from 'react';
import type { ReportSection } from '@/types/state';

const RAG_COLORS: Record<string, { bg: string; text: string; label: string; border: string }> = {
  red:   { bg: 'rgba(229,55,107,0.08)', text: '#E5376B', label: 'RED',   border: 'rgba(229,55,107,0.2)' },
  amber: { bg: 'rgba(245,168,0,0.08)',  text: '#F5A800', label: 'AMBER', border: 'rgba(245,168,0,0.2)' },
  green: { bg: 'rgba(5,171,140,0.08)',  text: '#05AB8C', label: 'GREEN', border: 'rgba(5,171,140,0.2)' },
};

interface StreamingSectionProps {
  section: ReportSection;
  index: number;
  isActive: boolean;
  sectionRef?: (el: HTMLDivElement | null) => void;
}

export function StreamingSection({ section, index, isActive, sectionRef }: StreamingSectionProps) {
  const rag = section.ragStatus ? RAG_COLORS[section.ragStatus] : null;
  const cursorRef = useRef<HTMLSpanElement>(null);

  // Blink cursor only while streaming
  useEffect(() => {
    if (!cursorRef.current) return;
    cursorRef.current.style.opacity = section.isStreaming ? '1' : '0';
  }, [section.isStreaming]);

  return (
    <div
      id={`section-${section.id}`}
      ref={sectionRef}
      style={{ marginBottom: 40 }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `2px solid ${isActive ? '#011E41' : '#E0E0E0'}`,
          paddingBottom: 10,
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#BDBDBD',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              minWidth: 24,
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: '#011E41',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {section.title}
          </h2>
          {section.isStreaming && (
            <span
              style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                color: '#F5A800',
                letterSpacing: '0.08em',
                animation: 'pulse 1.2s ease-in-out infinite',
              }}
            >
              STREAMING
            </span>
          )}
        </div>
        {rag && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              padding: '3px 10px',
              borderRadius: 3,
              background: rag.bg,
              color: rag.text,
              border: `1px solid ${rag.border}`,
              flexShrink: 0,
            }}
          >
            {rag.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.75,
          color: '#4F4F4F',
        }}
      >
        {section.content ? (
          section.content.split('\n\n').map((para, i, arr) => (
            <p key={i} style={{ margin: '0 0 14px 0' }}>
              {para}
              {/* Blinking cursor on the last paragraph while streaming */}
              {i === arr.length - 1 && section.isStreaming && (
                <span
                  ref={cursorRef}
                  style={{
                    display: 'inline-block',
                    width: 2,
                    height: '1em',
                    background: '#011E41',
                    marginLeft: 2,
                    verticalAlign: 'text-bottom',
                    animation: 'blink 0.8s step-end infinite',
                  }}
                />
              )}
            </p>
          ))
        ) : (
          section.isStreaming ? (
            <p style={{ margin: '0 0 14px 0', color: '#BDBDBD' }}>
              <span
                ref={cursorRef}
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: '1em',
                  background: '#011E41',
                  verticalAlign: 'text-bottom',
                  animation: 'blink 0.8s step-end infinite',
                }}
              />
            </p>
          ) : (
            <p style={{ margin: 0, color: '#BDBDBD', fontStyle: 'italic' }}>No content.</p>
          )
        )}
      </div>

      {/* Metrics table if present */}
      {section.metrics && Object.keys(section.metrics).length > 0 && (
        <div style={{ marginTop: 16, borderTop: '1px solid #E0E0E0', paddingTop: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(section.metrics).map(([key, val]) => (
              <div
                key={key}
                style={{
                  background: '#F4F4F4',
                  border: '1px solid #E0E0E0',
                  borderRadius: 4,
                  padding: '5px 10px',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#828282',
                    fontFamily: 'var(--font-mono)',
                    marginRight: 6,
                  }}
                >
                  {key}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#011E41',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
