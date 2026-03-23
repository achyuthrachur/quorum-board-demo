'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles } from 'lucide-react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { InlineChatAgentCard } from './InlineChatAgentCard';

interface Message {
  role: 'quorum' | 'user';
  text: string;
  recommendedAgentId?: string | null;
  skipped?: boolean;
}

interface QuorumChatProps {
  currentScenarioId: string;
  onScenarioRecommended: (id: string) => void;
  fullscreen?: boolean;
  chatAgents: string[];
  onAddAgent: (id: string) => void;
  visible?: boolean;
}

const INITIAL_MESSAGE: Message = {
  role: 'quorum',
  text: 'Hello! Tell me about your upcoming meeting \u2014 the type, any specific areas of focus, or anything unusual this quarter that should be in scope. I\u2019ll recommend the right agents for your package.',
};

const SUGGESTED = [
  'Full board quarterly package \u2014 we have open regulatory actions',
  'Audit committee focused on compliance findings',
  'Quick risk flash report \u2014 just capital and credit',
  'What agents do I need for a commercial real estate concentration issue?',
  'Explain the difference between the AI agents and the rules engines',
];

export function QuorumChat({ currentScenarioId, onScenarioRecommended, fullscreen = false, chatAgents, onAddAgent, visible = true }: QuorumChatProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const showSuggested = userMessageCount < 2;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll to bottom when becoming visible again
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 50);
    }
  }, [visible]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? inputValue).trim();
    if (!msg || isThinking) return;
    setInputValue('');
    const updatedMessages = [...messages, { role: 'user' as const, text: msg }];
    setMessages(updatedMessages);
    setIsThinking(true);
    try {
      // Build conversation history for context
      const history = updatedMessages.map((m) => `${m.role === 'user' ? 'User' : 'Quorum'}: ${m.text}`).join('\n');
      const addedList = chatAgents.length > 0 ? `\nAlready added agents: ${chatAgents.join(', ')}. Do NOT recommend these again.` : '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${addedList}\n\nConversation so far:\n${history}\n\nUser's latest message: ${msg}`,
          currentScenarioId,
        }),
      });
      const data = await res.json() as { reply?: string; recommendedAgentId?: string | null; recommendedScenarioId?: string | null; error?: string };
      const reply = data.reply ?? (data.error ? `Error: ${data.error}` : 'Something went wrong.');
      setMessages((prev) => [...prev, { role: 'quorum', text: reply, recommendedAgentId: data.recommendedAgentId }]);
      if (data.recommendedScenarioId) onScenarioRecommended(data.recommendedScenarioId);
    } catch {
      setMessages((prev) => [...prev, { role: 'quorum', text: 'Unable to connect. Please check your configuration.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleAddAgent = (agentId: string) => {
    onAddAgent(agentId);
    const agent = NODE_REGISTRY[agentId];
    if (agent) {
      setMessages((prev) => [...prev, {
        role: 'quorum',
        text: `${agent.label} added to your graph. Tell me more about your meeting or say "done" when you\u2019re ready to configure.`,
      }]);
    }
  };

  const handleSkipAgent = (agentId: string, msgIdx: number) => {
    setMessages((prev) => prev.map((m, i) => i === msgIdx ? { ...m, skipped: true } : m));
    const agent = NODE_REGISTRY[agentId];
    if (agent) {
      setMessages((prev) => [...prev, {
        role: 'quorum',
        text: `Skipped ${agent.label}. What else should I know about your meeting?`,
      }]);
    }
  };

  // Colors based on fullscreen mode
  const bg = fullscreen ? '#FFFFFF' : 'transparent';
  const msgBubbleQuorum = fullscreen
    ? { bg: '#F6F6F8', border: '1px solid #E8E8EC', color: '#1a1a1a' }
    : { bg: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' };
  const msgBubbleUser = fullscreen
    ? { bg: '#EEF3FA', border: '1px solid #D4DFF0', color: '#011E41' }
    : { bg: 'rgba(245,168,0,0.07)', border: '1px solid rgba(245,168,0,0.15)', color: 'rgba(255,255,255,0.8)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%', background: bg, borderRadius: fullscreen ? 0 : undefined, overflow: 'hidden' }}>
      {/* Header */}
      {fullscreen && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid #E8E8EC', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={16} color="#B14FC5" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Quorum Agent</span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#05AB8C', fontFamily: 'var(--font-mono)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#05AB8C', display: 'inline-block' }} />
            Ready
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: fullscreen ? '24px 28px' : '10px 0',
        }}
      >
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const bubble = isUser ? msgBubbleUser : msgBubbleQuorum;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row', maxWidth: fullscreen ? 700 : undefined, alignSelf: isUser ? 'flex-end' : 'flex-start' }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: fullscreen ? 32 : 22,
                  height: fullscreen ? 32 : 22,
                  borderRadius: fullscreen ? 10 : '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: fullscreen ? 12 : 9,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: isUser ? (fullscreen ? '#EEF3FA' : 'rgba(245,168,0,0.12)') : (fullscreen ? '#F3ECFF' : 'rgba(177,79,197,0.12)'),
                  color: isUser ? (fullscreen ? '#011E41' : '#F5A800') : '#B14FC5',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {isUser ? 'A' : 'S'}
              </div>
              <div style={{ flex: 1, maxWidth: fullscreen ? 580 : undefined }}>
                <div
                  style={{
                    fontSize: fullscreen ? 14 : 12,
                    lineHeight: 1.6,
                    color: bubble.color,
                    background: bubble.bg,
                    border: bubble.border,
                    borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    padding: fullscreen ? '12px 16px' : '8px 10px',
                  }}
                >
                  {msg.text}
                </div>
                {/* Inline agent card */}
                {msg.recommendedAgentId && !msg.skipped && (
                  <InlineChatAgentCard
                    agentId={msg.recommendedAgentId}
                    alreadyAdded={chatAgents.includes(msg.recommendedAgentId)}
                    onAdd={handleAddAgent}
                    onSkip={(id) => handleSkipAgent(id, i)}
                  />
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Thinking indicator */}
        {isThinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: fullscreen ? 32 : 22, height: fullscreen ? 32 : 22, borderRadius: fullscreen ? 10 : '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fullscreen ? 12 : 9, fontWeight: 700, flexShrink: 0, background: fullscreen ? '#F3ECFF' : 'rgba(177,79,197,0.12)', color: '#B14FC5', fontFamily: 'var(--font-mono)' }}>S</div>
            <div style={{ fontSize: fullscreen ? 14 : 12, color: fullscreen ? '#999' : 'rgba(255,255,255,0.35)', fontStyle: 'italic', background: fullscreen ? '#F6F6F8' : 'rgba(255,255,255,0.05)', border: fullscreen ? '1px solid #E8E8EC' : '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 14px 14px 14px', padding: fullscreen ? '12px 16px' : '8px 10px' }}>
              Thinking...
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested chips */}
      <AnimatePresence>
        {showSuggested && fullscreen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ padding: '0 28px 12px', display: 'flex', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}
          >
            {SUGGESTED.map((q) => (
              <motion.button
                key={q}
                type="button"
                onClick={() => void handleSend(q)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: 32,
                  padding: '0 16px',
                  border: '1px solid #DDD',
                  borderRadius: 100,
                  fontSize: 12,
                  color: '#555',
                  background: '#FFF',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'background 0.1s',
                }}
              >
                {q}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: fullscreen ? '12px 28px 20px' : '0',
          borderTop: fullscreen ? '1px solid #E8E8EC' : undefined,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: fullscreen ? '#F6F6F8' : 'rgba(255,255,255,0.05)',
            border: fullscreen ? '1px solid #E0E0E0' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14,
            padding: fullscreen ? '10px 16px' : '7px 10px',
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
              fontSize: fullscreen ? 14 : 12,
              color: fullscreen ? '#1a1a1a' : 'rgba(255,255,255,0.8)',
            }}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isThinking || !inputValue.trim()}
            style={{
              width: fullscreen ? 36 : 24,
              height: fullscreen ? 36 : 24,
              background: isThinking || !inputValue.trim() ? (fullscreen ? '#E0E0E0' : 'rgba(255,255,255,0.1)') : '#F5A800',
              border: 'none',
              borderRadius: fullscreen ? 10 : 6,
              cursor: isThinking || !inputValue.trim() ? 'not-allowed' : 'pointer',
              color: isThinking || !inputValue.trim() ? (fullscreen ? '#AAA' : 'rgba(255,255,255,0.3)') : '#011E41',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Send size={fullscreen ? 16 : 12} />
          </button>
        </div>
      </div>
    </div>
  );
}
