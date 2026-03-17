// useAgentCalculations - Agent View 计算逻辑
import { useMemo, useEffect } from "react";
import type { AgentRun, ReasoningEntry } from "@/stores";
import type { Message } from "@/services/llm/types";
import {
  buildStepSummary,
  buildReasoningFallback,
  buildReasoningFromLastAssistantMessage,
  buildTopActionLabel,
  toPreviewLines,
} from "@/features/agent/components/utils/agentViewUtils";
import { normalizeReasoningText } from "@/features/agent/components/utils/agentViewUtils";
import { buildArtifactSections } from "@/features/editor/views/utils/buildArtifactSections";
import type { DisplayStep, ArtifactSection } from "@/features/agent/components";

interface UseAgentCalculationsParams {
  currentRun: AgentRun | null;
  currentStreamContent: string;
  conversation: { messages: Message[] } | null;
  currentProvider: string | null;
  llmConfigs: Record<string, { model?: string }>;
  catalogProviders: Array<{ name: string; configured: boolean; models: string[] }>;
  accessToken: string | null;
  isProcessing: boolean;
  error: string | null;
  expandedFile: string | null;
}

export function useAgentCalculations(params: UseAgentCalculationsParams) {
  const {
    currentRun,
    currentStreamContent,
    conversation,
    currentProvider,
    llmConfigs,
    catalogProviders,
    accessToken,
    isProcessing,
    error,
    expandedFile,
  } = params;

  const visibleMessages = useMemo(
    () => (conversation?.messages || []).filter((message) => message.role !== "system"),
    [conversation?.messages]
  );

  const latestUserMessage = useMemo(
    () => [...visibleMessages].reverse().find((message) => message.role === "user"),
    [visibleMessages]
  );

  const configuredProviders = useMemo(
    () => catalogProviders.filter((provider) => provider.configured && provider.models.length > 0),
    [catalogProviders]
  );

  const currentLLMConfig = currentProvider ? llmConfigs[currentProvider] : null;
  const providerReady =
    Boolean(accessToken) &&
    Boolean(currentProvider) &&
    Boolean(currentLLMConfig?.model) &&
    configuredProviders.some(
      (provider) => provider.name === currentProvider && provider.models.includes(currentLLMConfig.model)
    );

  const displaySteps = useMemo<DisplayStep[]>(() => {
    if (!currentRun) return [];

    if (currentRun.steps.length === 0) {
      return [
        {
          id: "planning",
          order: 1,
          title: "Draft execution plan",
          status: currentRun.phase === "planning" ? "running" : "pending",
          summary: "Generating a structured execution plan for the current goal.",
          synthetic: true,
        },
      ];
    }

    return currentRun.steps.map((step) => ({
      id: step.id,
      order: step.order,
      title: step.title,
      status: step.status,
      summary: buildStepSummary(step),
    }));
  }, [currentRun]);

  const reasoningEntries = useMemo<ReasoningEntry[]>(() => {
    if (!currentRun) return [];

    const baseEntries =
      currentRun.reasoningEntries.length > 0
        ? currentRun.reasoningEntries
        : currentRun.lastAssistantMessage.trim()
        ? buildReasoningFromLastAssistantMessage(currentRun)
        : buildReasoningFallback(currentRun);

    const nextEntries = baseEntries.slice(-4);
    const normalizedPreview = normalizeReasoningText(currentStreamContent);
    const normalizedLastEntry = nextEntries.length > 0
      ? normalizeReasoningText(nextEntries[nextEntries.length - 1].text)
      : "";

    if (!normalizedPreview || normalizedPreview === normalizedLastEntry) {
      return nextEntries;
    }

    return [
      ...nextEntries,
      {
        id: "stream-preview",
        phase: (currentRun.phase === "planning" ? "planning" : "execution") as ReasoningEntry["phase"],
        text: currentStreamContent.trim(),
        stepId: currentRun.activeStepId,
        createdAt: currentRun.updatedAt,
      },
    ].slice(-4);
  }, [currentRun, currentStreamContent]);

  const shouldShowReasoningError =
    Boolean(currentRun?.error) &&
    (Boolean(currentRun?.reasoningEntries.length) || Boolean(currentRun?.lastAssistantMessage.trim()));

  const artifactSections = useMemo(
    () => buildArtifactSections(currentRun, currentStreamContent),
    [currentRun, currentStreamContent]
  );

  const activeStep = useMemo(() => {
    if (!currentRun) return null;
    if (currentRun.activeStepId) {
      return currentRun.steps.find((step) => step.id === currentRun.activeStepId) || null;
    }
    return currentRun.steps.find((step) => step.status === "running") || null;
  }, [currentRun]);

  const activeArtifactPath =
    activeStep?.artifactRefs[activeStep.artifactRefs.length - 1]?.path ||
    artifactSections.find((section) => section.state === "active")?.path ||
    artifactSections[0]?.path ||
    null;

  const activeStreamingSection = useMemo(
    () =>
      currentStreamContent.trim() && activeArtifactPath
        ? artifactSections.find((section) => section.path === activeArtifactPath && section.state === "active") || null
        : null,
    [activeArtifactPath, artifactSections, currentStreamContent]
  );

  const latestReasoning = reasoningEntries[reasoningEntries.length - 1] || null;
  const completedSteps = displaySteps.filter((step) => step.status === "completed").length;
  const hasSession = Boolean(currentRun);
  const hasPendingSteps = Boolean(currentRun?.steps.some((step) => step.status === "pending"));
  const canResumeCurrentRun =
    Boolean(currentRun) &&
    currentRun?.phase === "paused" &&
    hasPendingSteps;

  const topActionLabel = buildTopActionLabel(currentRun, isProcessing);

  const activeModelLabel =
    providerReady && currentProvider && currentLLMConfig?.model
      ? `${currentProvider} · ${currentLLMConfig.model}`
      : accessToken
      ? "No model"
      : "Sign in";

  const footerMessage = error || currentRun?.error
    ? error || currentRun?.error || "Run blocked."
    : isProcessing
    ? `Writing ${activeArtifactPath || activeStep?.title || "artifacts"}...`
    : canResumeCurrentRun
    ? "Review the artifacts and approve when ready."
    : currentRun?.phase === "completed"
    ? "Execution completed. Update the goal to start a new run."
    : "Agent is ready for the next instruction.";

  const expandedArtifactSection = useMemo(
    () => (expandedFile ? artifactSections.find((section) => section.path === expandedFile) || null : null),
    [artifactSections, expandedFile]
  );
  const expandedArtifactPath = expandedArtifactSection?.path || null;
  const expandedArtifactCacheKey = expandedArtifactSection?.cacheKey || null;
  const isExpandedArtifactStreaming =
    Boolean(currentStreamContent.trim()) &&
    expandedArtifactSection?.path === activeArtifactPath;

  return {
    visibleMessages,
    latestUserMessage,
    configuredProviders,
    currentLLMConfig,
    providerReady,
    displaySteps,
    reasoningEntries,
    shouldShowReasoningError,
    artifactSections,
    activeStep,
    activeArtifactPath,
    activeStreamingSection,
    latestReasoning,
    completedSteps,
    hasSession,
    hasPendingSteps,
    canResumeCurrentRun,
    topActionLabel,
    activeModelLabel,
    footerMessage,
    expandedArtifactPath,
    expandedArtifactCacheKey,
    expandedArtifactSection,
    isExpandedArtifactStreaming,
  };
}
