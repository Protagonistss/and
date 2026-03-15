import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLLMModelLabel, LLM_PROVIDERS } from "@/constants/llmProviders";
import type { LLMProvider } from "@/services/llm/types";
import { useConfigStore } from "@/stores/configStore";

interface AgentModelSelectProps {
  className?: string;
  disabled?: boolean;
}

interface ModelOption {
  provider: LLMProvider;
  model: string;
  label: string;
}

const MODEL_OPTIONS: ModelOption[] = LLM_PROVIDERS.flatMap((provider) =>
  provider.models.map((model) => ({
    provider: provider.id,
    model,
    label: getLLMModelLabel(provider.id, model),
  }))
);

export function AgentModelSelect({ className, disabled = false }: AgentModelSelectProps) {
  const currentProvider = useConfigStore((state) => state.currentProvider);
  const llmConfigs = useConfigStore((state) => state.llmConfigs);
  const setCurrentProvider = useConfigStore((state) => state.setCurrentProvider);
  const setLLMConfig = useConfigStore((state) => state.setLLMConfig);

  const providerConfig = llmConfigs[currentProvider];
  const selectedModel =
    providerConfig?.model || LLM_PROVIDERS.find((provider) => provider.id === currentProvider)?.models[0] || "";
  const selectedLabel = getLLMModelLabel(currentProvider, selectedModel);

  const options = useMemo(() => {
    const hasSelectedModel = MODEL_OPTIONS.some(
      (option) => option.provider === currentProvider && option.model === selectedModel
    );

    if (hasSelectedModel || !selectedModel) {
      return MODEL_OPTIONS;
    }

    return [
      {
        provider: currentProvider,
        model: selectedModel,
        label: getLLMModelLabel(currentProvider, selectedModel),
      },
      ...MODEL_OPTIONS,
    ];
  }, [currentProvider, selectedModel]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [providerValue, ...modelParts] = event.target.value.split(":");
    const model = modelParts.join(":");
    if (!providerValue || !model) {
      return;
    }

    const provider = providerValue as LLMProvider;
    setCurrentProvider(provider);
    setLLMConfig(provider, { model });
  };

  return (
    <div className={cn("group/model relative hidden min-w-[5.5rem] max-w-[11rem] sm:block", className)}>
      <span className="invisible block truncate whitespace-nowrap rounded-md px-2 pr-5 py-1.5 text-[11px] font-medium">
        {selectedLabel}
      </span>

      <div
        className={cn(
          "absolute inset-0 rounded-md transition-all",
          disabled ? "opacity-50" : "hover:bg-zinc-800/40"
        )}
      >
        <span className="pointer-events-none block truncate whitespace-nowrap px-2 pr-5 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors group-hover/model:text-zinc-300">
          {selectedLabel}
        </span>

        <select
          value={`${currentProvider}:${selectedModel}`}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 outline-none disabled:cursor-not-allowed"
          title="Select model"
        >
          {options.map((option) => (
            <option
              key={`${option.provider}:${option.model}`}
              value={`${option.provider}:${option.model}`}
              className="bg-zinc-900 text-zinc-300 py-1"
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <ChevronDown
        size={10}
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50 transition-opacity group-hover/model:opacity-100"
      />
    </div>
  );
}
