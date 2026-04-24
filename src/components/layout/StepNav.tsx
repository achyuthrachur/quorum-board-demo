'use client';

import { useRouter } from 'next/navigation';
import { useExecutionStore } from '@/store/executionStore';
import type { AppPhase } from '@/store/executionStore';

const WORKFLOW_STEPS = [
  { num: '1', label: 'Configure', phase: 'configure' as AppPhase, path: '/configure' },
  { num: '2', label: 'Build',     phase: 'build'     as AppPhase, path: '/build' },
  { num: '3', label: 'Execute',   phase: 'execute'   as AppPhase, path: '/execute' },
  { num: '4', label: 'Review',    phase: 'review'    as AppPhase, path: '/review' },
  { num: '5', label: 'Report',    phase: 'complete'  as AppPhase, path: '/report' },
] as const;

const PHASE_TO_INDEX: Record<AppPhase, number> = {
  configure: 0,
  build:     1,
  execute:   2,
  review:    3,
  complete:  4,
};

export function StepNav() {
  const appPhase  = useExecutionStore((s) => s.appPhase);
  const isRunning = useExecutionStore((s) => s.isRunning);
  const isComplete = useExecutionStore((s) => s.isComplete);
  const router    = useRouter();

  const activeIndex = PHASE_TO_INDEX[appPhase] ?? 0;
  // Highest step index the user has legitimately reached
  const highestReached = isComplete ? WORKFLOW_STEPS.length - 1 : activeIndex;

  const handleStepClick = (index: number, path: string) => {
    if (isRunning) return;
    if (index === activeIndex) return;
    if (index > highestReached) return; // not reached yet

    // Only ask for confirmation when going back and not all steps are done
    if (index < activeIndex && !isComplete) {
      if (!confirm('Navigate back to this step?')) return;
    }

    router.push(path);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {WORKFLOW_STEPS.map((step, i) => {
        const isActive    = i === activeIndex;
        const isDone      = i !== activeIndex && i <= highestReached;
        const isFuture    = i > highestReached;
        const isClickable = !isRunning && !isActive && i <= highestReached;

        return (
          <span key={step.phase} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              onClick={() => handleStepClick(i, step.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: isClickable ? 'pointer' : 'default',
                opacity: isFuture ? 0.3 : 1,
              }}
            >
              {/* Circle */}
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  flexShrink: 0,
                  background: isActive || isDone ? '#F5A800' : 'transparent',
                  border: `1px solid ${isActive || isDone ? '#F5A800' : 'rgba(255,255,255,0.3)'}`,
                  color: isActive || isDone ? '#011E41' : 'rgba(255,255,255,0.5)',
                }}
              >
                {isDone ? '✓' : step.num}
              </span>
              {/* Label */}
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-body)',
                  color: isActive
                    ? 'rgba(255,255,255,0.9)'
                    : isDone
                      ? 'rgba(255,255,255,0.65)'
                      : 'rgba(255,255,255,0.3)',
                }}
              >
                {step.label}
              </span>
            </span>
            {/* Separator */}
            {i < WORKFLOW_STEPS.length - 1 && (
              <span
                style={{
                  color: 'rgba(255,255,255,0.2)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  userSelect: 'none',
                }}
              >
                ›
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
