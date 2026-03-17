// ProviderCard - 单个 Provider 卡片组件
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { BackendLLMProvider } from "@/services/backend/llm";
import type { LLMConfig } from "@/services/llm/types";
import { getSelectedModel, getProviderDetailText } from "./utils";

export interface ProviderCardProps {
  provider: BackendLLMProvider;
  currentProvider: string | null;
  llmConfigs: Record<string, LLMConfig | null>;
  isEditing: boolean;
  pendingProvider: string | null;
  onUse: (provider: BackendLLMProvider) => void;
  onConfig: (provider: BackendLLMProvider) => void;
  onSelectModel: (provider: BackendLLMProvider, model: string) => void;
  renderEditor: (provider: BackendLLMProvider) => React.ReactNode;
}

export function ProviderCard({
  provider,
  currentProvider,
  llmConfigs,
  isEditing,
  pendingProvider,
  onUse,
  onConfig,
  onSelectModel,
  renderEditor,
}: ProviderCardProps) {
  const isActive = currentProvider === provider.name;
  const configured = provider.configured && provider.models.length > 0;
  const providerConfig = llmConfigs[provider.name];
  const selectedModel = getSelectedModel(provider, providerConfig);
  const detailText = getProviderDetailText(provider, providerConfig);
  const statusLabel = configured ? "Connected" : "Not configured";
  const actionLabel = configured ? "Config" : "Connect";

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "group relative -mx-3 rounded-lg p-3 transition-colors",
          isActive ? "bg-white/[0.02]" : "hover:bg-white/[0.03]"
        )}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "text-[13px] font-medium",
                  configured ? "text-zinc-300" : "text-zinc-400"
                )}
              >
                {provider.display_name}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    configured ? "bg-emerald-500/80" : "bg-zinc-700"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px]",
                    configured ? "text-zinc-500" : "text-zinc-600"
                  )}
                >
                  {statusLabel}
                </span>
                {isActive && (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                    Active
                  </span>
                )}
              </div>
            </div>

            {!isEditing && (
              <div className="absolute right-4 top-3 flex items-center gap-2 bg-[#050505] pl-2 opacity-0 shadow-[0_0_12px_8px_#050505] transition-opacity group-hover:opacity-100">
                {configured && (
                  <span className="max-w-[160px] truncate font-mono text-[11px] text-zinc-600">
                    {detailText}
                  </span>
                )}
                {configured && !isActive && (
                  <button
                    onClick={() => onUse(provider)}
                    className="px-2 py-1 text-[12px] text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    Use
                  </button>
                )}
                <button
                  onClick={() => onConfig(provider)}
                  className={cn(
                    "transition-colors",
                    configured
                      ? "px-2 py-1 text-[12px] text-zinc-500 hover:text-zinc-300"
                      : "rounded border border-white/5 bg-white/10 px-3 py-1 text-[12px] text-zinc-200 hover:bg-white/15"
                  )}
                >
                  {actionLabel}
                </button>
              </div>
            )}
          </div>

          <div className={cn("flex flex-wrap items-center gap-1.5", !configured && "opacity-50")}>
            {provider.models.map((model) => (
              <button
                key={`${provider.name}-${model}`}
                type="button"
                onClick={() => onSelectModel(provider, model)}
                className={cn(
                  "rounded-md border px-2 py-1 text-[10px] font-medium transition-colors",
                  isActive && selectedModel === model
                    ? "border-white/15 bg-white/[0.08] text-zinc-200"
                    : "border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-zinc-300"
                )}
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {renderEditor(provider)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
