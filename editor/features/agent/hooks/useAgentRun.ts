// useAgentRun Hook - Agent 运行控制
import { useCallback } from 'react';
import { useAgentStore } from '../store';
import { useConversationStore } from '@/stores/conversationStore';
import { useUIStore } from '@/stores/uiStore';

export interface AgentRunState {
  // Current run
  run: import('../store/types').AgentRun | null;
  isProcessing: boolean;
  canResume: boolean;
  canRetry: boolean;

  // Steps
  steps: import('../store/types').AgentStep[];
  activeStep: import('../store/types').AgentStep | null;
  completedSteps: import('../store/types').AgentStep[];
  pendingSteps: import('../store/types').AgentStep[];
  blockedSteps: import('../store/types').AgentStep[];

  // Artifacts
  artifacts: import('../store/types').ArtifactRef[];

  // Reasoning
  reasoningEntries: import('../store/types').ReasoningEntry[];
}

export interface AgentRunActions {
  // Run control
  start: (goal: string) => Promise<void>;
  resume: (instruction?: string) => Promise<void>;
  stop: () => void;
  retryStep: (stepId: string) => void;

  // Step management
  setStepStatus: (stepId: string, status: import('../store/types').AgentStepStatus, summary?: string) => void;

  // Utilities
  clearError: () => void;
  reset: () => void;
}

/**
 * Agent 运行控制 Hook
 * @param conversationId 可选的会话 ID
 */
export function useAgentRun(conversationId?: string): AgentRunState & AgentRunActions {
  const currentConversationId = useConversationStore((state) => state.currentConversationId);
  const targetConversationId = conversationId || currentConversationId;

  // Store selectors
  const run = useAgentStore((state) =>
    targetConversationId ? state.runsByConversation[targetConversationId] || null : null
  );
  const isProcessing = useAgentStore((state) => state.isProcessing);
  const sendMessage = useAgentStore((state) => state.sendMessage);
  const resumeRun = useAgentStore((state) => state.resumeRun);
  const stopGeneration = useAgentStore((state) => state.stopGeneration);
  const retryStep = useAgentStore((state) => state.retryStep);
  const setStepStatus = useAgentStore((state) => state.setStepStatus);
  const clearError = useAgentStore((state) => state.clearError);
  const reset = useAgentStore((state) => state.reset);

  const addToast = useUIStore((state) => state.addToast);

  // Computed values
  const canResume = Boolean(
    run &&
    (run.phase === 'paused' || run.phase === 'error') &&
    !isProcessing
  );

  const canRetry = Boolean(
    run &&
    run.steps.some((step) => step.status === 'blocked' || step.status === 'cancelled') &&
    !isProcessing
  );

  const steps = run?.steps || [];
  const activeStep = run?.activeStepId
    ? steps.find((s) => s.id === run.activeStepId) || null
    : null;
  const completedSteps = steps.filter((s) => s.status === 'completed');
  const pendingSteps = steps.filter((s) => s.status === 'pending');
  const blockedSteps = steps.filter((s) => s.status === 'blocked');

  const artifacts = run?.artifacts || [];
  const reasoningEntries = run?.reasoningEntries || [];

  // Actions
  const start = useCallback(
    async (goal: string) => {
      if (!goal.trim()) {
        addToast({ type: 'warning', message: '请输入目标内容' });
        return;
      }

      try {
        await sendMessage(goal);
      } catch (err) {
        addToast({
          type: 'error',
          message: err instanceof Error ? err.message : '启动执行失败',
        });
      }
    },
    [sendMessage, addToast]
  );

  const resume = useCallback(
    async (instruction?: string) => {
      if (!run) {
        addToast({ type: 'warning', message: '没有可恢复的执行' });
        return;
      }

      try {
        await resumeRun(instruction);
        addToast({ type: 'info', message: '已恢复执行' });
      } catch (err) {
        addToast({
          type: 'error',
          message: err instanceof Error ? err.message : '恢复执行失败',
        });
      }
    },
    [run, resumeRun, addToast]
  );

  const stop = useCallback(() => {
    stopGeneration();
    addToast({ type: 'info', message: '已停止生成' });
  }, [stopGeneration, addToast]);

  const retryStepCallback = useCallback(
    (stepId: string) => {
      retryStep(stepId);
      addToast({ type: 'info', message: '步骤已重置，可继续执行' });
    },
    [retryStep, addToast]
  );

  // Wrapper for setStepStatus that works with the current run
  const handleSetStepStatus = useCallback(
    (stepId: string, status: import('../store/types').AgentStepStatus, summary?: string) => {
      if (!run) return;
      // Note: setStepStatus is a pure function that returns the updated run
      // In a real implementation, you'd need to update the run in the store
      console.warn('setStepStatus needs to be implemented with store update logic');
    },
    [run]
  );

  return {
    // State
    run,
    isProcessing,
    canResume,
    canRetry,
    steps,
    activeStep,
    completedSteps,
    pendingSteps,
    blockedSteps,
    artifacts,
    reasoningEntries,

    // Actions
    start,
    resume,
    stop,
    retryStep: retryStepCallback,
    setStepStatus: handleSetStepStatus,
    clearError,
    reset,
  };
}
