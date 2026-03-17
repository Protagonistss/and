// Agent Store - Main store combining all slices
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import type { AgentState } from './types';
import type { AgentRunSlice } from './slices/agentRunSlice';
import type { ArtifactSlice } from './slices/artifactSlice';
import type { ReasoningSlice } from './slices/reasoningSlice';
import type { ToolCallSlice } from './slices/toolCallSlice';
import { createAgentRunSlice } from './slices/agentRunSlice';
import { createArtifactSlice } from './slices/artifactSlice';
import { createReasoningSlice } from './slices/reasoningSlice';
import { createToolCallSlice } from './slices/toolCallSlice';
import { normalizePersistedRuns } from './utils';
import { agentExecutionService } from '@/services/agent';

interface PersistedAgentState {
  runsByConversation: Record<string, import('./types').AgentRun>;
}

// Export types for use in components
export type { AgentState } from './types';
export type * from './types';

// Create the agent store by combining all slices
export const useAgentStore = create<AgentState>()(
  devtools(
    persist(
      (set, get, api) => {
        // Create individual slices
        const toolCallState = createToolCallSlice(set, get, api);
        const agentRunState = createAgentRunSlice(set, get, api);
        const artifactState = createArtifactSlice(set, get, api);
        const reasoningState = createReasoningSlice(set, get, api);

        return {
          // Status state
          status: 'idle',
          isProcessing: false,
          currentStreamContent: '',
          error: null,
          abortController: null,

          // Tool call state
          currentToolCalls: [],
          addToolCall: toolCallState.addToolCall,
          updateToolCall: toolCallState.updateToolCall,
          removeToolCall: toolCallState.removeToolCall,
          clearToolCalls: toolCallState.clearToolCalls,
          setToolCallStatus: toolCallState.setToolCallStatus,

          // Run state
          runsByConversation: agentRunState.runsByConversation,
          createRun: agentRunState.createRun,
          updateRun: agentRunState.updateRun,
          getRun: agentRunState.getRun,
          deleteRun: agentRunState.deleteRun,
          setRunPhase: agentRunState.setRunPhase,
          createStepsFromPlan: agentRunState.createStepsFromPlan,
          setStepStatus: agentRunState.setStepStatus,
          appendStepEvidence: agentRunState.appendStepEvidence,
          appendStepSummary: agentRunState.appendStepSummary,
          updateStep: agentRunState.updateStep,
          pauseRun: agentRunState.pauseRun,
          ensureRunnableStep: agentRunState.ensureRunnableStep,
          normalizePersistedRun: agentRunState.normalizePersistedRun,
          normalizePersistedRuns: agentRunState.normalizePersistedRuns,

          // Artifact actions
          createArtifact: artifactState.createArtifact,
          attachArtifactToRun: artifactState.attachArtifactToRun,
          attachArtifactToRunByConversationId: artifactState.attachArtifactToRunByConversationId,
          readArtifactSnapshot: artifactState.readArtifactSnapshot,
          resolveArtifactSnapshotPath: artifactState.resolveArtifactSnapshotPath,

          // Reasoning actions
          addReasoningEntry: reasoningState.addReasoningEntry,
          addReasoningEntryToRun: reasoningState.addReasoningEntryToRun,
          updateLastAssistantMessage: reasoningState.updateLastAssistantMessage,
          clearReasoningEntries: reasoningState.clearReasoningEntries,

          // Agent execution actions - implemented by AgentExecutionService
          sendMessage: async (content: string) => {
            await agentExecutionService.sendMessage(content, get, set);
          },
          resumeRun: async (instruction?: string) => {
            await agentExecutionService.resumeRun(instruction, get, set);
          },
          retryStep: (stepId: string) => {
            const run = get().runsByConversation[Object.keys(get().runsByConversation)[0]];
            if (run) {
              set((state) => ({
                runsByConversation: {
                  ...state.runsByConversation,
                  [run.conversationId]: get().setStepStatus(run, stepId, 'pending'),
                },
              }));
            }
          },
          stopGeneration: () => {
            const { abortController } = get();
            abortController?.abort();
            set({
              status: 'idle',
              isProcessing: false,
              currentStreamContent: '',
              abortController: null,
            });
          },
          executeToolCall: async (name, input) => {
            // Use toolCallSlice's executeToolCall method
            return toolCallState.executeToolCall(
              name,
              input,
              '',
              (conversationId, updater) => {
                set((state) => ({
                  runsByConversation: {
                    ...state.runsByConversation,
                    [conversationId]: updater(state.runsByConversation[conversationId]!),
                  },
                }));
              }
            );
          },
          setStatus: (status) => set({ status }),
          clearError: () => set({ error: null }),
          reset: () =>
            set({
              status: 'idle',
              isProcessing: false,
              currentStreamContent: '',
              currentToolCalls: [],
              error: null,
              abortController: null,
            }),
        };
      },
      {
        name: 'protagonist-agent-runs',
        partialize: (state): PersistedAgentState => ({
          runsByConversation: state.runsByConversation,
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<PersistedAgentState> | undefined;

          return {
            ...currentState,
            status: 'idle',
            isProcessing: false,
            currentStreamContent: '',
            currentToolCalls: [],
            error: null,
            abortController: null,
            runsByConversation: normalizePersistedRuns(persisted?.runsByConversation),
          };
        },
      }
    ),
    { name: 'AgentStore' }
  )
);

// Export createAgentStore for legacy compatibility
export function createAgentStore() {
  return useAgentStore;
}
