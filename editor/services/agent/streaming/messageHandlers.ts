// Streaming Message Handlers - 流式消息处理
import type { Message, ToolUseContentBlock } from '../../llm/types';
import type { AssistantAccumulator } from '../types';
import { useConversationStore } from '@/stores/conversationStore';

/**
 * Gets conversation messages from the store
 */
export function getConversationMessages(conversationId: string): Message[] {
  const conversationStore = useConversationStore.getState();
  const conversation = conversationStore.getConversation(conversationId);
  return conversation ? [...conversation.messages] : [];
}

/**
 * Creates an empty assistant message and returns its index
 */
export function createAssistantMessage(conversationId: string): number {
  const conversationStore = useConversationStore.getState();
  const conversation = conversationStore.getConversation(conversationId);
  const assistantMessageIndex = conversation?.messages.length || 0;
  conversationStore.addMessage(conversationId, {
    role: 'assistant',
    content: '',
  });
  return assistantMessageIndex;
}

/**
 * Appends text chunk to assistant message
 */
export function appendAssistantText(
  conversationId: string,
  assistantMessageIndex: number,
  accumulator: AssistantAccumulator,
  chunk: string
): void {
  const conversationStore = useConversationStore.getState();

  if (accumulator.blocks.length === 0) {
    accumulator.plainText += chunk;
    conversationStore.updateMessage(
      conversationId,
      assistantMessageIndex,
      accumulator.plainText
    );
    return;
  }

  const lastBlock = accumulator.blocks[accumulator.blocks.length - 1];
  if (lastBlock?.type === 'text') {
    lastBlock.text += chunk;
  } else {
    accumulator.blocks.push({
      type: 'text',
      text: chunk,
    });
  }

  conversationStore.updateMessage(
    conversationId,
    assistantMessageIndex,
    [...accumulator.blocks]
  );
}

/**
 * Appends a tool use block to assistant message
 */
export function appendAssistantToolUse(
  conversationId: string,
  assistantMessageIndex: number,
  accumulator: AssistantAccumulator,
  toolUse: ToolUseContentBlock
): void {
  const conversationStore = useConversationStore.getState();

  if (accumulator.blocks.length === 0 && accumulator.plainText) {
    accumulator.blocks.push({
      type: 'text',
      text: accumulator.plainText,
    });
  }

  accumulator.blocks.push(toolUse);
  accumulator.toolUses.push(toolUse);

  conversationStore.updateMessage(
    conversationId,
    assistantMessageIndex,
    [...accumulator.blocks]
  );
}
