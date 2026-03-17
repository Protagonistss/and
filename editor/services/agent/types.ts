// Agent Execution Types - 类型定义

import type { ContentBlock, LLMConfig, Message } from '../llm/types';
import type { ToolContext, ToolResult } from '../tools';
import type { ToolDefinition } from '../llm/types';

/**
 * Message context for agent execution
 */
export interface MessageContext {
  conversationId: string;
  accessToken: string;
  llmConfig: LLMConfig;
  externalTools: ToolDefinition[];
  toolContext: ToolContext;
  systemPrompt?: string;
}

/**
 * Assistant accumulator for streaming
 */
export interface AssistantAccumulator {
  plainText: string;
  blocks: ContentBlock[];
  toolUses: Array<{
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
}

/**
 * Type for Zustand store setter
 */
export type StoreSetter<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>)
) => void;

/**
 * Type for Zustand store getter
 */
export type StoreGetter<T> = () => T;
