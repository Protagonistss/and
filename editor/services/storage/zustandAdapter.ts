// Zustand persist storage adapter - 文件存储适配器（仅 Tauri）
import { sessionStorage } from './sessionStorage';
import { isTauriEnv } from '@/services/tauri';
import type { AgentRunFile } from './types';

interface PersistStorage {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
}

interface PersistedData {
  state?: {
    runsByConversation?: Record<string, AgentRunFile>;
  };
}

let isInitialized = false;
let pendingWrites: Map<string, string> = new Map();
let pendingFlush: ReturnType<typeof setTimeout> | null = null;

async function ensureInitialized(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await sessionStorage.initialize();
    isInitialized = true;
  } catch (error) {
    console.error('[FileStorage] Failed to initialize:', error);
  }
}

function flushWrites(): void {
  if (pendingFlush) {
    clearTimeout(pendingFlush);
    pendingFlush = null;
  }

  const entries = Array.from(pendingWrites.entries());
  pendingWrites = new Map();

  entries.forEach(([key, value]) => {
    writeToFile(value).catch((error) => {
      console.error('[FileStorage] Failed to flush:', error);
    });
  });
}

async function writeToFile(value: string): Promise<void> {
  if (!isTauriEnv) return;

  await ensureInitialized();

  try {
    const data: PersistedData = JSON.parse(value);
    const runsByConversation = data?.state?.runsByConversation;

    if (!runsByConversation) return;

    for (const [id, run] of Object.entries(runsByConversation)) {
      const existingMeta = await sessionStorage.getSession(id);

      if (!existingMeta) {
        await sessionStorage.createSession({
          id,
          title: run.goal?.slice(0, 50) || 'Untitled',
          projectPath: '',
          goal: run.goal || '',
          provider: run.provider || '',
          model: run.model || '',
          status: 'active',
          createdAt: run.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
      } else {
        await sessionStorage.updateSessionMeta(id, {
          updatedAt: Date.now(),
        });
      }

      await sessionStorage.saveAgentRun(id, run);
    }
  } catch (error) {
    console.error('[FileStorage] writeToFile error:', error);
  }
}

export const filePersistStorage: PersistStorage = {
  async getItem(_name: string): Promise<string | null> {
    if (!isTauriEnv) {
      console.warn('[FileStorage] Not available outside Tauri');
      return null;
    }

    await ensureInitialized();

    try {
      const sessions = await sessionStorage.listSessions();
      const runsByConversation: Record<string, AgentRunFile> = {};

      for (const session of sessions) {
        const agentRun = await sessionStorage.loadAgentRun(session.id);
        runsByConversation[session.id] = {
          id: session.id,
          conversationId: session.id,
          goal: session.goal,
          phase: agentRun?.phase || 'paused',
          provider: session.provider,
          model: session.model,
          activeStepId: agentRun?.activeStepId || null,
          error: agentRun?.error || null,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          steps: agentRun?.steps || [],
          artifacts: agentRun?.artifacts || [],
          reasoningEntries: agentRun?.reasoningEntries || [],
          lastAssistantMessage: agentRun?.lastAssistantMessage || '',
        };
      }

      return JSON.stringify({ state: { runsByConversation } });
    } catch (error) {
      console.error('[FileStorage] Failed to load:', error);
      return null;
    }
  },

  async setItem(_name: string, value: string): Promise<void> {
    if (!isTauriEnv) {
      console.warn('[FileStorage] Not available outside Tauri');
      return;
    }

    pendingWrites.set(_name, value);

    if (pendingFlush) {
      clearTimeout(pendingFlush);
    }

    pendingFlush = setTimeout(flushWrites, 2000);
  },

  async removeItem(_name: string): Promise<void> {
    // Not implemented - sessions are managed through sessionStorage directly
  },
};
