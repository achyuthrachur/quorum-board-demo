'use client';

/* Aesthetic direction: Luxury / refined */

import { useState } from 'react';
import { SCENARIOS } from '@/data/scenarios';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { useExecutionStore } from '@/store/executionStore';
import { useGraphExecution } from '@/hooks/useGraphExecution';
import { ScenarioCard } from './ScenarioCard';
import { RunControls } from './RunControls';
import { AgentSelector } from './AgentSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const DEFAULT_CUSTOM_NODES = Object.keys(NODE_REGISTRY);

export function ScenarioPanel() {
  const selectedScenarioId = useExecutionStore((state) => state.selectedScenarioId);
  const { switchScenario } = useGraphExecution();
  const [customNodes, setCustomNodes] = useState<string[]>(DEFAULT_CUSTOM_NODES);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // For custom builds, use the first scenario as data source if nothing selected
  const customBaseScenarioId = selectedScenarioId ?? SCENARIOS[0]?.id ?? 'falcon-board';

  return (
    <div className="mt-4 flex h-full flex-col gap-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'presets' | 'custom')}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mb-3 grid h-auto w-full grid-cols-2 gap-1 rounded-[1rem] border border-white/8 bg-white/[0.03] p-1">
          <TabsTrigger
            value="presets"
            className={cn(
              'rounded-lg px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8FE1FF] transition-colors',
              'data-[state=active]:bg-white/[0.08] data-[state=active]:text-white',
            )}
          >
            Presets
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className={cn(
              'rounded-lg px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8FE1FF] transition-colors',
              'data-[state=active]:bg-white/[0.08] data-[state=active]:text-white',
            )}
          >
            Custom Build
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="flex-1">
          <div className="flex flex-col gap-3">
            {SCENARIOS.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isSelected={selectedScenarioId === scenario.id}
                onSelect={() => { void switchScenario(scenario.id); }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="flex-1">
          <div
            className="rounded-[1.25rem] border p-4"
            style={{ borderColor: 'var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}
          >
            <p
              className="mb-1 text-[11px] font-bold uppercase tracking-widest text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Custom Agent Build
            </p>
            <p className="mb-4 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Using {SCENARIOS.find((s) => s.id === customBaseScenarioId)?.label ?? customBaseScenarioId} data.
            </p>
            <AgentSelector selectedNodes={customNodes} onChange={setCustomNodes} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-auto">
        <RunControls
          selectedScenarioId={activeTab === 'presets' ? selectedScenarioId : customBaseScenarioId}
          customNodes={activeTab === 'custom' ? customNodes : undefined}
        />
      </div>
    </div>
  );
}
