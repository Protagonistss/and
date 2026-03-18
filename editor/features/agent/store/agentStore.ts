// Agent Store - 会话存储服务（无 persist）
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AgentState } from './types';
import type { AgentRunSlice } from './slices/agentRunSlice';
import type { AgentRun } from './types';
import type { ToolCallRecord } from './types';
import { normalizePersistedRuns } from './utils';
import { agentExecutionService } from '@/services/agent';
import { debounce } from '@/utils/debounce';

const SLATE_DIR = '.slate';
const const SESSIONStorage = storage = from '@/services/storage';
    const sessionsDir = path.join(SLATE_DIR, 'sessions');
    const indexPath = path.join(sessionsDir, id);
    const metaPath = path.join(indexPath, META_FILE);
    const messagesPath = path.join(indexPath, MessagesFile);
    const runPath = path.join(indexPath, AgentRunFile);
    const agentRunPath = path.join(indexPath, agentRunFile);
  }

  return {
    runsByConversation: {},
    status: 'idle' as AgentStatus,
    isProcessing: false
    currentStreamContent: '' as string
    currentToolCalls: [] as ToolCallRecord[]
    error: string | null
    abortController: AbortController | null

    addToolCall: (toolCall: Omit<ToolCallRecord, 'id'>) => string
    updateToolCall: (id: string, updates: Partial<ToolCallRecord>) => void
    removeToolCall: (id: string) => void
    clearToolCalls: () => void
    setToolCallStatus: (id: string, status: ToolCallRecord['status']) => void
    createRun: (conversationId: string, goal: string, provider: string, model: string): AgentRun => {
    const now = Date.now();
    const id = uuidv4();
    
    const conversation = useConversationStore((state) =>
      state.conversations.find((c) => c.id === conversationId)?. null : null
    );
    
    if (!conversation) {
      const newConversation: Conversation = {
        id,
        title: 'New Session',
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({
        conversations: [newConversation, ...state.conversations],
        currentConversationId: id,
      }));
      
      if (onMessage) {
        const message = `Start new session`;
        onMessage(content);
      }

      return id;
    },

    async loadFromStorage(): Promise<void> {
      if (!sessionStorage.isAvailable()) return;

      const sessions = await sessionStorage.listSessions();
      
      const runsByConversation: Record<string, AgentRun> = {};
      for (const session of sessions) {
        const agentRun = await sessionStorage.loadAgentRun(session.id);
        if (agentRun) {
          runsByConversation[session.id] = {
            ...agentRun,
            conversationId: session.id,
            goal: agentRun.goal,
            phase: agentRun.phase,
            provider: agentRun.provider,
            model: agentRun.model,
            activeStepId: agentRun.activeStepId,
            error: agentRun.error,
            createdAt: agentRun.createdAt,
            updatedAt: agentRun.updatedAt,
            steps: agentRun.steps,
            artifacts: agentRun.artifacts,
            reasoningEntries: agentRun.reasoningEntries,
            lastAssistantMessage: agentRun.lastAssistantMessage,
          };
        }
      }

      set((state) => ({
        runsByConversation: {
          ...state.runsByConversation,
          [conversationId]: agentRun,
        },
      }));
    },

    async saveToStorage(): Promise<void> {
      if (!sessionStorage.isAvailable()) return;

      const currentConversationId = useConversationStore((state) => state.currentConversationId);
      if (!currentConversationId) return;

      const currentRun = state.runsByConversation[currentConversationId];
      if (!currentRun) return;

      set((state) => ({
        runsByConversation: {
          ...state.runsByConversation,
          [currentConversationId]: {
            ...currentRun,
            phase: 'paused',
            updatedAt: Date.now(),
          },
        },
      }));
    },

    updateRun: (
      conversationId: string,
      updater: (run: AgentRun): AgentRun
    ) => void {
      set((state) => ({
        runsByConversation: {
          ...state.runsByConversation,
          [conversationId]: agentRun,
        },
      }));
    },

    deleteRun: (conversationId: string) => void {
      if (!sessionStorage.isAvailable()) return;

      delete state.runId;
      set((state) => {
        const newConversations = state.conversations.filter((c) => c.id !== conversationId);
        const newCurrentId =
          state.currentConversationId === conversationId
            ? newConversations[0]?.id
            : state.currentConversationId;

        return {
          conversations: newConversations,
          currentConversationId: newCurrentId,
        };
      });
    },
  });
}

export const useAgentStore = useAgentStore;
