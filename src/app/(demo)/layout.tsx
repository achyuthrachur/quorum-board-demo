'use client';

import { useSSE } from '@/hooks/useSSE';
import { useExecutionStore } from '@/store/executionStore';

// Keeps SSE mounted across /build → /execute → /review → /report transitions
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const runId = useExecutionStore((s) => s.runId);
  useSSE(runId);
  return <>{children}</>;
}
