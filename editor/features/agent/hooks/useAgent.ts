import { useCallback } from 'react';
import { useAgentStore, useConversationStore, useUIStore } from '@/stores';

/**
 * Agent 操作 Hook
 */
export function useAgent() {
  const {
    status,
    isProcessing,
    currentStreamContent,
    currentToolCalls,
    runsByConversation,
    error,
    sendMessage,
    resumeRun,
    retryStep,
    stopGeneration,
    clearError,
    reset,
  } = useAgentStore();
  const currentConversationId = useConversationStore((state) => state.currentConversationId);

  const { addToast } = useUIStore();
  const currentRun = currentConversationId ? runsByConversation[currentConversationId] || null : null;

  const send = useCallback(
    async (content: string) => {
      if (!content.trim()) {
        addToast({ type: 'warning', message: '请输入消息内容' });
        return;
      }

      try {
        await sendMessage(content);
      } catch (err) {
        addToast({
          type: 'error',
          message: err instanceof Error ? err.message : '发送失败',
        });
      }
    },
    [sendMessage, addToast]
  );

  const resume = useCallback(
    async (instruction?: string) => {
      try {
        await resumeRun(instruction);
      } catch (err) {
        addToast({
          type: 'error',
          message: err instanceof Error ? err.message : '恢复执行失败',
        });
      }
    },
    [resumeRun, addToast]
  );

  const stop = useCallback(() => {
    stopGeneration();
    addToast({ type: 'info', message: '已停止生成' });
  }, [stopGeneration, addToast]);

  const retry = useCallback(
    (stepId: string) => {
      retryStep(stepId);
      addToast({ type: 'info', message: '步骤已重置，可继续执行' });
    },
    [retryStep, addToast]
  );

  return {
    status,
    isProcessing,
    currentStreamContent,
    currentToolCalls,
    currentRun,
    error,
    sendMessage: send,
    resumeRun: resume,
    retryStep: retry,
    stopGeneration: stop,
    clearError,
    reset,
  };
}
