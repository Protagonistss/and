import type { LLMProvider } from "@/services/llm/types";

export interface LLMProviderDefinition {
  id: LLMProvider;
  name: string;
  mark: string;
  description: string;
  models: readonly string[];
  badgeClass: string;
}

export const LLM_PROVIDERS: readonly LLMProviderDefinition[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    mark: "A",
    description: "用于复杂推理和稳定的工具调用。",
    models: [
      "claude-sonnet-4-6-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
    badgeClass: "text-[#d97757] border-[#d97757]/20 bg-[#d97757]/10",
  },
  {
    id: "openai",
    name: "OpenAI",
    mark: "O",
    description: "适合通用对话、快速输出和多模态场景。",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    badgeClass: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
  },
  {
    id: "ollama",
    name: "Ollama",
    mark: "L",
    description: "本地模型运行时，适合离线开发环境。",
    models: ["llama3.2", "qwen2.5", "mistral", "codellama"],
    badgeClass: "text-zinc-300 border-zinc-700 bg-zinc-800/60",
  },
] as const;

const MODEL_LABELS: Partial<Record<LLMProvider, Record<string, string>>> = {
  anthropic: {
    "claude-sonnet-4-6-20250514": "Claude Sonnet 4.6",
    "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
    "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
    "claude-3-opus-20240229": "Claude 3 Opus",
  },
  openai: {
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "gpt-4-turbo": "GPT-4 Turbo",
    "gpt-3.5-turbo": "GPT-3.5 Turbo",
  },
  ollama: {
    "llama3.2": "Llama 3.2",
    "qwen2.5": "Qwen 2.5",
    "mistral": "Mistral",
    "codellama": "Code Llama",
  },
};

export function getLLMModelLabel(provider: LLMProvider, model: string): string {
  return MODEL_LABELS[provider]?.[model] || model;
}
