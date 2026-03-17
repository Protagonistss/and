// AI Models Settings 工具函数
import type { BackendLLMProvider } from "@/services/backend/llm";
import type { LLMConfig } from "@/services/llm/types";

export interface ProviderDraft {
  displayName: string;
  model: string;
  modelText: string;
  baseUrl: string;
  apiKey: string;
}

export const EMPTY_DRAFT: ProviderDraft = {
  displayName: "",
  model: "",
  modelText: "",
  baseUrl: "",
  apiKey: "",
};

export function parseModels(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getSelectedModel(provider: BackendLLMProvider, config?: LLMConfig | null): string {
  if (config?.model && provider.models.includes(config.model)) {
    return config.model;
  }

  return provider.default_model || provider.models[0] || "";
}

export function getModelInputValue(provider: BackendLLMProvider): string {
  if (provider.models.length <= 1) {
    return provider.models[0] || "";
  }

  const defaultModel = provider.default_model;
  if (!defaultModel || !provider.models.includes(defaultModel)) {
    return provider.models.join(", ");
  }

  return [defaultModel, ...provider.models.filter((model) => model !== defaultModel)].join(", ");
}

export function createDraft(provider: BackendLLMProvider, config?: LLMConfig | null): ProviderDraft {
  return {
    displayName: provider.display_name,
    model: getSelectedModel(provider, config),
    modelText: getModelInputValue(provider),
    baseUrl: provider.base_url || "",
    apiKey: "",
  };
}

export function getProviderDetailText(provider: BackendLLMProvider, config?: LLMConfig | null): string {
  return provider.base_url?.trim() || config?.model || "Managed by backend";
}

export function getApiKeyPlaceholder(provider: BackendLLMProvider): string {
  return provider.source === "custom" && provider.configured ? "********" : "sk-...";
}
