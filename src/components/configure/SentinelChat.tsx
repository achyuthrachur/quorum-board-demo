'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'sentinel' | 'user';
  text: string;
}

interface SentinelChatProps {
  currentScenarioId: string;
  onScenarioRecommended: (id: string) => void;
}

const INITIAL_MESSAGE: Message = {
  role: 'sentinel',
  text: 'Hello. Tell me about your meeting — the type, any specific areas of focus, or anything unusual this quarter that should be in scope.',
};

export function SentinelChat({ currentScenarioId, onScenarioRecommended }: SentinelChatProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isThinking) return;
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setIsThinking(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, currentScenarioId }),
      });
      const data = await res.json() as { reply?: string; recommendedScenarioId?: string; error?: string };
      const reply = data.reply ?? (data.error ? `Error: ${data.error}` : 'Something went wrong.');
      setMessages((prev) => [...prev, { role: 'sentinel', text: reply }]);
      if (data.recommendedScenarioId) onScenarioRecommended(data.recommendedScenarioId);
    } catch {
      setMessages((prev) => [...prev, { role: 'sentinel', text: 'Unable to connect. Please check your configuration.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Chat header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Sentinel agent
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#05AB8C', fontFamily: 'var(--font-mono)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#05AB8C', display: 'inline-block' }} />
          Ready
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 10,
          paddingRight: 2,
        }}
      >
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} style={{ display: 'flex', gap: 6, flexDirection: isUser ? 'row-reverse' : 'row' }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 700,
                  flexShrink: 0,
                  border: '1.5px solid',
                  background: isUser ? 'rgba(245,168,0,0.12)' : 'rgba(177,79,197,0.12)',
                  borderColor: isUser ? 'rgba(245,168,0,0.4)' : 'rgba(177,79,197,0.4)',
                  color: isUser ? '#F5A800' : '#B14FC5',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {isUser ? 'A' : 'S'}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: 'rgba(255,255,255,0.8)',
                    background: isUser ? 'rgba(245,168,0,0.07)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isUser ? 'rgba(245,168,0,0.15)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: isUser ? '8px 0 8px 8px' : '0 8px 8px 8px',
                    padding: '8px 10px',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        {isThinking && (
          <div style={{ display: 'flex', gap: 6 }}>
            <div
              style={{
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, flexShrink: 0,
                border: '1.5px solid rgba(177,79,197,0.4)',
                background: 'rgba(177,79,197,0.12)', color: '#B14FC5',
                fontFamily: 'var(--font-mono)',
              }}
            >
              S
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0 8px 8px 8px', padding: '8px 10px',
                }}
              >
                Thinking…
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6,
          padding: '7px 10px',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          placeholder="Describe your meeting context..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
          disabled={isThinking}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
          }}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isThinking || !inputValue.trim()}
          style={{
            width: 24, height: 24,
            background: isThinking || !inputValue.trim() ? 'rgba(255,255,255,0.1)' : '#F5A800',
            border: 'none', borderRadius: 4,
            cursor: isThinking || !inputValue.trim() ? 'not-allowed' : 'pointer',
            color: isThinking || !inputValue.trim() ? 'rgba(255,255,255,0.3)' : '#011E41',
            fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
