// AIModelsSettings - AI 模型设置主组件
import { motion } from "motion/react";
import { SignInGuide } from "./SignInGuide";
import { ProviderList } from "./ProviderList";
import { useLLMCatalog } from "../../hooks/useLLMCatalog";

export function AIModelsSettings() {
  const {
    user,
    currentProvider,
    llmConfigs,
    providers,
    isLoading,
    configuredProviders,
    setCurrentProvider,
    setLLMConfig,
    saveProvider,
    deleteProvider,
    createCustomProvider,
  } = useLLMCatalog();

  return (
    <motion.div
      key="models-backend"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="max-w-[600px] space-y-8"
    >
      <div>
        <h2 className="mb-1 text-[20px] font-medium text-zinc-100">AI Providers</h2>
        <p className="text-[13px] text-zinc-500">
          Configure your API keys. Models will be available instantly in your workspace.
        </p>
      </div>

      <SignInGuide user={user} />

      {user && (
        <>
          <ProviderList
            providers={providers}
            currentProvider={currentProvider}
            llmConfigs={llmConfigs}
            isLoading={isLoading}
            setCurrentProvider={setCurrentProvider}
            setLLMConfig={setLLMConfig}
            saveProvider={saveProvider}
            deleteProvider={deleteProvider}
            createCustomProvider={createCustomProvider}
          />

          {configuredProviders.length === 0 && providers.length > 0 && (
            <div className="mt-3 rounded-xl border border-dashed border-zinc-800 bg-white/[0.01] p-5 text-[13px] text-zinc-500">
              当前目录里还没有可用模型。你可以新增一个 OpenAI-compatible Provider，或者在 backend 配置已有 Provider。
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
