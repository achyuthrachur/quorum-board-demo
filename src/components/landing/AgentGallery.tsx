'use client';

import { useRef, useState, useCallback } from 'react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { SCENARIOS } from '@/data/scenarios';
import { CardStack, type CardStackItem } from '@/components/card-stack';
import { AgentCardContent } from './AgentCard';
import { AgentDataPanel } from './AgentDataPanel';

const scenario = SCENARIOS[0];
const agentDataSources = scenario.agentDataSources ?? {};
const agents = Object.values(NODE_REGISTRY);

type AgentStackItem = CardStackItem & { agentId: string };

const stackItems: AgentStackItem[] = agents.map((agent) => ({
  id: agent.id,
  agentId: agent.id,
  title: agent.label,
  description: agent.description,
}));

// Build a description string per agent for the gradient scroll
const AGENT_SCROLL_TEXT: Record<string, string> = {
  meta_agent:
    'The Meta Agent is the orchestrator that runs before any analysis begins. It receives the meeting type and scenario context, then selects which agents to activate and in what order. For a full board package, it activates all 10 nodes. For a risk flash report, it collapses to 3. The graph literally builds itself based on what this agent decides.',
  financial_aggregator:
    'The Financial Aggregator receives quarterly financials from the core banking system. It calculates variance between actual and budget for each metric, then applies threshold rules to flag anomalies. Net interest margin compression triggers an amber flag. Efficiency ratio above 60% triggers a flag. No AI is used — pure arithmetic.',
  capital_monitor:
    'The Capital Monitor compares each capital and liquidity ratio against regulatory minimums and well-capitalised thresholds. It flags any ratio within 150 basis points of its minimum. No AI involved — deterministic threshold comparison across all five ratios.',
  credit_quality:
    'The Credit Quality agent uses a weighted scoring algorithm. Each dimension gets a score based on where it sits relative to peer medians and policy limits. Scores are weighted across non-performing loans, provision coverage, net charge-offs, and concentration risk.',
  trend_analyzer:
    'The Trend Analyzer is a hybrid agent. It first runs statistical regression on 5 quarters of data to compute slope. If any slope exceeds one standard deviation from the mean, it passes those flagged metrics to an AI to generate a narrative. The math runs first, the AI only writes the interpretation.',
  regulatory_digest:
    'The Regulatory Digest agent receives open regulatory actions, their due dates, and the examination schedule. It generates a structured narrative digest, identifies overdue items, and sets an escalation flag that forces the supervisor to include the human review gate.',
  operational_risk:
    'The Operational Risk agent reads the incident log and classifies each event as board-reportable or not. It identifies themes across incidents and flags anything requiring regulatory notification. Vendor breaches affecting over 1,000 accounts are always board-reportable.',
  supervisor:
    'The Supervisor reads all agent outputs and status indicators, then makes a routing decision: proceed to the human review gate, skip directly to report compilation if everything is clean, loop back to an agent for re-analysis, or escalate. It uses consistent low-temperature settings for reliable routing.',
  hitl_gate:
    'The Human-in-the-Loop Gate is where execution fully pauses. The chief financial officer or chief risk officer reviews a summary of all flags and agent findings before the report compiler fires. They can approve — which triggers compilation — or escalate for additional board discussion.',
  report_compiler:
    'The Report Compiler receives all structured outputs from previous agents — scores, status indicators, regulatory action lists, trend slopes — and writes the board narrative section by section. Each section streams into the report viewer. It has earned the right to write because all the math was done upstream.',
};

export function AgentGallery() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(agents[0].id);
  const [activeAgentId, setActiveAgentId] = useState<string>(agents[0].id);
  const dataPanelRef = useRef<HTMLDivElement>(null);

  const handleIndexChange = useCallback((_index: number, item: AgentStackItem) => {
    setActiveAgentId(item.agentId);
    setSelectedAgentId(item.agentId);
  }, []);

  const renderCard = useCallback(
    (item: AgentStackItem, state: { active: boolean }) => {
      const agent = NODE_REGISTRY[item.agentId];
      if (!agent) return null;
      return (
        <div style={{ width: '100%', height: '100%' }}>
          <AgentCardContent
            agent={agent}
            dataSources={agentDataSources[item.agentId]}
            isActive={state.active}
          />
        </div>
      );
    },
    [],
  );

  const scrollText = AGENT_SCROLL_TEXT[activeAgentId] ?? '';
  const activeAgent = NODE_REGISTRY[activeAgentId];

  return (
    <div>
      {/* ── Section header ── */}
      <div style={{ textAlign: 'center', padding: '48px 48px 0' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#F5A800',
            marginBottom: 10,
            fontFamily: 'var(--font-mono)',
          }}
        >
          Agent gallery
        </p>
        <h2
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            marginBottom: 6,
            fontFamily: 'var(--font-display)',
          }}
        >
          Meet the 10 agents
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 0 }}>
          Swipe or click to browse. Scroll down to see each agent&rsquo;s data.
        </p>
      </div>

      {/* ── Card stack ── */}
      <div style={{ padding: '32px 0 0' }}>
        <CardStack
          items={stackItems}
          autoAdvance={false}
          loop
          showDots
          cardWidth={340}
          cardHeight={420}
          overlap={0.52}
          spreadDeg={40}
          maxVisible={5}
          activeScale={1.02}
          inactiveScale={0.88}
          renderCard={renderCard}
          onChangeIndex={handleIndexChange}
        />
      </div>

      {/* ── Scroll text for active agent ── */}
      {scrollText && (
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: '64px 48px 80px',
          }}
        >
          {activeAgent && (
            <div
              style={{
                textAlign: 'center',
                marginBottom: 24,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: activeAgent.color,
              }}
            >
              How {activeAgent.label} works
            </div>
          )}
          <p
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.8,
              margin: 0,
              fontFamily: 'var(--font-body)',
              textAlign: 'center',
            }}
          >
            {scrollText}
          </p>
        </div>
      )}

      {/* ── Data panel ── */}
      <div ref={dataPanelRef}>
        <AgentDataPanel agentId={selectedAgentId} />
      </div>
    </div>
  );
}
