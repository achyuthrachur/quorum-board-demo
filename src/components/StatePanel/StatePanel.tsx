'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExecutionStore } from '@/store/executionStore';
import { cn } from '@/lib/utils';
import { LiveStateTab } from './LiveStateTab';
import { ReportPreviewTab } from './ReportPreviewTab';
import { DownloadTab } from './DownloadTab';

const triggerClass = cn(
  'flex flex-1 items-center justify-center h-[42px] text-[11px] font-bold uppercase tracking-[0.06em] cursor-pointer border-b-2 border-transparent transition-colors',
  'text-[#828282] data-[state=active]:text-[#011E41] data-[state=active]:border-[#F5A800]',
);

export function StatePanel() {
  const downloadReady = useExecutionStore(
    (state) => Boolean(state.docxBuffer ?? state.liveState.docxBuffer),
  );
  const isComplete = useExecutionStore((state) => state.isComplete);

  return (
    <Tabs defaultValue="live-state" className="flex min-h-0 flex-1 flex-col">
      <TabsList
        className="flex border-b border-[#BDBDBD] p-0 h-auto bg-transparent rounded-none shrink-0"
        variant="line"
      >
        <TabsTrigger value="live-state" className={cn(triggerClass)} style={{ fontFamily: 'var(--font-mono)' }}>
          Live state
        </TabsTrigger>
        <TabsTrigger value="report" className={cn(triggerClass, !isComplete && 'opacity-40')} style={{ fontFamily: 'var(--font-mono)' }}>
          Report
        </TabsTrigger>
        <TabsTrigger value="download" className={cn(triggerClass, !downloadReady && 'opacity-40')} style={{ fontFamily: 'var(--font-mono)' }}>
          Download
        </TabsTrigger>
      </TabsList>

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
