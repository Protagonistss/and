import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  Bot,
  CornerLeftUp,
  FileCode,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgent } from "@/hooks";
import { AnimatePresence, motion } from "framer-motion";
import {
  useAuthStore,
  useConversationStore,
  useLLMCatalogStore,
  useProjectStore,
  type AgentRun,
  type AgentStep as RuntimeAgentStep,
  type AgentStepStatus,
  type ReasoningEntry,
} from "@/stores";
import { useConfigStore } from "@/stores/configStore";
import type { Message } from "@/services/llm/types";
// Import migrated components from features/agent/components
import {
  AgentEmptyState,
  AgentControls,
  AgentStepList,
  AgentReasoningPanel,
  AgentArtifactPanel,
} from "@/features/agent/components";
// Import types from new components
import type {
  DisplayStep,
  ArtifactSection,
  ArtifactFileContentState,
} from "@/features/agent/components";
// Import utility functions from utils
import * as AgentViewUtils from "@/features/agent/components/utils/agentViewUtils";
const {
  extractTextContent,
  truncateText,
  normalizeReasoningText,
  buildStepSummary,
  buildReasoningFallback,
  buildReasoningFromLastAssistantMessage,
  buildTopActionLabel,
  toPreviewLines,
  toFileContentLines,
  getErrorMessage,
  resolveArtifactFilePath,
  readArtifactFileContent,
} = AgentViewUtils;

// AgentView-specific artifact sections builder
function buildArtifactSections(run: AgentRun | null, streamContent: string): ArtifactSection[] {
  if (!run) return [];

  const activeStep = run.activeStepId
    ? run.steps.find((step) => step.id === run.activeStepId) || null
    : run.steps.find((step) => step.status === "running") || null;

  const sections: ArtifactSection[] = run.artifacts
    .filter((artifact) => artifact.kind === "file")
    .sort((left, right) => {
      const leftPriority = left.stepId === run.activeStepId ? 0 : 1;
      const rightPriority = right.stepId === run.activeStepId ? 0 : 1;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return left.createdAt - right.createdAt;
    })
    .map((artifact) => {
      const preview = artifact.preview.trim() || artifact.title;
      return {
        id: artifact.id,
        path: artifact.path,
        state:
          streamContent.trim() && artifact.stepId === run.activeStepId ? "active" : "completed",
        preview,
        contentSnapshot: artifact.contentSnapshot || "",
        added: Math.max(1, toPreviewLines(preview, 24).length),
        removed: 0,
        cacheKey: `${run.id}:${artifact.path}`,
      };
    });

  if (streamContent.trim()) {
    const activeFileArtifact = [...(activeStep?.artifactRefs || [])]
      .reverse()
      .find((artifact) => artifact.kind === "file");

    if (activeFileArtifact) {
      sections.unshift({
        id: "stream-output",
        path: activeFileArtifact.path,
        state: "active",
        preview: streamContent.trim(),
        contentSnapshot: "",
        added: Math.max(1, toPreviewLines(streamContent.trim(), 24).length),
        removed: 0,
        cacheKey: `${run.id}:${activeFileArtifact.path}`,
      });
    }
  }

  const seenPaths = new Set<string>();
  return sections.filter((section) => {
    if (seenPaths.has(section.path)) return false;
    seenPaths.add(section.path);
    return true;
  });
}

export function AgentView() {
  const navigate = useNavigate();
  const goalInputRef = useRef<HTMLTextAreaElement | null>(null);
  const reasoningScrollRef = useRef<HTMLDivElement | null>(null);
  const artifactLastVisibleContentRef = useRef<Record<string, string>>({});
  const [goalDraft, setGoalDraft] = useState("");
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [artifactFileContents, setArtifactFileContents] = useState<Record<string, ArtifactFileContentState>>({});

  const accessToken = useAuthStore((state) => state.accessToken);
  const currentProvider = useConfigStore((state) => state.currentProvider);
  const workingDirectory = useConfigStore((state) => state.workingDirectory);
  const llmConfigs = useConfigStore((state) => state.llmConfigs);
  const syncLLMProviders = useConfigStore((state) => state.syncLLMProviders);
  const currentProjectPath = useProjectStore((state) => state.currentProject?.path || null);
  const catalogProviders = useLLMCatalogStore((state) => state.providers);
  const catalogLoading = useLLMCatalogStore((state) => state.isLoading);
  const catalogError = useLLMCatalogStore((state) => state.error);
  const initializeCatalog = useLLMCatalogStore((state) => state.initialize);
  const clearCatalog = useLLMCatalogStore((state) => state.clear);
  const createConversation = useConversationStore((state) => state.createConversation);
  const conversation = useConversationStore((state) =>
    state.currentConversationId
      ? state.conversations.find((item) => item.id === state.currentConversationId) || null
      : null
  );
  const {
    isProcessing,
    currentStreamContent,
    currentRun,
    error,
    sendMessage,
    resumeRun,
    retryStep,
    stopGeneration,
    reset,
  } = useAgent();

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

  useEffect(() => {
    if (accessToken) {
      void initializeCatalog();
    } else {
      clearCatalog();
    }
  }, [accessToken, clearCatalog, initializeCatalog]);

  useEffect(() => {
    if (catalogProviders.length > 0) {
      syncLLMProviders(catalogProviders);
    }
  }, [catalogProviders, syncLLMProviders]);

  useEffect(() => {
    const nextGoal = currentRun?.goal || extractTextContent(latestUserMessage);
    setGoalDraft(nextGoal || "");
  }, [currentRun?.goal, latestUserMessage]);

  useEffect(() => {
    const node = goalInputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 220)}px`;
  }, [goalDraft]);

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

  useEffect(() => {
    if (!isReasoningExpanded) {
      return;
    }

    const node = reasoningScrollRef.current;
    if (!node) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [currentStreamContent, isReasoningExpanded, reasoningEntries, shouldShowReasoningError]);

  const artifactSections = useMemo(
    () => buildArtifactSections(currentRun, currentStreamContent),
    [currentRun, currentStreamContent]
  );

  useEffect(() => {
    setArtifactFileContents({});
    artifactLastVisibleContentRef.current = {};
  }, [currentProjectPath, workingDirectory]);

  useEffect(() => {
    if (artifactSections.length === 0) {
      setExpandedFile(null);
      return;
    }

    if (!expandedFile) {
      return;
    }

    if (artifactSections.some((section) => section.path === expandedFile)) {
      return;
    }

    setExpandedFile(null);
  }, [artifactSections, expandedFile]);

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

  useEffect(() => {
    if (!currentStreamContent.trim() || !activeArtifactPath) {
      return;
    }

    const streamCacheKey = activeStreamingSection?.cacheKey || `stream:${activeArtifactPath}`;
    setArtifactFileContents((state) => {
      const currentState = state[activeArtifactPath];
      if (
        currentState?.cacheKey === streamCacheKey &&
        currentState.content === currentStreamContent &&
        currentState.status === "loading"
      ) {
        return state;
      }

      return {
        ...state,
        [activeArtifactPath]: {
          status: "loading",
          content: currentStreamContent,
          cacheKey: streamCacheKey,
          source: "stream",
        },
      };
    });
  }, [activeArtifactPath, activeStreamingSection?.cacheKey, currentStreamContent]);

  function ensureArtifactFileContent(section: ArtifactSection | null) {
    if (!section) {
      return;
    }

    const isStreamingSection = Boolean(currentStreamContent.trim()) && section.path === activeArtifactPath;
    if (isStreamingSection) {
      return;
    }

    const existingFileState = artifactFileContents[section.path] || null;
    const resolvedPath = resolveArtifactFilePath(section.path, workingDirectory, currentProjectPath);

    if (!resolvedPath) {
      setArtifactFileContents((state) => ({
        ...state,
        [section.path]: {
          status: "error",
          content: "",
          cacheKey: section.cacheKey,
          source: "file",
          error: "Project path is unavailable for this artifact.",
        },
      }));
      return;
    }

    if (
      existingFileState?.cacheKey === section.cacheKey &&
      existingFileState.source === "file" &&
      (existingFileState.status === "loading" || existingFileState.status === "loaded")
    ) {
      return;
    }

    setArtifactFileContents((state) => ({
      ...state,
      [section.path]: {
        status: "loading",
        content: state[section.path]?.content || "",
        cacheKey: section.cacheKey,
        source: "file",
      },
    }));

    void readArtifactFileContent(resolvedPath)
      .then((content) => {
        setArtifactFileContents((state) => {
          if (state[section.path]?.cacheKey !== section.cacheKey) {
            return state;
          }

          return {
            ...state,
            [section.path]: {
              status: "loaded",
              content,
              cacheKey: section.cacheKey,
              source: "file",
            },
          };
        });
      })
      .catch((error) => {
        setArtifactFileContents((state) => {
          if (state[section.path]?.cacheKey !== section.cacheKey) {
            return state;
          }

          return {
            ...state,
            [section.path]: {
              status: "error",
              content: "",
              cacheKey: section.cacheKey,
              source: "file",
              error: getErrorMessage(error),
            },
          };
        });
      });
  }

  const expandedArtifactSection = useMemo(
    () => (expandedFile ? artifactSections.find((section) => section.path === expandedFile) || null : null),
    [artifactSections, expandedFile]
  );
  const expandedArtifactPath = expandedArtifactSection?.path || null;
  const expandedArtifactCacheKey = expandedArtifactSection?.cacheKey || null;
  const isExpandedArtifactStreaming =
    Boolean(currentStreamContent.trim()) &&
    expandedArtifactSection?.path === activeArtifactPath;

  useEffect(() => {
    if (!expandedArtifactSection || !expandedArtifactPath || !expandedArtifactCacheKey || isExpandedArtifactStreaming) {
      return;
    }

    ensureArtifactFileContent(expandedArtifactSection);
  }, [
    currentProjectPath,
    expandedArtifactCacheKey,
    expandedArtifactPath,
    isExpandedArtifactStreaming,
    workingDirectory,
  ]);

  const latestReasoning = reasoningEntries[reasoningEntries.length - 1] || null;
  const completedSteps = displaySteps.filter((step) => step.status === "completed").length;
  const hasSession = Boolean(currentRun);
  const hasPendingSteps = Boolean(currentRun?.steps.some((step) => step.status === "pending"));
  const canResumeCurrentRun =
    Boolean(currentRun) &&
    currentRun?.phase === "paused" &&
    hasPendingSteps;
  const hasDraftInstruction =
    Boolean(currentRun) &&
    goalDraft.trim() &&
    goalDraft.trim() !== currentRun?.goal.trim();
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

    const instruction = hasDraftInstruction ? goalDraft.trim() : undefined;
    await resumeRun(instruction);

    if (instruction) {
      setGoalDraft(currentRun.goal);
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

  if (!hasSession) {
    return (
      <div className="flex h-full flex-1 flex-col justify-center space-y-8 overflow-y-auto p-4 pb-24 scrollbar-thin scrollbar-thumb-zinc-800 lg:p-6">
        <AgentEmptyState onStart={(goal) => void handleRun(goal)} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col space-y-6 overflow-y-auto p-4 pt-2 scrollbar-thin scrollbar-thumb-zinc-800 lg:p-6 lg:pt-4">
      <AgentControls
        goalDraft={goalDraft}
        isProcessing={isProcessing}
        topActionLabel={topActionLabel}
        canResumeCurrentRun={canResumeCurrentRun}
        onGoalChange={setGoalDraft}
        onPrimaryAction={handlePrimaryAction}
        onNewSession={handleNewSession}
      />

      <section className="grid h-full grid-cols-1 items-start gap-6 pb-10 lg:grid-cols-5">
        <div className="flex h-full flex-col lg:col-span-2">
          <div className="mb-4 flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold text-zinc-300">Execution Plan</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {completedSteps} / {displaySteps.length} Complete
            </span>
          </div>
          <AgentStepList
            displaySteps={displaySteps}
            onEditStep={handleEditStep}
            onRetryStep={handleRetryStep}
          />
        </div>

        <div className="flex h-full min-h-[600px] flex-col lg:col-span-3">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-[#0a0a0a] shadow-2xl shadow-black/50">
            <AgentReasoningPanel
              isReasoningExpanded={isReasoningExpanded}
              onToggleExpanded={() => setIsReasoningExpanded((value) => !value)}
              reasoningEntries={reasoningEntries}
              latestReasoning={latestReasoning}
              shouldShowReasoningError={shouldShowReasoningError}
              currentRun={currentRun}
              activeModelLabel={activeModelLabel}
              isProcessing={isProcessing}
              currentStreamContent={currentStreamContent}
            />

            <AgentArtifactPanel
              artifactSections={artifactSections}
              expandedFile={expandedFile}
              onSetExpandedFile={setExpandedFile}
              activeArtifactPath={activeArtifactPath}
              isProcessing={isProcessing}
              currentStreamContent={currentStreamContent}
            />

            <div className="flex shrink-0 items-center justify-between border-t border-zinc-800/80 bg-charcoal/90 p-3 backdrop-blur">
              <div className="flex items-center gap-2.5">
                {error || currentRun?.error ? (
                  <AlertCircle size={14} className="text-red-400" />
                ) : isProcessing ? (
                  <Loader2 size={14} className="animate-spin text-zinc-400" />
                ) : (
                  <Bot size={14} className="text-zinc-500" />
                )}
                <span className="text-xs font-medium text-zinc-300">{footerMessage}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={isProcessing ? stopGeneration : undefined}
                  disabled={!isProcessing}
                  className="rounded-md border border-zinc-700/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stop Generation
                </button>
                <button
                  onClick={() => void handleContinue()}
                  disabled={isProcessing || !canResumeCurrentRun}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    canResumeCurrentRun && !isProcessing
                      ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                      : "cursor-not-allowed bg-zinc-800 text-zinc-500 opacity-50"
                  )}
                >
                  Approve & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
