import type { ILLMAdapter, LLMConfig, LLMProvider, OpenAIConfig, AnthropicConfig, OllamaConfig } from './types';
import { OpenAIAdapter } from './OpenAIAdapter';
import { AnthropicAdapter } from './AnthropicAdapter';
import { OllamaAdapter } from './OllamaAdapter';

/**
 * 类型守卫：检查值是否为有效的 LLM Provider
 */
function isValidLLMProvider(provider: string): provider is 'openai' | 'anthropic' | 'ollama' {
  return ['openai', 'anthropic', 'ollama'].includes(provider);
}

/**
 * 类型守卫：检查配置是否为 OpenAI 配置
 */
function isOpenAIConfig(config: LLMConfig): config is OpenAIConfig {
  return config.provider === 'openai';
}

/**
 * 类型守卫：检查配置是否为 Anthropic 配置
 */
function isAnthropicConfig(config: LLMConfig): config is AnthropicConfig {
  return config.provider === 'anthropic';
}

/**
 * 类型守卫：检查配置是否为 Ollama 配置
 */
function isOllamaConfig(config: LLMConfig): config is OllamaConfig {
  return config.provider === 'ollama';
}

/**
 * LLM 适配器工厂
 * 根据配置创建对应的 LLM 适配器实例
 */
export class LLMFactory {
  private static adapters: Map<string, ILLMAdapter> = new Map();

  /**
   * 创建 LLM 适配器
   */
  static createAdapter(config: LLMConfig): ILLMAdapter {
    const key = this.getConfigKey(config);

    // 如果已存在相同配置的适配器，返回缓存
    if (this.adapters.has(key)) {
      return this.adapters.get(key)!;
    }

    // 验证 provider 类型并使用类型守卫
    if (!isValidLLMProvider(config.provider)) {
      throw new Error(`Unknown LLM provider: ${config.provider}`);
    }

    // 使用类型守卫来确定正确的适配器
    if (isOpenAIConfig(config)) {
      const adapter = new OpenAIAdapter(config);
      this.adapters.set(key, adapter);
      return adapter;
    }

    if (isAnthropicConfig(config)) {
      const adapter = new AnthropicAdapter(config);
      this.adapters.set(key, adapter);
      return adapter;
    }

    if (isOllamaConfig(config)) {
      const adapter = new OllamaAdapter({
        ...config,
        provider: 'ollama',
        baseUrl: config.baseUrl || 'http://localhost:11434',
      });
      this.adapters.set(key, adapter);
      return adapter;
    }

    // 这行代码实际上不会执行，因为 isValidLLMProvider 已经验证了所有已知情况
    throw new Error(`Unknown LLM provider: ${config.provider}`);
  }

  /**
   * 获取或创建适配器
   */
  static getAdapter(config: LLMConfig): ILLMAdapter {
    return this.createAdapter(config);
  }

  /**
   * 清除适配器缓存
   */
  static clearCache(): void {
    this.adapters.clear();
  }

  /**
   * 移除指定配置的适配器
   */
  static removeAdapter(config: LLMConfig): void {
    const key = this.getConfigKey(config);
    this.adapters.delete(key);
  }

  /**
   * 获取配置的唯一键
   */
  private static getConfigKey(config: LLMConfig): string {
    return `${config.provider}:${config.model}:${config.baseUrl || 'default'}`;
  }
}

/**
 * 创建默认配置
 */
export function createDefaultConfig(provider: LLMProvider): LLMConfig {
  switch (provider) {
    case 'openai':
      return {
        provider: 'openai',
        model: 'gpt-4o-mini',
        maxTokens: 4096,
        temperature: 0.7,
      };
    case 'anthropic':
      return {
        provider: 'anthropic',
        model: 'claude-sonnet-4-6-20250514',
        maxTokens: 4096,
        temperature: 0.7,
      };
    case 'ollama':
      return {
        provider: 'ollama',
        model: 'llama3.2',
        baseUrl: 'http://localhost:11434',
        maxTokens: 4096,
        temperature: 0.7,
      };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
