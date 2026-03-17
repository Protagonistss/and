// useAgentHandlers - Agent View 事件处理
import type { DisplayStep } from "@/features/agent/components";

interface UseAgentHandlersParams {
  goalDraft: string;
  setGoalDraft: (value: string) => void;
  goalInputRef: React.RefObject<HTMLTextAreaElement | null>;
  isProcessing: boolean;
  currentRun: { goal?: string; phase?: string } | null;
  canResumeCurrentRun: boolean;
  accessToken: string | null;
  catalogLoading: boolean;
  catalogError: string | null;
  configuredProviders: Array<{ name: string; configured: boolean; models: string[] }>;
  providerReady: boolean;
  sendMessage: (message: string) => Promise<void>;
  resumeRun: (instruction?: string) => Promise<void>;
  stopGeneration: () => void;
  createConversation: () => string;
  reset: () => void;
  setExpandedFile: (value: string | null) => void;
  retryStep: (stepId: string) => void;
}

export function useAgentHandlers(params: UseAgentHandlersParams) {
  const {
    goalDraft,
    setGoalDraft,
    goalInputRef,
    isProcessing,
    currentRun,
    canResumeCurrentRun,
    accessToken,
    catalogLoading,
    catalogError,
    configuredProviders,
    providerReady,
    sendMessage,
    resumeRun,
    stopGeneration,
    createConversation,
    reset,
    setExpandedFile,
    retryStep,
  } = params;

  const ensureAgentReady = () => {
    if (!accessToken) return false;
    if (catalogLoading && configuredProviders.length === 0) return false;
    if (catalogError && configuredProviders.length === 0) return false;
    if (!providerReady) return false;
    return true;
  };

  const handleRun = async (content: string) => {
    const next = content.trim();
    if (!next || isProcessing || !ensureAgentReady()) return;
    setGoalDraft(next);
    await sendMessage(next);
  };

  const handleContinue = async () => {
    if (isProcessing || !currentRun || !canResumeCurrentRun || !ensureAgentReady()) return;

    const hasDraftInstruction =
      Boolean(currentRun) &&
      goalDraft.trim() &&
      goalDraft.trim() !== currentRun?.goal?.trim();

    const instruction = hasDraftInstruction ? goalDraft.trim() : undefined;
    await resumeRun(instruction);

    if (instruction) {
      setGoalDraft(currentRun.goal || "");
    }
  };

  const handlePrimaryAction = async () => {
    if (isProcessing) {
      stopGeneration();
      return;
    }

    if (canResumeCurrentRun) {
      await handleContinue();
      return;
    }

    await handleRun(goalDraft);
  };

  const handleNewSession = () => {
    if (isProcessing) return;
    createConversation();
    reset();
    setGoalDraft("");
    setExpandedFile(null);
  };

  const handleEditStep = (step: DisplayStep) => {
    const prefix = `@Step ${step.order} (${step.title}): `;
    const nextGoal = goalDraft.trim() ? `${goalDraft.trim()}\n\n${prefix}` : prefix;
    setGoalDraft(nextGoal);

    window.requestAnimationFrame(() => {
      const node = goalInputRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(nextGoal.length, nextGoal.length);
    });
  };

  const handleRetryStep = (step: DisplayStep) => {
    if (step.synthetic || isProcessing) return;
    retryStep(step.id);
  };

  return {
    handleRun,
    handleContinue,
    handlePrimaryAction,
    handleNewSession,
    handleEditStep,
    handleRetryStep,
    ensureAgentReady,
  };
}
