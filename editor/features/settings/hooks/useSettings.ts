// useSettings - 设置状态管理组合 Hook
import { useConfigStore } from "@/stores/configStore";
import { useUIStore } from "@/stores/uiStore";
import { useLLMCatalog } from "./useLLMCatalog";

export function useSettings() {
  // LLM 配置状态
  const currentProvider = useConfigStore((state) => state.currentProvider);
  const llmConfigs = useConfigStore((state) => state.llmConfigs);

  // LLM 配置操作
  const setCurrentProvider = useConfigStore((state) => state.setCurrentProvider);
  const setLLMConfig = useConfigStore((state) => state.setLLMConfig);

  // UI 状态
  const addToast = useUIStore((state) => state.addToast);

  // LLM 目录
  const llmCatalog = useLLMCatalog();

  return {
    // LLM 配置状态
    currentProvider,
    llmConfigs,

    // LLM 配置操作
    setCurrentProvider,
    setLLMConfig,

    // UI 状态
    addToast,

    // LLM 目录
    llmCatalog,
  };
}
