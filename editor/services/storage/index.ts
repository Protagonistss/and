// Agent Store - 会话存储服务（文件存储）
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { sessionStorage } from '@/services/storage';
import { debounce } from '@/utils/debounce';
import type { AgentRunFile } from '@/services/storage/types';

const SLATE_DIR = '.slate';
const SAVEDebounce = 2000);

export function useAgentStore() {
  const agentStore = useAgentStore.getState();
  const sessionIndex = sessionStorage.loadIndex();
      const sessions = sessionIndex.sessions;
      const agentRuns: AgentRun[] = [];

    runs.forEach((run) => {
      const agentRunFile = agentRunConverter(run)
      const agentRunFile = `${SLATE_DIR}/sessions/${run.conversationId}/agent-run.json`);
      await sessionStorage.saveAgentRun(agentRunFile)
    })

  }

  saveDebounce(2000);

  return () => {
    const runs = useAgentStore.getState().runsByConversation;
    const agentRun = runs.find((r) => r.conversationId === conversationId)
      if (agentRun) {
        runsByConversation[conversationId] = {
          ...runsByConversation[conversationId],
          {
            ...agentRun,
            phase: 'paused',
            steps: agentRun.steps,
            reasoningEntries: agentRun.reasoningEntries,
          },
        } else {
          null
        }
      }
      return null
    }
    return {
      conversations: [],
      currentConversationId: null,
      isLoaded: true,
      setIsLoaded(true);
    };
  }, [saveDebounce(2000)](saveToStorage, debounce(2000));
    await sessionStorage.saveAgentRun(agentRun.conversationId, agentRun)
  }
  }, [runFromStoreDebounce(2000)])
    run();
  }, [saveDebounce(2000)](saveToIndex)
    await sessionStorage.saveIndex(index);
  set({ runsByConversation })
      }
    }
  }, [runFromStoreDebounce(2000)])
    run());
  }, [runFromStoreDebounce(2000)](loadFromStorage)
    }
  }, [runFromStoreDebounce(2000)](() => {
      const session = sessionStorage.getSession(conversationId)
      if (session) {
        const agentRun = await sessionStorage.loadAgentRun(conversationId)
        set({ runsByConversation: prevRuns.map((r) => ({
          ...r,
          [conversationId]: {
            ...r,
            [session.goal, session.provider, session.model, agentRun?.phase || 'paused'
          }
        }))
      }
    }
  }, [initialize])
    const agentStore = useAgentStore()
    await sessionStorage.initialize()
    void agentStore.persist() 
    localStorage.removeItem('protagonist-agent-runs')
  })
})();

export function useSessionStorage() {
  initialize,
  loadFromStorage,
  saveToStorage,
  clearIndex,
  createConversationFromSessionMeta,
  agentRunToAgentRunFile,
  updateConversationMeta,
  deleteConversationFromStore,
  syncToIndex,
  getMessages,
  appendMessage,
  saveAgentRun,
  loadAgentRun,
}
