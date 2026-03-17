// AgentView - 主视图组件（已重构，使用自定义 hooks 拆分逻辑）
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AgentEmptyState,
  AgentControls,
  AgentStepList,
  AgentReasoningPanel,
  AgentArtifactPanel,
} from "@/features/agent/components";
import type { DisplayStep } from "@/features/agent/components";
import { useAgentState, useAgentCalculations, useAgentEffects, useAgentHandlers } from "./hooks";

export function AgentView() {
  // State management
  const state = useAgentState();

  // Calculations
  const calculations = useAgentCalculations({
    currentRun: state.currentRun,
    currentStreamContent: state.currentStreamContent,
    conversation: state.conversation,
    currentProvider: state.currentProvider,
    llmConfigs: state.llmConfigs,
    catalogProviders: state.catalogProviders,
    accessToken: state.accessToken,
    isProcessing: state.isProcessing,
    error: state.error,
    expandedFile: state.expandedFile,
  });

  // Effects
  useAgentEffects({
    goalDraft: state.goalDraft,
    setGoalDraft: state.setGoalDraft,
    goalInputRef: state.goalInputRef,
    reasoningScrollRef: state.reasoningScrollRef,
    accessToken: state.accessToken,
    catalogProviders: state.catalogProviders,
    syncLLMProviders: state.syncLLMProviders,
    initializeCatalog: state.initializeCatalog,
    clearCatalog: state.clearCatalog,
    currentRun: state.currentRun,
    latestUserMessage: calculations.latestUserMessage,
    streamContent: state.currentStreamContent,
    isReasoningExpanded: state.isReasoningExpanded,
    reasoningEntries: calculations.reasoningEntries,
    shouldShowReasoningError: calculations.shouldShowReasoningError,
    currentProjectPath: state.currentProjectPath,
    workingDirectory: state.workingDirectory,
    artifactSections: calculations.artifactSections,
    expandedFile: state.expandedFile,
    setExpandedFile: state.setExpandedFile,
    setArtifactFileContents: state.setArtifactFileContents,
    artifactFileContents: state.artifactFileContents,
    artifactLastVisibleContentRef: state.artifactLastVisibleContentRef,
    activeArtifactPath: calculations.activeArtifactPath,
    activeStreamingSection: calculations.activeStreamingSection,
    expandedArtifactSection: calculations.expandedArtifactSection,
    expandedArtifactPath: calculations.expandedArtifactPath,
    expandedArtifactCacheKey: calculations.expandedArtifactCacheKey,
    isExpandedArtifactStreaming: calculations.isExpandedArtifactStreaming,
  });

  // Event handlers
  const handlers = useAgentHandlers({
    goalDraft: state.goalDraft,
    setGoalDraft: state.setGoalDraft,
    goalInputRef: state.goalInputRef,
    isProcessing: state.isProcessing,
    currentRun: state.currentRun,
    canResumeCurrentRun: calculations.canResumeCurrentRun,
    accessToken: state.accessToken,
    catalogLoading: state.catalogLoading,
    catalogError: state.catalogError,
    configuredProviders: calculations.configuredProviders,
    providerReady: calculations.providerReady,
    sendMessage: state.sendMessage,
    resumeRun: state.resumeRun,
    stopGeneration: state.stopGeneration,
    createConversation: state.createConversation,
    reset: state.reset,
    setExpandedFile: state.setExpandedFile,
    retryStep: state.retryStep,
  });

  // Empty state
  if (!calculations.hasSession) {
    return (
      <div className="flex h-full flex-1 flex-col justify-center space-y-8 overflow-y-auto p-4 pb-24 scrollbar-thin scrollbar-thumb-zinc-800 lg:p-6">
        <AgentEmptyState onStart={(goal) => void handlers.handleRun(goal)} />
      </div>
    );
  }

  // Main view
  return (
    <div className="flex h-full flex-1 flex-col space-y-6 overflow-y-auto p-4 pt-2 scrollbar-thin scrollbar-thumb-zinc-800 lg:p-6 lg:pt-4">
      <AgentControls
        goalDraft={state.goalDraft}
        isProcessing={state.isProcessing}
        topActionLabel={calculations.topActionLabel}
        canResumeCurrentRun={calculations.canResumeCurrentRun}
        onGoalChange={state.setGoalDraft}
        onPrimaryAction={handlers.handlePrimaryAction}
        onNewSession={handlers.handleNewSession}
      />

      <section className="grid h-full grid-cols-1 items-start gap-6 pb-10 lg:grid-cols-5">
        <div className="flex h-full flex-col lg:col-span-2">
          <div className="mb-4 flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold text-zinc-300">Execution Plan</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {calculations.completedSteps} / {calculations.displaySteps.length} Complete
            </span>
          </div>
          <AgentStepList
            displaySteps={calculations.displaySteps}
            onEditStep={handlers.handleEditStep}
            onRetryStep={handlers.handleRetryStep}
          />
        </div>

        <div className="flex h-full min-h-[600px] flex-col lg:col-span-3">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-[#0a0a0a] shadow-2xl shadow-black/50">
            <AgentReasoningPanel
              isReasoningExpanded={state.isReasoningExpanded}
              onToggleExpanded={() => state.setIsReasoningExpanded((value) => !value)}
              reasoningEntries={calculations.reasoningEntries}
              latestReasoning={calculations.latestReasoning}
              shouldShowReasoningError={calculations.shouldShowReasoningError}
              currentRun={state.currentRun}
              activeModelLabel={calculations.activeModelLabel}
              isProcessing={state.isProcessing}
              currentStreamContent={state.currentStreamContent}
            />

            <AgentArtifactPanel
              artifactSections={calculations.artifactSections}
              expandedFile={state.expandedFile}
              onSetExpandedFile={state.setExpandedFile}
              activeArtifactPath={calculations.activeArtifactPath}
              isProcessing={state.isProcessing}
              currentStreamContent={state.currentStreamContent}
            />

            <div className="flex shrink-0 items-center justify-between border-t border-zinc-800/80 bg-charcoal/90 p-3 backdrop-blur">
              <div className="flex items-center gap-2.5">
                {state.error || state.currentRun?.error ? (
                  <AlertCircle size={14} className="text-red-400" />
                ) : state.isProcessing ? (
                  <Loader2 size={14} className="animate-spin text-zinc-400" />
                ) : (
                  <Bot size={14} className="text-zinc-500" />
                )}
                <span className="text-xs font-medium text-zinc-300">{calculations.footerMessage}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={state.isProcessing ? state.stopGeneration : undefined}
                  disabled={!state.isProcessing}
                  className="rounded-md border border-zinc-700/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stop Generation
                </button>
                <button
                  onClick={() => void handlers.handleContinue()}
                  disabled={state.isProcessing || !calculations.canResumeCurrentRun}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    calculations.canResumeCurrentRun && !state.isProcessing
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
