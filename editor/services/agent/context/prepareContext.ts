// Context Preparation - 上下文准备
import { useAuthStore } from '@/stores/authStore';
import { useConfigStore } from '@/stores/configStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useEditorStore } from '@/stores/editorStore';
import { toolRegistry } from '../../tools';
import { buildConversationTitle } from '../internal/utils';
import type { MessageContext } from '../types';

/**
 * Prepares the context for a new goal
 */
export function prepareNewGoalContext(content: string): MessageContext | null {
  const conversationStore = useConversationStore.getState();
  const configStore = useConfigStore.getState();
  const authStore = useAuthStore.getState();
  const editorStore = useEditorStore.getState();

  const accessToken = authStore.accessToken;
  if (!accessToken) {
    return null;
  }

  let conversationId = conversationStore.currentConversationId;
  const suggestedTitle = buildConversationTitle(content);

  if (!conversationId) {
    conversationId = conversationStore.createConversation(suggestedTitle);
  } else {
    const currentConversation = conversationStore.getConversation(conversationId);
    const canReplacePlaceholderTitle =
      currentConversation &&
      currentConversation.messages.length === 0 &&
      /^新对话(?:\s+\d+)?$/.test(currentConversation.title);

    if (canReplacePlaceholderTitle) {
      conversationStore.renameConversation(conversationId, suggestedTitle);
    }
  }

  conversationStore.addMessage(conversationId, {
    role: 'user',
    content,
  });

  const llmConfig = configStore.getCurrentLLMConfig();
  if (!llmConfig.provider || !llmConfig.model) {
    return null;
  }

  const activeFile = editorStore.getActiveFile();

  return {
    conversationId,
    accessToken,
    llmConfig,
    externalTools: toolRegistry.getAllDefinitions(),
    toolContext: {
      workingDirectory: configStore.workingDirectory,
      openFiles: editorStore.openFiles.map((file) => file.path),
      activeFile: activeFile?.path,
      editorContent: activeFile?.content,
    },
    systemPrompt: configStore.llmConfigs[configStore.currentProvider]?.systemPrompt,
  };
}

/**
 * Prepares the context for resuming an existing run
 */
export function prepareExistingContext(): MessageContext | null {
  const conversationStore = useConversationStore.getState();
  const configStore = useConfigStore.getState();
  const authStore = useAuthStore.getState();
  const editorStore = useEditorStore.getState();

  const accessToken = authStore.accessToken;
  const conversationId = conversationStore.currentConversationId;

  if (!accessToken || !conversationId) {
    return null;
  }

  const llmConfig = configStore.getCurrentLLMConfig();
  if (!llmConfig.provider || !llmConfig.model) {
    return null;
  }

  const activeFile = editorStore.getActiveFile();

  return {
    conversationId,
    accessToken,
    llmConfig,
    externalTools: toolRegistry.getAllDefinitions(),
    toolContext: {
      workingDirectory: configStore.workingDirectory,
      openFiles: editorStore.openFiles.map((file) => file.path),
      activeFile: activeFile?.path,
      editorContent: activeFile?.content,
    },
    systemPrompt: configStore.llmConfigs[configStore.currentProvider]?.systemPrompt,
  };
}
