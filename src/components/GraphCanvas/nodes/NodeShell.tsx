'use client';

import { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'motion/react';
import type { NodeExecutionState } from '@/types/graph';

interface NodeShellProps {
  color: string;
  executionState: NodeExecutionState;
  children: React.ReactNode;
  hideSourceHandle?: boolean;
  hideTargetHandle?: boolean;
}

const handleStyle = {
  background: 'rgba(255,255,255,0.25)',
  border: '1px solid rgba(255,255,255,0.35)',
  width: 8,
  height: 8,
};

export function NodeShell({
  color,
  executionState,
  children,
  hideSourceHandle = false,
  hideTargetHandle = false,
}: NodeShellProps) {
  const isActive = executionState === 'active';
  const isCompleted = executionState === 'completed';
  const isPaused = executionState === 'paused';
  const isIdle = executionState === 'idle';

  // Brief green tint on completion
  const [justCompleted, setJustCompleted] = useState(false);
  useEffect(() => {
    if (isCompleted) {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 600);
      return () => clearTimeout(t);
    }
  }, [isCompleted]);

  // Amber pulsing border for active nodes
  const borderColor = isActive
    ? '#F5A800'
    : isPaused
      ? '#E5376B'
      : isCompleted
        ? `${color}88`
        : 'rgba(255,255,255,0.10)';

  return (
    <motion.div
      className="relative rounded-xl border-l-4"
      style={{
        width: 200,
        minHeight: 88,
        backgroundColor: '#002E62',
        borderLeftColor: color,
        borderTop: `1.5px solid ${borderColor}`,
        borderRight: `1.5px solid ${borderColor}`,
        borderBottom: `1.5px solid ${borderColor}`,
        overflow: 'hidden',
      }}
      animate={{
        opacity: isIdle ? 0.7 : 1,
        boxShadow: isActive
          ? [
              '0 0 0px 0px rgba(245,168,0,0), 0 2px 12px rgba(1,30,65,0.18)',
              '0 0 16px 3px rgba(245,168,0,0.35), 0 2px 12px rgba(1,30,65,0.18)',
              '0 0 0px 0px rgba(245,168,0,0), 0 2px 12px rgba(1,30,65,0.18)',
            ]
          : isPaused
            ? [
                '0 0 0px 0px rgba(229,55,107,0), 0 2px 12px rgba(1,30,65,0.18)',
                '0 0 14px 3px rgba(229,55,107,0.3), 0 2px 12px rgba(1,30,65,0.18)',
                '0 0 0px 0px rgba(229,55,107,0), 0 2px 12px rgba(1,30,65,0.18)',
              ]
            : justCompleted
              ? `0 0 14px 3px ${color}50, 0 2px 12px rgba(1,30,65,0.18)`
              : '0 2px 12px rgba(1,30,65,0.18)',
      }}
      transition={
        isActive || isPaused
          ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.35 }
      }
    >
      {!hideTargetHandle && (
        <Handle type="target" position={Position.Left} style={handleStyle} />
      )}
      {!hideSourceHandle && (
        <Handle type="source" position={Position.Right} style={handleStyle} />
      )}

      {/* Amber sweep on active nodes */}
      {isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(245,168,0,0.08), transparent 60%)',
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {children}

      {/* Pulsing amber dot — top-right when active */}
      {isActive && (
        <motion.div
          className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: '#F5A800', boxShadow: '0 0 8px rgba(245,168,0,0.6)' }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Completed checkmark */}
      {isCompleted && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 400, delay: 0.1 }}
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black"
          style={{
            backgroundColor: color,
            color: '#011E41',
            boxShadow: `0 0 8px ${color}60`,
          }}
        >
          ✓
        </motion.div>
      )}

      {/* Status dot + label */}
      <div className="flex items-center gap-1.5 px-3 pb-2">
        <motion.div
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: isActive ? '#F5A800' : color,
          }}
          animate={
            isActive
              ? { opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }
              : { opacity: isCompleted ? 1 : 0.35 }
          }
          transition={
            isActive ? { duration: 1, repeat: Infinity } : { duration: 0.3 }
          }
        />
        <span
          className="text-[9px] uppercase tracking-widest"
          style={{
            color: isActive ? 'rgba(245,168,0,0.8)' : 'rgba(255,255,255,0.45)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {executionState}
        </span>
      </div>
    </motion.div>
  );
}
