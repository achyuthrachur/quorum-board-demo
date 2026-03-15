'use client';

/* Aesthetic direction: Swiss / typographic */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExecutionStore } from '@/store/executionStore';
import { cn } from '@/lib/utils';
import { LiveStateTab } from './LiveStateTab';
import { ReportPreviewTab } from './ReportPreviewTab';
import { DownloadTab } from './DownloadTab';
import { InputDataTab } from './InputDataTab';

export function StatePanel() {
  const downloadReady = useExecutionStore(
    (state) => Boolean(state.docxBuffer ?? state.liveState.docxBuffer),
  );
  const isComplete = useExecutionStore((state) => state.isComplete);
  const selectedScenarioId = useExecutionStore((state) => state.selectedScenarioId);

  return (
    <Tabs defaultValue="input-data" className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <TabsList
        className="grid h-auto w-full grid-cols-4 gap-1 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-1.5"
        variant="line"
      >
        <TabsTrigger
          value="input-data"
          className={cn(
            'rounded-lg border border-transparent px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8FE1FF] transition-colors',
            'data-active:border-white/10 data-active:bg-white/[0.06] data-active:text-white data-active:after:hidden',
          )}
        >
          Input
        </TabsTrigger>
        <TabsTrigger
          value="live-state"
          className={cn(
            'rounded-lg border border-transparent px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8FE1FF] transition-colors',
            'data-active:border-white/10 data-active:bg-white/[0.06] data-active:text-white data-active:after:hidden',
          )}
        >
          Live
        </TabsTrigger>
        <TabsTrigger
          value="report"
          className={cn(
            'rounded-lg border border-transparent px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8FE1FF] transition-colors',
            'data-active:border-white/10 data-active:bg-white/[0.06] data-active:text-white data-active:after:hidden',
            !isComplete && 'text-[#8FE1FF]/80',
          )}
        >
          Report
        </TabsTrigger>
        <TabsTrigger
          value="download"
          className={cn(
            'rounded-lg border border-transparent px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8FE1FF] transition-colors',
            'data-active:border-white/10 data-active:bg-white/[0.06] data-active:text-white data-active:after:hidden',
            !downloadReady && 'text-[#8FE1FF]/80',
          )}
        >
          Download
        </TabsTrigger>
      </TabsList>

      <TabsContent value="input-data" className="min-h-0 flex-1">
        <InputDataTab scenarioId={selectedScenarioId} />
      </TabsContent>

      <TabsContent value="live-state" className="min-h-0 flex-1">
        <LiveStateTab />
      </TabsContent>

      <TabsContent value="report" className="min-h-0 flex-1">
        <ReportPreviewTab />
      </TabsContent>

      <TabsContent value="download" className="min-h-0 flex-1">
        <DownloadTab />
      </TabsContent>
    </Tabs>
  );
}
